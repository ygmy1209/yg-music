/**
 * 歌单列表侧边栏
 * 展示歌单列表，支持新建、重命名、删除
 */

<template>
  <div class="playlist-sidebar">
    <!-- 标题栏 -->
    <div class="sidebar-header">
      <span class="title">我的歌单</span>
      <button class="add-btn" @click="handleStartCreate" title="新建歌单">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <!-- 歌单列表 -->
    <div class="playlist-list">
      <div
        v-for="playlist in playlistStore.playlists"
        :key="playlist.id"
        class="playlist-item"
        :class="{ active: playlistStore.currentPlaylistId === playlist.id, editing: editingId === playlist.id }"
        @click="handleSelect(playlist.id, $event)"
        @contextmenu.prevent="handleContextMenu($event, playlist)"
      >
        <input
          v-if="editingId === playlist.id"
          :ref="el => { if (editingId === playlist.id) editInputRef = el }"
          v-model="editingValue"
          type="text"
          class="edit-input"
          :placeholder="isNewMode ? '新建歌单' : ''"
          @keydown.enter="confirmEdit"
          @keydown.escape="cancelEdit"
          @blur="handleBlur"
          @click.stop
        />
        <span v-else class="playlist-name text-ellipsis">{{ playlist.name }}</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="menu-item" @click="handleStartRename">重命名</div>
      <div
        v-if="contextMenu.playlist && contextMenu.playlist.id !== 'default'"
        class="menu-item danger"
        @click="handleDelete"
      >
        删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useDialogStore } from '@/stores/dialogStore'
import ConfirmDialogContent from '@/components/ui/ConfirmDialogContent.vue'

const playlistStore = usePlaylistStore()
const dialogStore = useDialogStore()

// ========== 统一编辑状态 ==========

const editingId = ref(null)        // 正在编辑的歌单 id（新建时为临时 id）
const editingValue = ref('')       // 编辑中的值
const isNewMode = ref(false)       // 是否为新建模式
const editInputRef = ref(null)
const playlistListRef = ref(null)  // 列表容器引用

// 检查歌单名是否重复（排除当前编辑的歌单）
const isNameDuplicate = (name) => {
  const trimmedName = name.trim()
  if (!trimmedName) return false

  return playlistStore.playlists.some(p => {
    // 排除临时项和当前正在编辑的歌单
    if (p.isTemp || p.id === editingId.value) return false
    return p.name === trimmedName
  })
}

// 处理失焦事件
const handleBlur = () => {
  confirmEdit()
}

