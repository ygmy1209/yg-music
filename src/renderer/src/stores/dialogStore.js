/**
 * 对话框状态管理
 * 用于全局控制对话框显示
 */

import { defineStore } from 'pinia'
import { ref, shallowRef, markRaw } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
  // 对话框可见性
  const visible = ref(false)

  // 对话框配置（使用 shallowRef 避免组件被响应式包装）
  const config = shallowRef({
    title: '',
    titleHighlight: '', // 需要高亮的部分（如歌曲名）
    showSuffix: false, // 是否显示后缀（如"到..."）
    component: null, // 动态组件
    props: {}, // 组件 props
    randomAnimation: true,
    closeOnClickOverlay: true,
    fullscreen: false // 是否全窗口覆盖
  })

  // 打开对话框
  const openDialog = (options) => {
    config.value = {
      title: options.title || '',
      titleHighlight: options.titleHighlight || '',
      showSuffix: options.showSuffix || false,
      component: options.component ? markRaw(options.component) : null,
      props: options.props || {},
      randomAnimation: options.randomAnimation !== false,
      closeOnClickOverlay: options.closeOnClickOverlay !== false,
      fullscreen: options.fullscreen === true
    }
    visible.value = true
  }

  // 关闭对话框
  const closeDialog = () => {
    visible.value = false
  }

  // 切换对话框
  const toggleDialog = () => {
    visible.value = !visible.value
  }

  return {
    visible,
    config,
    openDialog,
    closeDialog,
    toggleDialog
  }
})
