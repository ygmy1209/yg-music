/**
 * 底部播放控制栏组件
 * 包含：封面、歌曲信息、进度条、音量控制、播放控制按钮
 */

<template>
  <div class="player-bar">
    <!-- 封面图片 -->
    <div class="cover-image" @click="handleOpenDetail">
      <img v-if="playerStore.currentSong?.cover" :src="playerStore.currentSong.cover" alt="封面" />
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="placeholder-icon">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    </div>

    <!-- 歌曲信息 -->
    <div class="music-info">
      <div class="music-name">{{ playerStore.currentSong?.name || '未播放歌曲' }}</div>
      <div class="artist-name">{{ playerStore.currentSong?.artist || '--' }}</div>
    </div>

    <!-- 进度条区域 -->
    <div class="progress-section">
      <span class="time current-time">{{ playerStore.playProgress.currentTimeStr }}</span>
      <div class="progress-bar" ref="progressBarRef" @click="handleProgressClick" @mousedown="handleProgressDragStart">
        <div class="progress-track">
          <div class="progress-fill" :style="{ transform: `scaleX(${playerStore.playProgress.progress || 0})` }"></div>
          <div v-show="isDragging" class="progress-preview" :style="{ transform: `scaleX(${dragProgress || 0})` }"></div>
        </div>
      </div>
      <span class="time duration-time">{{ playerStore.playProgress.durationStr }}</span>
    </div>

    <!-- 功能按钮组 -->
    <div class="control-btn">
      <!-- 添加到歌单 -->
      <button class="ctrl-btn" title="添加到歌单" @click="handleAddToPlaylist">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-plus-icon lucide-heart-plus"><path d="m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49"/><path d="M15 15h6"/><path d="M18 12v6"/></svg>
      </button>

      <!-- 循环模式 -->
      <button class="ctrl-btn" :title="playerStore.playModeText" @click="playerStore.togglePlayMode">
        <!-- 列表循环 -->
        <svg v-if="playerStore.playMode === 'list'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m17 2 4 4-4 4"/>
          <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
          <path d="m7 22-4-4 4-4"/>
          <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
        </svg>
        <!-- 单曲循环 -->
        <svg v-else-if="playerStore.playMode === 'single'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m17 2 4 4-4 4"/>
          <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
          <path d="m7 22-4-4 4-4"/>
          <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
          <text x="12" y="14" font-size="8" fill="currentColor" text-anchor="middle">1</text>
        </svg>
        <!-- 随机播放 -->
        <svg v-else-if="playerStore.playMode === 'random'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/>
          <path d="m18 2 4 4-4 4"/>
          <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/>
          <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>
          <path d="m18 14 4 4-4 4"/>
        </svg>
        <!-- 顺序播放 -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6h13"/>
          <path d="M8 12h13"/>
          <path d="M8 18h13"/>
          <path d="M3 6h.01"/>
          <path d="M3 12h.01"/>
          <path d="M3 18h.01"/>
        </svg>
      </button>

      <!-- 音量控制 -->
      <PopupBtn placement="top" trigger="both" :pinned="isVolumeDragging">
        <button class="ctrl-btn" title="音量" @click.stop="playerStore.toggleMute">
          <!-- 静音 -->
          <svg v-if="playerStore.isMute || playerStore.volume === 0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
          <!-- 低音量 -->
          <svg v-else-if="playerStore.volume < 0.3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <!-- 中音量 -->
          <svg v-else-if="playerStore.volume < 0.7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
          <!-- 高音量 -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </button>

        <template #content>
          <div class="volume-panel">
            <div class="volume-info">
              <span>{{ Math.round(playerStore.volume * 100) }}%</span>
            </div>
            <div class="volume-slider" @mousedown="handleVolumeDragStart" ref="volumeSliderRef">
              <div class="slider-track">
                <div class="slider-fill" :style="{ transform: `scaleX(${playerStore.volume})` }"></div>
              </div>
            </div>
          </div>
        </template>
      </PopupBtn>
    </div>

    <!-- 播放控制按钮 -->
    <div class="play-btn-content">
      <!-- 上一首 -->
      <button class="skip-btn" title="上一首" @click="playerStore.prevSong">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/>
          <path d="M3 20V4"/>
        </svg>
      </button>

      <!-- 播放/暂停 -->
      <button class="play-btn" :title="playerStore.isPlaying ? '暂停' : '播放'" @click="playerStore.togglePlay">
        <!-- 暂停图标 -->
        <svg v-if="playerStore.isPlaying" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="14" y="4" width="4" height="16" rx="1"/>
          <rect x="6" y="4" width="4" height="16" rx="1"/>
        </svg>
        <!-- 播放图标 -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
        </svg>
      </button>

      <!-- 下一首 -->
      <button class="skip-btn" title="下一首" @click="playerStore.nextSong">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 4v16"/>
          <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useDialogStore } from '@/stores/dialogStore'
import PopupBtn from '@/components/ui/PopupBtn.vue'
import AddToPlaylistContent from '@/components/business/AddToPlaylistContent.vue'

const playerStore = usePlayerStore()
const dialogStore = useDialogStore()

// 进度条拖拽状态
const isDragging = ref(false)
const dragProgress = ref(0)
const progressBarRef = ref(null)

// 音量滑块引用
const volumeSliderRef = ref(null)
// 音量拖动状态：拖动期间锁定音量气泡，避免 mouseleave 打断操作
const isVolumeDragging = ref(false)

// 有歌曲时才打开播放详情页，避免出现空白播放器
const handleOpenDetail = () => {
  if (playerStore.currentSong) {
    playerStore.openDetail()
  }
}

