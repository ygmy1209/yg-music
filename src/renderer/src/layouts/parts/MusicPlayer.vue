<template>
  <!-- 详情页 UI - 使用 v-show 保持 DOM 存在，媒体元素在详情页内部 -->
  <div
    v-show="playerStore.showDetail"
    class="player-app"
    :class="[
      isVideoMode ? 'mode-video' : 'mode-music',
      { 'is-playing': isPlaying },
      animationClass
    ]"
    @mousemove="handleTitleBarMouseMove"
    @mouseleave="handleTitleBarMouseLeave"
  >
    <!-- 媒体元素 - 始终存在于详情页内部 -->
    <audio
      ref="audioRef"
      preload="auto"
      @play="onMediaPlay"
      @pause="onMediaPause"
      @timeupdate="onMediaTimeUpdate"
      @loadedmetadata="onMediaLoadedMetadata"
      @ended="onMediaEnded"
      @error="onMediaError"
      style="display: none"
    ></audio>
    <video
      ref="videoRef"
      preload="auto"
      @play="onMediaPlay"
      @pause="onMediaPause"
      @timeupdate="onMediaTimeUpdate"
      @loadedmetadata="onMediaLoadedMetadata"
      @ended="onMediaEnded"
      @error="onMediaError"
      :style="{
        display: isVideoMode ? 'block' : 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        'object-fit': 'contain',
        'z-index': isVideoMode ? 15 : 1,
        background: '#000'
      }"
    ></video>

    <!-- 视频信息覆盖层 - 独立放在顶层，确保 z-index 正确 -->
    <Transition name="fade">
      <div v-if="isVideoMode && showVideoInfo" class="video-info-overlay">
        <div class="video-title">{{ songTitle }}</div>
        <div class="video-artist">{{ artistName }}</div>
      </div>
    </Transition>

    <!-- 窗口控制按钮 -->
    <div class="window-controls-bar" :class="{ 'show-controls': showTitleBarControls }">
      <div class="window-controls-drag"></div>

      <!-- 媒体筛选胶囊切换器 -->
      <div class="media-filter-capsule">
        <div
          v-for="option in mediaFilterOptions"
          :key="option.value"
          class="filter-option"
          :class="{ active: playerStore.mediaFilter === option.value }"
          @click="setMediaFilter(option.value)"
        >
          {{ option.label }}
        </div>
        <div class="filter-slider" :style="filterSliderStyle"></div>
      </div>

      <div class="window-controls">
        <button class="win-btn win-back" @click="closePlayer" title="返回">
          <svg viewBox="0 0 12 12">
            <polyline
              points="3,4 6,7 9,4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button class="win-btn win-minimize" @click="minimizeWindow" title="最小化">
          <svg viewBox="0 0 12 12"><rect x="2" y="5.5" width="8" height="1" /></svg>
        </button>
        <button class="win-btn win-maximize" @click="maximizeWindow" title="最大化">
          <svg viewBox="0 0 12 12">
            <rect
              x="2"
              y="2"
              width="8"
              height="8"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            />
          </svg>
        </button>
        <button class="win-btn win-fullscreen" @click="fullscreenWindow" title="全屏">
          <svg viewBox="0 0 12 12">
            <polyline points="2,5 2,2 5,2" fill="none" stroke="currentColor" stroke-width="1" />
            <polyline points="7,2 10,2 10,5" fill="none" stroke="currentColor" stroke-width="1" />
            <polyline points="10,7 10,10 7,10" fill="none" stroke="currentColor" stroke-width="1" />
            <polyline points="5,10 2,10 2,7" fill="none" stroke="currentColor" stroke-width="1" />
          </svg>
        </button>
        <button class="win-btn win-close" @click="closeWindow" title="关闭">
          <svg viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 弥散背景层 -->
    <div class="ambient-stage">
      <div class="glow-sphere sphere-1"></div>
      <div class="glow-sphere sphere-2"></div>
      <div
        class="ambient-bg"
        :class="{ 'has-cover': hasCover }"
        :style="hasCover ? { backgroundImage: `url(${coverImage})` } : {}"
      ></div>
    </div>

    <!-- 转码进度提示 -->
    <Transition name="blur-fade">
      <div v-if="isTranscoding" class="transcoding-overlay">
        <div class="glass-card trans-card">
          <div class="loading-ring"></div>
          <div class="trans-text">
            <span>正在解析音频流</span>
            <small>{{ transcodeProgress }}%</small>
          </div>
          <div class="mini-progress">
            <div class="fill" :style="{ width: transcodeProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 筛选提示 Toast -->
    <Transition name="fade">
      <div v-if="filterToastVisible" class="filter-toast">
        {{ filterToastMessage }}
      </div>
    </Transition>

    <!-- 主舞台 -->
    <main class="main-stage">
      <div class="stage-content">
        <!-- 音乐模式布局 -->
        <template v-if="!isVideoMode">
          <div class="music-center">
            <!-- 媒体容器 -->
            <div class="media-container">
              <div class="canvas-wrapper">
                <!-- 音乐封面层 -->
                <div class="music-cover-layer">
                  <!-- 频谱可视化 Canvas -->
                  <canvas
                    ref="visualizerCanvas"
                    width="440"
                    height="440"
                    class="visualizer-canvas"
                  ></canvas>

                  <div class="cover-art-box">
                    <div v-if="!hasCover" class="default-art">♪</div>
                    <img ref="coverArtRef" v-else :src="coverImage" class="main-art" :style="coverRotationStyle" />
                    <div class="breathing-ring"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 歌曲信息（封面下方） -->
            <div class="song-info">
              <h1 class="song-name">{{ songTitle }}</h1>
              <p class="artist-name">{{ artistName }}</p>
              <p class="album-name" v-if="albumName">{{ albumName }}</p>
            </div>
          </div>

          <!-- 歌词面板 -->
          <aside
            class="lyrics-panel"
            :class="'lyrics-align-' + (settingsStore.settings['playDetail.lyricAlign'] || 'center')"
          >
            <div class="lyrics-engine" ref="lyricsWrapperRef">
              <!-- 顶部 padding，使第一行可以滚动到中间 -->
              <div class="lyrics-padding" :style="{ height: lyricPaddingHeight + 'px' }"></div>

              <div v-if="lyrics.length === 0" class="lyric-empty">
                {{ isLoading ? '正在获取歌词...' : '暂无歌词' }}
              </div>
              <div
                v-for="(line, index) in lyrics"
                :key="index"
                class="l-line"
                :class="{ 'l-active': index === currentLyricIndex }"
                :data-index="index"
                @click="seekToLyric(line.time)"
              >
                {{ line.text }}
              </div>

              <!-- 底部 padding，使最后一行可以滚动到中间 -->
              <div class="lyrics-padding" :style="{ height: lyricPaddingHeight + 'px' }"></div>
            </div>
          </aside>
        </template>

        <!-- 视频模式：占位（视频元素在顶层，信息覆盖层也移到顶层） -->
        <template v-else>
          <div class="video-fullscreen">
            <!-- 占位，实际视频和信息覆盖层在 .player-app 顶层 -->
          </div>
        </template>
      </div>
    </main>

    <!-- 悬浮控制岛 -->
    <nav class="floating-hub" :class="{ 'is-hidden': !showControlHub }">
      <div
        class="hub-progress-track"
        :class="{ 'is-dragging': isDraggingProgress }"
        @click="seekProgress"
        @mousedown="startProgressDrag"
      >
        <div
          class="hub-progress-fill"
          :style="{ width: (isDraggingProgress ? dragProgressPercent * 100 : progressPercent) + '%' }"
        >
          <div class="hub-progress-light"></div>
        </div>
      </div>

      <div class="hub-content">
        <div class="hub-section section-left">
          <div class="mini-card">
            <img v-if="hasCover" :src="coverImage" />
            <div v-else class="mini-cover-placeholder">♪</div>
            <div class="mini-info">
              <div class="m-title">{{ songTitle }}</div>
              <div class="m-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</div>
            </div>
          </div>
        </div>

        <div class="hub-section section-center">
          <button class="icon-btn side" title="上一首 (P)" @click="prevSong">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>
          <button
            class="play-trigger"
            :title="isPlaying ? '暂停 (空格)' : '播放 (空格)'"
            @click="togglePlay"
          >
            <svg v-if="!isPlaying" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            <svg v-else viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          </button>
          <button class="icon-btn side" title="下一首 (N)" @click="nextSong">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
          </button>
        </div>

        <div class="hub-section section-right">
          <div class="vol-control">
            <!-- 音量图标随音量变化 -->
            <svg
              class="vol-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path v-if="volume > 0" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path v-if="volume > 50" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <input
              type="range"
              v-model="volume"
              min="0"
              max="100"
              @input="onVolumeChange"
              class="vol-slider"
            />
          </div>
          <button
            class="icon-btn list-toggle"
            :class="{ active: showPlaylist }"
            title="播放列表 (L)"
            @click="showPlaylist = !showPlaylist"
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- 播放列表面板 -->
    <Transition name="pane-slide">
      <aside v-if="showPlaylist" ref="playlistPaneRef" class="glass-pane playlist-pane">
        <div class="pane-header">
          <h3>播放队列</h3>
          <button class="pane-close" @click="showPlaylist = false">✕</button>
        </div>
        <div class="pane-list" ref="playlistRef">
          <div
            v-for="(song, index) in playerStore.filteredPlaylist"
            :key="song.id"
            class="list-item"
            :class="{ active: index === playerStore.filteredIndex }"
            @click="switchToSong(index)"
          >
            <span class="type-tag">{{ song.type === 1 ? 'VIDEO' : 'AUDIO' }}</span>
            <div class="item-meta">
              <div class="it-title">{{ song.name }}</div>
              <div class="it-artist">{{ song.artist }}</div>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<script setup>
