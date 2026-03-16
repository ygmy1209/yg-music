/**
 * 歌曲相关 IPC 处理器
 */

import { ipcMain, shell } from 'electron'
import fs from 'fs'
import db from '../db/database.js'
import { writeMetadata } from '../utils/musicMetadata.js'

/**
 * 注册歌曲相关 IPC 处理器
 */
export const registerSongHandlers = () => {
  // 添加歌曲到歌单
  ipcMain.handle(
    'db:addSongToPlaylist',
    (event, songId, listId, songInfo, addLocation = 'top') => {
      return db.addSongToPlaylist(songId, listId, songInfo, addLocation)
    }
  )

  // 从歌单中移除歌曲
  ipcMain.handle('db:removeSongFromPlaylist', (event, songId, listId, isDefault) => {
    return db.removeSongFromPlaylist(songId, listId, isDefault)
  })

  // 更新歌曲顺序
  ipcMain.handle('db:updateSongsOrder', (event, listId, songIds) => {
    return db.updateSongsOrder(listId, songIds)
  })

  // 更新歌曲信息（数据库 + 文件元数据）
  ipcMain.handle('db:updateSongInfo', async (event, songId, updates) => {
    try {
      // 1. 检查文件是否存在
      if (!fs.existsSync(songId)) {
        return { success: false, error: '文件不存在' }
      }

      // 2. 写入文件元数据
      const writeResult = await writeMetadata(songId, {
        title: updates.name,
        artist: updates.singer,
        album: updates.album
      })

      if (!writeResult.success) {
        return { success: false, error: `写入文件失败: ${writeResult.error}` }
      }

      // 3. 更新数据库
      const dbResult = db.updateSongInfo(songId, updates)
      if (!dbResult) {
        return { success: false, error: '更新数据库失败' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 在文件资源管理器中显示文件
  ipcMain.handle('file:showInFolder', (event, filePath) => {
    return shell.showItemInFolder(filePath)
  })
}
