/**
 * 歌单业务逻辑服务
 * 封装歌单相关的业务操作
 */

import db from '../db/database.js'

class PlaylistService {
  /**
   * 获取所有歌单
   */
  getAll() {
    return db.getAllPlaylists()
  }

  /**
   * 创建歌单
   * @param {string} id - 歌单 ID
   * @param {string} name - 歌单名称
   */
  create(id, name) {
    if (!id || !name) {
      throw new Error('歌单 ID 和名称不能为空')
    }
    return db.createPlaylist(id, name)
  }

  /**
   * 重命名歌单
   * @param {string} id - 歌单 ID
   * @param {string} newName - 新名称
   */
  rename(id, newName) {
    if (!id || !newName) {
      throw new Error('歌单 ID 和新名称不能为空')
    }
    return db.renamePlaylist(id, newName)
  }

  /**
   * 删除歌单
   * @param {string} id - 歌单 ID
   */
  delete(id) {
    if (!id) {
      throw new Error('歌单 ID 不能为空')
    }
    return db.deletePlaylist(id)
  }

  /**
   * 获取歌单中的所有歌曲
   * @param {string} listId - 歌单 ID
   */
  getSongs(listId) {
    if (!listId) {
      throw new Error('歌单 ID 不能为空')
    }
    return db.getSongsByPlaylist(listId)
  }

  /**
   * 获取所有专辑
   */
  getAllAlbums() {
    return db.getAllAlbums()
  }

  /**
   * 获取专辑中的所有歌曲
   * @param {string} albumName - 专辑名称
   */
  getSongsByAlbum(albumName) {
    if (!albumName) {
      throw new Error('专辑名称不能为空')
    }
    return db.getSongsByAlbum(albumName)
  }
}

// 导出单例
export const playlistService = new PlaylistService()
export default playlistService
