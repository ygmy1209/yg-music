/**
 * 通用对话框组件
 * 支持随机 animate.css 动画、白色遮罩
 * 遮罩覆盖整个窗口
 */

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="modelValue" class="dialog-overlay" @click.self="handleOverlayClick">
        <div :class="['dialog-container', animationClass]">
          <!-- 标题栏（支持插槽自定义） -->
          <div v-if="title || $slots.header" class="dialog-header">
            <slot name="header">
              <span class="dialog-title">{{ title }}</span>
            </slot>
          </div>

          <!-- 内容区 -->
          <div class="dialog-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { pickRandomAnimation } from '@/constants/animations'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: true
  },
  randomAnimation: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// 当前动画类
const currentAnimation = ref('')

// 计算动画类
const animationClass = computed(() => {
  if (!props.randomAnimation) return 'animate__animated animate__fadeIn'
  return `animate__animated ${currentAnimation.value}`
})

// 监听显示状态，选择随机动画
watch(() => props.modelValue, (val) => {
  if (val && props.randomAnimation) {
    currentAnimation.value = pickRandomAnimation()
  }
})

// 点击遮罩
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style lang="scss" scoped>
// 对话框遮罩 - 覆盖整个窗口
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.dialog-container {
  background-color: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 80%;
  max-height: 70%;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 20px;
  flex-shrink: 0;

  .dialog-title {
    font-size: var(--font-size-base);
    font-weight: normal;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    display: none;
  }
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
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
