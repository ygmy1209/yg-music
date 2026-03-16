/**
 * 路由配置
 * 使用 hash 模式路由，适合 Electron 应用
 */

import { createRouter, createWebHashHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/PlayListPage.vue'),
    meta: { title: '歌单' }
  },
  {
    path: '/playlist/:id?',
    name: 'playlist',
    component: () => import('@/pages/PlayListPage.vue'),
    meta: { title: '歌单' }
  },
  {
    path: '/album',
    name: 'album',
    component: () => import('@/pages/AlbumPage.vue'),
    meta: { title: '专辑' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: '设置' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
