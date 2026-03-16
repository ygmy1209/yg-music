/**
 * 全局常量定义
 * 统一管理魔法数字、枚举值等
 */

// ========== 歌曲类型 ==========
export const SONG_TYPE = {
  MUSIC: 0,
  VIDEO: 1
}

// ========== 动画相关 ==========
export const ANIMATION = {
  // 动画时长（毫秒）
  DURATION_SHORT: 200,
  DURATION_NORMAL: 400,
  DURATION_LONG: 600,
  DURATION_VERY_LONG: 1000,

  // 遮罩过渡时间
  OVERLAY_TRANSITION: 400,

  // 高亮持续时间
  HIGHLIGHT_DURATION: 3000
}

// ========== 列表相关 ==========
export const LIST = {
  // 批量操作并发数
  BATCH_CONCURRENCY: 5,

  // 分页大小
  PAGE_SIZE: 50,

  // 虚拟滚动缓冲区大小
  VIRTUAL_SCROLL_BUFFER: 10
}

// ========== 播放器相关 ==========
export const PLAYER = {
  // 默认音量
  DEFAULT_VOLUME: 1,

  // 默认播放速率
  DEFAULT_PLAYBACK_RATE: 1,

  // 进度更新间隔（毫秒）
  PROGRESS_UPDATE_INTERVAL: 1000,

  // 歌词滚动偏移量
  LYRIC_SCROLL_OFFSET: 0.5
}

// ========== UI 相关 ==========
export const UI = {
  // 窗口尺寸选项
  WINDOW_SIZES: ['更小', '小', '中', '大', '更大', '超大', '巨大'],

  // 字体大小选项
  FONT_SIZES: ['更小', '小', '标准', '大', '更大', '非常大'],

  // 默认主题色
  DEFAULT_THEME_COLOR: '#79e3f1',

  // 主题色列表
  THEME_COLORS: [
    { name: '默认青色', value: '#79e3f1' },
    { name: '绿色', value: '#52c41a' },
    { name: '蓝色', value: '#1890ff' },
    { name: '紫色', value: '#722ed1' },
    { name: '粉色', value: '#eb2f96' },
    { name: '橙色', value: '#fa8c16' }
  ]
}

// ========== 设置键名 ==========
export const SETTING_KEYS = {
  // 基本设置
  SHOW_ANIMATION: 'common.showAnimation',
  SHOW_RANDOM_ANIMATION: 'common.showRandomAnimation',
  TRAY_ENABLE: 'tray.enable',
  THEME_COLOR: 'theme.color',
  WINDOW_SIZE: 'common.windowSize',
  FONT_SIZE: 'common.fontSize',
  FONT_FAMILY: 'common.fontFamily',

  // 播放设置
  STARTUP_AUTO_PLAY: 'player.startupAutoPlay',
  SAVE_PLAY_TIME: 'player.isSavePlayTime',
  AUTO_SKIP_ON_ERROR: 'player.autoSkipOnError',
  SHOW_TASK_PROGRESS: 'player.isShowTaskProgress',
  MEDIA_DEVICE_ID: 'player.mediaDeviceId',
  VOLUME: 'player.volume',
  IS_MUTE: 'player.isMute',
  PLAYBACK_RATE: 'player.playbackRate',

  // 播放详情页设置
  DRAG_LYRIC: 'playDetail.dragLyric',
  LYRIC_ALIGN: 'playDetail.lyricAlign',

  // 列表设置
  ADD_SONG_POSITION: 'list.addSongPosition'
}

// ========== 歌词对齐方式 ==========
export const LYRIC_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right'
}

// ========== 添加歌曲位置 ==========
export const ADD_SONG_POSITION = {
  TOP: 'top',
  BOTTOM: 'bottom'
}
