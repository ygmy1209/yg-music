/**
 * 歌词解析工具函数
 */

/**
 * 解析 LRC 歌词文本
 * @param {string} lrcText - LRC 格式的歌词文本
 * @returns {Array<{time: number, text: string}>} 解析后的歌词数组
 */
export function parseLrc(lrcText) {
  const lines = lrcText.split('\n')
  const result = []
  let metaOrder = 0 // 用于保证无时间戳元数据的先后顺序

  lines.forEach((line) => {
    line = line.trim()
    if (!line) return

    // 标准时间戳格式 [mm:ss.ms]歌词
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0
      const time = minutes * 60 + seconds + milliseconds / 1000
      const text = match[4].trim()

      // 过滤掉 awlrc 标记，保留其他内容
      if (text && !text.includes('awlrc')) {
        result.push({ time, text })
      }
    } else {
      // 检查是不是元数据格式，如 [ti:归期] 或 [ar:钱润玉] 或纯文本（没有时间戳但有冒号如“作词:xxx”）
      // 匹配类似 [xx:yyy] 的元数据标签
      const metaMatch = line.match(/^\[([a-zA-Z]+):(.*?)\]$/)
      if (metaMatch) {
        const tag = metaMatch[1].toLowerCase()
        const text = metaMatch[2].trim()
        
        // 忽略纯技术性标签
        const ignoreTags = ['offset', 'length', 're', 've']
        if (ignoreTags.includes(tag)) return

        // 映射常见标签为中文增强可读性
        const tagMap = { ti: '标题', ar: '歌手', al: '专辑', au: '作词', by: '歌词制作' }
        const displayTag = tagMap[tag] || tag.toUpperCase()

        // 我们想把这些展示在最顶部，所以赋予一个微小且递增的时间
        if (text && !text.includes('awlrc')) {
           result.push({ time: metaOrder * 0.0001, text: `${displayTag}: ${text}`, isMeta: true })
           metaOrder++
        }
      } else if (line.includes(':') || line.includes('：')) {
        // 处理形如 "作词: 于洛萱" 的裸文本元数据（如果没有时间戳被包裹）
        if (!line.includes('awlrc')) {
           result.push({ time: metaOrder * 0.0001, text: line, isMeta: true })
           metaOrder++
        }
      }
    }
  })

  // 按时间排序
  result.sort((a, b) => a.time - b.time)
  return result
}

/**
 * 在已按时间排序的歌词数组中查找当前播放时间对应的行索引
 * 使用二分查找，返回 time <= currentTime 的最后一个索引
 * @param {Array<{time: number}>} lines - 已按 time 升序排序的歌词行
 * @param {number} currentTime - 当前播放时间（秒）
 * @returns {number} 匹配行索引，无匹配返回 -1
 */
export function findLyricIndex(lines, currentTime) {
  if (!lines || lines.length === 0) return -1

  let low = 0
  let high = lines.length - 1
  let answer = -1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (lines[mid].time <= currentTime) {
      answer = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return answer
}
