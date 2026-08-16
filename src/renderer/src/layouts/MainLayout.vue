/**
 * 主布局组件
 * 整合侧边栏、顶部栏、内容区、底部播放控制栏
 */

<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <SideBar />

    <!-- 右侧容器 -->
    <div class="right-container">
      <!-- 顶部标题栏 -->
      <TitleBar />

      <!-- 内容区域（根据导航切换页面） -->
      <div class="content-area">
        <PlayListPage v-if="activeNav === 'playlist'" />
        <AlbumPage v-else-if="activeNav === 'album'" />
        <SingerPage v-else-if="activeNav === 'singer'" />
        <SettingsPage v-else-if="activeNav === 'settings'" />

        <!-- 全局对话框遮罩层（默认：仅覆盖 content-area） -->
        <Transition name="overlay">
          <div
            v-if="dialogStore.visible && !dialogStore.config.fullscreen"
            class="dialog-overlay"
            @click.self="handleOverlayClick"
          >
            <div :class="['dialog-container', animationClass]">
              <div v-if="dialogStore.config.title" class="dialog-header">
                <span class="dialog-title">
                  {{ dialogStore.config.title }}<span
                    v-if="dialogStore.config.titleHighlight"
                    class="title-highlight"
                  >{{ dialogStore.config.titleHighlight }}</span>{{ dialogStore.config.showSuffix && dialogStore.config.titleHighlight ? '  到...' : '' }}
                </span>
              </div>
              <div class="dialog-body">
                <component
                  :is="dialogStore.config.component"
                  v-bind="dialogStore.config.props"
                  @close="dialogStore.closeDialog"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 全窗口对话框遮罩层 -->
      <Teleport to="body">
        <Transition name="overlay">
          <div
            v-if="dialogStore.visible && dialogStore.config.fullscreen"
            class="dialog-overlay fullscreen"
            @click.self="handleOverlayClick"
          >
            <div :class="['dialog-container', animationClass]">
              <div v-if="dialogStore.config.title" class="dialog-header">
                <span class="dialog-title">
                  {{ dialogStore.config.title }}<span
                    v-if="dialogStore.config.titleHighlight"
                    class="title-highlight"
                  >{{ dialogStore.config.titleHighlight }}</span>{{ dialogStore.config.showSuffix && dialogStore.config.titleHighlight ? '  到...' : '' }}
                </span>
              </div>
              <div class="dialog-body">
                <component
                  :is="dialogStore.config.component"
                  v-bind="dialogStore.config.props"
                  @close="dialogStore.closeDialog"
                />
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 底部播放控制栏 -->
      <PlayerBar />
    </div>

    <!-- 播放详情页（全屏覆盖） -->
    <MusicPlayer />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useDialogStore } from '@/stores/dialogStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { pickRandomAnimation } from '@/constants/animations'
import SideBar from './parts/SideBar.vue'
import TitleBar from './parts/TitleBar.vue'
import PlayerBar from './parts/PlayerBar.vue'
import MusicPlayer from './parts/MusicPlayer.vue'
import PlayListPage from '@/pages/PlayListPage.vue'
import AlbumPage from '@/pages/AlbumPage.vue'
import SingerPage from '@/pages/SingerPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const navStore = useNavStore()
const dialogStore = useDialogStore()
const settingsStore = useSettingsStore()

// 当前激活的导航
const activeNav = computed(() => navStore.activeNav)

// 随机动画
const currentAnimation = ref('')

const animationClass = computed(() => {
  // 如果禁用了动画效果
  if (!settingsStore.showAnimation) return ''
  // 如果禁用了随机动画
  if (!settingsStore.showRandomAnimation) return 'animate__animated animate__fadeIn'
  return `animate__animated ${currentAnimation.value}`
})

watch(() => dialogStore.visible, (val) => {
  if (val && settingsStore.showAnimation && settingsStore.showRandomAnimation) {
    currentAnimation.value = pickRandomAnimation()
  }
})

// 处理遮罩点击
const handleOverlayClick = () => {
  if (dialogStore.config.closeOnClickOverlay) {
    dialogStore.closeDialog()
  }
}

// 监听页面切换，关闭对话框
watch(activeNav, () => {
  if (dialogStore.visible) {
    dialogStore.closeDialog()
  }
})
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background-color: var(--primary-color);

  .right-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-primary);
    border-radius: 8px 0 0 8px;
    overflow: hidden;

    .content-area {
      flex: 1;
      overflow: hidden;
      background-color: var(--bg-primary);
      position: relative;
    }
  }
}

// 对话框遮罩 - 默认仅覆盖 content-area
.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  border-radius: 8px 0 0 0;

  // 全窗口覆盖
  &.fullscreen {
    position: fixed;
    border-radius: 0;
  }
}

.dialog-container {
  background-color: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: height 0.25s ease;
}

.dialog-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 20px;

  .dialog-title {
    font-size: var(--font-size-base);
    font-weight: normal;
    color: var(--text-primary);
    white-space: nowrap;

    .title-highlight {
      color: var(--primary-color);
      display: inline-block;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
  }
}

.dialog-body {
  padding: 0 0 20px 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

// 遮罩过渡动画 - 缓慢出现
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.4s ease;

  .dialog-container {
    transition: all 0.4s ease;
  }
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .dialog-container {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
