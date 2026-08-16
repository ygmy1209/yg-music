/**
 * 窗口相关 IPC 处理器
 */

import { ipcMain } from 'electron'
import { getSettingValue } from './settingHandlers.js'

// 主窗口引用（由 index.js 设置）
let mainWindow = null

// 窗口尺寸配置
const windowSizes = [
  { width: 850, height: 570 },  // 更小
  { width: 900, height: 600 },  // 小
  { width: 1100, height: 700 }, // 中
  { width: 1280, height: 800 }, // 大
  { width: 1440, height: 900 }, // 更大
  { width: 1600, height: 1000 }, // 超大
  { width: 1760, height: 1100 } // 巨大
]

/**
 * 设置主窗口引用
 */
export const setMainWindow = (win) => {
  mainWindow = win
}

/**
 * 获取主窗口引用
 */
export const getMainWindow = () => {
  return mainWindow
}

/**
 * 注册窗口相关 IPC 处理器
 */
export const registerWindowHandlers = () => {
  // 最小化窗口
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize()
  })

  // 最大化/还原窗口
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        // 全屏状态下，先标记最大化再退出全屏，避免中间缩小动画
        mainWindow.maximize()
        mainWindow.setFullScreen(false)
      } else if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  // 关闭窗口
  ipcMain.on('window-close', () => {
    if (mainWindow) {
      const minimizeToTray = getSettingValue('tray.enable')
      if (minimizeToTray) {
        mainWindow.hide()
      } else {
        mainWindow.close()
      }
    }
  })

  // 全屏切换
  ipcMain.on('window-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })

  // 调整窗口尺寸
  ipcMain.handle('window:resize', (event, sizeIndex) => {
    if (mainWindow) {
      const size = windowSizes[sizeIndex]
      if (size) {
        mainWindow.setSize(size.width, size.height)
        mainWindow.center()
      }
    }
  })

  // 任务栏进度条
  ipcMain.on('taskbar:progress', (event, progress) => {
    if (mainWindow) {
      // progress: 0-1 表示进度，>1 表示不确定状态，-1 表示移除
      mainWindow.setProgressBar(progress)
    }
  })
}
