/**
 * 文件读取相关 IPC 处理器
 * 对应 preload 暴露的 fileAPI
 */

import { ipcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * 注册文件相关 IPC 处理器
 */
export const registerFileHandlers = () => {
  // 在文件资源管理器中显示文件
  ipcMain.handle('file:showInFolder', (event, filePath) => {
    return shell.showItemInFolder(filePath)
  })

  // 读取文本文件（歌词等）
  ipcMain.handle('file:read-text', async (event, filePath) => {
    try {
      try {
        await fs.promises.access(filePath)
      } catch {
        return { error: '文件不存在', content: null }
      }
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return { error: null, content }
    } catch (error) {
      console.error('读取文本文件失败:', error)
      return { error: error.message, content: null }
    }
  })

  // 读取音频/视频文件（返回 Buffer 供渲染进程创建 Blob）
  ipcMain.handle('file:read-audio', async (event, filePath) => {
    try {
      try {
        await fs.promises.access(filePath)
      } catch {
        return { error: '文件不存在', data: null, mimeType: null }
      }

      const buffer = await fs.promises.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()

      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.flac': 'audio/flac',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.wma': 'audio/x-ms-wma',
        '.ape': 'audio/x-ape',
        '.alac': 'audio/alac',
        '.aiff': 'audio/aiff',
        '.dsd': 'audio/dsd',
        '.mp4': 'video/mp4',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
        '.m4v': 'video/mp4'
      }

      const mimeType = mimeTypes[ext] || 'application/octet-stream'

      console.log('[主进程] 音频文件读取成功:', filePath, 'MIME:', mimeType, '大小:', buffer.length)
      return { error: null, data: buffer.buffer, mimeType }
    } catch (error) {
      console.error('读取音频文件失败:', error)
      return { error: error.message, data: null, mimeType: null }
    }
  })
}
