/**
 * 设置业务逻辑服务
 * 封装设置相关的业务操作
 */

import { getStore } from '../utils/store.js'
import defaultSetting, { mergeSetting } from '../utils/defaultSetting.js'

class SettingService {
  constructor() {
    this.store = null
    this.currentSetting = null
  }

  /**
   * 初始化服务
   */
  init() {
    this.store = getStore('config')
    const savedSetting = this.store.get('setting', {})
    this.currentSetting = mergeSetting(savedSetting)

    // 首次运行时保存默认设置
    if (Object.keys(savedSetting).length === 0) {
      this.store.set('setting', this.currentSetting)
    }

    console.log('[SettingService] 初始化完成')
  }

  /**
   * 获取所有设置
   */
  getAll() {
    return { ...this.currentSetting }
  }

  /**
   * 获取单个设置项
   * @param {string} key - 设置项键名
   */
  get(key) {
    return this.currentSetting ? this.currentSetting[key] : undefined
  }

  /**
   * 更新设置
   * @param {Object} newSetting - 新设置对象
   * @param {Function} notifyCallback - 通知回调函数
   */
  update(newSetting, notifyCallback) {
    this.currentSetting = { ...this.currentSetting, ...newSetting }
    this.store.set('setting', this.currentSetting)

    // 如果有通知回调，调用它
    if (notifyCallback) {
      notifyCallback(newSetting)
    }

    return this.currentSetting
  }

  /**
   * 重置为默认设置
   */
  reset() {
    this.currentSetting = { ...defaultSetting }
    this.store.set('setting', this.currentSetting)
    return this.currentSetting
  }
}

// 导出单例
export const settingService = new SettingService()
export default settingService
