import { test } from 'node:test'
import assert from 'node:assert/strict'
import { throttle, debounce } from '../src/renderer/src/utils/throttle.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('throttle: 在时间窗口内只执行一次', async () => {
  let count = 0
  const fn = throttle((value) => {
    count += 1
    lastValue = value
  }, 20)
  let lastValue = null

  fn(1)
  fn(2)
  fn(3)
  assert.equal(count, 0)
  await sleep(35)
  assert.equal(count, 1)
  // 节流实现保留首次调用的参数
  assert.equal(lastValue, 1)

  fn(4)
  await sleep(35)
  assert.equal(count, 2)
})

test('debounce: 只执行最后一次调用的参数', async () => {
  let lastValue = null
  const fn = debounce((value) => {
    lastValue = value
  }, 20)

  fn(1)
  fn(2)
  fn(3)
  await sleep(35)
  assert.equal(lastValue, 3)
})
