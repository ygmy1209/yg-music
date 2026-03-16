/**
 * 顶部标题栏组件
 * 包含窗口控制按钮（最小化、最大化、关闭）
 */

<template>
  <div class="title-bar drag-area">
    <!-- 窗口控制按钮 -->
    <div class="window-controls no-drag">
      <button class="control-btn minimize" @click="handleMinimize" title="最小化">
        <svg viewBox="0 0 12 12"><rect x="2" y="5.5" width="8" height="1" /></svg>
      </button>
      <button class="control-btn maximize" @click="handleMaximize" :title="isMaximized ? '还原' : '最大化'">
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
      <button class="control-btn close" @click="handleClose" title="关闭">
        <svg viewBox="0 0 12 12">
          <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1" />
          <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 窗口是否最大化
const isMaximized = ref(false)

// ========== 窗口控制 ==========

const handleMinimize = () => {
  window.windowAPI.minimize()
}

const handleMaximize = async () => {
  window.windowAPI.maximize()
  // 更新最大化状态
  isMaximized.value = await window.windowAPI.isMaximized()
}

const handleClose = () => {
  window.windowAPI.close()
}

// ========== 初始化 ==========

onMounted(async () => {
  isMaximized.value = await window.windowAPI.isMaximized()
})
</script>

<style lang="scss" scoped>
.title-bar {
  height: 50px;
  background-color: var(--bg-primary);
  display: flex;
  justify-content: flex-end;
  -webkit-app-region: drag;

  .window-controls {
    display: flex;
    -webkit-app-region: no-drag;

    .control-btn {
      width: 46px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background 0.1s ease;
      color: var(--text-secondary);

      svg {
        width: 12px;
        height: 12px;
        stroke: currentColor;
        stroke-width: 1;
      }

      &.minimize svg rect {
        fill: currentColor;
        stroke: none;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: var(--text-primary);
      }

      &.close:hover {
        background: #e81123;
        color: #ffffff;
      }
    }
  }
}
</style>
