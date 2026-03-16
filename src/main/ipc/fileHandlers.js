/**
 * 文件操作相关 IPC 处理器
 */

import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import {
  getAudioMetadata,
  getAudioDetailedInfo,
  getAudioCover,
  isAudioFile,
  isVideoFile,
  isSupportedMedia as isAudioSupported
} from '../utils/musicMetadata.js'
import { getVideoMetadata, getVideoDetailedInfo, isSupportedMedia } from '../utils/ffmpeg.js'

/**
 * 注册文件操作相关 IPC 处理器
 */
export const registerFileHandlers = () => {
  // ========== 文件选择对话框 ==========

  ipcMain.handle('dialog:selectMusicFiles', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'flac', 'wav', 'aac', 'ogg', 'wma', 'm4a', 'ape'] },
        { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })
    return result.filePaths
  })

  ipcMain.handle('dialog:selectMusicFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择音乐文件夹',
      properties: ['openDirectory']
    })
    return result.filePaths[0] || null
  })

  // ========== 文件夹扫描 ==========

  ipcMain.handle('music:scanFolder', async (event, folderPath) => {
    try {
      const mediaFiles = []
      const supportedExts = [
        '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a', '.ape', '.alac',
        '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'
      ]

      const scanDir = async (dirPath) => {
        const items = await fs.promises.readdir(dirPath)
        for (const item of items) {
          const itemPath = path.join(dirPath, item)
          const stat = await fs.promises.stat(itemPath)
          if (stat.isDirectory()) {
            await scanDir(itemPath)
          } else if (stat.isFile()) {
            const ext = path.extname(itemPath).toLowerCase()
            if (supportedExts.includes(ext)) {
              mediaFiles.push(itemPath)
            }
          }
        }
      }

      await scanDir(folderPath)
      return { success: true, files: mediaFiles }
    } catch (error) {
      console.error('扫描文件夹失败:', error)
      return { success: false, error: error.message, files: [] }
    }
  })

  // ========== 元数据解析 ==========

  ipcMain.handle('music:parseMetadata', async (event, filePath) => {
    try {
      if (!isSupportedMedia(filePath) && !isAudioSupported(filePath)) {
        return { success: false, error: '不支持的文件格式' }
      }

      let result
      if (isAudioFile(filePath)) {
        result = await getAudioMetadata(filePath)
      } else {
        const metadata = await getVideoMetadata(filePath)
        result = { success: true, data: metadata }
      }

      return result
    } catch (error) {
      console.error('解析元数据失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('music:parseMetadataBatch', async (event, filePaths) => {
    const results = []
    for (const filePath of filePaths) {
      try {
        if (!isSupportedMedia(filePath) && !isAudioSupported(filePath)) {
          results.push({ filePath, success: false, error: '不支持的文件格式' })
          continue
        }

        let result
        if (isAudioFile(filePath)) {
          result = await getAudioMetadata(filePath)
        } else {
          const metadata = await getVideoMetadata(filePath)
          result = { success: true, data: metadata }
        }

        if (result.success) {
          results.push({ filePath, success: true, data: result.data })
        } else {
          results.push({ filePath, success: false, error: result.error })
        }
      } catch (error) {
        results.push({ filePath, success: false, error: error.message })
      }
    }
    return results
  })

  ipcMain.handle('music:getDetailedInfo', async (event, filePath) => {
    try {
      if (isAudioFile(filePath)) {
        return await getAudioDetailedInfo(filePath)
      } else if (isVideoFile(filePath)) {
        return await getVideoDetailedInfo(filePath)
      } else {
        return { success: false, error: '不支持的文件格式' }
      }
    } catch (error) {
      console.error('获取详细信息失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('music:getCover', async (event, filePath) => {
    return await getAudioCover(filePath)
  })

  // ========== 文件读取 ==========

  ipcMain.handle('file:read-text', async (event, filePath) => {
    try {
      try {
        await fs.promises.access(filePath)
      } catch (err) {
        return { error: '文件不存在', content: null }
      }
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return { error: null, content }
    } catch (error) {
      console.error('读取文本文件失败:', error)
      return { error: error.message, content: null }
    }
  })

  ipcMain.handle('file:read-audio', async (event, filePath) => {
    try {
      try {
        await fs.promises.access(filePath)
      } catch (err) {
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
