/**
 * 选项组组件（用于多选一的场景）
 */

<template>
  <div class="option-group">
    <label v-for="option in options" :key="option.value" class="checkbox-label">
      <input
        type="checkbox"
        :checked="modelValue === option.value"
        :disabled="option.disabled"
        @change="$emit('update:modelValue', option.value)"
      />
      <span class="checkbox-box">
        <svg v-if="modelValue === option.value" class="check-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      </span>
      <span>{{ option.label }}</span>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
    // 格式: [{ label: '选项名', value: '值', disabled?: false }]
  }
})

defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type='checkbox'] {
    display: none;

    &:disabled + .checkbox-box {
      opacity: 0.5;
      cursor: default;
    }

    &:checked + .checkbox-box {
      border-color: var(--primary-color);
      background-color: var(--primary-color);
    }
  }

  .checkbox-box {
    flex-shrink: 0;
    width: 1em;
    height: 1em;
    border: 1px solid var(--text-icon);
    border-radius: 2px;
    margin-right: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .check-icon {
    width: 100%;
    height: 100%;
    color: #fff;
    transform: scale(0.8);
  }

  span:last-child {
    flex: 1;
  }
}
</style>
