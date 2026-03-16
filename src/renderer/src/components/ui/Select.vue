/**
 * 自定义下拉选择组件
 * 用于替代原生 select，支持高度限制和样式统一
 */

<template>
  <div ref="selectRef" class="select-wrapper" :style="{ width: width }">
    <div
      class="select-trigger"
      :class="{ disabled, open: isOpen }"
      tabindex="0"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeDropdown"
    >
      <span class="select-value" :class="{ placeholder: !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <svg class="select-arrow" :class="{ rotated: isOpen }" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7 10l5 5 5-5z" />
      </svg>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="select-dropdown"
        :style="dropdownStyle"
      >
        <div
          v-for="option in options"
          :key="option.value"
          class="select-option"
          :class="{ selected: option.value === modelValue, disabled: option.disabled }"
          @click.stop="selectOption(option)"
        >
          <span class="option-label">{{ option.label }}</span>
          <svg v-if="option.value === modelValue" class="check-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <div v-if="options.length === 0" class="select-empty">
          暂无选项
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
    // 格式: [{ label: '选项名', value: '值', disabled?: false }]
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // 触发器宽度（支持 CSS 值，如 '200px'、'100%'、'10rem'）
  width: {
    type: String,
    default: '100%'
  },
  // 下拉菜单宽度（不设置则与触发器同宽）
  dropdownWidth: {
    type: String,
    default: ''
  },
  // 下拉菜单最大高度
  maxHeight: {
    type: Number,
    default: 200
  }
})

const emit = defineEmits(['update:modelValue'])

const selectRef = ref(null)
const isOpen = ref(false)
const dropdownStyle = ref({})

// 获取当前选中项的标签
const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : ''
})

// 计算下拉菜单位置
const updateDropdownPosition = () => {
  if (!selectRef.value || !isOpen.value) return

  const rect = selectRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = Math.min(props.options.length * 36, props.maxHeight) + 16

  let top = rect.bottom + 4
  let maxHeight = viewportHeight - top - 20

  // 如果下方空间不足，尝试向上展开
  if (maxHeight < 100 && rect.top > maxHeight) {
    top = rect.top - dropdownHeight - 4
    maxHeight = rect.top - 20
  }

  // 下拉菜单宽度：优先使用 dropdownWidth，否则与触发器同宽
  const dropdownW = props.dropdownWidth || `${rect.width}px`

  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${top}px`,
    width: dropdownW,
    maxHeight: `${Math.min(maxHeight, props.maxHeight)}px`
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (option) => {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  closeDropdown()
}

// 点击外部关闭
const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    closeDropdown()
  }
}

// 滚动时更新位置
const handleScroll = () => {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', updateDropdownPosition)
})

watch(isOpen, (open) => {
  if (open) {
    updateDropdownPosition()
  }
})
</script>

<style lang="scss" scoped>
.select-wrapper {
  display: inline-block;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;

  &:hover:not(.disabled) {
    border-color: var(--primary-color);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  &.open {
    border-color: var(--primary-color);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  &.placeholder {
    color: var(--text-icon);
  }
}

.select-arrow {
  width: 18px;
  height: 18px;
  color: var(--text-icon);
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;

  &.rotated {
    transform: rotate(180deg);
  }
}
</style>

<style lang="scss">
// 下拉菜单样式（非 scoped，因为使用了 Teleport）
.select-dropdown {
  z-index: 9999;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  overflow-x: hidden;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(.disabled) {
    background-color: var(--bg-secondary);
  }

  &.selected {
    color: var(--primary-color);
    background-color: var(--primary-color-10);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }

  .check-icon {
    width: 16px;
    height: 16px;
    color: var(--primary-color);
    flex-shrink: 0;
    margin-left: 8px;
  }
}

.select-empty {
  padding: 12px;
  color: var(--text-icon);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>
