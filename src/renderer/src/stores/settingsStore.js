/**
 * 设置状态管理
 * 管理应用的全局设置，通过 IPC 与主进程通信持久化
 */

import { defineStore } from 'pinia'
import { ref, watch, toRaw } from 'vue'
import { UI } from '@/constants'

// 本地默认值（仅在 IPC 不可用时的降级方案）
// 注意：必须与 src/main/utils/defaultSetting.js 保持一致，修改时两处同步
export const localDefaults = {
  'common.showAnimation': true,
  'common.showRandomAnimation': true,
  'tray.enable': false,
  'theme.color': UI.DEFAULT_THEME_COLOR,
  'common.windowSize': 2,
  'common.fontSize': 2,
  'common.fontFamily': '',

  'player.startupAutoPlay': false,
  'player.isSavePlayTime': true,
  'player.autoSkipOnError': false,
  'player.isShowTaskProgress': true,
  'player.mediaDeviceId': 'default',
  'player.volume': 1,
  'player.isMute': false,
  'player.playbackRate': 1,

  'playDetail.dragLyric': true,
  'playDetail.lyricAlign': 'center',

  'list.addSongPosition': 'top'
}

export const useSettingsStore = defineStore('settings', () => {
  // ========== 响应式状态（兼容旧API） ==========

  // 为了兼容现有代码，提供简化的访问方式
  const themeColor = ref('#79e3f1')
  const windowSize = ref(2)
  const fontSize = ref(2)
  const fontFamily = ref('')
  const showAnimation = ref(true)
  const showRandomAnimation = ref(true)
  const minimizeToTray = ref(false)

  // 完整设置对象
  const settings = ref({ ...localDefaults })

  // 是否已初始化
  const isInitialized = ref(false)

  // 取消监听函数
  let unsubscribeChanged = null

  // ========== 键名映射（简化名 -> 完整键名） ==========

  const keyMap = {
    themeColor: 'theme.color',
    windowSize: 'common.windowSize',
    fontSize: 'common.fontSize',
    fontFamily: 'common.fontFamily',
    showAnimation: 'common.showAnimation',
    showRandomAnimation: 'common.showRandomAnimation',
    minimizeToTray: 'tray.enable'
  }

  // ========== 同步简化状态与完整设置 ==========

  const syncToSimple = () => {
    themeColor.value = settings.value['theme.color'] || '#79e3f1'
    windowSize.value = settings.value['common.windowSize'] ?? 2
    fontSize.value = settings.value['common.fontSize'] ?? 2
    fontFamily.value = settings.value['common.fontFamily'] ?? ''
    showAnimation.value = settings.value['common.showAnimation'] ?? true
    showRandomAnimation.value = settings.value['common.showRandomAnimation'] ?? true
    minimizeToTray.value = settings.value['tray.enable'] ?? false
  }

  const syncToFull = () => {
    settings.value['theme.color'] = themeColor.value
    settings.value['common.windowSize'] = windowSize.value
    settings.value['common.fontSize'] = fontSize.value
    settings.value['common.fontFamily'] = fontFamily.value
    settings.value['common.showAnimation'] = showAnimation.value
    settings.value['common.showRandomAnimation'] = showRandomAnimation.value
    settings.value['tray.enable'] = minimizeToTray.value
  }

  // ========== 应用设置到页面 ==========

  /**
   * 应用主题颜色到 CSS 变量
   * @param {string} color - 十六进制颜色值
   */
  const applyTheme = (color) => {
    const style = document.documentElement.style
    style.setProperty('--primary-color', color)
    style.setProperty('--primary-dark', adjustColorBrightness(color, -15))

    const rgb = hexToRgb(color)
    if (!rgb) return

    // 循环生成不同透明度的变量， 避免重复代码
    const opacities = [75, 50, 35, 30, 25, 20, 15, 10, 5]
    opacities.forEach(opacity => {
      const alpha = opacity / 100
      style.setProperty(`--primary-color-${opacity < 10 ? '0' + opacity : opacity}`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`)
    })
  }

  /**
   * 十六进制颜色转 RGB
   */
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  /**
   * 应用字体大小
   * 通过修改 html 元素的 font-size 来实现整体缩放
   * postcss-pxtorem 会把 px 转换为 rem（基于 rootValue: 16）
   */
  const applyFontSize = (sizeIndex) => {
    // 基准值是 16px，根据 sizeIndex 调整
    const fontSizes = [
      14, // 更小
      15, // 小
      16, // 标准
      17, // 大
      18, // 更大
      20 // 非常大
    ]
    const size = fontSizes[sizeIndex] || fontSizes[2]
    // 直接修改 html 元素的 font-size
    document.documentElement.style.fontSize = `${size}px`
  }

  /**
   * 应用字体到页面
   */
  const applyFontFamily = (font) => {
    if (font) {
      document.documentElement.style.setProperty('--font-family', font)
    } else {
      document.documentElement.style.removeProperty('--font-family')
    }
  }

  /**
   * 调整颜色亮度
   * @param {string} color - 十六进制颜色值
   * @param {number} percent - 调整百分比，负数变暗
   * @returns {string} - 调整后的颜色值
   */
  const adjustColorBrightness = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }

  // ========== 加载与保存 ==========

  /**
   * 从主进程加载设置
   */
  const loadSettings = async () => {
    try {
      if (window.settingAPI) {
        const result = await window.settingAPI.getAll()
        settings.value = { ...localDefaults, ...result }

        // 加载时不触发 watch 保存
        isSyncing.value = true
        syncToSimple()
        isSyncing.value = false

        // 应用设置到页面
        applyTheme(themeColor.value)
        applyFontSize(fontSize.value)
        applyFontFamily(fontFamily.value)

        isInitialized.value = true
      } else {
        // 开发环境降级到 localStorage
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('[SettingsStore] 加载设置失败:', error)
      loadFromLocalStorage()
    }
  }

  /**
   * 从 localStorage 加载（降级方案）
   */
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('yg-music-settings')
      if (saved) {
        const data = JSON.parse(saved)
        themeColor.value = data.themeColor || '#79e3f1'
        windowSize.value = data.windowSize ?? 2
        fontSize.value = data.fontSize ?? 2
        showAnimation.value = data.showAnimation ?? true
        showRandomAnimation.value = data.showRandomAnimation ?? true
        minimizeToTray.value = data.minimizeToTray ?? false
        syncToFull()
      }
      isInitialized.value = true
    } catch (e) {
      console.error('[SettingsStore] localStorage加载失败:', e)
    }
  }

  /**
   * 保存设置到主进程
   */
  const saveSettings = async () => {
    try {
      if (window.settingAPI) {
        // 使用 toRaw 将响应式对象转换为普通对象，否则 IPC 无法克隆
        const rawSettings = toRaw(settings.value)
        await window.settingAPI.update(rawSettings)
      } else {
        // 降级到 localStorage
        saveToLocalStorage()
      }
    } catch (error) {
      console.error('[SettingsStore] 保存设置失败:', error)
      saveToLocalStorage()
    }
  }

  /**
   * 保存到 localStorage（降级方案）
   */
  const saveToLocalStorage = () => {
    try {
      const data = {
        themeColor: themeColor.value,
        windowSize: windowSize.value,
        fontSize: fontSize.value,
        showAnimation: showAnimation.value,
        showRandomAnimation: showRandomAnimation.value,
        minimizeToTray: minimizeToTray.value
      }
      localStorage.setItem('yg-music-settings', JSON.stringify(data))
    } catch (e) {
      console.error('[SettingsStore] localStorage保存失败:', e)
    }
  }

  /**
   * 更新单个设置项
   */
  const updateSetting = (key, value) => {
    if (keyMap[key]) {
      // 简化键名
      settings.value[keyMap[key]] = value
    } else {
      // 完整键名
      settings.value[key] = value
    }
    syncToSimple()
    saveSettings()
  }

  /**
   * 批量更新设置
   */
  const updateSettings = (newSettings) => {
    for (const [key, value] of Object.entries(newSettings)) {
      if (keyMap[key]) {
        settings.value[keyMap[key]] = value
      } else {
        settings.value[key] = value
      }
    }
    syncToSimple()
    saveSettings()
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (unsubscribeChanged) {
      unsubscribeChanged()
      unsubscribeChanged = null
    }
  }

  // ========== 初始化 ==========

  // 是否正在同步（防止循环触发）
  const isSyncing = ref(false)

  // 监听简化状态变化
  watch(
    [
      themeColor,
      windowSize,
      fontSize,
      fontFamily,
      showAnimation,
      showRandomAnimation,
      minimizeToTray
    ],
    ([newThemeColor, newWindowSize, newFontSize, newFontFamily]) => {
      // 如果未初始化或正在同步，则退出，避免死循环
      if (!isInitialized.value || isSyncing.value) return

      syncToFull()
      saveSettings()

      if (newThemeColor) applyTheme(newThemeColor)
      if (newFontSize !== undefined) applyFontSize(newFontSize)
      if (newFontFamily !== undefined) applyFontFamily(newFontFamily)
      if (newWindowSize !== undefined && window.settingAPI) {
        window.settingAPI.resizeWindow(newWindowSize)
      }
    }
  )

  // 监听主进程设置变化
  if (typeof window !== 'undefined' && window.settingAPI) {
    unsubscribeChanged = window.settingAPI.onChanged((newSetting) => {
      isSyncing.value = true
      settings.value = { ...settings.value, ...newSetting }
      syncToSimple()
      isSyncing.value = false
    })
  }

  // 立即加载设置（store 创建时执行）
  loadSettings()

  return {
    // 简化状态（兼容现有代码）
    themeColor,
    windowSize,
    fontSize,
    fontFamily,
    showAnimation,
    showRandomAnimation,
    minimizeToTray,

    // 完整设置对象
    settings,
    isInitialized,

    // 方法
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    applyTheme,
    applyFontSize,
    applyFontFamily,
    cleanup
  }
})
