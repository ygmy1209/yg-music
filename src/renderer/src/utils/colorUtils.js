/**
 * 颜色转换工具函数
 */

/**
 * RGB 转 HSL
 * @param {number} r - 红色值 (0-255)
 * @param {number} g - 绿色值 (0-255)
 * @param {number} b - 蓝色值 (0-255)
 * @returns {[number, number, number]} HSL 值 [hue(0-360), saturation(0-100), lightness(0-100)]
 */
export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)]
}

/**
 * 从图片中提取主题色并更新 CSS 变量
 * @param {string|null} imgSrc - 图片 URL 或 base64
 * @param {Object} options - 配置选项
 * @param {Object} options.themeRgb - 存储 RGB 值的响应式对象
 * @param {string} options.defaultColor - 默认颜色
 */
export function updateThemeColor(imgSrc, options = {}) {
  const { themeRgb, defaultColor = '#FF6699' } = options
  const defaultRgb = { r: 255, g: 102, b: 153 }

  if (!imgSrc) {
    document.documentElement.style.setProperty('--active-primary-color', defaultColor)
    document.documentElement.style.setProperty('--active-primary-rgb', '255, 102, 153')
    document.documentElement.style.setProperty(
      '--active-accent-glow',
      'rgba(255, 102, 153, 0.3)'
    )
    if (themeRgb) {
      themeRgb.value = { ...defaultRgb }
    }
    return
  }

  const img = new Image()
  img.src = imgSrc
  img.crossOrigin = 'Anonymous'

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 50
      canvas.height = 50
      ctx.drawImage(img, 0, 0, 50, 50)

      const imageData = ctx.getImageData(10, 10, 30, 30).data
      let r = 0
      let g = 0
      let b = 0
      let count = 0

      // 采样并过滤过暗/过亮的像素
      for (let i = 0; i < imageData.length; i += 4) {
        const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3
        if (brightness > 30 && brightness < 220) {
          r += imageData[i]
          g += imageData[i + 1]
          b += imageData[i + 2]
          count++
        }
      }

      if (count > 0) {
        r = Math.floor(r / count)
        g = Math.floor(g / count)
        b = Math.floor(b / count)

        const hsl = rgbToHsl(r, g, b)
        const color = `hsl(${hsl[0]}, ${Math.min(hsl[1] + 20, 80)}%, ${Math.max(hsl[2], 55)}%)`

        document.documentElement.style.setProperty('--active-primary-color', color)
        document.documentElement.style.setProperty('--active-primary-rgb', `${r}, ${g}, ${b}`)
        document.documentElement.style.setProperty(
          '--active-accent-glow',
          `rgba(${r}, ${g}, ${b}, 0.3)`
        )

        if (themeRgb) {
          themeRgb.value = { r, g, b }
        }

        console.log('[主题] 颜色更新:', color)
      }
    } catch (e) {
      console.warn('[主题] 取色失败:', e)
    }
  }

  img.onerror = () => {
    console.warn('[主题] 图片加载失败')
  }
}
