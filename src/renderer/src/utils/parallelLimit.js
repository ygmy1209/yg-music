/**
 * 限制并发执行的辅助函数
 * 按批次并行处理，避免同时发起过多 IPC 请求
 */

/**
 * @param {Array} items - 要处理的项目数组
 * @param {(item: any) => Promise<any>} handler - 处理单个项目的函数
 * @param {number} concurrency - 最大并发数
 * @returns {Promise<Array>} 与输入顺序一致的结果数组
 */
export async function parallelLimit(items, handler, concurrency = 5) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(handler))
    results.push(...batchResults)
  }
  return results
}
