import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rgbToHsl } from '../src/renderer/src/utils/colorUtils.js'

test('rgbToHsl: 基本颜色转换', () => {
  assert.deepEqual(rgbToHsl(255, 0, 0), [0, 100, 50])
  assert.deepEqual(rgbToHsl(255, 255, 255), [0, 0, 100])
  assert.deepEqual(rgbToHsl(0, 0, 0), [0, 0, 0])
})
