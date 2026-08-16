/**
 * 播放器状态管理
 */

import { ref, computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { formatTime } from '@/utils/formatTime'
import { throttle } from '@/utils/throttle'

export const usePlayerStore = defineStore('player', () => {
  // 播放状态
  const isPlaying = ref(false)

  // 是否正在恢复播放信息（恢复期间不自动播放）
  const isRestoring = ref(false)

  // 播放详情页显示状态
  const showDetail = ref(false)

  // 音量 (0-1)
  const volume = ref(0.7)
  const isMute = ref(false)
  const volumeBeforeMute = ref(0.7)

  // 播放进度
  const playProgress = reactive({
    currentTime: 0,       // 当前播放时间（秒）
    duration: 0,          // 总时长（秒）
    progress: 0,          // 进度比例 (0-1)
    currentTimeStr: '00:00',
    durationStr: '00:00',
  })

  // 播放模式: 'list' 列表循环 | 'single' 单曲循环 | 'random' 随机播放 | 'order' 顺序播放
  const playMode = ref('list')

  // 媒体筛选模式: 'all' 音/视(全部) | 'audio' 仅音乐 | 'video' 仅视频
  const mediaFilter = ref('all')

  // 当前歌曲信息
  const currentSong = ref(null)

  // 播放列表
  const playlist = ref([])

  // 当前播放的歌单 ID
  const currentPlaylistId = ref(null)

  // 当前播放的专辑名称
  const currentAlbumName = ref(null)

  // 当前播放的歌手名称
  const currentSingerName = ref(null)

  // ========== 持久化相关 ==========

  // 节流保存播放信息（5秒内最多保存一次，保留窗口内最后一次调用的参数）
  const throttledSavePlayInfo = throttle(
    async () => {
      await savePlayInfo()
    },
    5000,
    { trailing: true }
  )

  // 保存播放信息
  const savePlayInfo = async () => {
    // 需要有当前歌曲，并且有播放来源（歌单、专辑或歌手）
    if (!currentSong.value || (!currentPlaylistId.value && !currentAlbumName.value && !currentSingerName.value)) return

    const info = {
      songId: currentSong.value.id,       // 当前歌曲 ID
      listId: currentPlaylistId.value,    // 当前歌单 ID
      albumName: currentAlbumName.value,  // 专辑名称
      singerName: currentSingerName.value, // 歌手名称
      index: currentIndex.value,          // 当前索引
      time: playProgress.currentTime,     // 播放进度
      duration: playProgress.duration,    // 总时长
      volume: volume.value,               // 音量
      playMode: playMode.value,           // 播放模式
      mediaFilter: mediaFilter.value      // 媒体筛选模式
    }
    try {
      await window.playInfoAPI.save(info)
      console.log('[Player] 保存播放信息成功:', info.time, '秒')
    } catch (err) {
      console.warn('[Player] 保存播放信息失败:', err)
    }
  }
  // 恢复播放信息
  const restorePlayInfo = async () => {
    try {
      const info = await window.playInfoAPI.get()
      if (!info) return null
      // 恢复音量和播放模式
      if (info.volume !== undefined) {
        volume.value = info.volume
      }
      if (info.playMode) {
        playMode.value = info.playMode
      }
      if (info.mediaFilter) {
        mediaFilter.value = info.mediaFilter
      }
      return info
    } catch (err) {
      console.warn('[Player] 恢复播放信息失败:', err)
      return null
    }
  }
  // 根据保存的信息恢复播放状态
  const restoreFromSavedInfo = async (savedInfo) => {
    if (!savedInfo || !savedInfo.songId) return false
    if (!savedInfo.listId && !savedInfo.albumName && !savedInfo.singerName) return false

    isRestoring.value = true

    try {
      let songs = null
      if (savedInfo.albumName) {
        songs = await window.dbAPI.getSongsByAlbum(savedInfo.albumName)
      } else if (savedInfo.singerName) {
        songs = await window.dbAPI.getSongsBySinger(savedInfo.singerName)
      } else {
        songs = await window.dbAPI.getSongsByPlaylist(savedInfo.listId)
      }

      if (!songs || !songs.length) {
        // 恢复失败也要清除标志，否则后续正常点歌会被误判为“恢复中”而不自动播放
        isRestoring.value = false
        return false
      }

      const convertedSongs = songs.map(song => ({
        id: song.id,
        name: song.name,
        artist: song.singer,
        album: song.album || '',
        duration: song.interval || '',
        type: song.type || 0,
        meta: song.meta
      }))

      let targetIndex = -1
      
      // 1. 先尝试用 index 定位
      if (savedInfo.index >= 0 && savedInfo.index < convertedSongs.length && convertedSongs[savedInfo.index].id === savedInfo.songId) {
        targetIndex = savedInfo.index
      }

      // 2. 遍历查找
      if (targetIndex === -1) {
        targetIndex = convertedSongs.findIndex(s => s.id === savedInfo.songId)
      }

      // 3. 尝试临近歌曲
      if (targetIndex === -1) {
        if (savedInfo.index + 1 < convertedSongs.length) targetIndex = savedInfo.index + 1
        else if (savedInfo.index - 1 >= 0) targetIndex = savedInfo.index - 1
        else {
          isRestoring.value = false
          return false
        }
      }

      // 设置播放来源状态
      currentPlaylistId.value = null
      currentAlbumName.value = null
      currentSingerName.value = null

      if (savedInfo.albumName) {
        currentAlbumName.value = savedInfo.albumName
      } else if (savedInfo.singerName) {
        currentSingerName.value = savedInfo.singerName
      } else {
        currentPlaylistId.value = savedInfo.listId
      }
      
      playlist.value = convertedSongs
      currentSong.value = convertedSongs[targetIndex]

      return { time: savedInfo.time || 0, duration: savedInfo.duration || 0 }
    } catch (error) {
      console.error('[Player] 恢复播放信息失败:', error)
      isRestoring.value = false
      return false
    }
  }

  // 清除恢复标志
  const clearRestoring = () => {
    isRestoring.value = false
  }

  // 更新当前时间
  const setCurrentTime = (time) => {
    playProgress.currentTime = time
    playProgress.currentTimeStr = formatTime(time)
    if (playProgress.duration > 0) {
      playProgress.progress = time / playProgress.duration
    }
  }
  // 更新总时长
  const setDuration = (duration) => {
    playProgress.duration = duration
    playProgress.durationStr = formatTime(duration)
    if (duration > 0) {
      playProgress.progress = playProgress.currentTime / duration
    }
  }
  // 设置进度
  const setProgress = (progress) => {
    playProgress.progress = progress
    if (playProgress.duration > 0) {
      playProgress.currentTime = progress * playProgress.duration
      playProgress.currentTimeStr = formatTime(playProgress.currentTime)
    }
  }
  // 播放/暂停切换
  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
  }
  // 设置播放状态
  const setPlaying = (playing) => {
    isPlaying.value = playing
  }
  // 设置音量
  const setVolume = (val) => {
    volume.value = Math.max(0, Math.min(1, val))
    if (volume.value > 0) {
      isMute.value = false
    }
  }
  // 切换静音
  const toggleMute = () => {
    if (isMute.value) {
      // 取消静音，恢复之前的音量
      isMute.value = false
      volume.value = volumeBeforeMute.value || 0.7
    } else {
      // 静音，保存当前音量
      volumeBeforeMute.value = volume.value
      isMute.value = true
    }
  }
  // 切换播放模式
  const togglePlayMode = () => {
    const modes = ['list', 'single', 'random', 'order']
    const currentIndex = modes.indexOf(playMode.value)
    playMode.value = modes[(currentIndex + 1) % modes.length]
  }
  // 打开播放详情页
  const openDetail = () => {
    showDetail.value = true
  }
  // 关闭播放详情页
  const closeDetail = () => {
    showDetail.value = false
  }
  // 设置当前歌曲
  const setCurrentSong = (song) => {
    currentSong.value = song
  }
  // 设置播放列表
  const setPlaylist = (songs) => {
    playlist.value = songs
  }

  // 设置当前播放的歌单 ID
  const setCurrentPlaylistId = (id) => {
    currentPlaylistId.value = id
    if (id) {
      currentAlbumName.value = null
      currentSingerName.value = null
    }
  }

  // 设置当前播放的专辑名称
  const setCurrentAlbumName = (name) => {
    currentAlbumName.value = name
    if (name) {
      currentPlaylistId.value = null
      currentSingerName.value = null
    }
  }

  // 设置当前播放的歌手名称
  const setCurrentSingerName = (name) => {
    currentSingerName.value = name
    if (name) {
      currentPlaylistId.value = null
      currentAlbumName.value = null
    }
  }
  // 获取当前歌曲在列表中的索引
  const currentIndex = computed(() => {
    if (!currentSong.value || !playlist.value.length) return -1
    return playlist.value.findIndex(s => s.id === currentSong.value.id)
  })

  // 筛选后的播放列表（根据媒体筛选模式）
  const filteredPlaylist = computed(() => {
    if (mediaFilter.value === 'all') return playlist.value
    const targetType = mediaFilter.value === 'audio' ? 0 : 1
    return playlist.value.filter(song => song.type === targetType)
  })

  // 筛选后的当前索引（在筛选列表中的位置）
  const filteredIndex = computed(() => {
    if (!currentSong.value || !filteredPlaylist.value.length) return -1
    return filteredPlaylist.value.findIndex(s => s.id === currentSong.value.id)
  })

  // 设置媒体筛选模式（返回 { success: boolean, error?: string }）
  const setMediaFilter = (mode) => {
    // 如果是切换到音频或视频模式，需要校验歌单中是否有对应类型
    if (mode !== 'all') {
      const targetType = mode === 'audio' ? 0 : 1
      const hasType = playlist.value.some(song => song.type === targetType)
      if (!hasType) {
        return {
          success: false,
          error: mode === 'audio' ? '歌单中没有音乐哦~' : '歌单中没有视频哦~'
        }
      }
    }

    mediaFilter.value = mode
    // 如果当前歌曲不在筛选后的列表中，自动切换到筛选列表的第一首
    if (filteredIndex.value === -1 && filteredPlaylist.value.length > 0) {
      currentSong.value = filteredPlaylist.value[0]
    }
    return { success: true }
  }
  // 上一首
  const prevSong = () => {
    const list = filteredPlaylist.value
    if (!list.length) return

    let index = filteredIndex.value
    if (index === -1) {
      currentSong.value = list[0]
      return
    }

    if (playMode.value === 'random') {
      currentSong.value = list[Math.floor(Math.random() * list.length)]
      return
    }

    index = (index - 1 + list.length) % list.length
    currentSong.value = list[index]
  }

  // 下一首
  const nextSong = () => {
    const list = filteredPlaylist.value
    if (!list.length) return

    let index = filteredIndex.value
    if (index === -1) {
      currentSong.value = list[0]
      return
    }

    if (playMode.value === 'random') {
      currentSong.value = list[Math.floor(Math.random() * list.length)]
      return
    }

    // 顺序播放到达末尾时停止
    if (playMode.value === 'order' && index === list.length - 1) {
      setPlaying(false)
      return
    }

    index = (index + 1) % list.length
    currentSong.value = list[index]
  }

  // 音量图标
  const volumeIcon = computed(() => {
    if (isMute.value || volume.value === 0) return 'mute'
    if (volume.value < 0.3) return 'low'
    if (volume.value < 0.7) return 'medium'
    return 'high'
  })
  // 播放模式图标
  const playModeIcon = computed(() => {
    const icons = {
      list: 'repeat',      // 列表循环
      single: 'repeat-1',  // 单曲循环
      random: 'shuffle',   // 随机播放
      order: 'list',       // 顺序播放
    }
    return icons[playMode.value]
  })
  // 播放模式文字
  const playModeText = computed(() => {
    const texts = {
      list: '列表循环',
      single: '单曲循环',
      random: '随机播放',
      order: '顺序播放',
    }
    return texts[playMode.value]
  })
  // ========== 监听变化自动保存 ==========
  // 监听播放进度变化（节流保存）
  // 每次进度变化都尝试调用节流函数，节流函数保证 5 秒内最多执行一次
  watch(() => playProgress.currentTime, () => {
    throttledSavePlayInfo()
  })
  // 监听歌曲变化
  watch(currentSong, () => {
    savePlayInfo()
  })
  // 监听播放模式变化
  watch(playMode, () => {
    savePlayInfo()
  })
  // 监听媒体筛选模式变化
  watch(mediaFilter, () => {
    savePlayInfo()
  })
  // 监听音量变化（拖动时会高频触发，走节流避免频繁写盘）
  watch(volume, () => {
    throttledSavePlayInfo()
  })
  // 暂停时立即保存一次精确进度，避免节流窗口导致进度回退
  watch(isPlaying, (playing) => {
    if (!playing) {
      savePlayInfo()
    }
  })

  /**
   * 更新歌曲信息（当编辑当前播放歌曲时调用）
   */
  const updateSongInfo = (songId, updates) => {
    // 更新当前歌曲
    if (currentSong.value?.id === songId) {
      currentSong.value = {
        ...currentSong.value,
        name: updates.name ?? currentSong.value.name,
        artist: updates.singer ?? currentSong.value.artist,
        album: updates.album ?? currentSong.value.album
      }
    }

    // 更新播放列表中的歌曲
    const index = playlist.value.findIndex(s => s.id === songId)
    if (index !== -1) {
      playlist.value[index] = {
        ...playlist.value[index],
        name: updates.name ?? playlist.value[index].name,
        artist: updates.singer ?? playlist.value[index].artist,
        album: updates.album ?? playlist.value[index].album
      }
    }
  }

  return {
    // 状态
    isPlaying,
    isRestoring,
    volume,
    isMute,
    playProgress,
    playMode,
    mediaFilter,
    currentSong,
    playlist,
    showDetail,
    currentPlaylistId,
    currentAlbumName,
    currentSingerName,
    // 计算属性
    volumeIcon,
    playModeIcon,
    playModeText,
    currentIndex,
    filteredPlaylist,
    filteredIndex,
    // 方法
    setCurrentTime,
    setDuration,
    setProgress,
    togglePlay,
    setPlaying,
    setVolume,
    toggleMute,
    togglePlayMode,
    setMediaFilter,
    openDetail,
    closeDetail,
    setCurrentSong,
    setPlaylist,
    setCurrentPlaylistId,
    setCurrentAlbumName,
    setCurrentSingerName,
    prevSong,
    nextSong,
    // 持久化方法
    restorePlayInfo,
    restoreFromSavedInfo,
    clearRestoring,
    // 歌曲信息更新
    updateSongInfo,
  }
})
