/**
 * 歌单相关 IPC 处理器
 */

import { ipcMain } from 'electron'
import db from '../db/database.js'

/**
 * 注册歌单相关 IPC 处理器
 */
export const registerPlaylistHandlers = () => {
  // 获取所有歌单
  ipcMain.handle('db:getAllPlaylists', () => {
    return db.getAllPlaylists()
  })

  // 创建歌单
  ipcMain.handle('db:createPlaylist', (event, id, name) => {
    return db.createPlaylist(id, name)
  })

  // 重命名歌单
  ipcMain.handle('db:renamePlaylist', (event, id, newName) => {
    return db.renamePlaylist(id, newName)
  })

  // 删除歌单
  ipcMain.handle('db:deletePlaylist', (event, id) => {
    return db.deletePlaylist(id)
  })

  // 获取歌单中的所有歌曲
  ipcMain.handle('db:getSongsByPlaylist', (event, listId) => {
    return db.getSongsByPlaylist(listId)
  })

  // 获取所有专辑
  ipcMain.handle('db:getAllAlbums', () => {
    return db.getAllAlbums()
  })

  // 获取专辑中的所有歌曲
  ipcMain.handle('db:getSongsByAlbum', (event, albumName) => {
    return db.getSongsByAlbum(albumName)
  })

  // 获取所有歌手
  ipcMain.handle('db:getAllSingers', () => {
    return db.getAllSingers()
  })

  // 获取歌手的所有歌曲
  ipcMain.handle('db:getSongsBySinger', (event, singerName) => {
    return db.getSongsBySinger(singerName)
  })
}