/**
 * MusicPlayer.vue - 摇光音乐播放器
 *
 * 核心特性：
 * 1. 悬浮岛屿控制栏 - 自动隐藏/显示
 * 2. 环形频谱可视化 - Canvas 实时渲染
 * 3. 动态取色 + 弥散光球背景
 * 4. 音乐/视频模式丝滑形变
 * 5. 视频全屏播放
 */
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHotkeys } from '@/composables/useHotkeys'
import { formatTime, parseDuration } from '@/utils/formatTime'
import { parseLrc, findLyricIndex } from '@/utils/parseLrc'
import { updateThemeColor } from '@/utils/colorUtils'

// ==================== Stores ====================
const playerStore = usePlayerStore()
const settingsStore = useSettingsStore()
const hotkeys = useHotkeys()

// ==================== 动画控制 ====================
const isClosing = ref(false)

// 动画类
const animationClass = computed(() => {
  if (isClosing.value) {
    return 'animate__animated animate__fadeOutDownBig'
  }
  return 'animate__animated animate__fadeInRightBig'
})

// 关闭播放器
const closePlayer = () => {
  isClosing.value = true
  setTimeout(() => {
    playerStore.closeDetail()
    isClosing.value = false
  }, 600) // 等待动画完成
}

// 计算属性 - 从 store 获取播放列表
const playlist = computed(() => playerStore.playlist || [])
const currentIndex = computed(() => playerStore.currentIndex)

// 是否为视频模式
const isVideoMode = computed(() => playerStore.currentSong?.type === 1)

// ==================== 响应式状态 ====================
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// 音量以 playerStore.volume 为唯一状态源（0-1），这里仅做 0-100 的 UI 换算
const volume = computed({
  get: () => Math.round(playerStore.volume * 100),
  set: (val) => playerStore.setVolume(val / 100)
})
const songTitle = ref('加载中...')
const artistName = ref('未知艺术家')
const albumName = ref('未知专辑')
const coverImage = ref('')
const hasCover = ref(false)
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const isLoading = ref(true)
const isTranscoding = ref(false)
const isDraggingProgress = ref(false)  // 进度条拖拽状态
const dragProgressPercent = ref(0)   // 拖拽时的临时进度（视觉预览）
const transcodeProgress = ref(0)
const showPlaylist = ref(false)

// ==================== 控制栏显示/隐藏 ====================
const showControlHub = ref(true)
const showVideoInfo = ref(false) // 视频信息覆盖层
const showTitleBarControls = ref(false) // 标题栏窗口控制按钮
let hideTimer = null
let videoInfoTimer = null
let titleBarTimer = null // 标题栏隐藏计时器
let isSwitchingSong = false // 是否正在切换歌曲
let lastTaskbarPercent = null // 上次写入任务栏的整数进度百分比
let lastPointerY = null // 最近一次鼠标在窗口内的纵向位置

// ==================== 标题栏控制 ====================
const handleTitleBarMouseMove = (event) => {
  const windowHeight = window.innerHeight
  const mouseY = event.clientY
  lastPointerY = mouseY
  const topThreshold = windowHeight * 0.2 // 顶部 20% 区域

  if (mouseY <= topThreshold) {
    // 鼠标在顶部 20% 区域，显示控制按钮
    showTitleBarControls.value = true
    // 视频模式下同时显示视频信息
    if (isVideoMode.value) {
      showVideoInfo.value = true
    }
    if (titleBarTimer) {
      clearTimeout(titleBarTimer)
      titleBarTimer = null
    }
  } else {
    // 鼠标离开顶部 20% 区域，3秒后隐藏
    if (showTitleBarControls.value && !titleBarTimer) {
      titleBarTimer = setTimeout(() => {
        showTitleBarControls.value = false
        // 视频模式下同时隐藏视频信息
        if (isVideoMode.value && !showControlHub.value) {
          showVideoInfo.value = false
        }
        titleBarTimer = null
      }, 3000)
    }
  }
}

const handleTitleBarMouseLeave = () => {
  // 鼠标离开窗口时立即开始隐藏计时
  if (showTitleBarControls.value && !titleBarTimer) {
    titleBarTimer = setTimeout(() => {
      showTitleBarControls.value = false
      titleBarTimer = null
    }, 3000)
  }
}

// 窗口控制
const minimizeWindow = () => {
  window.windowAPI.minimize()
}

const maximizeWindow = () => {
  window.windowAPI.maximize()
}

const fullscreenWindow = () => {
  window.windowAPI.fullscreen()
}

const closeWindow = () => {
  window.windowAPI.close()
}

// ==================== 媒体筛选 ====================
const mediaFilterOptions = [
  { value: 'audio', label: '音乐' },
  { value: 'all', label: '音/视' },
  { value: 'video', label: '视频' }
]

const filterSliderStyle = computed(() => {
  const index = mediaFilterOptions.findIndex(o => o.value === playerStore.mediaFilter)
  return {
    transform: `translateX(${index * 100}%)`
  }
})

const setMediaFilter = (mode) => {
  const result = playerStore.setMediaFilter(mode)
  if (!result.success) {
    showFilterToast(result.error)
  }
}

// 筛选提示 toast
const filterToastVisible = ref(false)
const filterToastMessage = ref('')
let filterToastTimer = null

const showFilterToast = (message) => {
  filterToastMessage.value = message
  filterToastVisible.value = true
  if (filterToastTimer) {
    clearTimeout(filterToastTimer)
  }
  filterToastTimer = setTimeout(() => {
    filterToastVisible.value = false
    filterToastTimer = null
  }, 2000)
}

const startHideTimer = () => {
  clearHideTimer()
  hideTimer = setTimeout(() => {
    if (isPlaying.value && !showPlaylist.value) {
      showControlHub.value = false
      // 视频模式下，隐藏3秒后也跟随控制栏隐藏
      if (isVideoMode.value) {
        showVideoInfo.value = false
      }
    }
  }, 3000)
}

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const startVideoInfoTimer = () => {
  if (videoInfoTimer) {
    clearTimeout(videoInfoTimer)
  }
  // 如果控制栏已隐藏，视频信息独立显示4秒后消失
  // 如果控制栏显示中，则跟随控制栏，不需要独立计时
  if (!showControlHub.value) {
    videoInfoTimer = setTimeout(() => {
      showVideoInfo.value = false
    }, 4000)
  }
}

const handleMouseMove = (event) => {
  // 详情页隐藏时无需处理控制栏显隐
  if (!playerStore.showDetail) return

  const windowHeight = window.innerHeight
  const mouseY = event.clientY
  lastPointerY = mouseY
  const bottomThreshold = windowHeight * 0.8 // 底部 20% 区域

  if (mouseY >= bottomThreshold) {
    // 鼠标在底部 20% 区域，显示控制栏
    showControlHub.value = true
    // 视频模式下同时显示视频信息
    if (isVideoMode.value) {
      showVideoInfo.value = true
    }
    clearHideTimer()
  } else if (showControlHub.value && !hideTimer) {
    // 鼠标在中间区域，开始计时
    startHideTimer()
  }
}

// 按最近一次鼠标位置重新评估上下悬浮控件的自动隐藏计时
// 用于关闭播放队列等状态变化后，避免悬浮控件一直停留在页面上
const refreshAutoHideTimers = () => {
  if (lastPointerY === null) return
  handleTitleBarMouseMove({ clientY: lastPointerY })
  handleMouseMove({ clientY: lastPointerY })
}

