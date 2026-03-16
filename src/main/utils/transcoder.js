/**
 * transcoder.js - 视频/音频转码模块
 *
 * 用于检测和转码不被 Chromium 支持的音频编码格式
 * 主要解决 E-AC-3 (Dolby Digital Plus) 等格式在 Electron 中无法播放的问题
 */

import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { registerProcess } from './processManager.js'

// 获取 ffmpeg 和 ffprobe 的路径
let ffmpegPath = null
let ffprobePath = null
let initPromise = null

// 异步初始化函数
async function initPaths() {
  try {
    // 尝试加载 @ffmpeg-installer/ffmpeg
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg')
    ffmpegPath = ffmpegInstaller.default?.path || ffmpegInstaller.default
    console.log('[转码器] ffmpeg 路径:', ffmpegPath)

    // 尝试加载 @ffprobe-installer/ffprobe
    const ffprobeInstaller = await import('@ffprobe-installer/ffprobe')
    ffprobePath = ffprobeInstaller.default?.path || ffprobeInstaller.default
    console.log('[转码器] ffprobe 路径:', ffprobePath)
  } catch (e) {
    console.warn('[转码器] 无法加载 ffmpeg/ffprobe 路径:', e.message)
  }
}

// 立即开始初始化，并保存 Promise
initPromise = initPaths()

/**
 * 确保初始化完成
 * 在使用 ffmpeg/ffprobe 之前调用此函数
 */
async function ensureInitialized() {
  if (initPromise) {
    await initPromise
    initPromise = null  // 只等待一次
  }
}

/**
 * Chromium 不支持的音频编码格式列表
 * 这些格式需要转码为 AAC 后才能播放
 */
const UNSUPPORTED_AUDIO_CODECS = [
  'eac3',      // E-AC-3 (Dolby Digital Plus)
  'ac3',       // AC-3 (Dolby Digital)
  'dts',       // DTS
  'dtshd',     // DTS-HD
  'truehd',    // Dolby TrueHD
  'mlp',       // MLP (Dolby TrueHD 的基础)
  'opus',      // Opus (在某些容器中可能不支持)
  'vorbis',    // Vorbis (在 MP4 容器中不支持)
  'alac',      // ALAC (Apple Lossless)
  'pcm_s16le', // PCM 格式
  'pcm_s24le',
  'pcm_s32le'
]

/**
 * 获取转码缓存目录
 * 转码后的文件会存储在这里
 * @returns {string} 缓存目录路径
 */
function getTranscodeCacheDir() {
  const userDataPath = app.getPath('userData')
  const cacheDir = path.join(userDataPath, 'transcode-cache')

  // 确保目录存在
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  return cacheDir
}

/**
 * 生成转码文件的缓存路径
 * 使用原文件的修改时间和大小作为缓存键，避免重复转码
 * @param {string} filePath - 原文件路径
 * @returns {string|null} 缓存文件路径，如果文件不存在则返回 null
 */
function getCacheFilePath(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn('[转码器] 文件不存在:', filePath)
      return null
    }
    const stats = fs.statSync(filePath)
    const fileName = path.basename(filePath, path.extname(filePath))
    // 使用文件大小和修改时间作为缓存键
    // mtimeMs 是毫秒时间戳（数字类型），取整秒
    const mtimeSeconds = Math.floor(stats.mtimeMs / 1000)
    const cacheKey = `${fileName}_${stats.size}_${mtimeSeconds}`
    return path.join(getTranscodeCacheDir(), `${cacheKey}.mkv`)
  } catch (error) {
    console.error('[转码器] 获取缓存路径失败:', error.message)
    return null
  }
}

/**
 * 使用 ffprobe 获取媒体文件的编码信息
 * @param {string} filePath - 媒体文件路径
 * @returns {Promise<Object>} 包含音频、视频编码信息的对象
 */
