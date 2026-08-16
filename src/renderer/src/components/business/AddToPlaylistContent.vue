/**
 * 添加到歌单对话框内容组件
 */

<template>
  <div class="add-to-playlist-content">
    <!-- 歌单列表 -->
    <div class="playlist-grid">
      <!-- 现有歌单按钮 -->
      <button
        v-for="pl in availablePlaylists"
        :key="pl.id"
        class="playlist-btn"
        :disabled="pl.id === playlistStore.currentPlaylistId"
        @click="handleAddToPlaylist(pl.id)"
      >
        {{ pl.name }}
      </button>

      <!-- 新建列表按钮 -->
      <button
        v-if="!isCreatingPlaylist"
        class="playlist-btn create-btn"
        title="新建列表"
        @click="startCreatePlaylist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      <!-- 新建列表输入框 -->
      <input
        v-else
        ref="createInputRef"
        v-model="newPlaylistName"
        type="text"
        class="playlist-input"
        placeholder="请输入"
        @keydown.enter="confirmCreatePlaylist"
        @blur="confirmCreatePlaylist"
      />

      <!-- 占位元素，用于最后一行左对齐 -->
      <span v-for="i in spaceNum" :key="'space-' + i" class="playlist-btn placeholder" />
    </div>

    <!-- 无可用歌单提示 -->
    <div v-if="availablePlaylists.length === 0 && !isCreatingPlaylist" class="empty-tip">
      暂无可添加的歌单，请新建一个
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useDialogStore } from '@/stores/dialogStore'

const props = defineProps({
  song: {
    type: Object,
    required: true
  }
})

const playlistStore = usePlaylistStore()
const dialogStore = useDialogStore()

// 每行按钮数量
const rowNum = 3

// 新建歌单相关
const isCreatingPlaylist = ref(false)
const newPlaylistName = ref('')
const createInputRef = ref(null)

// 可用歌单（排除当前歌单，自建歌单排除 default）
const availablePlaylists = computed(() => {
  const currentId = playlistStore.currentPlaylistId

  // 如果当前是 default，显示所有自建歌单
  if (currentId === 'default') {
    return playlistStore.playlists.filter(p => p.id !== 'default')
  }

  // 如果当前是自建歌单，只显示其他自建歌单（不显示 default）
  return playlistStore.playlists.filter(p => p.id !== 'default' && p.id !== currentId)
})

// 实际显示的项目数量（歌单 + 新建按钮/输入框）
const totalItems = computed(() => {
  return availablePlaylists.value.length + 1 // +1 是新建按钮或输入框
})

// 计算需要的占位元素数量
const spaceNum = computed(() => {
  const total = totalItems.value
  if (total < 2) return 0
  const remainder = total % rowNum
  return remainder === 0 ? 0 : rowNum - remainder
})

// 开始创建歌单
const startCreatePlaylist = async () => {
  isCreatingPlaylist.value = true
  await nextTick()
  createInputRef.value?.focus()
}

// 确认创建歌单
const confirmCreatePlaylist = async () => {
  const name = newPlaylistName.value.trim()
  if (name) {
    // 创建歌单
    const playlist = await playlistStore.createPlaylist(name)
    if (playlist) {
      // 直接添加歌曲到新歌单
      const song = props.song
      if (song) {
        const songInfo = {
          name: song.name,
          singer: song.artist,
          album: song.album,
          type: song.type,
          interval: song.duration,
          meta: song.meta
        }
        await playlistStore.addSongToPlaylist(song.id, playlist.id, songInfo)
      }
    }
  }
  // 重置状态
  isCreatingPlaylist.value = false
  newPlaylistName.value = ''
}

// 添加到指定歌单
const handleAddToPlaylist = async (targetListId) => {
  const song = props.song
  if (song && targetListId !== playlistStore.currentPlaylistId) {
    // 构造 songInfo
    const songInfo = {
      name: song.name,
      singer: song.artist,
      album: song.album,
      type: song.type,
      interval: song.duration,
      meta: song.meta
    }
    await playlistStore.addSongToPlaylist(song.id, targetListId, songInfo)
  }
  // 关闭对话框
  dialogStore.closeDialog()
}
</script>

<style lang="scss" scoped>
.add-to-playlist-content {
  max-width: 800px;

  .playlist-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    max-height: 300px;
    padding-right: 15px;
    overflow-y: auto;
  }

  .playlist-btn {
    width: 200px;
    margin-bottom: 15px;
    margin-left: 15px;
    padding: 12px 16px;
    background-color: var(--primary-color-15);
    border: none;
    border-radius: 8px;
    font-size: var(--font-size-sm);
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.placeholder {
      visibility: hidden;
      height: 0;
      margin: 0;
      padding: 0;
    }

    &:hover:not(:disabled):not(.placeholder) {
      background-color: var(--primary-color-35);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    // 新建列表按钮样式（和其他按钮一样）
    &.create-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1.5px dashed var(--primary-color);

      svg {
        color: var(--primary-color);
      }
    }
  }

  .playlist-input {
    width: 200px;
    margin-bottom: 15px;
    margin-left: 15px;
    padding: 12px 16px;
    background-color: var(--primary-color-15);
    border: 1.5px dashed var(--primary-color);
    border-radius: 8px;
    font-size: var(--font-size-sm);
    color: var(--primary-color);
    outline: none;
    text-align: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--primary-color-35);
    }

    &::placeholder {
      color: var(--text-icon);
      text-align: center;
    }
  }

  .empty-tip {
    width: 100%;
    text-align: center;
    color: var(--text-icon);
    font-size: var(--font-size-sm);
    padding: 20px 0;
  }
}
</style>
