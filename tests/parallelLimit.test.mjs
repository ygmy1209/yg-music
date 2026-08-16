import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parallelLimit } from '../src/renderer/src/utils/parallelLimit.js'

test('parallelLimit: 结果顺序与输入一致', async () => {
  const result = await parallelLimit(
    [1, 2, 3, 4, 5],
    async (value) => value * 10,
    2
  )
  assert.deepEqual(result, [10, 20, 30, 40, 50])
})

test('parallelLimit: 并发数不超过限制', async () => {
  let running = 0
  let maxRunning = 0

  await parallelLimit(
    Array.from({ length: 7 }, (_, i) => i),
    async () => {
      running += 1
      maxRunning = Math.max(maxRunning, running)
      await new Promise((resolve) => setTimeout(resolve, 5))
      running -= 1
    },
    3
  )

  assert.equal(maxRunning, 3)
})
