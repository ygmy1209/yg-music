/**
 * Store 工具类
 * 用于在主进程中持久化存储数据到 JSON 文件
 * 采用原子写入策略确保数据完整性
 */

import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// 数据存储目录
const getDataPath = () => {
  const userDataPath = app.getPath('userData')
  const dataPath = path.join(userDataPath, 'data')
  return dataPath
}

// 确保目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Store 类
 * 管理单个 JSON 文件的读写
 */
class Store {
  constructor(name) {
    const dataPath = getDataPath()
    ensureDir(dataPath)

    this.filePath = path.join(dataPath, `${name}.json`)
    this.data = this.load()
  }

  /**
   * 从文件加载数据
   */
  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.error(`[Store] 加载 ${this.filePath} 失败:`, error)
      // 尝试恢复备份文件
      const backupPath = this.filePath + '.bak'
      if (fs.existsSync(backupPath)) {
        try {
          const content = fs.readFileSync(backupPath, 'utf-8')
          console.log(`[Store] 从备份恢复 ${this.filePath}`)
          return JSON.parse(content)
        } catch (e) {
          console.error(`[Store] 备份文件也损坏:`, e)
        }
      }
    }
    return {}
  }

  /**
   * 保存数据到文件（原子写入）
   */
  save() {
    try {
      // 先写入临时文件
      const tempPath = this.filePath + '.' + Date.now() + '.tmp'
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8')

      // 备份旧文件
      if (fs.existsSync(this.filePath)) {
        const backupPath = this.filePath + '.bak'
        fs.copyFileSync(this.filePath, backupPath)
      }

      // 原子重命名
      fs.renameSync(tempPath, this.filePath)
    } catch (error) {
      console.error(`[Store] 保存 ${this.filePath} 失败:`, error)
      throw error
    }
  }

  /**
   * 获取指定 key 的值
   */
  get(key, defaultValue = undefined) {
    if (key === undefined) {
      return this.data
    }
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : defaultValue
  }

  /**
   * 设置指定 key 的值
   */
  set(key, value) {
    if (value === undefined) {
      // 如果 value 为 undefined，删除该 key
      delete this.data[key]
    } else {
      this.data[key] = value
    }
    this.save()
  }

  /**
   * 批量设置多个值
   */
  setAll(obj) {
    this.data = { ...this.data, ...obj }
    this.save()
  }

  /**
   * 完全覆盖数据
   */
  override(data) {
    this.data = { ...data }
    this.save()
  }

  /**
   * 检查 key 是否存在
   */
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.data, key)
  }

  /**
   * 删除指定 key
   */
  delete(key) {
    delete this.data[key]
    this.save()
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.data = {}
    this.save()
  }
}

// 缓存已创建的 Store 实例
const storeCache = new Map()

/**
 * 获取或创建 Store 实例
 * @param {string} name - 存储文件名（不含扩展名）
 * @returns {Store}
 */
export const getStore = (name) => {
  if (!storeCache.has(name)) {
    storeCache.set(name, new Store(name))
  }
  return storeCache.get(name)
}

export default Store
