/**
 * 快捷键相关 IPC 处理器
 */

import { ipcMain } from 'electron'
import { getStore } from '../utils/store.js'

// 快捷键存储实例
let hotKeyStore = null

/**
 * 初始化快捷键存储
 */
export const initHotKey = () => {
  hotKeyStore = getStore('hot_key')
  console.log('[HotKey] 快捷键存储初始化完成')
}

/**
 * 获取快捷键配置
 */
export const getHotKeyConfig = () => {
  if (!hotKeyStore) initHotKey()
  return hotKeyStore.get('config', null)
}

/**
 * 保存快捷键配置
 */
export const saveHotKeyConfig = (config) => {
  if (!hotKeyStore) initHotKey()
  hotKeyStore.set('config', config)
}

/**
 * 注册快捷键相关 IPC 处理器
 */
export const registerHotKeyHandlers = () => {
  ipcMain.handle('hotKey:getAll', () => {
    return getHotKeyConfig()
  })

  ipcMain.handle('hotKey:update', (event, config) => {
    saveHotKeyConfig(config)
    return true
  })
}
