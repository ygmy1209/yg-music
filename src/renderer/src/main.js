/**
 * 渲染进程入口文件
 * 配置 Vue 应用、Pinia 状态管理、全局样式
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 全局样式
import './styles/base.scss'

// 动画库
import 'animate.css'

// 创建 Vue 应用
const app = createApp(App)

// 配置 Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 挂载应用
app.mount('#app')
