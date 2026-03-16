/**
 * 转码相关 IPC 处理器
 */

import { ipcMain } from 'electron'
import { ensurePlayable, probeMedia } from '../utils/transcoder.js'

/**
 * 注册转码相关 IPC 处理器
 */
export const registerTranscodeHandlers = () => {
  // 检测媒体文件是否需要转码
  ipcMain.handle('transcode:probe', async (event, filePath) => {
    try {
      const result = await probeMedia(filePath)
      return { success: true, data: result }
    } catch (error) {
      console.error('[转码] 检测失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 确保文件可播放（按需转码）
  ipcMain.handle('transcode:ensurePlayable', async (event, filePath) => {
    try {
      // 发送进度事件
      const sendProgress = (percent) => {
        event.sender.send('transcode:progress', { filePath, percent })
      }

      const result = await ensurePlayable(filePath, sendProgress)
      return { success: true, data: result }
    } catch (error) {
      console.error('[转码] 转码失败:', error)
      return { success: false, error: error.message }
    }
  })
}
