/**
 * 气泡按钮组件
 * 鼠标悬停/点击触发弹窗，支持鼠标移入弹窗内容
 */

<template>
  <div ref="containerRef" class="popup-btn-container" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <slot />
    <Teleport to="body">
      <Transition name="popup-fade">
        <div
          v-show="visible"
          class="popup-panel"
          :style="popupStyle"
          @click.stop
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div class="popup-arrow" :style="arrowStyle"></div>
          <div class="popup-content">
            <slot name="content" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, reactive, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 弹窗位置: top, bottom
  placement: {
    type: String,
    default: 'top',
  },
  // 触发方式: hover, click, both
  trigger: {
    type: String,
    default: 'both',
  },
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const visible = ref(props.modelValue)

const popupStyle = reactive({
  position: 'fixed',
  bottom: 'auto',
  left: '0px',
  transform: 'translateX(-50%)',
})

const arrowStyle = reactive({
  left: '50%',
})

let showTimeout = null
let hideTimeout = null

// 清除所有定时器
const clearAllTimeouts = () => {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

// 显示弹窗
const show = () => {
  clearAllTimeouts()
  if (visible.value) return
  showTimeout = setTimeout(() => {
    updatePosition()
    visible.value = true
    emit('update:modelValue', true)
  }, 100)
}

// 隐藏弹窗
const hide = () => {
  clearAllTimeouts()
  if (!visible.value) return
  hideTimeout = setTimeout(() => {
    visible.value = false
    emit('update:modelValue', false)
  }, 100)
}

// 点击切换
const handleClick = (e) => {
  if (props.trigger === 'hover') return
  e.stopPropagation()
  if (visible.value) {
    hide()
  } else {
    clearAllTimeouts()
    updatePosition()
    visible.value = true
    emit('update:modelValue', true)
  }
}

// 鼠标进入
const handleMouseEnter = () => {
  if (props.trigger === 'click') return
  show()
}

// 鼠标离开
const handleMouseLeave = () => {
  if (props.trigger === 'click') return
  hide()
}

// 更新弹窗位置
const updatePosition = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 计算水平位置
  let left = rect.left + rect.width / 2

  // 计算垂直位置
  if (props.placement === 'top') {
    popupStyle.bottom = `${viewportHeight - rect.top + 8}px`
  } else {
    popupStyle.bottom = 'auto'
  }

  // 防止超出屏幕
  const panelWidth = 150 // 预估面板宽度
  if (left - panelWidth / 2 < 10) {
    left = panelWidth / 2 + 10
  } else if (left + panelWidth / 2 > viewportWidth - 10) {
    left = viewportWidth - panelWidth / 2 - 10
  }

  popupStyle.left = `${left}px`

  // 计算箭头位置
  const arrowLeft = rect.left + rect.width / 2 - left
  arrowStyle.left = `calc(50% + ${arrowLeft}px)`
}

// 点击外部关闭
const handleDocumentClick = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    hide()
  }
}

// 同步外部 v-model
watch(() => props.modelValue, (val) => {
  if (val !== visible.value) {
    visible.value = val
    if (val) updatePosition()
  }
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  clearAllTimeouts()
})

// 暴露方法
defineExpose({
  show,
  hide,
})
</script>

<style lang="scss" scoped>
.popup-btn-container {
  position: relative;
  display: inline-flex;
}

.popup-panel {
  z-index: 1000;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));

  .popup-arrow {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    transform: translateX(-50%) rotate(45deg);
  }

  .popup-content {
    position: relative;
    background: var(--bg-primary);
    border-radius: 8px;
    z-index: 1;
  }
}

// 过渡动画
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}
</style>
