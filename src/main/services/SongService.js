/**
 * 歌曲业务逻辑服务
 * 封装歌曲相关的业务操作
 */

import db from '../db/database.js'

class SongService {
  /**
   * 添加歌曲到歌单
   * @param {string} songId - 歌曲 ID
   * @param {string} listId - 歌单 ID
   * @param {Object} songInfo - 歌曲信息
   * @param {string} addLocation - 添加位置 ('top' | 'bottom')
   */
  addToPlaylist(songId, listId, songInfo, addLocation = 'top') {
    if (!songId || !listId) {
      throw new Error('歌曲 ID 和歌单 ID 不能为空')
    }
    return db.addSongToPlaylist(songId, listId, songInfo, addLocation)
  }

  /**
   * 从歌单中移除歌曲
   * @param {string} songId - 歌曲 ID
   * @param {string} listId - 歌单 ID
   * @param {boolean} isDefault - 是否为默认歌单
   */
  removeFromPlaylist(songId, listId, isDefault = false) {
    if (!songId || !listId) {
      throw new Error('歌曲 ID 和歌单 ID 不能为空')
    }
    return db.removeSongFromPlaylist(songId, listId, isDefault)
  }

  /**
   * 更新歌曲顺序
   * @param {string} listId - 歌单 ID
   * @param {Array} songIds - 歌曲 ID 数组（按新顺序）
   */
  updateOrder(listId, songIds) {
    if (!listId || !Array.isArray(songIds)) {
      throw new Error('歌单 ID 和歌曲 ID 数组不能为空')
    }
    return db.updateSongsOrder(listId, songIds)
  }

  /**
   * 批量添加歌曲到歌单
   * @param {Array} songs - 歌曲数组
   * @param {string} listId - 歌单 ID
   * @param {string} addLocation - 添加位置
   */
  batchAddToPlaylist(songs, listId, addLocation = 'top') {
    if (!Array.isArray(songs) || songs.length === 0) {
      throw new Error('歌曲数组不能为空')
    }
    if (!listId) {
      throw new Error('歌单 ID 不能为空')
    }

    const results = []
    for (const song of songs) {
      try {
        const result = this.addToPlaylist(song.id, listId, song, addLocation)
        results.push({ songId: song.id, success: true, result })
      } catch (error) {
        results.push({ songId: song.id, success: false, error: error.message })
      }
    }
    return results
  }
}

// 导出单例
export const songService = new SongService()
export default songService
