/**
 * 歌曲表格组件
 * 展示歌曲列表，支持排序、高亮和右键菜单
 */

<template>
  <div class="song-table">
    <!-- 表头 -->
    <div class="table-header">
      <div class="col col-type">类型</div>
      <div class="col col-index">#</div>
      <div
        class="col col-name sortable"
        :class="{ active: sortField === 'name' }"
        @click="handleSort('name')"
      >
        歌曲
        <span class="sort-icon">{{ sortField === 'name' ? (sortAsc ? '↑' : '↓') : '' }}</span>
      </div>
      <div
        class="col col-artist sortable"
        :class="{ active: sortField === 'artist' }"
        @click="handleSort('artist')"
      >
        艺术家
        <span class="sort-icon">{{ sortField === 'artist' ? (sortAsc ? '↑' : '↓') : '' }}</span>
      </div>
      <div
        class="col col-album sortable"
        :class="{ active: sortField === 'album' }"
        @click="handleSort('album')"
      >
        专辑
        <span class="sort-icon">{{ sortField === 'album' ? (sortAsc ? '↑' : '↓') : '' }}</span>
      </div>
      <div
        class="col col-duration sortable"
        :class="{ active: sortField === 'duration' }"
        @click="handleSort('duration')"
      >
        时长
        <span class="sort-icon">{{ sortField === 'duration' ? (sortAsc ? '↑' : '↓') : '' }}</span>
      </div>
    </div>

    <!-- 表格内容 -->
    <div ref="tableBodyRef" class="table-body">
      <div
        v-for="(song, index) in playlistStore.displaySongs"
        :key="song.id"
        :data-song-id="song.id"
        class="table-row"
        :class="{
          highlighted: highlightedSongId === song.id,
          selected: playlistStore.isSelected(song.id),
          'context-active': contextMenu.show && contextMenu.song?.id === song.id
        }"
        @click="handleRowClick($event, song, index)"
        @dblclick="handlePlay(song)"
        @contextmenu.prevent="handleContextMenu($event, song)"
      >
        <div class="col col-type">
          <span class="type-badge" :class="song.type === 0 ? 'music' : 'video'">
            <svg v-if="song.type === 0" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </span>
        </div>
        <div class="col col-index">{{ index + 1 }}</div>
        <div class="col col-name"><span class="text-ellipsis">{{ song.name }}</span></div>
        <div class="col col-artist"><span class="text-ellipsis">{{ song.artist }}</span></div>
        <div class="col col-album"><span class="text-ellipsis">{{ song.album }}</span></div>
        <div class="col col-duration">{{ song.duration }}</div>
      </div>

      <!-- 空状态 -->
      <div v-if="playlistStore.displaySongs.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <p>暂无歌曲</p>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <!-- 单首操作 -->
      <template v-if="!contextMenu.isBatchMode">
        <div class="menu-item" @click="handlePlaySong">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>播放</span>
        </div>

        <div class="menu-item" @click="handleShowAddToPlaylistDialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加到歌单</span>
        </div>

        <div class="menu-item" @click="handleShowMusicInfo">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>音乐信息</span>
        </div>

        <div class="menu-item danger" @click="handleDeleteSong">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>从歌单移除</span>
        </div>
      </template>

      <!-- 批量操作 -->
      <template v-else>
        <div class="menu-header">已选中 {{ playlistStore.selectedSongCount }} 首歌曲</div>
        <div class="menu-item" @click="handleBatchAddToPlaylist">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加到歌单</span>
        </div>
        <div class="menu-item danger" @click="handleBatchDelete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>从歌单移除</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useDialogStore } from '@/stores/dialogStore'
import AddToPlaylistContent from '@/components/business/AddToPlaylistContent.vue'
import BatchAddToPlaylistContent from '@/components/business/BatchAddToPlaylistContent.vue'
import MusicInfoContent from '@/components/business/MusicInfoContent.vue'
import ConfirmDialogContent from '@/components/ui/ConfirmDialogContent.vue'

const playlistStore = usePlaylistStore()
const playerStore = usePlayerStore()
const dialogStore = useDialogStore()

// ========== 键盘状态 ==========

const isCtrlPressed = ref(false)
const isShiftPressed = ref(false)

const handleKeyDown = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = true
  if (e.key === 'Shift') isShiftPressed.value = true

  // Ctrl+A 全选/取消全选
  if (e.key === 'a' && e.ctrlKey) {
    e.preventDefault()
    if (playlistStore.selectedSongCount === playlistStore.displaySongs.length) {
      playlistStore.clearSelection()
    } else {
      playlistStore.selectAll()
    }
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'Control') isCtrlPressed.value = false
  if (e.key === 'Shift') isShiftPressed.value = false
}

