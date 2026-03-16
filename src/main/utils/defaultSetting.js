/**
 * 默认应用设置
 * 定义所有设置项的默认值
 */

const defaultSetting = {
  // ========== 基本设置 ==========

  // 显示动画效果
  'common.showAnimation': true,

  // 弹出层随机动画
  'common.showRandomAnimation': true,

  // 关闭窗口时最小化到托盘
  'tray.enable': false,

  // 主题颜色
  'theme.color': '#79e3f1',

  // 窗口尺寸 (0-6: 更小到巨大)
  'common.windowSize': 2,

  // 字体大小 (0-5: 更小到非常大)
  'common.fontSize': 2,

  // 字体
  'common.fontFamily': '',

  // ========== 播放设置 ==========

  // 启动软件后自动播放音乐
  'player.startupAutoPlay': false,

  // 记住播放进度
  'player.isSavePlayTime': true,

  // 播放错误时自动切换歌曲
  'player.autoSkipOnError': false,

  // 在任务栏上显示当前歌曲播放进度
  'player.isShowTaskProgress': true,

  // 音频输出设备ID
  'player.mediaDeviceId': 'default',

  // 音量 (0-1)
  'player.volume': 1,

  // 是否静音
  'player.isMute': false,

  // 播放速率
  'player.playbackRate': 1,

  // ========== 播放详情页设置 ==========

  // 允许通过拖拽歌词调整播放进度
  'playDetail.dragLyric': true,

  // 歌词对齐方式 (left/center/right)
  'playDetail.lyricAlign': 'center',

  // ========== 列表设置 ==========

  // 添加歌曲到列表时的位置 (top/bottom)
  'list.addSongPosition': 'top'
}

export default defaultSetting

/**
 * 合并用户设置与默认设置
 * @param {Object} userSetting - 用户设置
 * @returns {Object} - 合并后的完整设置
 */
export const mergeSetting = (userSetting = {}) => {
  const result = {}
  for (const [key, defaultValue] of Object.entries(defaultSetting)) {
    result[key] = userSetting.hasOwnProperty(key) ? userSetting[key] : defaultValue
  }
  return result
}