export async function probeMedia(filePath) {
  // 确保初始化完成
  await ensureInitialized()

  return new Promise((resolve, reject) => {
    console.log('[转码器] probeMedia 开始, 文件:', filePath)

    // 先设置全局的 ffprobe 路径
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath)
      console.log('[转码器] 设置 ffprobe 路径:', ffprobePath)
    }
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath)
      console.log('[转码器] 设置 ffmpeg 路径:', ffmpegPath)
    }

    const command = ffmpeg(filePath)
    registerProcess(command)

    command.ffprobe((err, data) => {
      if (err) {
        console.error('[转码器] ffprobe 分析失败:', err.message)
        reject(err)
        return
      }

      console.log('[转码器] ffprobe 原始数据:', JSON.stringify(data, null, 2).substring(0, 1000))

      const result = {
        duration: data.format?.duration || 0,
        audioCodec: null,
        videoCodec: null,
        audioSupported: true,
        needsTranscode: false,
        streams: []
      }

      // 分析流信息
      if (data.streams) {
        for (const stream of data.streams) {
          const streamInfo = {
            type: stream.codec_type,
            codec: stream.codec_name,
            channels: stream.channels,
            sampleRate: stream.sample_rate
          }
          result.streams.push(streamInfo)
          console.log('[转码器] 发现流:', streamInfo)

          if (stream.codec_type === 'audio') {
            result.audioCodec = stream.codec_name
            // 检查音频编码是否支持
            const codecLower = stream.codec_name.toLowerCase()
            console.log('[转码器] 检查音频编码:', codecLower, '在不支持列表中:', UNSUPPORTED_AUDIO_CODECS.includes(codecLower))

            if (UNSUPPORTED_AUDIO_CODECS.includes(codecLower)) {
              result.audioSupported = false
              result.needsTranscode = true
            }
          } else if (stream.codec_type === 'video') {
            result.videoCodec = stream.codec_name
          }
        }
      }

      console.log('[转码器] 媒体分析结果:', {
        文件: path.basename(filePath),
        音频编码: result.audioCodec,
        视频编码: result.videoCodec,
        需要转码: result.needsTranscode
      })

      resolve(result)
    })
  })
}

/**
 * 转码视频文件
 * 将音频流转码为 AAC，视频流保持不变
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径（可选，不提供则使用缓存路径）
 * @param {Function} onProgress - 进度回调函数 (percent) => {}
 * @returns {Promise<string>} 转码后的文件路径
 */
export async function transcodeVideo(inputPath, outputPath = null, onProgress = null) {
  // 确保初始化完成
  await ensureInitialized()

  return new Promise((resolve, reject) => {
    const cachePath = outputPath || getCacheFilePath(inputPath)

    // 如果无法获取缓存路径（文件不存在）
    if (!cachePath) {
      reject(new Error('无法获取缓存路径，文件可能不存在'))
      return
    }

    // 如果缓存文件已存在， 直接返回
    if (fs.existsSync(cachePath)) {
      console.log('[转码器] 使用缓存的转码文件:', cachePath)
      resolve(cachePath)
      return
    }

    console.log('[转码器] 开始转码:', inputPath)
    console.log('[转码器] 输出到:', cachePath)

    // 设置全局的 ffmpeg 和 ffprobe 路径
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath)
    }
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath)
    }

    const command = ffmpeg(inputPath)
    registerProcess(command)

    // 转码参数：
    // -c:v copy: 视频流直接复制，不重新编码
    // -c:a flac: 音频转码为 FLAC 无损格式
    command
      .videoCodec('copy')
      .audioCodec('flac')
      .output(cachePath.replace('.mp4', '.mkv'))

    // 进度回调
    if (onProgress) {
      command.on('progress', (progress) => {
        if (progress.percent) {
          onProgress(Math.round(progress.percent))
        }
      })
    }

    command
      .on('start', (commandLine) => {
        console.log('[转码器] FFmpeg 命令:', commandLine)
      })
      .on('end', () => {
        console.log('[转码器] 转码完成:', cachePath)
        resolve(cachePath)
      })
      .on('error', (err) => {
        console.error('[转码器] 转码失败:', err.message)
        // 清理失败的临时文件
        if (fs.existsSync(cachePath)) {
          try {
            fs.unlinkSync(cachePath)
          } catch (e) {
            // 忽略清理错误
          }
        }
        reject(err)
      })
      .run()
  })
}

