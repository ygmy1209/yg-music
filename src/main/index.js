/**
 * Electron 主进程入口
 * 负责创建窗口、初始化数据库、处理 IPC 通信
 */

import { app, shell, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './db/database.js'
import { registerIpcHandlers, initAllModules, setMainWindow, getSettingValue } from './ipc/index.js'
import { killAllProcesses } from './utils/processManager.js'

// 主窗口引用
let mainWindow = null
let tray = null
let isQuitting = false
let isClosing = false

/**
 * 创建系统托盘
 */
function createTray() {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  tray.setToolTip('摇光音乐')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '退出',
      click: () => {
        cleanupAndQuit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  // 设置主窗口引用给 IPC 模块使用
  setMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 窗口关闭事件 - 根据设置决定是最小化到托盘还是退出
  mainWindow.on('close', (event) => {
    // 如果是正在退出（由 cleanupAndQuit 触发），则允许关闭
    if (isQuitting) return

    const minimizeToTray = getSettingValue('tray.enable')
    if (minimizeToTray) {
      event.preventDefault()
      mainWindow.hide()
    } else {
      // 如果不最小化到托盘，直接进入我们的快速清理退出流程
      event.preventDefault()
      cleanupAndQuit()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 阻止渲染进程导航到非应用页面
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devServerUrl = is.dev ? process.env['ELECTRON_RENDERER_URL'] : null
    const indexFileUrl = pathToFileURL(join(__dirname, '../renderer/index.html')).toString()

    if (devServerUrl && url.startsWith(devServerUrl)) return
    if (url.startsWith(indexFileUrl)) return
    event.preventDefault()
  })

  // 开发模式加载本地服务器，生产模式加载打包文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ========== 应用生命周期 ==========

/**
 * 统一清理并退出
 */
function cleanupAndQuit() {
  if (isClosing) return
  isClosing = true
  isQuitting = true

  // 1. 立即隐藏所有窗口，给用户“秒关”的反馈
  if (mainWindow) {
    mainWindow.hide()
  }

  console.log('[App] 窗口已隐藏，后台执行清理...')
  
  // 2. 异步执行清理逻辑，不阻塞主线程循环
  setImmediate(() => {
    try {
      // 杀死子进程
      killAllProcesses()
      
      // 尝试关闭数据库，如果 500ms 没关掉就直接强制退出
      const closeTimer = setTimeout(() => {
        console.log('[App] 数据库关闭超时，强制退出')
        process.exit(0)
      }, 500)

      closeDatabase()
      clearTimeout(closeTimer)
    } catch (error) {
      console.warn('[App] 清理出错:', error)
    }

    // 3. 正式退出
    app.quit()
    
    // 最终兜底
    setTimeout(() => {
      process.exit(0)
    }, 1000)
  })
}

app.whenReady().then(() => {
  // 设置应用 ID
  electronApp.setAppUserModelId('com.yg-music')

  // 初始化数据库
  initDatabase()

  // 初始化所有模块（设置、播放信息、快捷键等）
  initAllModules()

  // 注册 IPC 处理器
  registerIpcHandlers()

  // 创建托盘
  createTray()

  // 开发模式下 F12 打开开发者工具（需在 createWindow 前注册，主窗口才会生效）
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
})

// 应用即将退出时清理
app.on('before-quit', () => {
  // 如果已经处理过，直接返回
  if (isClosing) return

  console.log('[App] 触发 before-quit 事件')
  isQuitting = true
  
  // 执行清理
  try {
    killAllProcesses()
    closeDatabase()
  } catch (error) {
    console.warn('[App] before-quit 清理出错:', error)
  }
  
  isClosing = true
})

// 关闭所有窗口时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  // macOS 通常不退出应用
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 上点击 Dock 图标时显示或重建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show()
  }
})
