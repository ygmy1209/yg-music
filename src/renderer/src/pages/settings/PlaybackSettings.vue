/**
 * 播放设置组件
 */

<template>
  <dt class="settings-dt">播放设置</dt>
  <dd class="settings-dd">
    <SettingItem v-model="settings.startupAutoPlay">启动软件后自动播放音乐</SettingItem>
    <SettingItem v-model="settings.savePlayTime">记住播放进度</SettingItem>
    <SettingItem v-model="settings.autoSkipOnError">播放错误时自动切换歌曲</SettingItem>
    <SettingItem v-model="settings.showTaskProgress">在任务栏上显示当前歌曲播放进度</SettingItem>
  </dd>

  <dt class="settings-dt">音频输出</dt>
  <dd class="settings-dd">
    <Select
      v-model="settings.mediaDeviceId"
      :options="deviceOptions"
      width="300px"
      dropdown-width="50%"
      placeholder="默认音频设备"
    />
  </dd>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import SettingItem from '@/components/ui/SettingItem.vue'
import Select from '@/components/ui/Select.vue'

const settingsStore = useSettingsStore()

// 响应式设置对象
const settings = reactive({
  startupAutoPlay: settingsStore.settings['player.startupAutoPlay'] ?? false,
  savePlayTime: settingsStore.settings['player.isSavePlayTime'] ?? false,
  autoSkipOnError: settingsStore.settings['player.autoSkipOnError'] ?? false,
  showTaskProgress: settingsStore.settings['player.isShowTaskProgress'] ?? false,
  mediaDeviceId: settingsStore.settings['player.mediaDeviceId'] ?? 'default'
})

// 音频设备列表
const mediaDevices = ref([])

// 设备选项（用于 Select 组件）
const deviceOptions = computed(() => {
  const options = []
  mediaDevices.value.forEach(device => {
    options.push({
      label: device.label || `音频设备 ${device.deviceId.slice(0, 8)}`,
      value: device.deviceId
    })
  })
  return options
})

// 获取音频设备列表
const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    mediaDevices.value = devices.filter(device => device.kind === 'audiooutput')
  } catch (error) {
    console.error('获取音频设备失败:', error)
  }
}

// 监听设置变化并同步到 store
watch(
  settings,
  (newVal) => {
    settingsStore.settings['player.startupAutoPlay'] = newVal.startupAutoPlay
    settingsStore.settings['player.isSavePlayTime'] = newVal.savePlayTime
    settingsStore.settings['player.autoSkipOnError'] = newVal.autoSkipOnError
    settingsStore.settings['player.isShowTaskProgress'] = newVal.showTaskProgress
    settingsStore.settings['player.mediaDeviceId'] = newVal.mediaDeviceId
    settingsStore.saveSettings()
  },
  { deep: true }
)

onMounted(() => {
  getMediaDevices()
})
</script>