// 点击播放队列面板以外的空白区域时关闭面板（底部控制岛和顶部窗口栏除外）
const handleDocumentClick = (event) => {
  if (!showPlaylist.value) return
  if (playlistPaneRef.value && playlistPaneRef.value.contains(event.target)) return
  if (event.target.closest('.floating-hub') || event.target.closest('.window-controls-bar')) return
  showPlaylist.value = false
}

// ==================== DOM 引用 ====================
const audioRef = ref(null)
const videoRef = ref(null)
const lyricsWrapperRef = ref(null)
const visualizerCanvas = ref(null)
const playlistRef = ref(null) // 播放列表容器引用
const playlistPaneRef = ref(null) // 播放队列面板引用

// ==================== 音频可视化 ====================
let audioCtx = null
let analyser = null
let sourceNode = null
let animationId = null
let isConnected = false
let coverRotation = 0 // 封面旋转角度
let coverAnimationFrame = null // 封面旋转动画帧

// 主题色 RGB 值（用于可视化）
const themeRgb = ref({ r: 255, g: 102, b: 153 })

// 初始化音频分析器（只连接 audio 元素，永不重连）
const initAudioAnalyser = () => {
  if (audioCtx || isConnected) return

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    // 只连接 audio 元素（不连接 video，避免切换模式时重连问题）
    if (audioRef.value) {
      sourceNode = audioCtx.createMediaElementSource(audioRef.value)
      sourceNode.connect(analyser)
      analyser.connect(audioCtx.destination)
      isConnected = true
      console.log('[可视化] 初始化成功')
    }
  } catch (e) {
    console.warn('[可视化] 初始化失败:', e)
  }
}

