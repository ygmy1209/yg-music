/**
 * 快捷键管理 composable
 * 提供快捷键配置的加载、保存、匹配和格式化功能
 * 配置持久化在 hot_key.json 中（通过主进程 IPC）
 */

import { ref, reactive, readonly } from 'vue'

// ========== 动作定义 ==========

const actionDefs = [
  { id: 'playPause', name: '播放/暂停' },
  { id: 'backward', name: '快退5s' },
  { id: 'forward', name: '快进5s' },
  { id: 'volumeUp', name: '音量增大' },
  { id: 'volumeDown', name: '音量减小' },
  { id: 'prevSong', name: '上一首歌曲' },
  { id: 'nextSong', name: '下一首歌曲' },
  { id: 'togglePlaylist', name: '显示/隐藏播放列表' },
  { id: 'focusSearch', name: '聚焦搜索框' },
  { id: 'minimize', name: '最小化程序' },
  { id: 'exit', name: '退出程序' }
]

// ========== 默认快捷键 ==========

const defaultKeys = {
  playPause: { code: 'Space', ctrl: false, shift: false, alt: false },
  backward: { code: 'ArrowLeft', ctrl: false, shift: false, alt: false },
  forward: { code: 'ArrowRight', ctrl: false, shift: false, alt: false },
  volumeUp: { code: 'ArrowUp', ctrl: false, shift: false, alt: false },
  volumeDown: { code: 'ArrowDown', ctrl: false, shift: false, alt: false },
  prevSong: { code: 'KeyP', ctrl: false, shift: false, alt: false },
  nextSong: { code: 'KeyN', ctrl: false, shift: false, alt: false },
  togglePlaylist: { code: 'KeyL', ctrl: false, shift: false, alt: false },
  focusSearch: { code: 'KeyF', ctrl: true, shift: false, alt: false },
  minimize: null,
  exit: null
}

// ========== 按键代码显示名映射 ==========

