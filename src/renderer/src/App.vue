/** * 应用根组件 */

<template>
  <!-- 等待设置初始化完成后再渲染 -->
  <MainLayout v-if="isReady" />
  <div v-else class="app-loading"></div>
</template>

<script setup>
import { ref, watch, onMounted, unref } from 'vue'
import MainLayout from './layouts/MainLayout.vue'
import { useSettingsStore } from './stores/settingsStore'
import { usePlayerStore } from './stores/playerStore'
import { usePlaylistStore } from './stores/playlistStore'
import { useHotkeys } from './composables/useHotkeys'

const settingsStore = useSettingsStore()
const hotkeys = useHotkeys()
const isReady = ref(false)

// 更新动画设置
const updateAnimationSetting = () => {
  if (typeof document === 'undefined') return

  // 直接访问 store 的 showAnimation ref
  const enabled = unref(settingsStore.showAnimation)

  console.log('[App] 动画设置值:', enabled)

  if (enabled) {
    document.body.classList.remove('no-animation')
    console.log('[App] 移除 no-animation class')
  } else {
    document.body.classList.add('no-animation')
    console.log('[App] 添加 no-animation class')
  }
}

// 恢复播放信息并处理自动播放
const restorePlayback = async () => {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()

  try {
    const savedInfo = await playerStore.restorePlayInfo()
    if (!savedInfo) return

    // 1. 初始化列表并恢复基本信息
    await playlistStore.init()
    const result = await playerStore.restoreFromSavedInfo(savedInfo)

    if (result) {
      console.log('[App] 恢复播放信息成功:', result)
      // 检查是否需要恢复播放进度；期间用户可能已手动换了歌，此时不再套用旧进度
      if (
        settingsStore.settings['player.isSavePlayTime'] &&
        playerStore.currentSong?.id === savedInfo.songId
      ) {
        playerStore.setCurrentTime(result.time)
        playerStore.setDuration(result.duration)
      }
    } else {
      console.log('[App] 恢复播放信息失败: 歌单或歌曲不存在')
    }

    // 2. 清除恢复标志
    playerStore.clearRestoring()

    // 3. 检查是否需要自动播放
    const startupAutoPlay = settingsStore.settings['player.startupAutoPlay']
    if (startupAutoPlay && playerStore.currentSong) {
      playerStore.setPlaying(true)
      console.log('[App] 启动自动播放')
    }
  } catch (err) {
    console.warn('[App] 恢复播放信息出错:', err)
    playerStore.clearRestoring()
  }
}

// 监听设置初始化
watch(
  () => unref(settingsStore.isInitialized),
  async (initialized) => {
    console.log('[App] 初始化状态:', initialized)
    if (initialized && !isReady.value) {
      isReady.value = true
      updateAnimationSetting()
      await restorePlayback()
    }
  },
  { immediate: true }
)

// 监听动画设置变化
watch(
  () => unref(settingsStore.showAnimation),
  (newValue) => {
    console.log('[App] showAnimation 变化:', newValue)
    updateAnimationSetting()
  }
)

// 挂载时检查
onMounted(() => {
  hotkeys.loadConfig()
  setTimeout(async () => {
    if (!isReady.value) {
      console.log('[App] 超时强制就绪')
      isReady.value = true
      updateAnimationSetting()
      await restorePlayback()
    }
  }, 2000)
})
</script>

<style lang="scss" scoped>
.app-loading {
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
}
</style>