// 绘制环形频谱
const drawVisualizer = () => {
  if (!visualizerCanvas.value || !analyser) return

  const canvas = visualizerCanvas.value
  const ctx = canvas.getContext('2d')
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const render = () => {
    // 详情页隐藏、暂停或视频模式下不绘制，但保持循环便于恢复后继续
    if (!playerStore.showDetail || !playerStore.isPlaying || !analyser || isVideoMode.value) {
      animationId = requestAnimationFrame(render)
      return
    }

    animationId = requestAnimationFrame(render)

    // 再次检查 analyser 是否存在（可能在动画帧中被关闭）
    if (!analyser) return

    analyser.getByteFrequencyData(dataArray)

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const innerRadius = 140
    const outerMaxRadius = 200

    ctx.clearRect(0, 0, width, height)

    const { r, g, b } = themeRgb.value

    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[i] / 255
      const barHeight = amplitude * (outerMaxRadius - innerRadius)
      const angle = (i / bufferLength) * Math.PI * 2 - Math.PI / 2

      const x1 = centerX + Math.cos(angle) * innerRadius
      const y1 = centerY + Math.sin(angle) * innerRadius
      const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight)
      const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight)

      const alpha = 0.3 + amplitude * 0.7

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    ctx.shadowBlur = 20
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`
  }

  render()
}

// 停止可视化
const stopVisualizer = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// ==================== 计算属性 ====================
const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))
const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 当前歌曲对象（带安全检查）
const currentSong = computed(() => {
  if (
    !playlist.value.length ||
    currentIndex.value < 0 ||
    currentIndex.value >= playlist.value.length
  ) {
    return null
  }
  return playlist.value[currentIndex.value]
})

// 当前音频路径（歌曲 id 就是文件路径）
const currentAudioPath = computed(() => {
  if (!currentSong.value) return ''
  return currentSong.value.id // id 就是完整的文件路径
})

// 当前歌词路径
const currentLrcPath = computed(() => {
  if (!currentSong.value) return ''
  // 将音频文件扩展名替换为 .lrc
  return currentSong.value.id.replace(/\.[^.]+$/, '.lrc')
})

// ==================== 音频元数据 ====================
let embeddedLyrics = null
// 加载令牌：每次切歌递增，异步结果返回时令牌不一致说明是过期请求，直接丢弃
let loadToken = 0

// 歌曲元数据/封面小缓存，避免来回切歌时反复 IPC 解析同一文件
const metadataCache = new Map()
const METADATA_CACHE_LIMIT = 12

const getMetadataCacheKey = (song) =>
  `${song.id}|${song.name || ''}|${song.artist || ''}|${song.album || ''}`

const putMetadataCache = (key, entry) => {
  if (metadataCache.size >= METADATA_CACHE_LIMIT) {
    const oldestKey = metadataCache.keys().next().value
    metadataCache.delete(oldestKey)
  }
  metadataCache.set(key, entry)
}

const applyCover = (coverData) => {
  if (coverData) {
    coverImage.value = coverData
    hasCover.value = true
    updateThemeColor(coverData, { themeRgb })
    // 同步封面到 playerStore，让 PlayerBar 也能显示
    if (playerStore.currentSong) {
      playerStore.currentSong.cover = coverData
    }
  } else {
    hasCover.value = false
    coverImage.value = ''
    updateThemeColor(null, { themeRgb })
  }
}

async function loadAudioMetadata(token) {
  // 安全检查
  const song = currentSong.value
  if (!song) {
    console.warn('[渲染进程] 无当前歌曲')
    return false
  }

  const audioPath = currentAudioPath.value
  const cacheKey = getMetadataCacheKey(song)

  // 重置内嵌歌词
  embeddedLyrics = null

  const cached = metadataCache.get(cacheKey)
  if (cached) {
    songTitle.value = cached.title
    artistName.value = cached.artist
    albumName.value = cached.album
    if (cached.duration > 0) duration.value = cached.duration
    embeddedLyrics = cached.lyrics
    applyCover(cached.cover)
    return true
  }

  try {
    console.log('[渲染进程] 正在请求音频元数据:', audioPath)
    const result = await window.musicAPI.parseMetadata(audioPath)
    if (token !== loadToken) return false
    console.log('[渲染进程] 收到结果:', result)

    if (!result.success) {
      console.warn('[渲染进程] 元数据解析错误:', result.error)
      songTitle.value = song.name || '未知歌曲'
      artistName.value = song.artist || '未知艺术家'
      albumName.value = song.album || ''
      return true
    }

    const metadata = result.data

    songTitle.value = metadata.name || song.name || '未知歌曲'
    artistName.value = metadata.artist || song.artist || '未知艺术家'
    albumName.value = metadata.album || song.album || ''
    if (metadata.duration) duration.value = parseDuration(metadata.duration)

    // 获取内嵌歌词
    if (metadata.lyrics) {
      console.log('[渲染进程] 找到内嵌歌词')
      embeddedLyrics = metadata.lyrics
    }

    // 封面图片
    const coverResult = await window.musicAPI.getCover(audioPath)
    if (token !== loadToken) return false

    const coverData = coverResult.success ? coverResult.data : null
    applyCover(coverData)
    putMetadataCache(cacheKey, {
      title: songTitle.value,
      artist: artistName.value,
      album: albumName.value,
      duration: duration.value,
      lyrics: embeddedLyrics,
      cover: coverData
    })

    return true
  } catch (error) {
    if (token !== loadToken) return false
    console.error('[渲染进程] 获取元数据失败:', error)
    songTitle.value = song.name || '未知歌曲'
    artistName.value = song.singer || '未知艺术家'
    albumName.value = song.album || ''
    return true
  }
}

// ==================== 歌词加载 ====================
async function loadLyrics(token) {
  if (embeddedLyrics) {
    const parsed = parseLrc(embeddedLyrics)
    if (parsed.length > 0) {
      lyrics.value = parsed
      return
    }
    const lines = embeddedLyrics.split('\n').filter((line) => line.trim())
    if (lines.length > 0) {
      lyrics.value = lines.map((text, index) => ({
        time: index * 5,
        text: text.trim()
      }))
      return
    }
  }

  try {
    const result = await window.fileAPI.readTextFile(currentLrcPath.value)
    if (token !== loadToken) return
    if (result.error) {
      lyrics.value = []
      return
    }
    lyrics.value = parseLrc(result.content)
  } catch {
    if (token !== loadToken) return
    lyrics.value = []
  }
}

// ==================== 播放控制 ====================
function getMediaElement() {
  if (isVideoMode.value) {
    return videoRef.value
  }
  return audioRef.value
}

async function togglePlay() {
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }

  const media = getMediaElement()
  if (!media) return

  if (isPlaying.value) {
    media.pause()
  } else {
    media.play().catch((err) => {
      console.warn('[播放控制] 播放失败:', err.message)
      const savedTime = media.currentTime
      media.load()
      media.currentTime = savedTime
      media.play().catch((e) => console.error(e))
    })
  }
}

let mediaBlobUrl = null
let unsubscribeTranscodeProgress = null

// 订阅转码进度事件（preload 提供，主进程通过 transcode:progress 推送）
// 返回取消订阅函数，保证快速切歌时各请求只清理自己的订阅
function subscribeTranscodeProgress(filePath) {
  if (typeof window.transcodeAPI?.onProgress !== 'function') return null
  const unsubscribe = window.transcodeAPI.onProgress((data) => {
    if (data && data.filePath === filePath) {
      transcodeProgress.value = Math.max(0, Math.min(100, data.percent || 0))
    }
  })
  unsubscribeTranscodeProgress = unsubscribe
  return () => {
    if (unsubscribeTranscodeProgress === unsubscribe) {
      unsubscribeTranscodeProgress = null
    }
    unsubscribe()
  }
}

// 取消当前记录的转码进度订阅（切歌/卸载时使用）
function unsubscribeTranscodeProgressSafe() {
  if (unsubscribeTranscodeProgress) {
    unsubscribeTranscodeProgress()
    unsubscribeTranscodeProgress = null
  }
}

async function prepareMediaFile(originalPath, token) {
  if (!isVideoMode.value || !window.transcodeAPI) return originalPath

  try {
    const probeResult = await window.transcodeAPI.probe(originalPath)
    if (token !== loadToken) return originalPath
    if (!probeResult.success || !probeResult.data?.needsTranscode) {
      return originalPath
    }

    isTranscoding.value = true
    transcodeProgress.value = 10
    const unsubscribe = subscribeTranscodeProgress(originalPath)

    try {
      const result = await window.transcodeAPI.ensurePlayable(originalPath)
      if (token !== loadToken) return originalPath
      transcodeProgress.value = 100
      return result.success && result.data ? result.data.path : originalPath
    } finally {
      unsubscribe?.()
      if (token === loadToken) {
        isTranscoding.value = false
      }
    }
  } catch (transcodeError) {
    console.warn('[转码] 检测失败，使用原文件:', transcodeError)
    if (token === loadToken) {
      isTranscoding.value = false
    }
    return originalPath
  }
}

/**
 * 加载并播放当前歌曲
 * @param {boolean} autoPlay - 是否自动播放，默认 true
 */
async function loadAndPlay(autoPlay = true) {
  console.log('========== loadAndPlay 开始 ==========')

  // 安全检查：确保播放列表和索引有效
  if (!playlist.value.length || currentIndex.value < 0 || currentIndex.value >= playlist.value.length) {
    console.warn('[加载] 播放列表为空或索引无效')
    isLoading.value = false
    songTitle.value = '未播放歌曲'
    artistName.value = '请选择要播放的音乐'
    return
  }

  const currentSong = playlist.value[currentIndex.value]
  console.log('[加载] 开始加载:', currentSong.title || currentSong.name)

  // 每次加载使用新令牌，过期请求返回后不再覆盖当前界面状态
  const token = ++loadToken

  // 标记正在切换歌曲，避免触发控制栏显示
  isSwitchingSong = true
  clearHideTimer()
  if (videoInfoTimer) {
    clearTimeout(videoInfoTimer)
    videoInfoTimer = null
  }
  showVideoInfo.value = false

  // 重置封面旋转角度
  stopCoverRotation()
  coverRotation = 0
  coverRotationStyle.value = { transform: 'rotate(0deg)' }
  if (coverArtRef.value) {
    coverArtRef.value.style.transform = 'rotate(0deg)'
  }

  // 重置任务栏进度条
  window.settingAPI.setTaskProgress(-1)
  lastTaskbarPercent = null

  // 只在自动播放时重置进度
  if (autoPlay) {
    currentTime.value = 0
    currentLyricIndex.value = -1
  }
  // 清空上一首歌的信息，避免解析失败时残留旧封面/专辑/时长
  songTitle.value = currentSong.name || '未知歌曲'
  artistName.value = currentSong.artist || '未知艺术家'
  albumName.value = ''
  duration.value = 0
  hasCover.value = false
  coverImage.value = ''
  lyrics.value = []
  if (lyricScrollTimer) {
    clearTimeout(lyricScrollTimer)
    lyricScrollTimer = null
  }
  isLoading.value = true
  unsubscribeTranscodeProgressSafe()
  isTranscoding.value = false
  transcodeProgress.value = 0

  if (audioRef.value) {
    audioRef.value.pause()
    if (autoPlay) audioRef.value.currentTime = 0
  }
  if (videoRef.value) {
    videoRef.value.pause()
    if (autoPlay) videoRef.value.currentTime = 0
  }

  await loadAudioMetadata(token)
  if (token !== loadToken) return

  if (!isVideoMode.value) {
    await loadLyrics(token)
    if (token !== loadToken) return
  }

  try {
    const playFilePath = await prepareMediaFile(currentAudioPath.value, token)
    if (token !== loadToken) return

    console.log('[加载] 正在读取媒体文件:', playFilePath)
    const fileResult = await window.fileAPI.readAudioFile(playFilePath)
    if (token !== loadToken) return
    
    if (fileResult.error) throw new Error(fileResult.error)
    if (!fileResult.data) throw new Error('没有返回数据')

    const blob = new Blob([fileResult.data], { type: fileResult.mimeType })
    const newBlobUrl = URL.createObjectURL(blob)
    if (token !== loadToken) {
      // 期间又切歌了，释放本次创建的 Blob URL
      URL.revokeObjectURL(newBlobUrl)
      return
    }

    // 新 URL 准备就绪后才释放旧 URL，避免切歌瞬间旧媒体还在使用
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl)
    }
    mediaBlobUrl = newBlobUrl

    if (isVideoMode.value) {
      await nextTick()
    }
    if (token !== loadToken) return

    const media = getMediaElement()
    if (media) {
      media.src = mediaBlobUrl
      media.load()

      if (autoPlay) {
        console.log('[加载] 开始播放...')
        media.play().catch((err) => console.warn('[加载] 自动播放失败:', err.message))
      } else {
        console.log('[加载] 仅加载，等待 loadedmetadata 事件')
      }
    } else {
      console.error('[加载] 无法获取媒体元素!')
    }
  } catch (error) {
    if (token !== loadToken) return
    console.error('[加载] 媒体文件加载失败:', error)
    isTranscoding.value = false

    // 尝试直接使用文件路径
    const media = getMediaElement()
    if (media && currentAudioPath.value) {
      media.src = `file:///${currentAudioPath.value.replace(/\\/g, '/')}`
      media.load()
      if (autoPlay) {
        media.play().catch((e) => console.error('[加载] 后备加载也失败:', e))
      }
    }
  }

  if (token !== loadToken) return
  isLoading.value = false
  isSwitchingSong = false
}

function prevSong() {
  playerStore.prevSong()
  // loadAndPlay 会由 watch 监听 currentSong 变化自动触发
}

function nextSong() {
  playerStore.nextSong()
  // loadAndPlay 会由 watch 监听 currentSong 变化自动触发
}

function switchToSong(index) {
  const filteredList = playerStore.filteredPlaylist
  if (index < 0 || index >= filteredList.length) return
  const song = filteredList[index]
  if (song && song.id !== playerStore.currentSong?.id) {
    playerStore.setCurrentSong(song)
    // loadAndPlay 会由 watch 监听 currentSong 变化自动触发
  }
  showPlaylist.value = false
}

function seekProgress(event) {
  const media = getMediaElement()
  if (!media || duration.value === 0) return
  const rect = event.currentTarget.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  media.currentTime = percent * duration.value
}

// 进度条拖拽开始
function startProgressDrag(event) {
  event.preventDefault()
  isDraggingProgress.value = true
  // 初始化拖拽进度为当前进度
  dragProgressPercent.value = progressPercent.value / 100
  updateDragProgress(event)
  document.addEventListener('mousemove', onProgressDrag)
  document.addEventListener('mouseup', stopProgressDrag)
  window.addEventListener('blur', stopProgressDrag)
}

// 进度条拖拽中（只更新视觉，不 seek）
function onProgressDrag(event) {
  if (!isDraggingProgress.value) return
  updateDragProgress(event)
}

// 更新拖拽进度（视觉预览）
function updateDragProgress(event) {
  const track = document.querySelector('.hub-progress-track')
  if (!track) return
  const rect = track.getBoundingClientRect()
  dragProgressPercent.value = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
}

