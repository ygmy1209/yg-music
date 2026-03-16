/**
 * FFmpeg 工具模块
 * 用于获取音视频文件的元数据（主要用于视频文件）
 */

import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { registerProcess } from './processManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========== 初始化 FFmpeg 路径 ==========

const getRealPath = (originalPath) => {
  if (originalPath.includes('app.asar')) {
    return originalPath.replace('app.asar', 'app.asar.unpacked')
  }
  return originalPath
}

const realFfmpegPath = getRealPath(ffmpegPath.path)
const realFfprobePath = getRealPath(ffprobePath.path)

ffmpeg.setFfmpegPath(realFfmpegPath)
ffmpeg.setFfprobePath(realFfprobePath)

console.log('FFmpeg Path:', realFfmpegPath)
console.log('FFprobe Path:', realFfprobePath)

// ========== 工具函数 ==========

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

const formatShortDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return ''
  if (bytes < 1024) return bytes + ' Bytes'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KiB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MiB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GiB'
}

const formatBitrate = (bps) => {
  if (!bps || isNaN(bps)) return ''
  return Math.round(bps / 1000) + ' kb/s'
}

const formatSampleRate = (hz) => {
  if (!hz || isNaN(hz)) return ''
  if (hz >= 1000) {
    return (hz / 1000).toFixed(1) + ' kHz'
  }
  return hz + ' Hz'
}

const getChannelLayout = (channels) => {
  if (!channels) return '-'
  const layouts = { 1: 'Mono', 2: 'Stereo', 6: '5.1', 8: '7.1' }
  return layouts[channels] || `${channels} channels`
}

// ========== 元数据获取 ==========

/**
 * 获取视频文件的元数据（用于导入时保存到数据库）
 */
export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(filePath)
    registerProcess(command)

    command.ffprobe((err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      try {
        const format = metadata.format || {}
        const streams = metadata.streams || []
        const audioStream = streams.find(s => s.codec_type === 'audio')
        const videoStream = streams.find(s => s.codec_type === 'video')
        const tags = format.tags || {}

        const result = {
          name: tags.title || path.basename(filePath, path.extname(filePath)),
          singer: tags.artist || tags.album_artist || '未知艺术家',
          album: tags.album || '',
          duration: formatShortDuration(format.duration),
          type: 1,
          meta: JSON.stringify({
            title: tags.title,
            artist: tags.artist,
            album: tags.album,
            duration: format.duration,
            bitrate: format.bit_rate,
            sampleRate: audioStream?.sample_rate,
            channels: audioStream?.channels,
            codec: audioStream?.codec_name,
            videoCodec: videoStream?.codec_name,
            width: videoStream?.width,
            height: videoStream?.height,
            fileSize: format.size
          })
        }

        resolve(result)
      } catch (parseError) {
        reject(parseError)
      }
    })
  })
}

/**
 * 检查文件是否为支持的音视频格式
 */
export const isSupportedMedia = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const supportedExts = [
    '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a', '.ape', '.alac',
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'
  ]
  return supportedExts.includes(ext)
}

/**
 * 获取视频文件的详细信息（MediaInfo 风格）
 */