// ========== 排序 ==========

const sortField = computed(() => playlistStore.sortField)
const sortAsc = computed(() => playlistStore.sortAsc)

const handleSort = (field) => {
  // 排序时退出筛选状态
  if (playlistStore.isSearchFiltered) {
    playlistStore.clearSearch()
  }
  playlistStore.setSortField(field)
}

// ========== 高亮滚动 ==========

const tableBodyRef = ref(null)
const highlightedSongId = computed(() => playlistStore.highlightedSongId)

// 滚动到指定歌曲
const scrollToSong = (songId) => {
  if (!tableBodyRef.value) return

  // 遍历所有行查找匹配的歌曲（避免 CSS 选择器特殊字符问题）
  const rows = tableBodyRef.value.querySelectorAll('.table-row')
  for (const row of rows) {
    if (row.dataset.songId === songId) {
      const container = tableBodyRef.value
      const targetOffset = row.offsetTop
      const containerHeight = container.clientHeight
      const targetHeight = row.clientHeight
      const scrollTop = targetOffset - (containerHeight / 2) + (targetHeight / 2)

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      })

      setTimeout(() => {
        playlistStore.clearHighlight()
      }, 3000)
      return
    }
  }
}

watch(highlightedSongId, async (newId) => {
  if (newId) {
    await nextTick()
    scrollToSong(newId)
  }
})

// ========== 右键菜单 ==========

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  song: null
})

// 行点击（左键）
const handleRowClick = (event, song, index) => {
  if (event.button !== 0) return // 只处理左键

  if (isCtrlPressed.value) {
    // Ctrl+点击：切换选中状态
    playlistStore.toggleSelection(song.id)
    playlistStore.lastSelectedIndex = index
  } else if (isShiftPressed.value) {
    // Shift+点击：范围选择
    if (playlistStore.lastSelectedIndex >= 0) {
      // 有上次选中位置：从上次位置到当前位置
      playlistStore.selectRange(playlistStore.lastSelectedIndex, index)
    } else {
      // 没有上次选中位置：选中当前歌曲
      playlistStore.selectSingle(song.id)
      playlistStore.lastSelectedIndex = index
    }
  } else {
    // 普通点击：取消所有选中
    playlistStore.clearSelection()
  }
}

const handleContextMenu = (event, song) => {
  // 右键不自动选中，只显示菜单
  // 如果右键的歌曲不在已选中列表中，显示单首操作菜单
  // 如果右键的歌曲在已选中列表中，显示批量操作菜单

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    song,
    // 标记是否为批量操作模式（右键的歌曲在选中列表中）
    isBatchMode: playlistStore.isSelected(song.id)
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

// 显示添加到歌单对话框
const handleShowAddToPlaylistDialog = () => {
  const song = contextMenu.value.song
  if (song) {
    // 打开对话框，传入歌曲信息
    dialogStore.openDialog({
      title: '添加  ',
      titleHighlight: song.name,
      showSuffix: true,
      component: AddToPlaylistContent,
      props: {
        song: {
          id: song.id,
          name: song.name,
          artist: song.artist,
          album: song.album,
          type: song.type,
          duration: song.duration,
          meta: song.meta
        }
      },
      randomAnimation: true
    })
  }
  closeContextMenu()
}

// 显示音乐信息对话框
const handleShowMusicInfo = () => {
  const song = contextMenu.value.song
  if (song) {
    // song.id 就是文件路径
    dialogStore.openDialog({
      title: '',
      component: MusicInfoContent,
      props: {
        filePath: song.id,
        songName: song.name,
        songType: song.type
      },
      randomAnimation: true
    })
  }
  closeContextMenu()
}

// 删除歌曲
const handleDeleteSong = () => {
  const song = contextMenu.value.song
  if (song) {
    const listId = playlistStore.currentPlaylistId
    const isDefault = listId === 'default'

    // 确认消息
    const message = isDefault
      ? `确定要从"全部歌曲"中删除「${song.name}」吗？\n这将从所有歌单中移除该歌曲。`
      : `确定要从当前歌单中移除「${song.name}」吗？`

    // 打开确认对话框
    dialogStore.openDialog({
      title: '',
      component: ConfirmDialogContent,
      props: {
        message,
        onConfirm: async () => {
          await playlistStore.removeSongFromPlaylist(song.id, listId, isDefault)
        }
      },
      randomAnimation: true
    })
  }
  closeContextMenu()
}

// 批量添加到歌单
const handleBatchAddToPlaylist = () => {
  const count = playlistStore.selectedSongCount
  dialogStore.openDialog({
    title: '添加  ',
    titleHighlight: `${count} 首歌曲`,
    showSuffix: true,
    component: BatchAddToPlaylistContent,
    props: {},
    randomAnimation: true
  })
  closeContextMenu()
}

// 批量删除
const handleBatchDelete = () => {
  const count = playlistStore.selectedSongCount
  const listId = playlistStore.currentPlaylistId
  const isDefault = listId === 'default'

  const message = isDefault
    ? `确定要从"全部歌曲"中删除选中的 ${count} 首歌曲吗？\n这将从所有歌单中移除这些歌曲。`
    : `确定要从当前歌单中移除选中的 ${count} 首歌曲吗？`

  // 打开确认对话框
  dialogStore.openDialog({
    title: '确认删除',
    component: ConfirmDialogContent,
    props: {
      message,
      onConfirm: async () => {
        await playlistStore.removeSelectedSongsFromPlaylist(listId, isDefault)
      }
    },
    randomAnimation: true
  })
  closeContextMenu()
}

// 点击其他地方关闭菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.context-menu')) {
    closeContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})

