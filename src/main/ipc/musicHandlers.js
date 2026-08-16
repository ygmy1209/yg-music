/**
 * 音乐元数据相关 IPC 处理器
 * 对应 preload 暴露的 musicAPI
 */

import { ipcMain } from 'electron'
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
 * 解析单个媒体文件的元数据（音频走 music-metadata，视频走 ffprobe）
 */
const parseMetadata = async (filePath) => {
  if (!isSupportedMedia(filePath) && !isAudioSupported(filePath)) {
    return { success: false, error: '不支持的文件格式' }
  }

  if (isAudioFile(filePath)) {
    return await getAudioMetadata(filePath)
  }

  const metadata = await getVideoMetadata(filePath)
  return { success: true, data: metadata }
}

/**
 * 注册音乐元数据相关 IPC 处理器
 */
export const registerMusicHandlers = () => {
  // 扫描文件夹中的音视频文件
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

  // 解析单个文件元数据
  ipcMain.handle('music:parseMetadata', async (event, filePath) => {
    try {
      return await parseMetadata(filePath)
    } catch (error) {
      console.error('解析元数据失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 批量解析文件元数据
  ipcMain.handle('music:parseMetadataBatch', async (event, filePaths) => {
    const results = []
    for (const filePath of filePaths) {
      try {
        const result = await parseMetadata(filePath)
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

  // 获取文件详细信息（MediaInfo 风格）
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

  // 获取音频文件内嵌封面
  ipcMain.handle('music:getCover', async (event, filePath) => {
    return await getAudioCover(filePath)
  })
}