// 进度条拖拽结束（此时才真正 seek）
function stopProgressDrag() {
  if (isDraggingProgress.value && duration.value > 0) {
    const media = getMediaElement()
    if (media) {
      media.currentTime = dragProgressPercent.value * duration.value
    }
  }
  isDraggingProgress.value = false
  document.removeEventListener('mousemove', onProgressDrag)
  document.removeEventListener('mouseup', stopProgressDrag)
  window.removeEventListener('blur', stopProgressDrag)
}

function seekToLyric(time) {
  // 检查是否允许拖拽歌词调整进度
  const dragLyric = settingsStore.settings['playDetail.dragLyric']
  if (!dragLyric) return

  const media = getMediaElement()
  if (!media) return
  media.currentTime = time
}

// ==================== 歌词滚动 ====================
let lyricScrollAnimation = null
let lyricScrollTimer = null
let lyricsResizeObserver = null
const lyricPaddingHeight = ref(0)

// 歌词中心点偏移比例 (0.5 = 正中间, >0.5 = 偏下)
const LYRIC_CENTER_RATIO = 0.55

// 自定义平滑滚动，可控制速度
function smoothScrollTo(element, targetScrollTop, duration) {
  if (lyricScrollAnimation) {
    cancelAnimationFrame(lyricScrollAnimation)
  }

  const startScrollTop = element.scrollTop
  const distance = targetScrollTop - startScrollTop
  const startTime = performance.now()

  function animate(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用 ease-out 缓动函数
    const easeOut = 1 - Math.pow(1 - progress, 3)

    element.scrollTop = startScrollTop + distance * easeOut

    if (progress < 1) {
      lyricScrollAnimation = requestAnimationFrame(animate)
    }
  }

  lyricScrollAnimation = requestAnimationFrame(animate)
}

// 更新歌词 padding 高度，使第一行可以滚动到中间
function updateLyricPadding() {
  if (!lyricsWrapperRef.value) return
  const containerHeight = lyricsWrapperRef.value.clientHeight
  lyricPaddingHeight.value = containerHeight * LYRIC_CENTER_RATIO
}

function updateCurrentLyric() {
  // 详情页隐藏时跳过歌词定位与滚动，打开后下一次 timeupdate 会立即同步
  if (!playerStore.showDetail) return
  if (lyrics.value.length === 0) return

  // 歌词已按时间排序，用二分查找定位当前行，避免每次 timeupdate 遍历整个数组
  const newIndex = findLyricIndex(lyrics.value, currentTime.value)

  if (newIndex !== currentLyricIndex.value && lyricsWrapperRef.value) {
    currentLyricIndex.value = newIndex

    // 先高亮显示，延迟后再滚动；切歌时取消旧的滚动任务
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer)
      lyricScrollTimer = null
    }
    lyricScrollTimer = setTimeout(() => {
      lyricScrollTimer = null
      // 期间可能已切歌或歌词已更新，避免把旧索引滚到错误位置
      if (!lyricsWrapperRef.value || currentLyricIndex.value !== newIndex) return
      const currentLine = lyricsWrapperRef.value.querySelector(`[data-index="${newIndex}"]`)
      if (currentLine) {
        const containerHeight = lyricsWrapperRef.value.clientHeight
        const lineTop = currentLine.offsetTop
        const lineHeight = currentLine.offsetHeight
        const scrollTop = lineTop - containerHeight * LYRIC_CENTER_RATIO + lineHeight / 2

        // 使用自定义平滑滚动，持续时间 800ms
        smoothScrollTo(lyricsWrapperRef.value, scrollTop, 800)
      }
    }, 800)
  }
}

// ==================== 封面旋转控制 ====================
const coverArtRef = ref(null)
// 仅用于初始/重置角度；播放中的逐帧旋转直接写 DOM，避免每帧触发 Vue 渲染
const coverRotationStyle = ref({ transform: 'rotate(0deg)' })

const startCoverRotation = () => {
  if (coverAnimationFrame) return

  const rotate = () => {
    // 60 秒转一圈（0.1 度/帧 ≈ 6 度/秒）；详情页隐藏时跳过 DOM 写入
    if (playerStore.showDetail) {
      coverRotation += 0.1
      if (coverRotation >= 360) coverRotation = 0
      if (coverArtRef.value) {
        coverArtRef.value.style.transform = `rotate(${coverRotation}deg)`
      }
    }
    coverAnimationFrame = requestAnimationFrame(rotate)
  }
  coverAnimationFrame = requestAnimationFrame(rotate)
}

const stopCoverRotation = () => {
  if (coverAnimationFrame) {
    cancelAnimationFrame(coverAnimationFrame)
    coverAnimationFrame = null
  }
  // 暂停时保持当前角度
}

