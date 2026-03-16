/**
 * 确认对话框内容组件
 * 用于删除歌单、删除歌曲等操作的二次确认
 */

<template>
  <div class="confirm-dialog-content">
    <p class="confirm-message">{{ message }}</p>
    <div class="confirm-buttons">
      <button class="btn btn-cancel" @click="handleCancel">{{ cancelText }}</button>
      <button class="btn btn-confirm" @click="handleConfirm">{{ confirmText }}</button>
    </div>
  </div>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialogStore'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  onConfirm: {
    type: Function,
    default: null
  },
  onCancel: {
    type: Function,
    default: null
  },
  cancelText: {
    type: String,
    default: '不要！'
  },
  confirmText: {
    type: String,
    default: '我确定'
  }
})

const dialogStore = useDialogStore()

const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  }
  dialogStore.closeDialog()
}

const handleConfirm = () => {
  if (props.onConfirm) {
    props.onConfirm()
  }
  dialogStore.closeDialog()
}
</script>

<style lang="scss" scoped>
.confirm-dialog-content {
  padding: 20px 20px 0  20px;
  min-width: 300px;
  max-width: 70vh;

  .confirm-message {
    font-size: var(--font-size-base);
    color: var(--text-primary);
    text-align: left;
    margin: 0 0 20px 0;
    line-height: 1.7;
    white-space: pre-line;
  }

  .confirm-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .btn {
      flex: 1;
      max-width: 120px;
      padding: 10px 10px;
      border-radius: 6px;
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-cancel,
    .btn-confirm {
      background-color: var(--primary-color-15);
      color: var(--primary-color);

      &:hover {
        background-color: var(--primary-color-50);
      }
    }
  }
}
</style>
