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
 * 前端显示格式转换为数据库存储格式
 * @param {Object} displaySong - 前端显示用的歌曲对象
 * @returns {Object} 数据库存储用的歌曲对象
 */
export function displayToDbSong(displaySong) {
  if (!displaySong) return null

  return {
    id: displaySong.id,
    name: displaySong.name,
    singer: displaySong.artist || '',
    album: displaySong.album || '',
    interval: displaySong.duration || '',
    type: displaySong.type ?? 0,
    meta: displaySong.meta || null
  }
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

/**
 * 格式化歌曲时长（秒转换为 mm:ss 格式）
 * @param {number|string} seconds - 秒数或时长字符串
 * @returns {string} 格式化后的时长
 */
export function formatDuration(seconds) {
  if (!seconds) return ''

  // 如果已经是字符串格式，直接返回
  if (typeof seconds === 'string' && seconds.includes(':')) {
    return seconds
  }

  const sec = parseInt(seconds, 10)
  if (isNaN(sec)) return ''

  const minutes = Math.floor(sec / 60)
  const remainingSeconds = sec % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * 解析时长字符串为秒数
 * @param {string} duration - 时长字符串（mm:ss 格式）
 * @returns {number} 秒数
 */
export function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') return 0

  const parts = duration.split(':')
  if (parts.length !== 2) return 0

  const minutes = parseInt(parts[0], 10) || 0
  const seconds = parseInt(parts[1], 10) || 0
  return minutes * 60 + seconds
}

/**
 * 比较两首歌曲是否相同（基于 ID 或路径）
 * @param {Object} song1 - 歌曲1
 * @param {Object} song2 - 歌曲2
 * @returns {boolean} 是否相同
 */
export function isSameSong(song1, song2) {
  if (!song1 || !song2) return false
  return song1.id === song2.id
}