// 进度条点击
const handleProgressClick = (e) => {
  if (!progressBarRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const progress = (e.clientX - rect.left) / rect.width
  playerStore.setProgress(Math.max(0, Math.min(1, progress)))
}

// 进度条拖拽开始
const handleProgressDragStart = (e) => {
  isDragging.value = true
  updateDragProgress(e)

  document.addEventListener('mousemove', handleProgressDrag)
  document.addEventListener('mouseup', handleProgressDragEnd)
  window.addEventListener('blur', handleWindowBlur)
}

// 进度条拖拽中
const handleProgressDrag = (e) => {
  updateDragProgress(e)
}

// 更新拖拽进度
const updateDragProgress = (e) => {
  if (!progressBarRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  dragProgress.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
}

// 进度条拖拽结束
const handleProgressDragEnd = () => {
  isDragging.value = false
  playerStore.setProgress(dragProgress.value)

  document.removeEventListener('mousemove', handleProgressDrag)
  document.removeEventListener('mouseup', handleProgressDragEnd)
  window.removeEventListener('blur', handleWindowBlur)
}

// 音量拖拽开始
const handleVolumeDragStart = (e) => {
  e.preventDefault()
  isVolumeDragging.value = true
  handleVolumeDrag(e)
  document.addEventListener('mousemove', handleVolumeDrag)
  document.addEventListener('mouseup', handleVolumeDragEnd)
  window.addEventListener('blur', handleWindowBlur)
}

// 音量拖拽中
const handleVolumeDrag = (e) => {
  if (!volumeSliderRef.value) return
  const rect = volumeSliderRef.value.getBoundingClientRect()
  const volume = (e.clientX - rect.left) / rect.width
  playerStore.setVolume(volume)
}

// 音量拖拽结束
const handleVolumeDragEnd = () => {
  isVolumeDragging.value = false
  document.removeEventListener('mousemove', handleVolumeDrag)
  document.removeEventListener('mouseup', handleVolumeDragEnd)
  window.removeEventListener('blur', handleWindowBlur)
}

// 窗口失焦时结束拖动（鼠标可能在窗口外松开）
const handleWindowBlur = () => {
  if (isDragging.value) handleProgressDragEnd()
  if (isVolumeDragging.value) handleVolumeDragEnd()
}

// 添加当前歌曲到歌单
const handleAddToPlaylist = () => {
  const song = playerStore.currentSong
  if (!song) return

  dialogStore.openDialog({
    title: '添加到歌单',
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

onUnmounted(() => {
  document.removeEventListener('mousemove', handleProgressDrag)
  document.removeEventListener('mouseup', handleProgressDragEnd)
  document.removeEventListener('mousemove', handleVolumeDrag)
  document.removeEventListener('mouseup', handleVolumeDragEnd)
  window.removeEventListener('blur', handleWindowBlur)
})
</script>

<style lang="scss" scoped>
.player-bar {
  height: 66px;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  border-top: 1px solid var(--border-color);
  gap: 10px;
  padding: 6px;

  // 封面
  .cover-image {
    height: 100%;
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
    background-color: var(--primary-color-15);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
      display: block;
    }

    .placeholder-icon {
      color: var(--primary-color-50);
    }

    // 高亮遮罩层
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    &:hover::after {
      opacity: 0.15;
    }
  }

  // 歌曲信息
  .music-info {
    padding: 0 10px;
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    justify-content: center;
    min-width: 0;
    line-height: 1.5;

    .music-name,
    .artist-name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      width: 100%;
    }

    .music-name {
      font-size: 14px;
      color: var(--text-primary);
    }

    .artist-name {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }

  // 进度条区域
  .progress-section {
    width: 35%;
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;

    .time {
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
      width: 40px;

      &.current-time {
        text-align: right;
      }

      &.duration-time {
        text-align: left;
      }
    }

    .progress-bar {
      flex: 1;
      height: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      position: relative;

      .progress-track {
        width: 100%;
        height: 5px;
        background: var(--primary-color-20);
        border-radius: 4px;
        position: relative;
        overflow: hidden;
      }

      .progress-fill {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-color);
        transform-origin: left;
        will-change: transform;
      }

      .progress-preview {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-color-50);
        transform-origin: left;
        pointer-events: none;
      }

      &:hover {
        .progress-track {
          height: 6px;
        }
      }
    }
  }

  // 功能按钮
  .control-btn {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 4px;

    .ctrl-btn {
      background: none;
      border: none;
      padding: 6px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;

      svg {
        color: var(--primary-color-50);
      }

      &:hover {
        background-color: var(--bg-tertiary);

        svg {
          color: var(--primary-color);
        }
      }
    }
  }

  // 播放控制按钮
  .play-btn-content {
    display: flex;
    flex-flow: nowrap;
    align-items: center;
    gap: 12px;
    padding-left: 6px;
    padding-right: 10px;

    button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        color: var(--text-primary);
      }

      &:hover svg {
        color: var(--primary-color);
      }
    }

    .play-btn {
      width: 40px;
      height: 40px;
      background-color: var(--primary-color);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.2s;

      svg {
        color: #ffffff;
        margin-left: 2px;
      }

      &:hover {
        background-color: var(--primary-dark);

        svg {
          color: #ffffff;
        }
      }
    }
  }
}

// 音量面板样式
.volume-panel {
  padding: 12px 16px;
  width: 120px;

  .volume-info {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }

  .volume-slider {
    position: relative;
    height: 16px;
    display: flex;
    align-items: center;
    cursor: pointer;

    .slider-track {
      width: 100%;
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }

    .slider-fill {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: var(--primary-color);
      transform-origin: left;
    }

    &:hover {
      .slider-track {
        height: 5px;
      }
    }
  }
}
</style>