export const getVideoDetailedInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(filePath)
    registerProcess(command)

    command.ffprobe((err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      try {
        const format = metadata.format || {}
        const streams = metadata.streams || []
        const tags = format.tags || {}
        const stats = fs.statSync(filePath)

        const ext = path.extname(filePath).toLowerCase()
        const dirName = path.dirname(filePath)
        const fileName = path.basename(filePath)
        const baseName = path.basename(filePath, ext)

        // 查找流
        const videoStream = streams.find(s => s.codec_type === 'video')
        const audioStream = streams.find(s => s.codec_type === 'audio')

        // 判断视频是否为真正的视频（不是封面）
        const isRealVideo = videoStream && videoStream.width > 0 && videoStream.height > 0 &&
          (videoStream.duration > 30 || !videoStream.duration)

        // General 信息
        const generalInfo = {
          completeName: filePath,
          folder: dirName,
          fileName: fileName,
          extension: ext.slice(1).toUpperCase(),
          format: format.format_long_name || format.format_name || '-',
          fileSize: formatFileSize(stats.size),
          duration: formatDuration(format.duration),
          overallBitRate: formatBitrate(format.bit_rate),
          writingLibrary: tags.encoder || '-'
        }

        // Tags 信息
        const tagsInfo = {
          title: tags.title || baseName,
          artist: tags.artist || '-',
          artists: tags.artist ? [tags.artist] : [],
          album: tags.album || '-',
          albumArtist: tags.album_artist || '-',
          track: tags.track ? { no: parseInt(tags.track), of: null } : null,
          disc: tags.disc ? { no: parseInt(tags.disc), of: null } : null,
          year: tags.year || tags.date || '-',
          date: tags.date || '-',
          genre: tags.genre || '-',
          composer: tags.composer ? [tags.composer] : [],
          lyricist: [],
          conductor: [],
          producer: [],
          publisher: '-',
          label: '-',
          copyright: tags.copyright || '-',
          comment: tags.comment || '-',
          encoder: tags.encoder || '-',
          bpm: '-',
          isrc: [],
          barcode: '-'
        }

        // Video 流信息
        let videoInfo = null
        if (videoStream) {
          videoInfo = {
            format: videoStream.codec_long_name || videoStream.codec_name || '-',
            formatInfo: '-',
            codec: videoStream.codec_name || '-',
            codecProfile: videoStream.profile || '-',
            duration: formatDuration(videoStream.duration || format.duration),
            bitRate: formatBitrate(videoStream.bit_rate),
            width: videoStream.width ? `${videoStream.width} pixels` : '-',
            height: videoStream.height ? `${videoStream.height} pixels` : '-',
            aspectRatio: videoStream.display_aspect_ratio || '-',
            frameRateMode: '-',
            frameRate: videoStream.r_frame_rate || '-',
            colorSpace: videoStream.pix_fmt || '-',
            chromaSubsampling: '-',
            bitDepth: videoStream.bits_per_raw_sample ? `${videoStream.bits_per_raw_sample} bits` : '-',
            scanType: videoStream.field_order === 'progressive' ? 'Progressive' : 'Interlaced',
            compressionMode: 'Lossy',
            streamSize: videoStream.bit_rate && (videoStream.duration || format.duration)
              ? formatFileSize((videoStream.bit_rate / 8) * (videoStream.duration || format.duration))
              : '-',
            writingLibrary: tags.encoder || '-',
            encodingSettings: '-'
          }
        }

        // Audio 流信息
        let audioInfo = null
        if (audioStream) {
          audioInfo = {
            format: audioStream.codec_long_name || audioStream.codec_name || '-',
            formatInfo: '-',
            codec: audioStream.codec_name || '-',
            codecProfile: audioStream.profile || '-',
            commercialName: audioStream.codec_name?.toUpperCase() || '-',
            duration: formatDuration(audioStream.duration || format.duration),
            bitRate: formatBitrate(audioStream.bit_rate || format.bit_rate),
            bitRateMode: audioStream.bit_rate ? 'Constant' : 'Variable',
            channels: audioStream.channels ? `${audioStream.channels} channels` : '-',
            channelLayout: getChannelLayout(audioStream.channels),
            samplingRate: formatSampleRate(audioStream.sample_rate),
            frameRate: '-',
            bitDepth: audioStream.bits_per_sample ? `${audioStream.bits_per_sample} bits` : '-',
            compressionMode: 'Lossy',
            streamSize: audioStream.bit_rate && (audioStream.duration || format.duration)
              ? formatFileSize((audioStream.bit_rate / 8) * (audioStream.duration || format.duration))
              : '-',
            replayGain: '-',
            albumReplayGain: '-'
          }
        }

        resolve({
          success: true,
          data: {
            general: generalInfo,
            tags: tagsInfo,
            audio: audioInfo,
            video: videoInfo,
            image: null,
            hasVideo: isRealVideo,
            hasImage: !isRealVideo && videoStream ? true : false
          }
        })
      } catch (parseError) {
        reject(parseError)
      }
    })
  })
}

export default {
  getVideoMetadata,
  getVideoDetailedInfo,
  isSupportedMedia
}
