/**
 * IPC 通信模块入口
 * 统一注册所有 IPC 处理器
 */

// 导入各模块的初始化和注册函数
import { initSetting, registerSettingHandlers } from './settingHandlers.js'
import { initHotKey, registerHotKeyHandlers } from './hotKeyHandlers.js'
import { initPlayInfo, registerPlayInfoHandlers } from './playInfoHandlers.js'
import { registerPlaylistHandlers } from './playlistHandlers.js'
import { registerSongHandlers } from './songHandlers.js'
import { registerDialogHandlers } from './dialogHandlers.js'
import { registerMusicHandlers } from './musicHandlers.js'
import { registerFileHandlers } from './fileHandlers.js'
import { registerTranscodeHandlers } from './transcodeHandlers.js'
import { registerWindowHandlers, setMainWindow } from './windowHandlers.js'
import { registerFontHandlers } from './fontHandlers.js'

// 重导出 setMainWindow 供 index.js 使用
export { setMainWindow }

/**
 * 初始化所有模块
 */
export const initAllModules = () => {
  initSetting()
  initPlayInfo()
  initHotKey()
  console.log('[IPC] 所有模块初始化完成')
}

/**
 * 注册所有 IPC 处理器
 */
export const registerIpcHandlers = () => {
  // 注册各模块的处理器
  registerSettingHandlers()
  registerHotKeyHandlers()
  registerPlayInfoHandlers()
  registerPlaylistHandlers()
  registerSongHandlers()
  registerDialogHandlers()
  registerMusicHandlers()
  registerFileHandlers()
  registerTranscodeHandlers()
  registerWindowHandlers()
  registerFontHandlers()

  console.log('[IPC] 所有处理器注册完成')
}

// 统一导出主进程内部常用接口（如 main/index.js 直接读取设置）
export { getSetting, getSettingValue, updateSetting } from './settingHandlers.js'
export { getHotKeyConfig, saveHotKeyConfig } from './hotKeyHandlers.js'
export { getPlayInfo, savePlayInfo } from './playInfoHandlers.js'
