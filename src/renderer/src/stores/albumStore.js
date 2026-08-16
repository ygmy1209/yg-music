/**
 * 专辑状态管理
 * 管理专辑列表和专辑内歌曲数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSongSelection } from '@/composables/useSongSelection'
import { dbToDisplaySongs } from '@/utils/songTransform'
import { parallelLimit } from '@/utils/parallelLimit'
import { LIST } from '@/constants'

export const useAlbumStore = defineStore('album', () => {
  // ========== 专辑列表 ==========

  const albums = ref([])
  const albumCovers = ref({}) // 专辑封面缓存 { albumName: coverUrl }
  const currentAlbum = ref(null) // 当前选中的专辑
  const currentAlbumSongs = ref([])

  // 是否在专辑详情视图
  const isInAlbumDetail = computed(() => currentAlbum.value !== null)

  // ========== 使用歌曲选择 Composable ==========

  const selection = useSongSelection(currentAlbumSongs)

  // ========== 数据加载 ==========

  // 加载所有专辑
  const loadAlbums = async () => {
    try {
      const list = await window.dbAPI.getAllAlbums()
      albums.value = list || []

      // 加载专辑封面
      await loadAlbumCovers()
    } catch (error) {
      console.error('加载专辑失败:', error)
      albums.value = []
    }
  }

  // 加载专辑封面（从每个专辑的第一首歌获取，批量并行优化）
  const loadAlbumCovers = async () => {
    // 过滤掉未知专辑、空专辑和已有封面的专辑，避免反复进入页面时重复请求
    const albumList = albums.value.filter(a =>
      a.name &&
      a.name !== '未知专辑' &&
      a.songs &&
      a.songs.length > 0 &&
      !albumCovers.value[a.name]
    )

    // 批量并行加载，限制并发数
    await parallelLimit(
      albumList,
      (album) => loadAlbumCover(album.name, album.songs[0].id),
      LIST.BATCH_CONCURRENCY
    )
  }

  // 进行中的封面加载，避免并发重复请求同一专辑
  const loadingCovers = new Set()

  // 加载单个专辑封面
  const loadAlbumCover = async (albumName, songId) => {
    if (loadingCovers.has(albumName)) return
    loadingCovers.add(albumName)
    try {
      const result = await window.musicAPI.getCover(songId)
      if (result.success) {
        albumCovers.value[albumName] = result.data
      }
    } catch {
      // 静默失败，保持占位图
    } finally {
      loadingCovers.delete(albumName)
    }
  }

  // 获取专辑封面
  const getAlbumCover = (albumName) => {
    return albumCovers.value[albumName] || null
  }

  // 选择专辑，加载专辑内歌曲
  const selectAlbum = async (album) => {
    currentAlbum.value = album
    selection.clearSelection()
    try {
      const songs = await window.dbAPI.getSongsByAlbum(album.name)
      // 使用转换工具函数
      currentAlbumSongs.value = dbToDisplaySongs(songs)
    } catch (error) {
      console.error('加载专辑歌曲失败:', error)
      currentAlbumSongs.value = []
    }
  }

  // 返回专辑列表
  const backToAlbumList = () => {
    currentAlbum.value = null
    currentAlbumSongs.value = []
    selection.clearSelection()
  }

  // ========== 初始化 ==========

  const init = async () => {
    await loadAlbums()
  }

  return {
    // 状态
    albums,
    albumCovers,
    currentAlbum,
    currentAlbumSongs,
    isInAlbumDetail,

    // 选中状态（从 composable 导出）
    selectedSongIds: selection.selectedSongIds,
    lastSelectedIndex: selection.lastSelectedIndex,
    selectedSongCount: selection.selectedSongCount,
    hasSelection: selection.hasSelection,

    // 方法
    init,
    loadAlbums,
    selectAlbum,
    backToAlbumList,
    getAlbumCover,

    // 选中方法（从 composable 导出）
    isSelected: selection.isSelected,
    toggleSelection: selection.toggleSelection,
    selectSingle: selection.selectSingle,
    selectRange: selection.selectRange,
    selectAll: selection.selectAll,
    clearSelection: selection.clearSelection,
    getSelectedSongs: selection.getSelectedSongs
  }
})