// ==================== 事件处理 ====================
function onMediaPlay() {
  isPlaying.value = true
  playerStore.setPlaying(true) // 同步到 store
  nextTick(() => {
    if (!audioCtx) {
      initAudioAnalyser()
      drawVisualizer()
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  })

  // 音乐模式下开始封面旋转
  if (!isVideoMode.value) {
    startCoverRotation()
  }

  // 视频模式：显示视频信息（控制栏可见则跟随控制栏，否则4秒后消失）
  if (isVideoMode.value) {
    showVideoInfo.value = true
    startVideoInfoTimer()
  }

  // 开始隐藏计时（切换歌曲时不重置控制栏状态）
  if (!isSwitchingSong) {
    startHideTimer()
  }
}

function onMediaPause() {
  isPlaying.value = false
  playerStore.setPlaying(false) // 同步到 store
  // 暂停封面旋转（保持当前角度）
  stopCoverRotation()
  // 切换歌曲时不强制显示控制栏，保持当前状态
  if (!isSwitchingSong) {
    showControlHub.value = true
    // 视频模式下也显示视频信息
    if (isVideoMode.value) {
      showVideoInfo.value = true
    }
  }
  clearHideTimer()
}

function onMediaTimeUpdate() {
  const media = getMediaElement()
  if (!media) return
  currentTime.value = media.currentTime
  // 同步进度到 store
  playerStore.setCurrentTime(media.currentTime)
  if (!isVideoMode.value) {
    updateCurrentLyric()
  }

  // 更新任务栏进度条：只在整数百分比变化时发 IPC，避免 timeupdate 高频调用
  const showTaskProgress = settingsStore.settings['player.isShowTaskProgress']
  if (showTaskProgress && media.duration > 0) {
    const percent = Math.round((media.currentTime / media.duration) * 100)
    if (percent !== lastTaskbarPercent) {
      lastTaskbarPercent = percent
      window.settingAPI.setTaskProgress(percent / 100)
    }
  }
}

function onMediaLoadedMetadata() {
  const media = getMediaElement()
  if (!media) return
  duration.value = media.duration
  // 同步时长到 store
  playerStore.setDuration(media.duration)

  // 设置音频输出设备
  applyAudioOutputDevice()

  // 如果处于播放状态（如启动自动播放场景），开始播放
  if (playerStore.isPlaying) {
    media.play().catch((err) => console.warn('[加载] 元数据后播放失败:', err.message))
  }
}

// 应用音频输出设备设置
async function applyAudioOutputDevice() {
  const media = getMediaElement()
  if (!media || !media.setSinkId) return

  const deviceId = settingsStore.settings['player.mediaDeviceId'] || 'default'
  try {
    if (deviceId === 'default') {
      // 清除自定义设备，使用系统默认
      await media.setSinkId('')
    } else {
      await media.setSinkId(deviceId)
    }
    console.log('[音频] 设置输出设备:', deviceId)
  } catch (err) {
    console.warn('[音频] 设置输出设备失败:', err.message)
  }
}

function onMediaEnded() {
  isPlaying.value = false
  currentLyricIndex.value = -1

  // 单曲循环模式：重新播放当前歌曲
  if (playerStore.playMode === 'single') {
    const media = getMediaElement()
    if (media) {
      media.currentTime = 0
      media.play().catch((err) => console.warn('[单曲循环] 播放失败:', err.message))
      isPlaying.value = true
      playerStore.setPlaying(true)
    }
    return
  }

  // 其他模式：播放下一首
  playerStore.setPlaying(false)
  nextSong()
}

function onMediaError(e) {
  console.error('[事件] 媒体错误:', e)

  // 播放失败时先同步为停止状态，避免 UI 停留在“播放中”
  isPlaying.value = false
  playerStore.setPlaying(false)

  // 检查是否需要自动跳过错误歌曲
  const autoSkipOnError = settingsStore.settings['player.autoSkipOnError']
  if (autoSkipOnError) {
    console.log('[事件] 自动跳过错误歌曲')
    nextSong()
  }
}

function onVolumeChange() {
  // v-model 已通过 computed setter 更新 playerStore.volume，这里同步到媒体元素
  const media = getMediaElement()
  if (!media) return
  media.volume = volume.value / 100
}

// ==================== 键盘快捷键 ====================
function handleKeydown(event) {
  if (hotkeys.shouldIgnoreEvent(event)) return

  // Escape 优先关闭播放队列面板
  if (event.key === 'Escape' && showPlaylist.value) {
    event.preventDefault()
    showPlaylist.value = false
    return
  }

  const action = hotkeys.matchAction(event)
  if (!action) return

  const media = getMediaElement()

  switch (action) {
    case 'playPause':
      event.preventDefault()
      togglePlay()
      break
    case 'backward':
      event.preventDefault()
      if (media) media.currentTime = Math.max(0, media.currentTime - 5)
      break
    case 'forward':
      event.preventDefault()
      if (media) media.currentTime = Math.min(duration.value, media.currentTime + 5)
      break
    case 'volumeUp':
      event.preventDefault()
      volume.value = Math.min(100, volume.value + 10)
      onVolumeChange()
      break
    case 'volumeDown':
      event.preventDefault()
      volume.value = Math.max(0, volume.value - 10)
      onVolumeChange()
      break
    case 'prevSong':
      event.preventDefault()
      prevSong()
      break
    case 'nextSong':
      event.preventDefault()
      nextSong()
      break
    case 'togglePlaylist':
      event.preventDefault()
      showPlaylist.value = !showPlaylist.value
      break
    case 'focusSearch': {
      event.preventDefault()
      // 如果是在全局页面能搜到输入框的话：
      const searchInput = document.querySelector('.search-input')
      if (searchInput) searchInput.focus()
      break
    }
    case 'minimize':
      event.preventDefault()
      window.windowAPI?.minimize()
      break
    case 'exit':
      event.preventDefault()
      window.windowAPI?.close()
      break
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  console.log('=== 摇光音乐播放器 ===')

  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('click', handleDocumentClick)

  if (audioRef.value) {
    audioRef.value.volume = playerStore.volume
    audioRef.value.muted = playerStore.isMute
  }
  if (videoRef.value) {
    videoRef.value.volume = playerStore.volume
    videoRef.value.muted = playerStore.isMute
  }

  // 初始化歌词 padding 并监听容器大小变化
  nextTick(() => {
    updateLyricPadding()
    if (lyricsWrapperRef.value) {
      lyricsResizeObserver = new ResizeObserver(() => {
        updateLyricPadding()
      })
      lyricsResizeObserver.observe(lyricsWrapperRef.value)
    }
  })

  // 只有在已有歌曲时才加载播放
  if (playerStore.currentSong) {
    await loadAndPlay()
  } else {
    isLoading.value = false
    songTitle.value = '未播放歌曲'
    artistName.value = '请选择要播放的音乐'
  }

  console.log('=== 初始化完成 ===')
  console.log('快捷键: 空格=播放 | ←→=快进快退 | ↑↓=音量 | N/P=上下首 | L=播放列表')
})

// 监听歌曲变化，自动加载播放
watch(
  () => playerStore.currentSong,
  async (newSong, oldSong) => {
    console.log('[Watch] currentSong 变化!')
    console.log('[Watch] newSong:', newSong)
    console.log('[Watch] oldSong:', oldSong)
    console.log('[Watch] isRestoring:', playerStore.isRestoring)

    if (newSong && newSong.id !== oldSong?.id) {
      if (playerStore.isRestoring) {
        // 恢复模式：加载资源但不播放
        console.log('[Watch] 正在恢复播放信息，仅加载资源不播放')
        await loadAndPlay(false)
      } else {
        // 正常模式：加载并播放
        console.log('[Watch] 触发 loadAndPlay, 歌曲名:', newSong.name)
        await loadAndPlay()
      }
    } else {
      console.log('[Watch] 条件不满足， 不触发 loadAndPlay')
    }
  },
  { immediate: false }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleDocumentClick)
  clearHideTimer()
  if (videoInfoTimer) {
    clearTimeout(videoInfoTimer)
    videoInfoTimer = null
  }
  if (titleBarTimer) {
    clearTimeout(titleBarTimer)
    titleBarTimer = null
  }
  if (filterToastTimer) {
    clearTimeout(filterToastTimer)
    filterToastTimer = null
  }
  if (paneScrollTimer) {
    clearTimeout(paneScrollTimer)
    paneScrollTimer = null
  }
  if (lyricsResizeObserver) {
    lyricsResizeObserver.disconnect()
    lyricsResizeObserver = null
  }
  if (lyricScrollAnimation) {
    cancelAnimationFrame(lyricScrollAnimation)
    lyricScrollAnimation = null
  }
  if (lyricScrollTimer) {
    clearTimeout(lyricScrollTimer)
    lyricScrollTimer = null
  }
  stopCoverRotation()
  stopVisualizer()
  unsubscribeTranscodeProgressSafe()
  window.removeEventListener('blur', stopProgressDrag)
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
  if (mediaBlobUrl) {
    URL.revokeObjectURL(mediaBlobUrl)
    mediaBlobUrl = null
  }
})

// 监听模式切换（不再重置 AudioContext，避免重连问题）
watch(isVideoMode, (newMode) => {
  // 视频模式下停止可视化动画
  if (newMode) {
    stopVisualizer()
  }
})

// ========== 巻加与 PlayerBar 同步的控制 ==========

// 监听 store 的播放状态变化
watch(
  () => playerStore.isPlaying,
  (playing) => {
    const media = getMediaElement()
    if (media && media.readyState >= 2) {
      // 只有媒体已准备好（HAVE_CURRENT_DATA 或更高）才操作
      if (playing) {
        media.play().catch((err) => console.warn('[同步] 播放失败:', err.message))
      } else {
        media.pause()
      }
    }
  }
)

// 监听 store 的进度变化（用户拖拽进度条时跳转）
watch(
  () => playerStore.playProgress.progress,
  (progress) => {
    const media = getMediaElement()
    if (media && playerStore.playProgress.duration > 0) {
      const expectedTime = progress * playerStore.playProgress.duration
      // 如果进度变化超过 1 秒，说明是用户主动跳转
      if (Math.abs(expectedTime - media.currentTime) > 1) {
        media.currentTime = expectedTime
      }
    }
  }
)

// 监听 store 的音量变化（PlayerBar 滑块、启动恢复等入口）
watch(
  () => playerStore.volume,
  (vol) => {
    const media = getMediaElement()
    if (media) {
      media.volume = vol
    }
  }
)

// 监听 store 的静音状态变化（PlayerBar 静音按钮）
watch(
  () => playerStore.isMute,
  (muted) => {
    const media = getMediaElement()
    if (media) {
      media.muted = muted
    }
  }
)

// 监听音频输出设备变化
watch(
  () => settingsStore.settings['player.mediaDeviceId'],
  () => {
    applyAudioOutputDevice()
  }
)

// 滚动播放列表到当前歌曲（仅在容器内部滚动）
const scrollPlaylistToCurrent = () => {
  if (!playlistRef.value) return
  const activeItem = playlistRef.value.querySelector('.list-item.active')
  if (!activeItem) return

  const container = playlistRef.value
  const itemTop = activeItem.offsetTop
  const itemHeight = activeItem.offsetHeight
  const containerHeight = container.clientHeight
  const scrollTop = container.scrollTop

  // 计算目标滚动位置（居中显示）
  const targetScroll = itemTop - containerHeight / 2 + itemHeight / 2

  // 只有当元素不在可视区域内时才滚动
  if (itemTop < scrollTop || itemTop + itemHeight > scrollTop + containerHeight) {
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }
}

// 监听播放列表显示状态
let paneScrollTimer = null

watch(showPlaylist, (newVal) => {
  if (newVal) {
    showControlHub.value = true
    clearHideTimer()
    // 延迟滚动，等待动画完成
    if (paneScrollTimer) clearTimeout(paneScrollTimer)
    paneScrollTimer = setTimeout(() => {
      paneScrollTimer = null
      scrollPlaylistToCurrent()
    }, 300)
  } else {
    // 关闭面板后，按最近一次鼠标位置重新启动上下悬浮控件的自动隐藏计时
    if (paneScrollTimer) {
      clearTimeout(paneScrollTimer)
      paneScrollTimer = null
    }
    refreshAutoHideTimers()
  }
})

