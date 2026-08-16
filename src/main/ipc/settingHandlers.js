/**
 * 设置相关 IPC 处理器
 */

import { ipcMain, BrowserWindow } from 'electron'
import { getStore } from '../utils/store.js'
import { mergeSetting } from '../utils/defaultSetting.js'

// 设置存储实例
let settingStore = null
let currentSetting = null

/**
 * 初始化设置
 */
export const initSetting = () => {
  settingStore = getStore('config')
  const savedSetting = settingStore.get('setting', {})
  currentSetting = mergeSetting(savedSetting)

  // 首次运行时保存默认设置
  if (Object.keys(savedSetting).length === 0) {
    settingStore.set('setting', currentSetting)
  }

  console.log('[Setting] 设置初始化完成')
}

/**
 * 获取当前设置
 */
export const getSetting = () => {
  return { ...currentSetting }
}

/**
 * 获取单个设置项
 */
export const getSettingValue = (key) => {
  return currentSetting ? currentSetting[key] : undefined
}

/**
 * 更新设置
 */
export const updateSetting = (newSetting) => {
  currentSetting = { ...currentSetting, ...newSetting }
  settingStore.set('setting', currentSetting)

  // 通知所有窗口设置已更新
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('setting:changed', newSetting)
  })

  return currentSetting
}

/**
 * 注册设置相关 IPC 处理器
 */
export const registerSettingHandlers = () => {
  ipcMain.handle('setting:getAll', () => {
    return getSetting()
  })

  ipcMain.handle('setting:get', (event, key) => {
    return getSettingValue(key)
  })

  ipcMain.handle('setting:update', (event, newSetting) => {
    return updateSetting(newSetting)
  })
}