const codeDisplayMap = {
  Space: 'Space',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Enter: 'Enter',
  Tab: 'Tab',
  Escape: 'Esc',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Insert: 'Insert',
  NumpadAdd: 'Num+',
  NumpadSubtract: 'Num-',
  NumpadMultiply: 'Num*',
  NumpadDivide: 'Num/',
  NumpadDecimal: 'Num.',
  NumpadEnter: 'NumEnter',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`'
}

// ========== 共享状态（模块级单例） ==========

const config = reactive({
  enabled: true,
  keys: {}
})

// 初始化默认值（深拷贝避免引用共享）
for (const [key, value] of Object.entries(defaultKeys)) {
  config.keys[key] = value ? { ...value } : null
}

const isLoaded = ref(false)

// 录制锁：录制快捷键时阻止全局快捷键响应
const isRecording = ref(false)

// ========== composable ==========

export function useHotkeys() {
  /**
   * 从主进程加载快捷键配置
   */
  async function loadConfig() {
    if (isLoaded.value) return

    try {
      // 1. 获取保存的数据（优先 IPC，备选 localStorage）
      let saved = null
      if (window.hotKeyAPI) {
        saved = await window.hotKeyAPI.getAll()
      } else {
        const localData = localStorage.getItem('yg-music-hotkeys')
        if (localData) saved = JSON.parse(localData)
      }

      // 2. 如果没有保存的数据，标记加载完成并返回
      if (!saved) {
        isLoaded.value = true
        return
      }

      // 3. 应用保存的配置
      config.enabled = saved.enabled ?? true
      if (saved.keys && Object.keys(saved.keys).length > 0) {
        // 与默认值合并（确保新增的动作有默认快捷键）
        for (const [key, defaultValue] of Object.entries(defaultKeys)) {
          // 如果用户有自定义设置，则克隆自定义设置，否则使用默认值
          const userBinding = saved.keys.hasOwnProperty(key) ? saved.keys[key] : defaultValue
          config.keys[key] = userBinding ? { ...userBinding } : null
        }
      }
    } catch (error) {
      console.error('[Hotkeys] 加载快捷键配置失败:', error)
    }

    isLoaded.value = true
    console.log('[Hotkeys] 快捷键配置加载完成')
  }

  /**
   * 保存快捷键配置到主进程
   */
  async function saveConfig() {
    const data = {
      enabled: config.enabled,
      keys: { ...config.keys }
    }

    try {
      if (window.hotKeyAPI) {
        await window.hotKeyAPI.update(data)
      } else {
        localStorage.setItem('yg-music-hotkeys', JSON.stringify(data))
      }
    } catch (error) {
      console.error('[Hotkeys] 保存快捷键配置失败:', error)
    }
  }

  /**
   * 将键盘事件转换为快捷键配置对象
   * @returns {Object|null} 返回 null 表示纯修饰键
   */
  function eventToKeyConfig(event) {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      return null
    }

    return {
      code: event.code,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey
    }
  }

  /**
   * 格式化快捷键配置为显示字符串
   */
  function formatKeyCombo(keyConfig) {
    if (!keyConfig) return '未设置'

    const parts = []
    if (keyConfig.ctrl) parts.push('Ctrl')
    if (keyConfig.shift) parts.push('Shift')
    if (keyConfig.alt) parts.push('Alt')

    let keyName = keyConfig.code
    
    // 扁平化映射逻辑
    if (codeDisplayMap[keyName]) {
      keyName = codeDisplayMap[keyName]
    } else if (keyName.startsWith('Key')) {
      keyName = keyName.slice(3)
    } else if (keyName.startsWith('Digit')) {
      keyName = keyName.slice(5)
    } else if (keyName.startsWith('Numpad')) {
      keyName = 'Num' + keyName.slice(6)
    }

    parts.push(keyName)
    return parts.join(' + ')
  }

  /**
   * 匹配键盘事件对应的动作
   * @returns {string|null} 动作 ID，未匹配返回 null
   */
  function matchAction(event) {
    if (!config.enabled || isRecording.value) return null

    const keyConfig = eventToKeyConfig(event)
    if (!keyConfig) return null

    for (const [actionId, binding] of Object.entries(config.keys)) {
      if (!binding) continue
      if (
        binding.code === keyConfig.code &&
        binding.ctrl === keyConfig.ctrl &&
        binding.shift === keyConfig.shift &&
        binding.alt === keyConfig.alt
      ) {
        return actionId
      }
    }
    return null
  }

  /**
   * 判断事件是否应被忽略（在输入框中的无修饰符按键）
   */
  function shouldIgnoreEvent(event) {
    const target = event.target
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable

    if (!isInput) return false

    // 在输入元素中，仍然响应带 Ctrl/Alt 修饰符的快捷键和功能键
    if (event.ctrlKey || event.altKey) return false
    if (/^F\d{1,2}$/.test(event.code)) return false

    return true
  }

  /**
   * 更新某个动作的快捷键
   */
  function updateKey(actionId, keyConfig) {
    config.keys[actionId] = keyConfig ? { ...keyConfig } : null
    saveConfig()
  }

  /**
   * 清除某个动作的快捷键
   */
  function clearKey(actionId) {
    config.keys[actionId] = null
    saveConfig()
  }

  /**
   * 设置快捷键启用状态
   */
  function setEnabled(enabled) {
    config.enabled = enabled
    saveConfig()
  }

  /**
   * 检查快捷键冲突
   * @returns {string|null} 冲突的动作 ID，无冲突返回 null
   */
  function findConflict(actionId, keyConfig) {
    if (!keyConfig) return null

    for (const [id, binding] of Object.entries(config.keys)) {
      if (id === actionId || !binding) continue
      if (
        binding.code === keyConfig.code &&
        binding.ctrl === keyConfig.ctrl &&
        binding.shift === keyConfig.shift &&
        binding.alt === keyConfig.alt
      ) {
        return id
      }
    }
    return null
  }

  /**
   * 恢复所有快捷键为默认值
   */
  function resetToDefaults() {
    for (const [key, value] of Object.entries(defaultKeys)) {
      config.keys[key] = value ? { ...value } : null
    }
    config.enabled = true
    saveConfig()
  }

  /**
   * 设置录制状态
   */
  function setRecording(value) {
    isRecording.value = value
  }

  return {
    config,
    isLoaded: readonly(isLoaded),
    isRecording: readonly(isRecording),
    actionDefs,
    defaultKeys,
    loadConfig,
    saveConfig,
    matchAction,
    shouldIgnoreEvent,
    formatKeyCombo,
    eventToKeyConfig,
    updateKey,
    clearKey,
    setEnabled,
    findConflict,
    resetToDefaults,
    setRecording
  }
}
