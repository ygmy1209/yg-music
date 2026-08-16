import { test } from 'node:test'
import assert from 'node:assert/strict'
import defaultSetting, { mergeSetting } from '../src/main/utils/defaultSetting.js'
import { localDefaults } from '../src/renderer/src/stores/settingsStore.js'

test('mergeSetting: 用户设置覆盖默认值，缺省项回填默认值', () => {
  const merged = mergeSetting({ 'theme.color': '#ff0000' })
  assert.equal(merged['theme.color'], '#ff0000')
  assert.equal(merged['common.showAnimation'], defaultSetting['common.showAnimation'])
})

test('mergeSetting: 忽略默认项之外的键', () => {
  const merged = mergeSetting({ 'unknown.key': 1 })
  assert.equal('unknown.key' in merged, false)
})

test('renderer 降级默认值与主进程默认值保持一致', () => {
  for (const [key, value] of Object.entries(defaultSetting)) {
    assert.equal(
      localDefaults[key],
      value,
      `localDefaults.${key} 与 defaultSetting.${key} 不一致`
    )
  }
  assert.deepEqual(Object.keys(localDefaults).sort(), Object.keys(defaultSetting).sort())
})
