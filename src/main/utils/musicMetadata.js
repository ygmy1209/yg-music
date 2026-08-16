/**
 * Music Metadata 工具模块
 * 使用 music-metadata 库解析音频文件的元数据
 * 支持更准确的标签解析（ID3、 Vorbis, APE 等)
 */

import { parseFile } from 'music-metadata'
import path from 'path'
import fs from 'fs'

// 音频文件扩展名
const AUDIO_EXTENSIONS = [
  '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a', '.ape', '.alac', '.aiff', '.dsd'
]

// 视频文件扩展名
const VIDEO_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'
]

/**
 * 判断文件是否为音频格式
 */
export const isAudioFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return AUDIO_EXTENSIONS.includes(ext)
}

/**
 * 判断文件是否为视频格式
 */
export const isVideoFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return VIDEO_EXTENSIONS.includes(ext)
}

/**
 * 判断文件是否为支持的媒体格式
 */
export const isSupportedMedia = (filePath) => {
  return isAudioFile(filePath) || isVideoFile(filePath)
}

/**
 * 格式化时长（秒转为可读格式）
 */
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)

  if (h > 0) {
    return `${h} h ${m} min ${s} s`
  }
  if (ms > 0) {
    return `${m} min ${s} s ${ms} ms`
  }
  return `${m} min ${s} s`
}

/**
 * 格式化短时长（mm:ss）
 */
const formatShortDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return ''
  if (bytes < 1024) return bytes + ' Bytes'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KiB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MiB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GiB'
}

/**
 * 格式化比特率
 */
const formatBitrate = (bitrate) => {
  if (!bitrate || isNaN(bitrate)) return ''
  const kbps = Math.round(bitrate / 1000)
  return kbps + ' kb/s'
}

/**
 * 格式化采样率
 */
const formatSampleRate = (sampleRate) => {
  if (!sampleRate || isNaN(sampleRate)) return ''
  if (sampleRate >= 1000) {
    return (sampleRate / 1000).toFixed(1) + ' kHz'
  }
  return sampleRate + ' Hz'
}

/**
 * 歌词字段白名单
 * 优先查找同步歌词（带时间标签）， 再查找未同步歌词
 * 按优先级排列
 */
const SYNCED_LYRICS_FIELDS = [
  // 同步歌词字段（优先）
  'SYLT',                    // MP3 ID3v2 同步歌词
  'LYRICS',                  // FLAC/Vorbis 同步歌词（非标准)
  '©lyr',                    // MP4/M4A iTunes 歌词
  'WMLyrics_Synchronised',   // WMA 同步歌词
  'TXXX:LYRICS'              // 自定义同步歌词
]

const UNSYNCED_LYRICS_FIELDS = [
  // 未同步歌词字段（备选）
  'USLT',                    // MP3 ID3v2 未同步歌词
  'UNSYNCEDLYRICS',          // FLAC/Vorbis 未同步歌词
  'TXXX:UNSYNCEDLYRICS',
  'WMLyrics',               // WMA 未同步歌词
  'LYRIC',
  'lyrics'
]

/**
 * 从原生标签中提取歌词
 * 当 common.lyrics 没有值时， 尝试从原生标签中查找
 * music-metadata 的 native 结构: { 'ID3v2.3': [...], 'vorbis': [...] }
 * @param {Object} nativeTags - music-metadata 返回的 native 标签对象
 * @returns {string|null} 歌词文本或 null
 */
