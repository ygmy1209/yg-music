/**
 * 基础设置组件
 */

<template>
  <dt class="settings-dt">基本设置</dt>
  <dd class="settings-dd">
    <SettingItem v-model="settings.showAnimation">显示动画效果</SettingItem>
    <SettingItem
      v-model="settings.showRandomAnimation"
      :disabled="!settings.showAnimation"
    >
      弹出层随机动画
    </SettingItem>
    <SettingItem v-model="settings.minimizeToTray">
      关闭窗口时不退出软件将其最小化到系统托盘
    </SettingItem>
  </dd>

  <dt class="settings-dt">主题颜色</dt>
  <dd class="settings-dd">
    <div class="theme-list">
      <div
        v-for="theme in themeList"
        :key="theme.value"
        class="theme-item"
        :class="{ active: settings.themeColor === theme.value }"
        @click="settings.themeColor = theme.value"
      >
        <div class="theme-preview" :style="{ backgroundColor: theme.value }"></div>
        <span class="theme-name">{{ theme.name }}</span>
      </div>
    </div>
  </dd>

  <dt class="settings-dt">窗口尺寸</dt>
  <dd class="settings-dd">
    <OptionGroup
      v-model="settings.windowSize"
      :options="windowSizeOptions"
    />
  </dd>

  <dt class="settings-dt">字体大小</dt>
  <dd class="settings-dd">
    <OptionGroup
      v-model="settings.fontSize"
      :options="fontSizeOptions"
    />
  </dd>

  <dt class="settings-dt">字体</dt>
  <dd class="settings-dd">
    <Select
      v-model="settings.fontFamily"
      :options="fontOptions"
      width="200px"
      dropdown-width="300px"
      placeholder="默认"
    />
  </dd>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import SettingItem from '@/components/ui/SettingItem.vue'
import OptionGroup from '@/components/ui/OptionGroup.vue'
import Select from '@/components/ui/Select.vue'
import { UI } from '@/constants'

const settingsStore = useSettingsStore()

// 响应式设置对象
const settings = ref({
  showAnimation: settingsStore.showAnimation,
  showRandomAnimation: settingsStore.showRandomAnimation,
  minimizeToTray: settingsStore.minimizeToTray,
  themeColor: settingsStore.themeColor,
  windowSize: settingsStore.windowSize,
  fontSize: settingsStore.fontSize,
  fontFamily: settingsStore.fontFamily
})

// 主题颜色列表
const themeList = UI.THEME_COLORS

// 窗口尺寸选项
const windowSizeOptions = UI.WINDOW_SIZES.map((label, value) => ({ label, value }))

// 字体大小选项
const fontSizeOptions = UI.FONT_SIZES.map((label, value) => ({ label, value }))

// 系统字体列表
const systemFonts = ref([])

// 字体选项（用于 Select 组件）
const fontOptions = computed(() => {
  const options = [{ label: '默认', value: '' }]
  systemFonts.value.forEach(font => {
    options.push({ label: font, value: font })
  })
  return options
})

// 获取系统字体列表
const getSystemFonts = async () => {
  try {
    if (window.fontAPI) {
      systemFonts.value = await window.fontAPI.getSystemFonts()
    }
  } catch (error) {
    console.error('获取系统字体失败:', error)
  }
}

// 监听设置变化并同步到 store
watch(
  settings,
  (newVal) => {
    settingsStore.showAnimation = newVal.showAnimation
    settingsStore.showRandomAnimation = newVal.showRandomAnimation
    settingsStore.minimizeToTray = newVal.minimizeToTray
    settingsStore.themeColor = newVal.themeColor
    settingsStore.windowSize = newVal.windowSize
    settingsStore.fontSize = newVal.fontSize
    settingsStore.fontFamily = newVal.fontFamily
  },
  { deep: true }
)

onMounted(() => {
  getSystemFonts()
})
</script>

<style lang="scss" scoped>
// 主题列表
.theme-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 60px;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }

  &.active {
    .theme-preview {
      border-color: var(--primary-color);
    }
  }
}

.theme-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid transparent;
  margin-bottom: 4px;
  transition: border-color 0.3s ease;
}

.theme-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
