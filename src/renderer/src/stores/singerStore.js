/**
 * 歌手状态管理
 * 管理歌手列表和歌手内歌曲数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSongSelection } from '@/composables/useSongSelection'
import { dbToDisplaySongs } from '@/utils/songTransform'

export const useSingerStore = defineStore('singer', () => {
  // ========== 歌手列表 ==========

  const singers = ref([])
  const currentSinger = ref(null) // 当前选中的歌手
  const currentSingerSongs = ref([])

  // 是否在歌手详情视图
  const isInSingerDetail = computed(() => currentSinger.value !== null)

  // ========== 使用歌曲选择 Composable ==========

  const selection = useSongSelection(currentSingerSongs)

  // ========== 数据加载 ==========

  // 加载所有歌手
  const loadSingers = async () => {
    try {
      const list = await window.dbAPI.getAllSingers()
      singers.value = list || []
    } catch {
      console.error('加载歌手失败')
      singers.value = []
    }
  }

  // 选择歌手，加载歌手内歌曲
  const selectSinger = async (singer) => {
    currentSinger.value = singer
    selection.clearSelection()
    try {
      const songs = await window.dbAPI.getSongsBySinger(singer.name)
      currentSingerSongs.value = dbToDisplaySongs(songs)
    } catch {
      console.error('加载歌手歌曲失败')
      currentSingerSongs.value = []
    }
  }

  // 返回歌手列表
  const backToSingerList = () => {
    currentSinger.value = null
    currentSingerSongs.value = []
    selection.clearSelection()
  }

  // ========== 初始化 ==========

  const init = async () => {
    await loadSingers()
  }

  return {
    // 状态
    singers,
    currentSinger,
    currentSingerSongs,
    isInSingerDetail,

    // 选中状态
    selectedSongIds: selection.selectedSongIds,
    lastSelectedIndex: selection.lastSelectedIndex,
    selectedSongCount: selection.selectedSongCount,
    hasSelection: selection.hasSelection,

    // 方法
    init,
    loadSingers,
    selectSinger,
    backToSingerList,

    // 选中方法
    isSelected: selection.isSelected,
    toggleSelection: selection.toggleSelection,
    selectSingle: selection.selectSingle,
    selectRange: selection.selectRange,
    selectAll: selection.selectAll,
    clearSelection: selection.clearSelection,
    getSelectedSongs: selection.getSelectedSongs
  }
})
