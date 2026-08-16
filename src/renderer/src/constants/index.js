/**
 * 全局常量定义
 * 统一管理魔法数字、枚举值等
 */

// ========== 列表相关 ==========
export const LIST = {
  // 批量操作并发数
  BATCH_CONCURRENCY: 5
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