// 监听当前歌曲索引变化，自动滚动播放列表到当前歌曲
watch(() => playerStore.filteredIndex, () => {
  if (showPlaylist.value) {
    nextTick(() => {
      scrollPlaylistToCurrent()
    })
  }
})

// 监听详情页显示状态 - 不需要同步媒体，因为媒体元素始终存在
watch(
  () => playerStore.showDetail,
  async (showDetail) => {
    if (showDetail) {
      // 进入详情页时，确保媒体元素正确显示
      await nextTick()
      // 媒体元素始终存在，不需要特殊处理
    }
  }
)
</script>


<style lang="scss" scoped>
/* ==================== 基础与变量 ==================== */
:global(:root) {
  --active-primary-color: #ff6699;
  --active-primary-rgb: 255, 102, 153;
  --active-accent-glow: rgba(255, 102, 153, 0.3);
}

.player-app {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow: hidden;
  background: #050507;
  color: #fff;
  font-family: 'Inter', 'PingFang SC', -apple-system, sans-serif;

  --glass: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.12);
  --transition-smooth: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-fast: all 0.3s ease;

  /* ==================== 弥散背景引擎 ==================== */
  .ambient-stage {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;

    .ambient-bg {
      position: absolute;
      inset: -10%;
      background-size: cover;
      background-position: center;
      filter: blur(80px) brightness(0.4) saturate(1.4);
      opacity: 0;
      transition: opacity 1.5s ease;

      &.has-cover { opacity: 0.6; }
    }

    .glow-sphere {
      position: absolute;
      width: 50vw;
      height: 50vw;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.12;
      z-index: 1;
      pointer-events: none;

      &.sphere-1 {
        top: -15%; left: -15%;
        background: var(--active-primary-color);
        animation: drift 25s infinite alternate ease-in-out;
      }

      &.sphere-2 {
        bottom: -15%; right: -15%;
        background: #4facfe;
        animation: drift 30s infinite alternate-reverse ease-in-out;
      }
    }
  }

  /* 视频播放时背景更暗 */
  &.mode-video.is-playing {
    .ambient-bg { opacity: 0.15; }
    .glow-sphere { opacity: 0.03; }
  }

  /* ==================== 窗口控制与筛选 ==================== */
  .window-controls-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 48px;
    z-index: 9999;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    -webkit-app-region: drag;

    .window-controls-drag { flex: 1; height: 100%; }

    .window-controls {
      display: flex;
      align-items: center;
      height: 32px;
      -webkit-app-region: no-drag;
      opacity: 0;
      transition: opacity 0.2s ease;

      .win-btn {
        width: 46px; height: 32px;
        border: none; background: transparent;
        cursor: pointer;
        display: flex; justify-content: center; align-items: center;
        transition: background 0.1s ease;
        color: rgba(255, 255, 255, 0.7);

        svg { width: 12px; height: 12px; stroke: currentColor; stroke-width: 1; }
        &.win-minimize svg rect { fill: currentColor; stroke: none; }

        &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        &.win-close:hover { background: #e81123; color: #fff; }
      }
    }

    &.show-controls {
      .window-controls, .media-filter-capsule { opacity: 1; }
    }

    .media-filter-capsule {
      display: flex; align-items: center;
      position: relative;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      margin: 6px 16px 0 0;
      height: 32px;
      opacity: 0;
      transition: opacity 0.2s ease;
      -webkit-app-region: no-drag;

      .filter-option {
        position: relative; z-index: 1;
        padding: 6px 14px;
        font-size: 13px; font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: color 0.2s ease;
        user-select: none;
        white-space: nowrap;

        &:hover { color: rgba(255, 255, 255, 0.85); }
        &.active { color: #fff; }
      }

      .filter-slider {
        position: absolute;
        inset: 0 auto 0 0;
        width: calc(100% / 3);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  }

  /* ==================== 主舞台 ==================== */
  .main-stage {
    position: relative;
    z-index: 10;
    height: 100vh;
    display: flex; justify-content: center; align-items: center;
    padding: 30px 40px 130px;
    box-sizing: border-box;

    .stage-content {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
      padding: 0 20px;
    }
  }

  &.mode-video {
    .main-stage { padding: 0; }
    .stage-content { max-width: none; }
  }

  /* ==================== 音乐播放核心布局 ==================== */
  .music-center {
    flex: 40%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 32px;

    .media-container {
      flex-shrink: 0;
      perspective: 1000px;

      .canvas-wrapper {
        // 宽高永远取同一个变量，保证画布与内层封面始终是正方形，旋转时不会变椭圆
        --cover-canvas-size: min(40vw, 440px);
        position: relative;
        width: var(--cover-canvas-size);
        height: var(--cover-canvas-size);
        border-radius: 40px;
        overflow: hidden;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        transition: var(--transition-smooth);

        .music-cover-layer {
          position: absolute; inset: 0;
          display: flex; justify-content: center; align-items: center;
          background: transparent;

          .visualizer-canvas {
            position: absolute; top: 50%; left: 50%;
            width: 100%; height: 100%;
            transform: translate(-50%, -50%);
            z-index: 1; pointer-events: none;
            filter: blur(0.5px);
          }

          .cover-art-box {
            position: relative;
            // 与画布保持 280/440 = 63.6% 比例，宽高都由同一变量算出，严格正方形
            width: calc(var(--cover-canvas-size) * 0.636);
            height: calc(var(--cover-canvas-size) * 0.636);
            display: flex; justify-content: center; align-items: center;
            z-index: 2;

            .main-art {
              width: 100%; height: 100%;
              object-fit: cover; border-radius: 50%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.08);
              will-change: transform;
            }

            .default-art {
              width: 100%; height: 100%;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--active-primary-color), #ff9eb8);
              display: flex; justify-content: center; align-items: center;
              // 18% ≈ 默认 440px 画布下的 79px，与原 5rem 视觉一致，并随画布缩放
              font-size: calc(var(--cover-canvas-size) * 0.18);
              color: rgba(255, 255, 255, 0.8);
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }

            .breathing-ring {
              position: absolute; inset: -15px;
              border: 2px solid var(--active-primary-color);
              border-radius: 50%;
              opacity: 0.2;
              animation: breathe 3s infinite ease-in-out;
              pointer-events: none;
            }
          }
        }
      }
    }

    .song-info {
      text-align: center;
      max-width: 400px;

      .song-name {
        font-size: 2rem; font-weight: 800;
        letter-spacing: -0.5px; margin-bottom: 8px;
        background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text; line-height: 1.2;
      }

      .artist-name { font-size: 1.1rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; }
      .album-name { font-size: 0.9rem; color: rgba(255, 255, 255, 0.4); }
    }
  }

  /* ==================== 歌词面板 ==================== */
  .lyrics-panel {
    flex: 60%; min-width: 360px;
    display: flex; flex-direction: column;
    height: 75vh; max-height: 75vh;

    .lyrics-engine {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 0 16px 0 8px;
      mask-image: linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }

      .lyric-empty {
        color: rgba(255, 255, 255, 0.4);
        font-size: 1rem; text-align: center; padding-top: 80px;
      }

      .l-line {
        padding: 14px 0;
        font-size: 1.1rem; color: rgba(255, 255, 255, 0.3);
        transition: color 0.3s ease, text-shadow 0.3s ease;
        cursor: pointer; line-height: 1.6;

        &:hover { color: rgba(255, 255, 255, 0.7); }
        &.l-active {
          color: #fff; font-weight: 600;
          text-shadow: 0 0 25px var(--active-accent-glow);
        }
      }
    }

    &.lyrics-align-left .l-line { text-align: left; }
    &.lyrics-align-center .l-line { text-align: center; }
    &.lyrics-align-right .l-line { text-align: right; }
  }

  /* ==================== 悬浮控制岛 ==================== */
  .floating-hub {
    position: fixed;
    bottom: 24px; left: 50%; transform: translateX(-50%);
    width: calc(100% - 48px); max-width: 920px;
    background: rgba(15, 15, 20, 0.75);
    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border); border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    z-index: 100; overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;

    &.is-hidden { transform: translateX(-50%) translateY(calc(100% + 30px)); opacity: 0; pointer-events: none; }

    .hub-progress-track {
      height: 5px; width: 100%; cursor: pointer;
      background: rgba(255, 255, 255, 0.05);
      position: relative; transition: height 0.2s ease;

      &::before { content: ''; position: absolute; inset: -10px 0; z-index: 1; }
      &:hover, &.is-dragging { height: 8px; }
      &.is-dragging { cursor: grabbing; }

      .hub-progress-fill {
        height: 100%; background: var(--active-primary-color);
        position: relative; transition: width 0.1s linear;

        .hub-progress-light {
          position: absolute; inset: 0 0 0 auto;
          width: 20px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8));
          filter: blur(3px);
        }
      }
    }

    .hub-content {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 24px; gap: 20px;

      .hub-section {
        display: flex; align-items: center;
        &.section-left { flex: 1; justify-content: flex-start; }
        &.section-center { flex: 1; justify-content: center; gap: 16px; }
        &.section-right { flex: 1; justify-content: flex-end; gap: 16px; }
      }

      .mini-card {
        display: flex; align-items: center; gap: 14px;
        img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
        
        .mini-cover-placeholder {
          width: 48px; height: 48px; border-radius: 10px;
          background: linear-gradient(135deg, var(--active-primary-color), #ff9eb8);
          display: flex; justify-content: center; align-items: center; font-size: 1.3rem;
        }

        .mini-info {
          min-width: 0;
          .m-title {
            font-size: 0.95rem; font-weight: 600;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            max-width: 180px; margin-bottom: 3px;
          }
          .m-time { font-size: 0.8rem; color: rgba(255, 255, 255, 0.45); font-variant-numeric: tabular-nums; }
        }
      }

      .play-trigger {
        width: 56px; height: 56px; border-radius: 50%;
        background: #fff; color: #000; border: none;
        display: flex; justify-content: center; align-items: center;
        cursor: pointer; transition: var(--transition-fast);
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);

        &:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(255, 255, 255, 0.3); }
        svg { width: 24px; height: 24px; fill: currentColor; }
      }

      .icon-btn {
        background: none; border: none;
        color: rgba(255, 255, 255, 0.55); cursor: pointer;
        padding: 10px; border-radius: 50%;
        transition: var(--transition-fast);
        display: flex; justify-content: center; align-items: center;

        &:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
        &.active { color: var(--active-primary-color); background: rgba(var(--active-primary-rgb), 0.15); }
        svg { width: 22px; height: 22px; fill: currentColor; }
        &.side svg { width: 24px; height: 24px; }
      }

      .vol-control {
        display: flex; align-items: center; gap: 10px;
        .vol-icon { width: 20px; height: 20px; }
        .vol-slider {
          width: 90px; height: 4px; -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.15); border-radius: 2px; cursor: pointer;

          &::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px;
            background: #fff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }
  }

  /* ==================== 播放列表面板 ==================== */
  .playlist-pane {
    position: fixed;
    top: 24px; right: 24px; bottom: 140px;
    width: 340px; border-radius: 24px;
    z-index: 101; display: flex; flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); overflow: hidden;
    background: rgba(12, 12, 18, 0.88); backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);

    .pane-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; flex-shrink: 0;
      h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
      .pane-close {
        background: none; border: none; color: rgba(255, 255, 255, 0.5);
        font-size: 1.2rem; cursor: pointer; padding: 4px 8px;
        border-radius: 8px; transition: var(--transition-fast);
        &:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
      }
    }

    .pane-list {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 12px 6px 12px 12px;
      scrollbar-gutter: stable;

      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb {
        background: rgba(var(--active-primary-rgb), 0.3); border-radius: 3px;
        &:hover { background: rgba(var(--active-primary-rgb), 0.5); }
      }

      .list-item {
        padding: 14px 16px; border-radius: 14px;
        cursor: pointer; transition: var(--transition-fast);
        margin-bottom: 4px;

        &:hover { background: var(--glass); }
        &.active {
          background: rgba(var(--active-primary-rgb), 0.15);
          border: 1px solid rgba(var(--active-primary-rgb), 0.25);
        }

        .type-tag {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;
          color: var(--active-primary-color); opacity: 0.8; display: block; margin-bottom: 4px;
        }
        .it-title { font-size: 0.95rem; font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .it-artist { font-size: 0.82rem; color: rgba(255, 255, 255, 0.45); }
      }
    }
  }

  /* ==================== 响应式适配 ==================== */
  @media (max-width: 1200px) {
    .music-center { flex: 0 0 40%; min-width: 280px; }
    .lyrics-panel { flex: 0 0 52%; min-width: 320px; height: 70vh; }
    .canvas-wrapper { --cover-canvas-size: 360px; }
  }

  @media (max-width: 900px) {
    .music-center { flex: 0 0 42%; min-width: 240px; }
    .lyrics-panel { flex: 0 0 50%; min-width: 280px; height: 65vh; }
    .canvas-wrapper { --cover-canvas-size: 300px; }
    .song-info .song-name { font-size: 1.6rem; }
    .l-line.l-active { font-size: 1.2rem; }
  }

  @media (max-width: 700px) {
    .main-stage { padding: 20px 20px 110px; }
    .stage-content { gap: 20px; padding: 0 10px; }
    .music-center { flex: 0 0 38%; min-width: 200px; gap: 20px; }
    .lyrics-panel { flex: 0 0 55%; min-width: 240px; height: 55vh; }
    .canvas-wrapper { --cover-canvas-size: 240px; border-radius: 28px; }
    .song-info .song-name { font-size: 1.3rem; }
    .floating-hub { width: calc(100% - 24px); bottom: 12px; border-radius: 18px; }
    .hub-content { padding: 10px 16px; }
    .mini-card img, .mini-cover-placeholder { width: 40px; height: 40px; }
    .m-title { max-width: 100px; font-size: 0.85rem; }
    .play-trigger { width: 48px; height: 48px; }
    .playlist-pane { top: 12px; right: 12px; left: 12px; width: auto; bottom: 120px; }
    .vol-slider { width: 60px; }
  }

  // 矮窗口：收紧纵向留白与文字，避免封面/信息被上下裁掉
  @media (max-height: 640px) {
    .main-stage { padding: 16px 40px 112px; }
    .music-center { gap: 16px; }
    .lyrics-panel { height: 70vh; max-height: 70vh; }
    .song-info .song-name { font-size: 1.5rem; }
    .song-info .artist-name { font-size: 1rem; }
    .song-info .album-name { font-size: 0.8rem; }
  }
}

