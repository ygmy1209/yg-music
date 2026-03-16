/**
 * 播放信息持久化 IPC 处理器
 */

import { ipcMain } from 'electron'
import { getStore } from '../utils/store.js'

// 播放信息存储实例
let playInfoStore = null

/**
 * 初始化播放信息存储
 */
export const initPlayInfo = () => {
  playInfoStore = getStore('playInfo')
  console.log('[PlayInfo] 播放信息存储初始化完成')
}

/**
 * 获取播放信息
 */
export const getPlayInfo = () => {
  if (!playInfoStore) initPlayInfo()
  return playInfoStore.get('playInfo', null)
}

/**
 * 保存播放信息
 */
export const savePlayInfo = (info) => {
  if (!playInfoStore) initPlayInfo()
  playInfoStore.set('playInfo', info)
}

/**
 * 注册播放信息相关 IPC 处理器
 */
export const registerPlayInfoHandlers = () => {
  ipcMain.handle('playInfo:get', () => {
    return getPlayInfo()
  })

  ipcMain.handle('playInfo:save', (event, info) => {
    return savePlayInfo(info)
  })
}
