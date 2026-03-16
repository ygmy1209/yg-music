/**
 * 子进程管理器
 * 负责追踪和清理 ffmpeg 等子进程
 */

const activeProcesses = new Set()

/**
 * 注册一个活动的子进程（如 ffmpeg 命令实例）
 * @param {Object} command - fluent-ffmpeg 实例
 */
export const registerProcess = (command) => {
  activeProcesses.add(command)
  
  // 监听结束或错误，自动移除
  const remove = () => activeProcesses.delete(command)
  command.on('end', remove)
  command.on('error', remove)
}

/**
 * 杀死所有活动的子进程
 */
export const killAllProcesses = () => {
  console.log(`[ProcessManager] 正在清理 ${activeProcesses.size} 个子进程...`)
  for (const command of activeProcesses) {
    try {
      // fluent-ffmpeg 提供了 kill 方法
      if (typeof command.kill === 'function') {
        command.kill('SIGKILL')
      }
    } catch (e) {
      console.warn('[ProcessManager] 杀掉进程失败:', e.message)
    }
  }
  activeProcesses.clear()
}

export default {
  registerProcess,
  killAllProcesses
}