/* ==================== 独立全屏层 ==================== */
.global-video-element {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  object-fit: contain; background: #000;
  z-index: 1; opacity: 0; pointer-events: none;
  transition: opacity 0.3s ease;
  &.video-visible { opacity: 1; pointer-events: auto; }
}

.transcoding-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(15px);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;

  .glass-card {
    background: rgba(20, 20, 30, 0.8); border: 1px solid var(--glass-border);
    border-radius: 24px; backdrop-filter: blur(20px);
    &.trans-card { padding: 40px 60px; text-align: center; }
  }

  .loading-ring {
    width: 48px; height: 48px; border: 3px solid var(--glass-border);
    border-top-color: var(--active-primary-color); border-radius: 50%;
    margin: 0 auto 20px; animation: spin 1s linear infinite;
  }

  .trans-text {
    margin-bottom: 16px;
    span { display: block; font-size: 1.1rem; font-weight: 500; margin-bottom: 4px; }
    small { color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; }
  }

  .mini-progress {
    width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1);
    border-radius: 2px; overflow: hidden; margin: 0 auto;
    .fill { height: 100%; background: var(--active-primary-color); border-radius: 2px; transition: width 0.3s ease; }
  }
}

.filter-toast {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(15, 15, 20, 0.85); backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
  padding: 16px 28px; font-size: 15px; font-weight: 500;
  color: rgba(255, 255, 255, 0.9); z-index: 3000; pointer-events: none;
}

.video-info-overlay {
  position: absolute; top: 0; left: 0; right: 0; padding: 24px 32px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  pointer-events: none; z-index: 20;
  .video-title { font-size: 1.3rem; font-weight: 600; margin-bottom: 4px; }
  .video-artist { font-size: 1rem; color: rgba(255, 255, 255, 0.7); }
}

/* ==================== 动画定义 ==================== */
@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(5%, 8%) scale(1.1); }
  100% { transform: translate(10%, 5%) scale(1.15); }
}

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.1; }
  50% { transform: scale(1.05); opacity: 0.35; }
}

/* ==================== Vue 过渡动画 ==================== */
.blur-fade-enter-active, .blur-fade-leave-active { transition: all 0.4s ease; }
.blur-fade-enter-from, .blur-fade-leave-to { opacity: 0; filter: blur(10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pane-slide-enter-active, .pane-slide-leave-active { transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); }
.pane-slide-enter-from, .pane-slide-leave-to { transform: translateX(120%); opacity: 0; }
</style>
