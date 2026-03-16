/**
 * 列表设置组件
 */

<template>
  <dt class="settings-dt">列表设置</dt>
  <dd class="settings-dd">
    <h3 class="settings-h3">添加歌曲到列表时的位置</h3>
    <OptionGroup
      v-model="settings.addSongPosition"
      :options="positionOptions"
    />
  </dd>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import OptionGroup from '@/components/ui/OptionGroup.vue'
import { ADD_SONG_POSITION } from '@/constants'

const settingsStore = useSettingsStore()

// 响应式设置对象
const settings = reactive({
  addSongPosition: settingsStore.settings['list.addSongPosition'] ?? ADD_SONG_POSITION.BOTTOM
})

// 位置选项
const positionOptions = [
  { label: '顶部', value: ADD_SONG_POSITION.TOP },
  { label: '底部', value: ADD_SONG_POSITION.BOTTOM }
]

// 监听设置变化并同步到 store
watch(
  settings,
  (newVal) => {
    settingsStore.settings['list.addSongPosition'] = newVal.addSongPosition
    settingsStore.saveSettings()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.settings-h3 {
  font-size: 12px;
  font-weight: normal;
  margin: 15px 0 10px;
  color: var(--text-secondary);
}
</style>
