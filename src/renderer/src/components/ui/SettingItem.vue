/**
 * 通用设置项组件
 */

<template>
  <div class="setting-item">
    <label class="checkbox-label">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span class="checkbox-box">
        <svg v-if="modelValue" class="check-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      </span>
      <span><slot /></span>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
.setting-item {
  padding: 6px 0;
  line-height: 1.5;
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