/**
 * 检查文件是否需要转码，如果需要则自动转码
 * 这是主要的对外接口
 * @param {string} filePath - 媒体文件路径
 * @param {Function} onProgress - 转码进度回调（可选）
 * @returns {Promise<{path: string, transcoded: boolean}>} 可播放的文件路径和是否进行了转码
 */
export async function ensurePlayable(filePath, onProgress = null) {
  console.log('[转码器] ========== ensurePlayable 开始 ==========')
  console.log('[转码器] 输入文件:', filePath)

  // 确保初始化完成
  await ensureInitialized()

  console.log('[转码器] ffmpeg 路径:', ffmpegPath)
  console.log('[转码器] ffprobe 路径:', ffprobePath)

  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { path: filePath, transcoded: false, error: '文件不存在' }
    }

    // 先分析媒体文件
    console.log('[转码器] 正在分析媒体文件...')
    const probeResult = await probeMedia(filePath)
    console.log('[转码器] 分析结果:', JSON.stringify(probeResult, null, 2))

    // 如果音频编码支持， 直接返回原文件
    if (probeResult.audioSupported) {
      console.log('[转码器] 音频编码支持，无需转码')
      return { path: filePath, transcoded: false, probe: probeResult }
    }

    console.log('[转码器] 检测到不支持的音频编码:', probeResult.audioCodec)

    // 检查缓存
    const cachePath = getCacheFilePath(filePath)
    console.log('[转码器] 缓存路径:', cachePath)

    if (!cachePath) {
      console.log('[转码器] 无法获取缓存路径，返回原文件')
      return { path: filePath, transcoded: false, error: '无法获取缓存路径' }
    }

    if (fs.existsSync(cachePath)) {
      console.log('[转码器] 使用缓存的转码文件')
      return { path: cachePath, transcoded: true, fromCache: true, probe: probeResult }
    }

    // 执行转码
    console.log('[转码器] 开始自动转码...')
    const transcodedPath = await transcodeVideo(filePath, cachePath, onProgress)

    console.log('[转码器] ========== ensurePlayable 完成 ==========')
    return { path: transcodedPath, transcoded: true, fromCache: false, probe: probeResult }
  } catch (error) {
    console.error('[转码器] ensurePlayable 失败:', error.message)
    console.error('[转码器] 错误堆栈:', error.stack)
    // 出错时返回原文件，让播放器尝试播放
    return { path: filePath, transcoded: false, error: error.message }
  }
}

/**
 * 清理转码缓存
 * @param {number} maxAgeDays - 最大缓存天数，超过此天数的缓存会被删除
 */
export function cleanTranscodeCache(maxAgeDays = 30) {
  const cacheDir = getTranscodeCacheDir()
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

  let cleaned = 0
  let totalSize = 0

  try {
    const files = fs.readdirSync(cacheDir)
    for (const file of files) {
      const filePath = path.join(cacheDir, file)
      const stats = fs.statSync(filePath)

      if (now - stats.mtimeMs > maxAgeMs) {
        totalSize += stats.size
        fs.unlinkSync(filePath)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[转码器] 清理了 ${cleaned} 个缓存文件，释放 ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    }
  } catch (error) {
    console.error('[转码器] 清理缓存失败:', error.message)
  }
}

export default {
  probeMedia,
  transcodeVideo,
  ensurePlayable,
  cleanTranscodeCache
}