// 滚动到编辑项
const scrollToEditingItem = async () => {
  await nextTick()
  await nextTick() // 双重 nextTick 确保 DOM 完全更新

  const listEl = document.querySelector('.playlist-list')
  if (!listEl) return

  const editingItem = listEl.querySelector('.playlist-item.editing')
  if (editingItem) {
    const containerRect = listEl.getBoundingClientRect()
    const itemRect = editingItem.getBoundingClientRect()

    // 判断是否需要滚动
    if (itemRect.bottom > containerRect.bottom || itemRect.top < containerRect.top) {
      editingItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
}

// 开始新建
const handleStartCreate = async () => {
  // 创建临时 id
  editingId.value = `temp_${Date.now()}`
  editingValue.value = ''
  isNewMode.value = true

  // 临时插入到 playlists（用于显示输入框位置）
  playlistStore.playlists.push({
    id: editingId.value,
    name: '',
    isTemp: true
  })

  // 等待 DOM 更新后滚动
  await scrollToEditingItem()

  // 等待滚动开始后再聚焦
  setTimeout(() => {
    editInputRef.value?.focus()
  }, 100)
}

// 开始重命名
const handleStartRename = async () => {
  const playlist = contextMenu.value.playlist
  if (playlist) {
    editingId.value = playlist.id
    editingValue.value = playlist.name
    isNewMode.value = false
  }
  closeContextMenu()

  // 聚焦并将光标移到最后
  await nextTick()
  const input = editInputRef.value
  if (input) {
    input.focus()
    // 将光标移到文字末尾
    const len = input.value.length
    input.setSelectionRange(len, len)
  }
}

// 确认编辑（新建或重命名）
const confirmEdit = async (forceCreate = false) => {
  const name = editingValue.value.trim()

  // 检查名字是否重复（非强制创建时）
  if (!forceCreate && name && isNameDuplicate(name)) {
    // 弹出确认对话框
    dialogStore.openDialog({
      component: ConfirmDialogContent,
      props: {
        message: '已存在同名歌单，是否继续创建？',
        cancelText: '不要！',
        confirmText: '是的',
        onConfirm: () => {
          // 强制创建
          doConfirmEdit(name)
        },
        onCancel: () => {
          // 取消创建
          cancelEdit()
        }
      },
      randomAnimation: true,
      closeOnClickOverlay: false,
      fullscreen: true
    })
    return
  }

  doConfirmEdit(name)
}

// 执行确认编辑
const doConfirmEdit = async (name) => {
  if (isNewMode.value) {
    // 新建模式：移除临时项
    const tempIndex = playlistStore.playlists.findIndex(p => p.id === editingId.value)
    if (tempIndex > -1) {
      playlistStore.playlists.splice(tempIndex, 1)
    }

    if (name) {
      const playlist = await playlistStore.createPlaylist(name)
      if (playlist) {
        await playlistStore.selectPlaylist(playlist.id)
      }
    }
  } else {
    // 重命名模式
    if (name && editingId.value) {
      await playlistStore.renamePlaylist(editingId.value, name)
    }
  }

  cancelEdit()
}

// 取消编辑
const cancelEdit = () => {
  if (isNewMode.value) {
    // 移除临时项
    const tempIndex = playlistStore.playlists.findIndex(p => p.id === editingId.value)
    if (tempIndex > -1) {
      playlistStore.playlists.splice(tempIndex, 1)
    }
  }

  editingId.value = null
  editingValue.value = ''
  isNewMode.value = false
}

// ========== 选择歌单 ==========

const handleSelect = (id, event) => {
  // 编辑状态不触发选择
  if (editingId.value === id) return
  playlistStore.selectPlaylist(id)
}

// ========== 右键菜单 ==========

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  playlist: null
})

const handleContextMenu = (event, playlist) => {
  // 临时项不显示菜单
  if (playlist.isTemp) return

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    playlist
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

// 删除
const handleDelete = () => {
  const playlist = contextMenu.value.playlist
  if (playlist && playlist.id !== 'default') {
    // 打开确认对话框
    dialogStore.openDialog({
      component: ConfirmDialogContent,
      props: {
        message: `确定要删除歌单「${playlist.name}」吗？\n删除后无法恢复。`,
        onConfirm: () => {
          playlistStore.deletePlaylist(playlist.id)
        }
      },
      randomAnimation: true
    })
  }
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
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.playlist-sidebar {
  width: 10%;
  min-width: 150px;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 20px 15px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .add-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;

      svg {
        color: var(--text-icon);
      }

      &:hover {
        background-color: var(--bg-tertiary);

        svg {
          color: var(--primary-color);
        }
      }
    }
  }

  .playlist-list {
    flex: 1;
    overflow-y: scroll;
    padding: 0 8px 8px;
    scroll-behavior: smooth;

    .playlist-item {
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      .playlist-name {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
      }

      .edit-input {
        width: 100%;
        padding: 0;
        border: none;
        border-radius: 0;
        font-size: var(--font-size-sm);
        outline: none;
        background: transparent;
        color: var(--text-primary);
        font-family: inherit;

        &::placeholder {
          color: var(--text-icon);
        }
      }

      &:hover {
        background-color: var(--bg-tertiary);

        .playlist-name {
          color: var(--text-primary);
        }
      }

      &.active {
        background-color: var(--primary-color-25);

        .playlist-name {
          color: var(--primary-dark);
        }
      }

      &.editing {
        background-color: var(--primary-color-15);
      }
    }
  }

  .context-menu {
    position: fixed;
    background-color: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 6px;
    z-index: 1000;
    min-width: 100px;

    .menu-item {
      padding: 8px 14px;
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease;

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