// ========== 播放 ==========

const handlePlay = (song) => {
  console.log('播放歌曲:', song.name)

  // 设置播放列表为当前显示的歌曲列表
  playerStore.setPlaylist([...playlistStore.displaySongs])

  // 设置当前歌单 ID（用于持久化恢复）
  playerStore.setCurrentPlaylistId(playlistStore.currentPlaylistId)

  // 重置媒体筛选模式为默认（音/视）
  playerStore.setMediaFilter('all')

  // 设置当前歌曲
  playerStore.setCurrentSong(song)

  // 不自动打开播放详情页，用户可以点击封面进入
}

// 播放歌曲（右键菜单）
const handlePlaySong = () => {
  const song = contextMenu.value.song
  if (song) {
    handlePlay(song)
  }
  closeContextMenu()
}
</script>

<style lang="scss" scoped>
.song-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .table-header {
    display: flex;
    padding: 0 20px;
    height: 40px;
    background-color: var(--bg-primary);
    border-bottom: 0.5px solid var(--primary-color-30);

    .col {
      display: flex;
      align-items: center;
      font-size: var(--font-size-xs);
      color: var(--text-icon);
      font-weight: 500;

      &.sortable {
        cursor: pointer;
        user-select: none;
        transition: color 0.2s ease;

        &:hover {
          color: var(--text-secondary);
        }

        &.active {
          color: var(--primary-color);
        }

        .sort-icon {
          margin-left: 4px;
          font-size: 10px;
        }
      }
    }
  }

  .table-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;

    .table-row {
      display: flex;
      height: 44px;
      margin: 0 -20px;
      padding: 0 20px;
      transition: background-color 0.2s ease;

      &:hover,
      &.context-active {
        background-color: var(--primary-color-15);
      }

      &.selected {
        background-color: var(--primary-color-25);
      }

      &.highlighted {
        background-color: var(--primary-color-25);
      }

      .col {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #333;
        overflow: hidden;
        min-width: 0;

        .text-ellipsis {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          display: block;
          width: 100%;
        }

        &.col-index {
          color: #9499a0;
        }
      }
    }

    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: var(--text-icon);

      svg {
        opacity: 0.5;
        margin-bottom: 12px;
      }

      p {
        font-size: var(--font-size-sm);
      }
    }
  }

  // 列宽设置（使用百分比）
  .col-type {
    width: 5%;
    min-width: 0;
    justify-content: center;
  }

  .col-index {
    width: 5%;
    min-width: 0;
    justify-content: center;
  }

  .col-name {
    width: 35%;
    min-width: 0;
  }

  .col-artist {
    width: 25%;
    min-width: 0;
  }

  .col-album {
    width: 20%;
    min-width: 0;
  }

  .col-duration {
    width: 10%;
    min-width: 0;
    justify-content: flex-end;
  }

  // 类型标签
  .type-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 4px;

    &.music {
      background-color: var(--primary-color-20);
      svg {
        color: var(--primary-color);
      }
    }

    &.video {
      background-color: rgba(114, 46, 209, 0.2);
      svg {
        color: #722ed1;
      }
    }
  }

  // 右键菜单
  .context-menu {
    position: fixed;
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 6px;
    z-index: 1000;
    min-width: 140px;

    .menu-header {
      padding: 8px 14px;
      font-size: var(--font-size-xs);
      color: var(--text-icon);
      border-bottom: 1px solid var(--primary-color-20);
      margin-bottom: 4px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      svg {
        flex-shrink: 0;
      }

      &:hover {
        background-color: var(--bg-secondary);
      }

      &.danger {
        color: var(--danger-color);

        &:hover {
          background-color: rgba(255, 107, 107, 0.1);
        }
      }
    }
  }
}
</style>
