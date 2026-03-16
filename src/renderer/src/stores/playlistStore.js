/**
 * 歌单状态管理
 * 管理歌单列表和歌曲数据，与数据库同步
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settingsStore'
import { useSongSelection } from '@/composables/useSongSelection'
import { dbToDisplaySongs, extractSongInfo } from '@/utils/songTransform'
import { LIST } from '@/constants'

/**
 * 限制并发执行的辅助函数
 * @param {Array} items - 要处理的项目数组
 * @param {Function} handler - 处理单个项目的函数
 * @param {number} concurrency - 最大并发数
 */
async function parallelLimit(items, handler, concurrency = LIST.BATCH_CONCURRENCY) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(handler))
    results.push(...batchResults)
  }
  return results
}

export const usePlaylistStore = defineStore('playlist', () => {
  // ========== 歌单列表 ==========

  const playlists = ref([])
  const currentPlaylistId = ref('default')

  // 当前选中的歌单
  const currentPlaylist = computed(() => {
    return playlists.value.find(p => p.id === currentPlaylistId.value) || { id: 'default', name: '全部歌曲' }
  })

  // ========== 歌曲数据 ==========

  const currentSongs = ref([])

  // ========== 排序状态 ==========

  const sortField = ref('')
  const sortAsc = ref(true)

  // ========== 显示的歌曲列表（考虑搜索筛选和排序） ==========

  const displaySongs = computed(() => {
    const songs = isSearchFiltered.value ? filteredSongs.value : currentSongs.value
    if (!sortField.value) return songs

    return [...songs].sort((a, b) => {
      let aVal = a[sortField.value] || ''
      let bVal = b[sortField.value] || ''
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal === bVal) return 0
      const comparison = aVal < bVal ? -1 : 1
      return sortAsc.value ? comparison : -comparison
    })
  })

  // ========== 使用歌曲选择 Composable ==========

  const selection = useSongSelection(displaySongs)

  // ========== 搜索状态 ==========

  const searchKeyword = ref('')
  const isSearchFocused = ref(false)
  const isSearchFiltered = ref(false)
  const highlightedSongId = ref(null)
  const filteredSongs = ref([]) // 筛选后的歌曲快照

  // 搜索结果（实时，用于下拉框）
  const searchResults = computed(() => {
    if (!searchKeyword.value.trim()) return []
    const keyword = searchKeyword.value.toLowerCase()
    return currentSongs.value.filter(song =>
      (song.name || '').toLowerCase().includes(keyword) ||
      (song.artist || '').toLowerCase().includes(keyword)
    )
  })

  // ========== 数据加载 ==========

  // 加载所有歌单
  const loadPlaylists = async () => {
    try {
      const list = await window.dbAPI.getAllPlaylists()
      playlists.value = list || []
    } catch (error) {
      console.error('加载歌单失败:', error)
      playlists.value = []
    }
  }

  // 加载歌单中的歌曲
  const loadSongs = async () => {
    try {
      const songs = await window.dbAPI.getSongsByPlaylist(currentPlaylistId.value)
      // 使用转换工具函数
      currentSongs.value = dbToDisplaySongs(songs)
    } catch (error) {
      console.error('加载歌曲失败:', error)
      currentSongs.value = []
    }
  }

  // ========== 歌单操作 ==========

  // 创建歌单
  const createPlaylist = async (name) => {
    try {
      const id = `userlist_${Date.now()}`
      await window.dbAPI.createPlaylist(id, name.trim())
      await loadPlaylists()
      return playlists.value.find(p => p.id === id)
    } catch (error) {
      console.error('创建歌单失败:', error)
      return null
    }
  }

  // 重命名歌单
  const renamePlaylist = async (id, newName) => {
    try {
      await window.dbAPI.renamePlaylist(id, newName.trim())
      await loadPlaylists()
    } catch (error) {
      console.error('重命名歌单失败:', error)
    }
  }

  // 删除歌单
  const deletePlaylist = async (id) => {
    try {
      await window.dbAPI.deletePlaylist(id)
      await loadPlaylists()
      // 如果删除的是当前选中的歌单，切换到默认歌单
      if (currentPlaylistId.value === id) {
        currentPlaylistId.value = 'default'
        await loadSongs()
      }
    } catch (error) {
      console.error('删除歌单失败:', error)
    }
  }

  // 选中歌单
  const selectPlaylist = async (id) => {
    currentPlaylistId.value = id
    await loadSongs()
    clearSearch()
    selection.clearSelection()
  }

  // ========== 歌曲操作 ==========

  // 添加歌曲到歌单
  const addSongToPlaylist = async (songId, listId, songInfo) => {
    try {
      const settingsStore = useSettingsStore()
      const addLocation = settingsStore.settings['list.addSongPosition'] || 'top'
      await window.dbAPI.addSongToPlaylist(songId, listId, songInfo, addLocation)
      // 如果添加到当前歌单或 default，刷新当前歌单
      if (listId === currentPlaylistId.value || listId === 'default') {
        await loadSongs()
      }
    } catch (error) {
      console.error('添加歌曲失败:', error)
    }
  }

  // 从歌单移除歌曲
  const removeSongFromPlaylist = async (songId, listId, isDefault = false) => {
    try {
      await window.dbAPI.removeSongFromPlaylist(songId, listId, isDefault)
      await loadSongs()
    } catch (error) {
      console.error('移除歌曲失败:', error)
    }
  }

  // 批量添加选中歌曲到歌单（并行优化）
  const addSelectedSongsToPlaylist = async (targetListId) => {
    const settingsStore = useSettingsStore()
    const addLocation = settingsStore.settings['list.addSongPosition'] || 'top'
    const songs = selection.getSelectedSongs()

    // 使用并行限制处理
    await parallelLimit(songs, async (song) => {
      const songInfo = extractSongInfo(song)
      await window.dbAPI.addSongToPlaylist(song.id, targetListId, songInfo, addLocation)
    })
  }

  // 批量删除选中歌曲（并行优化）
  const removeSelectedSongsFromPlaylist = async (listId, isDefault = false) => {
    const songs = selection.getSelectedSongs()

    // 使用并行限制处理
    await parallelLimit(songs, async (song) => {
      await window.dbAPI.removeSongFromPlaylist(song.id, listId, isDefault)
    })

    await loadSongs()
    selection.clearSelection()
  }

  // ========== 添加歌曲（选择文件 + 解析元数据） ==========

  const addSongsFromFiles = async (filePaths) => {
    if (!filePaths || filePaths.length === 0) return

    try {
      const settingsStore = useSettingsStore()
      const addLocation = settingsStore.settings['list.addSongPosition'] || 'top'

      // 批量解析元数据
      const results = await window.musicAPI.parseMetadataBatch(filePaths)

      // 使用并行限制处理
      await parallelLimit(results, async (result) => {
        if (!result.success) {
          console.warn('解析失败:', result.filePath, result.error)
          return
        }

        const songInfo = result.data
        // 先添加到 default
        await window.dbAPI.addSongToPlaylist(result.filePath, 'default', songInfo, addLocation)
        
        // 如果当前不是 default，也添加到当前歌单
        if (currentPlaylistId.value !== 'default') {
          await window.dbAPI.addSongToPlaylist(result.filePath, currentPlaylistId.value, songInfo, addLocation)
        }
      })

      // 刷新歌曲列表
      await loadSongs()
    } catch (error) {
      console.error('批量添加歌曲失败:', error)
    }
  }

  // 从文件夹导入歌曲
  const addSongsFromFolder = async (folderPath) => {
    if (!folderPath) return

    try {
      // 扫描文件夹中的音视频文件
      const scanResult = await window.musicAPI.scanFolder(folderPath)
      if (!scanResult.success || scanResult.files.length === 0) {
        console.warn('未找到音视频文件:', folderPath)
        return
      }

      // 批量添加
      await addSongsFromFiles(scanResult.files)
    } catch (error) {
      console.error('导入文件夹失败:', error)
    }
  }

  // ========== 排序操作 ==========

  const setSortField = (field) => {
    if (sortField.value === field) {
      if (sortAsc.value) {
        // 升序 → 降序
        sortAsc.value = false
      } else {
        // 降序 → 无排序
        sortField.value = ''
      }
    } else {
      // 新字段，默认升序
      sortField.value = field
      sortAsc.value = true
    }
  }

  // ========== 搜索操作 ==========

  // 更新搜索关键字（不影响筛选状态）
  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  // 应用搜索筛选（回车时）
  const applySearchFilter = () => {
    if (searchKeyword.value.trim() && searchResults.value.length > 0) {
      // 保存当前搜索结果快照
      filteredSongs.value = [...searchResults.value]
      isSearchFiltered.value = true
    } else if (!searchKeyword.value.trim()) {
      // 搜索框为空时，退出筛选状态
      isSearchFiltered.value = false
      filteredSongs.value = []
    }
  }

  // 高亮并滚动到歌曲
  const highlightSong = (songId) => {
    highlightedSongId.value = songId
  }

  // 清除搜索
  const clearSearch = () => {
    searchKeyword.value = ''
    isSearchFiltered.value = false
    filteredSongs.value = []
    highlightedSongId.value = null
  }

  // 清除高亮
  const clearHighlight = () => {
    highlightedSongId.value = null
  }

  // 设置搜索焦点状态
  const setSearchFocused = (focused) => {
    isSearchFocused.value = focused
  }

  // ========== 初始化 ==========

  const init = async () => {
    await loadPlaylists()
    await loadSongs()
  }

  return {
    // 状态
    playlists,
    currentPlaylistId,
    currentPlaylist,
    currentSongs,
    displaySongs,
    sortField,
    sortAsc,
    searchKeyword,
    searchResults,
    isSearchFocused,
    isSearchFiltered,
    highlightedSongId,

    // 选中状态（从 composable 导出）
    selectedSongIds: selection.selectedSongIds,
    lastSelectedIndex: selection.lastSelectedIndex,
    selectedSongCount: selection.selectedSongCount,
    hasSelection: selection.hasSelection,

    // 方法
    init,
    loadPlaylists,
    loadSongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    selectPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    addSongsFromFiles,
    addSongsFromFolder,
    setSortField,
    setSearchKeyword,
    setSearchFocused,
    applySearchFilter,
    highlightSong,
    clearSearch,
    clearHighlight,

    // 选中方法（从 composable 导出）
    isSelected: selection.isSelected,
    toggleSelection: selection.toggleSelection,
    selectSingle: selection.selectSingle,
    selectRange: selection.selectRange,
    selectAll: selection.selectAll,
    clearSelection: selection.clearSelection,
    getSelectedSongs: selection.getSelectedSongs,
    addSelectedSongsToPlaylist,
    removeSelectedSongsFromPlaylist
  }
})
