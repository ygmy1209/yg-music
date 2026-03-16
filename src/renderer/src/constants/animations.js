/**
 * 动画相关常量
 * 定义 animate.css 弹入动画列表
 */

// 可用的弹入动画列表
export const IN_ANIMATIONS = [
  'animate__fadeIn',
  'animate__fadeInDown',
  'animate__fadeInUp',
  'animate__zoomIn',
  'animate__bounceIn',
  'animate__slideInDown',
  'animate__flipInX'
]

// 动画持续时间（毫秒）
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 400,
  SLOW: 600,
  VERY_SLOW: 1000
}

// 遮罩过渡时间（毫秒）
export const OVERLAY_TRANSITION_DURATION = 400

/**
 * 随机选择一个弹入动画
 * @returns {string} 动画类名
 */
export function pickRandomAnimation() {
  const randomIndex = Math.floor(Math.random() * IN_ANIMATIONS.length)
  return IN_ANIMATIONS[randomIndex]
}

/**
 * 计算动画类名
 * @param {boolean} showAnimation - 是否显示动画
 * @param {boolean} randomAnimation - 是否随机动画
 * @param {string} currentAnimation - 当前动画类名
 * @returns {string} 完整的动画类名
 */
export function getAnimationClass(showAnimation, randomAnimation, currentAnimation) {
  if (!showAnimation) return ''
  if (!randomAnimation) return 'animate__animated animate__fadeIn'
  return `animate__animated ${currentAnimation}`
}
