/**
 * 歌曲选择功能 Composable
 * 提供统一的歌曲选择逻辑，支持单选、多选、范围选择
 */

import { ref, computed } from 'vue'

/**
 * 创建歌曲选择功能
 * @param {import('vue').Ref<Array>} songListRef - 歌曲列表的响应式引用
 * @returns {Object} 选择相关的状态和方法
 */
export function useSongSelection(songListRef) {
  // 选中的歌曲 ID 集合
  const selectedSongIds = ref(new Set())

  // 上次选中的索引（用于 Shift 范围选择）
  const lastSelectedIndex = ref(-1)

  // 计算属性：选中数量
  const selectedSongCount = computed(() => selectedSongIds.value.size)

  // 计算属性：是否有选中
  const hasSelection = computed(() => selectedSongIds.value.size > 0)

  /**
   * 检查歌曲是否被选中
   * @param {string} songId - 歌曲 ID
   * @returns {boolean}
   */
  const isSelected = (songId) => selectedSongIds.value.has(songId)

  /**
   * 切换单首歌曲的选中状态
   * @param {string} songId - 歌曲 ID
   */
  const toggleSelection = (songId) => {
    const newSet = new Set(selectedSongIds.value)
    if (newSet.has(songId)) {
      newSet.delete(songId)
    } else {
      newSet.add(songId)
    }
    selectedSongIds.value = newSet
  }

  /**
   * 选中单首歌曲（清除其他选中）
   * @param {string} songId - 歌曲 ID
   */
  const selectSingle = (songId) => {
    selectedSongIds.value = new Set([songId])
  }

  /**
   * 范围选择（从 fromIndex 到 toIndex）
   * @param {number} fromIndex - 起始索引
   * @param {number} toIndex - 结束索引
   */
  const selectRange = (fromIndex, toIndex) => {
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    const newSet = new Set(selectedSongIds.value)

    for (let i = start; i <= end; i++) {
      const song = songListRef.value[i]
      if (song) {
        newSet.add(song.id)
      }
    }
    selectedSongIds.value = newSet
  }

  /**
   * 全选当前列表中的所有歌曲
   */
  const selectAll = () => {
    const newSet = new Set()
    songListRef.value.forEach(song => {
      newSet.add(song.id)
    })
    selectedSongIds.value = newSet
  }

  /**
   * 清除所有选中
   */
  const clearSelection = () => {
    selectedSongIds.value = new Set()
    lastSelectedIndex.value = -1
  }

  /**
   * 获取所有选中的歌曲
   * @returns {Array} 选中的歌曲数组
   */
  const getSelectedSongs = () => {
    return songListRef.value.filter(song => selectedSongIds.value.has(song.id))
  }

  /**
   * 获取选中的歌曲 ID 数组
   * @returns {Array<string>} 选中的歌曲 ID 数组
   */
  const getSelectedSongIds = () => {
    return Array.from(selectedSongIds.value)
  }

  /**
   * 批量选中指定的歌曲 ID
   * @param {Array<string>} songIds - 要选中的歌曲 ID 数组
   */
  const selectByIds = (songIds) => {
    const newSet = new Set(selectedSongIds.value)
    songIds.forEach(id => newSet.add(id))
    selectedSongIds.value = newSet
  }

  return {
    // 状态
    selectedSongIds,
    lastSelectedIndex,
    selectedSongCount,
    hasSelection,

    // 方法
    isSelected,
    toggleSelection,
    selectSingle,
    selectRange,
    selectAll,
    clearSelection,
    getSelectedSongs,
    getSelectedSongIds,
    selectByIds
  }
}
