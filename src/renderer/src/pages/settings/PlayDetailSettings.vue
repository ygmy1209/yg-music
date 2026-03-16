/**
 * 播放详情页设置组件
 */

<template>
  <dt class="settings-dt">播放详情页设置</dt>
  <dd class="settings-dd">
    <SettingItem v-model="settings.dragLyric">允许通过拖拽歌词调整播放进度</SettingItem>
  </dd>

  <dt class="settings-dt">歌词对齐方式</dt>
  <dd class="settings-dd">
    <OptionGroup
      v-model="settings.lyricAlign"
      :options="lyricAlignOptions"
    />
  </dd>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import SettingItem from '@/components/ui/SettingItem.vue'
import OptionGroup from '@/components/ui/OptionGroup.vue'
import { LYRIC_ALIGN } from '@/constants'

const settingsStore = useSettingsStore()

// 响应式设置对象
const settings = reactive({
  dragLyric: settingsStore.settings['playDetail.dragLyric'] ?? false,
  lyricAlign: settingsStore.settings['playDetail.lyricAlign'] ?? LYRIC_ALIGN.CENTER
})

// 歌词对齐选项
const lyricAlignOptions = [
  { label: '居左', value: LYRIC_ALIGN.LEFT },
  { label: '居中', value: LYRIC_ALIGN.CENTER },
  { label: '居右', value: LYRIC_ALIGN.RIGHT }
]

// 监听设置变化并同步到 store
watch(
  settings,
  (newVal) => {
    settingsStore.settings['playDetail.dragLyric'] = newVal.dragLyric
    settingsStore.settings['playDetail.lyricAlign'] = newVal.lyricAlign
    settingsStore.saveSettings()
  },
  { deep: true }
)
</script>
