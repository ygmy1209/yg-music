/**
 * 导航状态管理
 * 管理侧边栏导航和当前激活的视图
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavStore = defineStore('nav', () => {
  // ========== 状态定义 ==========

  // 当前激活的导航项
  // 'playlist' | 'album' | 'singer' | 'settings'
  const activeNav = ref('playlist')

  // ========== 方法 ==========

  // 切换导航
  const setActiveNav = (nav) => {
    activeNav.value = nav
  }

  return {
    activeNav,
    setActiveNav
  }
})
