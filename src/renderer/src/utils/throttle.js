/**
 * 节流工具函数
 */

/**
 * 创建节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 节流延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay) {
  let timer = null

  return (...args) => {
    if (timer) return

    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}

/**
 * 创建防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 防抖延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay) {
  let timer = null

  return (...args) => {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}
