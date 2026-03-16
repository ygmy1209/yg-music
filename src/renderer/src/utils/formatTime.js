/**
 * 时间格式化工具函数
 */

/**
 * 将秒数格式化为 mm:ss 格式
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 将时长字符串 (mm:ss) 解析为秒数
 * @param {string} durationStr - 时长字符串，如 "03:45"
 * @returns {number} 秒数
 */
export function parseDuration(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 0
  const parts = durationStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0
    const secs = parseInt(parts[1]) || 0
    return mins * 60 + secs
  }
  return 0
}