function extractLyricsFromNativeTags(nativeTags) {
  if (!nativeTags || typeof nativeTags !== 'object') {
    return null
  }

  // 遍历所有标签格式（ID3v2.3, ID3v2.4, vorbis, iTunes 等）
  for (const tagType of Object.keys(nativeTags)) {
    const tags = nativeTags[tagType]
    if (!Array.isArray(tags)) {
      continue
    }

    console.log('[元数据] 检查标签类型:', tagType, '标签数量:', tags.length)

    // 先查找同步歌词
    for (const field of SYNCED_LYRICS_FIELDS) {
      const lyrics = findLyricsInTags(tags, field)
      if (lyrics) {
        // 检查是否包含时间标签
        const hasTimestamps = /\[\d{2}:\d{2}/.test(lyrics)
        if (hasTimestamps) {
          console.log('[元数据] 从', field, '找到同步歌词（带时间标签)')
          return lyrics
        }
      }
    }

    // 没找到同步歌词, 查找未同步歌词
    for (const field of UNSYNCED_LYRICS_FIELDS) {
      const lyrics = findLyricsInTags(tags, field)
      if (lyrics) {
        console.log('[元数据] 从', field, '找到未同步歌词')
        return lyrics
      }
    }
  }

  return null
}

/**
 * 在标签数组中查找指定字段的歌词
 */
function findLyricsInTags(tags, field) {
  // 处理 TXXX:xxx 格式的自定义字段
  if (field.startsWith('TXXX:')) {
    const description = field.slice(5)
    const txxxTag = tags.find(tag =>
      tag.id === 'TXXX' && tag.value &&
      tag.value.description &&
      tag.value.description.toUpperCase() === description.toUpperCase()
    )
    if (txxxTag && txxxTag.value && txxxTag.value.text) {
      const text = txxxTag.value.text
      if (typeof text === 'string' && text.trim()) {
        return text.trim()
      }
    }
    return null
  }

  // 普通字段查找
  const tag = tags.find(t => {
    if (!t.id) return false
    // 精确匹配或大小写不敏感匹配
    return t.id === field || t.id.toUpperCase() === field.toUpperCase()
  })

  if (tag && tag.value) {
    let text = null
    // USLT/SYLT 格式: { language, shortText, text } 或 { ... }
    if (typeof tag.value === 'object') {
      if (tag.value.text) {
        text = tag.value.text
      } else if (tag.value.value) {
        // 某些格式的值在 value 字段
        text = tag.value.value
      }
    } else if (typeof tag.value === 'string') {
      text = tag.value
    }

    if (text && typeof text === 'string' && text.trim()) {
      return text.trim()
    }
  }

  return null
}

/**
 * 将 SYLT 同步歌词转换为 LRC 格式
 * @param {Array} syllableLyrics - music-metadata 返回的 syllableLyrics 数组
 * @returns {string} LRC 格式歌词文本
 */
function convertSyllableToLrc(syllableLyrics) {
  if (!Array.isArray(syllableLyrics) || syllableLyrics.length === 0) {
    return null
  }

  const lrcLines = syllableLyrics.map(item => {
    // syllableLyrics 格式: { time: 毫秒, text: '歌词' }
    const timeMs = item.time || 0
    const minutes = Math.floor(timeMs / 60000)
    const seconds = ((timeMs % 60000) / 1000).toFixed(2)
    const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.padStart(5, '0')}`
    return `[${timestamp}]${item.text || ''}`
  })

  return lrcLines.join('\n')
}

function parseNameAndSinger(baseName, common) {
  let name = common.title || ''
  let singer = common.artist || ''

  if (name || singer) {
    return { name, singer: singer || '未知艺术家' }
  }

  const dashIndex = baseName.lastIndexOf(' - ')
  if (dashIndex > 0) {
    return {
      name: baseName.substring(0, dashIndex).trim(),
      singer: baseName.substring(dashIndex + 3).trim()
    }
  }

  return { name: baseName, singer: '未知艺术家' }
}

function extractLyrics(common, nativeTags) {
  // 1. 优先从 common.syllableLyrics 获取（SYLT 同步歌词）
  if (Array.isArray(common.syllableLyrics) && common.syllableLyrics.length > 0) {
    console.log('[元数据] 找到 syllableLyrics (SYLT 格式)')
    return convertSyllableToLrc(common.syllableLyrics)
  }

  // 2. 从 common.lyrics 获取（未同步歌词或已转换的歌词）
  if (common.lyrics) {
    if (typeof common.lyrics === 'string' && common.lyrics.trim()) {
      console.log('[元数据] 找到 common.lyrics (字符串)')
      return common.lyrics.trim()
    }
    
    if (Array.isArray(common.lyrics) && common.lyrics.length > 0) {
      const firstItem = common.lyrics[0]
      if (typeof firstItem === 'string') {
        return common.lyrics.join('\n')
      }
      if (typeof firstItem === 'object' && firstItem !== null && firstItem.time !== undefined && firstItem.text !== undefined) {
        return convertSyllableToLrc(common.lyrics)
      }
    }
  }

  // 3. 从原生标签中提取
  if (nativeTags) {
    const nativeLyrics = extractLyricsFromNativeTags(nativeTags)
    if (nativeLyrics) return nativeLyrics
  }

  return null
}

/**
 * 获取音频文件的元数据（用于导入时保存到数据库）
 */
export const getAudioMetadata = async (filePath) => {
  try {
    const metadata = await parseFile(filePath, { skipCovers: true })
    const common = metadata.common || {}
    const format = metadata.format || {}
    const nativeTags = metadata.native || {}

    const baseName = path.basename(filePath, path.extname(filePath))
    const { name, singer } = parseNameAndSinger(baseName, common)

    const metaInfo = {
      title: common.title || name,
      artist: common.artist || singer,
      album: common.album || '',
      albumArtist: common.albumartist || '',
      year: common.year ? String(common.year) : '',
      genre: common.genre ? common.genre.join(', ') : '',
      track: common.track ? (common.track.no || '') : '',
      disc: common.disk ? (common.disk.no || '') : '',
      composer: common.composer ? common.composer.join(', ') : '',
      duration: format.duration,
      bitrate: format.bitrate,
      sampleRate: format.sampleRate,
      channels: format.numberOfChannels,
      codec: format.codec || format.container || '',
      fileSize: fs.statSync(filePath).size,
      container: format.container || ''
    }

    let lyrics = extractLyrics(common, nativeTags)

    if (lyrics && typeof lyrics !== 'string') {
      console.log('[元数据] 歌词不是字符串，尝试转换:', typeof lyrics)
      try {
        lyrics = String(lyrics)
      } catch {
        lyrics = null
      }
    }

    if (lyrics && typeof lyrics === 'string') {
      console.log('[元数据] 成功提取内嵌歌词，长度:', lyrics.length)
    }

    return {
      success: true,
      data: {
        name,
        singer,
        artist: singer,
        album: common.album || '',
        duration: formatShortDuration(format.duration),
        type: isVideoFile(filePath) ? 1 : 0,
        meta: JSON.stringify(metaInfo),
        lyrics // 添加歌词字段
      }
    }
  } catch (error) {
    console.error('解析音频元数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取音频文件的封面图片
 * @param {string} filePath - 音频文件路径
 * @returns {Object} { success: boolean, data?: string (base64 data URL), error?: string }
 */
export const getAudioCover = async (filePath) => {
  try {
    const metadata = await parseFile(filePath, { skipCovers: false })
    const common = metadata.common || {}

    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0]
      // 转换为 base64 data URL
      // pic.data 可能是 Uint8Array 或 Buffer, 使用 Buffer.from 确保兼容
      const buffer = Buffer.isBuffer(pic.data) ? pic.data : Buffer.from(pic.data)
      const base64 = buffer.toString('base64')
      const mimeType = pic.format || 'image/jpeg'
      return {
        success: true,
        data: `data:${mimeType};base64,${base64}`
      }
    }

    return {
      success: false,
      error: '无封面图片'
    }
  } catch (error) {
    console.error('获取封面图片失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取音频文件的详细信息（MediaInfo 风格）
 */
export const getAudioDetailedInfo = async (filePath) => {
  try {
    const metadata = await parseFile(filePath, { skipCovers: false })
    const common = metadata.common || {}
    const format = metadata.format || {}
    const stats = fs.statSync(filePath)

    const ext = path.extname(filePath).toLowerCase()
    const dirName = path.dirname(filePath)
    const fileName = path.basename(filePath)
    const baseName = path.basename(filePath, ext)

    // 判断是否有封面图片
    const hasImage = common.picture && common.picture.length > 0
    let imageInfo = null

    if (hasImage) {
      const pic = common.picture[0]
      imageInfo = {
        format: pic.format || 'Unknown',
        width: '-', // music-metadata 不提供图片尺寸
        height: '-',
        colorSpace: '-',
        chromaSubsampling: '-',
        bitDepth: '-',
        compressionMode: 'Lossy',
        streamSize: formatFileSize(pic.data?.length || 0)
      }
    }

    // General 信息
    const generalInfo = {
      completeName: filePath,
      folder: dirName,
      fileName: fileName,
      extension: ext.slice(1).toUpperCase(),
      format: format.container || ext.slice(1).toUpperCase(),
      fileSize: formatFileSize(stats.size),
      duration: formatDuration(format.duration),
      overallBitRate: formatBitrate(format.bitrate),
      writingLibrary: common.encoder || format.tool || '-'
    }

    // Audio Tags 信息
    const tagsInfo = {
      title: common.title || baseName,
      artist: common.artist || '-',
      artists: common.artists || [],
      album: common.album || '-',
      albumArtist: common.albumartist || '-',
      track: common.track || null,
      disc: common.disk || null,
      year: common.year || '-',
      date: common.date || '-',
      genre: common.genre ? common.genre.join(', ') : '-',
      composer: common.composer || [],
      lyricist: common.lyricist || [],
      conductor: common.conductor || [],
      producer: common.producer || [],
      publisher: common.publisher || '-',
      label: common.label || '-',
      copyright: common.copyright || '-',
      comment: common.comment ? (Array.isArray(common.comment) ? common.comment.join(' ') : common.comment) : '-',
      encoder: common.encoder || '-',
      bpm: common.bpm || '-',
      isrc: common.isrc || [],
      barcode: common.barcode || '-'
    }

    // Audio 流信息
    const audioInfo = {
      format: format.container || ext.slice(1).toUpperCase(),
      formatInfo: format.codecProfile || '-',
      codec: format.codec || '-',
      codecProfile: format.codecProfile || '-',
      commercialName: getCommercialName(format),
      duration: formatDuration(format.duration),
      bitRate: formatBitrate(format.bitrate),
      bitRateMode: format.bitrate ? 'Constant' : 'Variable',
      channels: format.numberOfChannels ? `${format.numberOfChannels} channels` : '-',
      channelLayout: getChannelLayout(format.numberOfChannels),
      samplingRate: formatSampleRate(format.sampleRate),
      frameRate: format.sampleRate ? `${Math.round(format.sampleRate / 1152)} FPS` : '-',
      bitDepth: format.bitsPerSample ? `${format.bitsPerSample} bits` : '-',
      compressionMode: format.lossless ? 'Lossless' : 'Lossy',
      streamSize: format.bitrate && format.duration
        ? formatFileSize((format.bitrate / 8) * format.duration)
        : '-',
      replayGain: format.trackGain ? `${format.trackGain.toFixed(2)} dB` : '-',
      albumReplayGain: format.albumGain ? `${format.albumGain.toFixed(2)} dB` : '-'
    }

    return {
      success: true,
      data: {
        general: generalInfo,
        tags: tagsInfo,
        audio: audioInfo,
        image: imageInfo,
        video: null,
        hasImage,
        hasVideo: false
      }
    }
  } catch (error) {
    console.error('获取音频详细信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取商业名称（用于音频质量描述)
 */
const getCommercialName = (format) => {
  if (!format) return '-'

  const codec = (format.codec || '').toLowerCase()
  const container = (format.container || '').toLowerCase()

  if (format.lossless) {
    if (container.includes('flac')) return 'FLAC'
    if (container.includes('alac')) return 'ALAC'
    if (codec.includes('pcm')) return 'PCM'
    return 'Lossless'
  }

  // 有损格式
  const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : 0
  if (bitrate >= 320) return 'MP3 / Extreme'
  if (bitrate >= 256) return 'MP3 / High'
  if (bitrate >= 192) return 'MP3 / Standard'

  return format.codec || format.container || '-'
}

/**
 * 获取声道布局描述
 */
const getChannelLayout = (channels) => {
  if (!channels) return '-'
  const layouts = {
    1: 'Mono',
    2: 'Stereo',
    3: '2.1',
    6: '5.1',
    8: '7.1'
  }
  return layouts[channels] || `${channels} channels`
}

/**
 * 写入音频文件元数据（使用 FFmpeg）
 * @param {string} filePath - 文件路径
 * @param {object} metadata - 元数据 { title?, artist?, album? }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const writeMetadata = (filePath, metadata) => {
  return new Promise((resolve) => {
    // 动态导入 ffmpeg（ESM 模块）
    import('fluent-ffmpeg').then((ffmpegModule) => {
      const ffmpeg = ffmpegModule.default
      const ext = path.extname(filePath)
      const tempPath = filePath.replace(ext, `.temp${ext}`)

      let cmd = ffmpeg(filePath)

      // 添加元数据
      if (metadata.title) {
        cmd = cmd.outputOptions(`-metadata`, `title=${metadata.title}`)
      }
      if (metadata.artist) {
        cmd = cmd.outputOptions(`-metadata`, `artist=${metadata.artist}`)
      }
      if (metadata.album) {
        cmd = cmd.outputOptions(`-metadata`, `album=${metadata.album}`)
      }

      cmd
        .outputOptions('-codec', 'copy')  // 不重编码，直接复制流
        .output(tempPath)
        .on('end', () => {
          try {
            // 用临时文件替换原文件
            fs.unlinkSync(filePath)
            fs.renameSync(tempPath, filePath)
            resolve({ success: true })
          } catch (err) {
            resolve({ success: false, error: `文件替换失败: ${err.message}` })
          }
        })
        .on('error', (err) => {
          // 清理临时文件
          if (fs.existsSync(tempPath)) {
            try {
              fs.unlinkSync(tempPath)
            } catch {
              // 忽略清理错误
            }
          }
          resolve({ success: false, error: err.message })
        })
        .run()
    }).catch((err) => {
      resolve({ success: false, error: `FFmpeg 加载失败: ${err.message}` })
    })
  })
}
