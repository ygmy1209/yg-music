/**
 * 歌单工具栏
 * 包含播放全部、添加歌曲、搜索框等功能
 */

<template>
  <div class="playlist-toolbar">
    <!-- 歌单信息 -->
    <div class="playlist-info">
      <h3 class="playlist-title text-ellipsis">{{ playlistStore.currentPlaylist.name }}</h3>
      <span class="song-count">{{ playlistStore.currentSongs.length }} 首歌曲</span>
    </div>

    <!-- 功能按钮 -->
    <div class="toolbar-actions">
      <!-- 播放全部 -->
      <button class="action-btn primary" @click="handlePlayAll">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span>播放全部</span>
      </button>

      <!-- 添加歌曲 -->
      <button class="action-btn" @click="handleAddSongs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>导入歌曲</span>
      </button>

      <!-- 导入文件夹 -->
      <button class="action-btn" @click="handleImportFolder">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>导入文件夹</span>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-wrapper">
      <div class="search-box" :class="{ focused: isSearchFocused, hasValue: hasSearchKeyword }">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref="searchInputRef"
          :value="playlistStore.searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索歌曲"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @input="handleSearchInput"
          @keydown.enter="handleSearchEnter"
        />
        <button v-show="hasSearchKeyword" class="clear-btn" @mousedown.prevent @click="handleClearSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 搜索下拉列表 -->
      <SearchDropdown
        :visible="showDropdown"
        :results="playlistStore.searchResults"
        @select="handleSelectSong"
      />
    </div>

    <!-- 搜索筛选状态提示 -->
    <div v-if="playlistStore.isSearchFiltered" class="filter-tip">
      <span>搜索结果：{{ playlistStore.displaySongs.length }} 首</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'
import SearchDropdown from './SearchDropdown.vue'

const playlistStore = usePlaylistStore()
const playerStore = usePlayerStore()

// ========== 搜索状态 ==========

const searchInputRef = ref(null)

// 计算属性
const hasSearchKeyword = computed(() => playlistStore.searchKeyword.trim().length > 0)
const isSearchFocused = computed(() => playlistStore.isSearchFocused)
const showDropdown = computed(() => isSearchFocused.value && hasSearchKeyword.value)

// ========== 搜索交互 ==========

const handleSearchFocus = () => {
  playlistStore.setSearchFocused(true)
}

const handleSearchBlur = () => {
  // 延迟关闭，给点击下拉列表留时间
  setTimeout(() => {
    playlistStore.setSearchFocused(false)
  }, 200)
}

const handleSearchInput = (e) => {
  playlistStore.setSearchKeyword(e.target.value)
}

const handleSearchEnter = () => {
  if (hasSearchKeyword.value) {
    if (playlistStore.searchResults.length > 0) {
      playlistStore.applySearchFilter()
      searchInputRef.value?.blur()
    }
  } else {
    playlistStore.clearSearch()
    searchInputRef.value?.blur()
  }
}

// 选择搜索结果中的歌曲
const handleSelectSong = async (song) => {
  // 先脱焦关闭下拉框
  playlistStore.setSearchFocused(false)
  searchInputRef.value?.blur()

  // 清除筛选状态，显示全部歌曲
  playlistStore.isSearchFiltered = false

  // 等待 DOM 更新后再设置高亮（因为 displaySongs 可能变化）
  await nextTick()
  playlistStore.highlightSong(song.id)
}

const handleClearSearch = () => {
  playlistStore.clearSearch()
  playlistStore.setSearchFocused(true)
  searchInputRef.value?.focus()
}

// ========== 功能按钮 ==========

const handlePlayAll = () => {
  const songs = playlistStore.currentSongs
  if (!songs || songs.length === 0) return

  // 获取第一首歌曲
  const firstSong = songs[0]

  // 设置播放列表为当前歌单的歌曲（使用原始对象，不手动转换）
  playerStore.setPlaylist([...songs])

  // 设置当前歌单 ID
  playerStore.setCurrentPlaylistId(playlistStore.currentPlaylist.id)

  // 重置媒体筛选模式为默认（音/视）
  playerStore.setMediaFilter('all')

  // 设置播放模式为列表循环
  playerStore.playMode = 'list'

  // 设置第一首歌曲为当前歌曲（会触发 watch 自动加载播放）
  playerStore.setCurrentSong(firstSong)

  // 注意：不调用 setPlaying(true)，因为 MusicPlayer.vue 中的 watch 会自动处理播放
}

const handleAddSongs = async () => {
  try {
    const filePaths = await window.dialogAPI.selectMusicFiles()
    if (filePaths && filePaths.length > 0) {
      await playlistStore.addSongsFromFiles(filePaths)
    }
  } catch (error) {
    console.error('添加歌曲失败:', error)
  }
}

const handleImportFolder = async () => {
  try {
    const folderPath = await window.dialogAPI.selectMusicFolder()
    if (folderPath) {
      await playlistStore.addSongsFromFolder(folderPath)
    }
  } catch (error) {
    console.error('导入文件夹失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.playlist-toolbar {
  padding: 0 20px  20px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background-color: var(--bg-primary);

  .playlist-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    .playlist-title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
    }

    .song-count {
      font-size: var(--font-size-xs);
      color: var(--text-icon);
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 10px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background-color: var(--bg-tertiary);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #d8d8d8;
        color: var(--text-primary);
      }

      &.primary {
        background-color: var(--primary-color);
        color: #ffffff;

        &:hover {
          background-color: var(--primary-dark);
        }
      }
    }
  }

  .search-wrapper {
    position: relative;
    margin-left: auto;

    .search-box {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      background-color: var(--bg-secondary);
      transition: all 0.2s ease;

      &.focused {
        background-color: var(--bg-tertiary);
      }

      .search-icon {
        color: var(--text-icon);
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 0 8px;
        font-size: var(--font-size-sm);
        background: transparent;
        color: var(--text-primary);
        min-width: 150px;

        &::placeholder {
          color: var(--text-icon);
        }
      }

      .clear-btn {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;

        svg {
          color: var(--text-icon);
        }

        &:hover {
          background-color: var(--bg-primary);
          svg {
            color: var(--text-primary);
          }
        }
      }
    }
  }

  .filter-tip {
    padding: 6px 12px;
    background-color: var(--primary-color-15);
    border-radius: 4px;
    font-size: var(--font-size-xs);
    color: var(--primary-dark);
  }
}
</style>
