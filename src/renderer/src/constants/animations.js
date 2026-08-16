/**
 * 动画相关常量
 * 定义 animate.css 弹入动画列表
 */

// 可用的弹入动画列表
const IN_ANIMATIONS = [
  'animate__fadeIn',
  'animate__fadeInDown',
  'animate__fadeInUp',
  'animate__zoomIn',
  'animate__bounceIn',
  'animate__slideInDown',
  'animate__flipInX'
]

/**
 * 随机选择一个弹入动画
 * @returns {string} 动画类名
 */
export function pickRandomAnimation() {
  const randomIndex = Math.floor(Math.random() * IN_ANIMATIONS.length)
  return IN_ANIMATIONS[randomIndex]
}
