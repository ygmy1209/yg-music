/**
 * 字体相关 IPC 处理器
 */

import { ipcMain } from 'electron'
import fontList from 'font-list'

/**
 * 注册字体相关 IPC 处理器
 */
export const registerFontHandlers = () => {
  ipcMain.handle('font:getList', async () => {
    try {
      const fonts = await fontList.getFonts()
      // 排序并去重
      return [...new Set(fonts)].sort((a, b) => a.localeCompare(b))
    } catch (error) {
      console.error('获取系统字体失败:', error)
      return []
    }
  })
}
