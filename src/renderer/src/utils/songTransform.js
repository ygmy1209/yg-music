/**
 * 歌曲数据转换工具
 * 处理 singer↔artist、interval↔duration 等字段映射
 */

/**
 * 数据库歌曲记录转换为前端显示格式
 * @param {Object} dbSong - 数据库中的歌曲对象
 * @returns {Object} 前端显示用的歌曲对象
 */
export function dbToDisplaySong(dbSong) {
  if (!dbSong) return null

  return {
    id: dbSong.id,
    name: dbSong.name,
    artist: dbSong.singer || '',
    album: dbSong.album || '',
    duration: dbSong.interval || '',
    type: dbSong.type ?? 0,
    meta: dbSong.meta || null
  }
}

/**
 * 批量转换数据库歌曲记录
 * @param {Array<Object>} dbSongs - 数据库中的歌曲数组
 * @returns {Array<Object>} 前端显示用的歌曲数组
 */
export function dbToDisplaySongs(dbSongs) {
  if (!dbSongs || !Array.isArray(dbSongs)) return []
  return dbSongs.map(dbToDisplaySong)
}

/**
 * 提取歌曲基本信息用于添加到歌单
 * @param {Object} song - 歌曲对象（任意格式）
 * @returns {Object} 包含基本信息的对象
 */
export function extractSongInfo(song) {
  return {
    name: song.name || '',
    singer: song.artist || song.singer || '',
    album: song.album || '',
    type: song.type ?? 0,
    interval: song.duration || song.interval || '',
    meta: song.meta || null
  }
}
