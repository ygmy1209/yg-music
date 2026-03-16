/**
 * 设置页面
 * 管理应用的各项设置
 * 参考lx-music的设计风格
 */

<template>
  <div class="settings-page">
    <!-- 左侧导航 -->
    <div class="settings-sidebar">
      <div class="sidebar-header">
        <span class="title">设置</span>
      </div>
      <div class="settings-list">
        <div
          v-for="item in navList"
          :key="item.id"
          class="settings-item"
          :class="{ active: activeTab === item.id }"
          @click="handleTabChange(item.id)"
        >
          <span class="item-name">{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div ref="contentRef" class="settings-content">
      <dl class="settings-dl">
        <!-- 基本设置 -->
        <BasicSettings v-if="activeTab === 'basic'" />

        <!-- 播放设置 -->
        <PlaybackSettings v-if="activeTab === 'play'" />

        <!-- 播放详情页设置 -->
        <PlayDetailSettings v-if="activeTab === 'playDetail'" />

        <!-- 列表设置 -->
        <ListSettings v-if="activeTab === 'list'" />

        <!-- 快捷键设置 -->
        <HotkeySettings v-if="activeTab === 'hotkey'" />
      </dl>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BasicSettings from './settings/BasicSettings.vue'
import PlaybackSettings from './settings/PlaybackSettings.vue'
import PlayDetailSettings from './settings/PlayDetailSettings.vue'
import ListSettings from './settings/ListSettings.vue'
import HotkeySettings from './settings/HotkeySettings.vue'

// 当前激活的标签页
const activeTab = ref('basic')

// 内容区域引用（用于滚动）
const contentRef = ref(null)

// 导航列表
const navList = [
  { id: 'basic', title: '基本设置' },
  { id: 'play', title: '播放设置' },
  { id: 'playDetail', title: '播放详情页' },
  { id: 'list', title: '列表设置' },
  { id: 'hotkey', title: '快捷键设置' }
]

// 切换标签页
const handleTabChange = (tabId) => {
  activeTab.value = tabId
  // 滚动到顶部
  if (contentRef.value) {
    contentRef.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  display: flex;
  height: 100%;
}

// 左侧导航
.settings-sidebar {
  width: 10%;
  min-width: 150px;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 20px 15px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .settings-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 8px;
    scroll-behavior: smooth;

    .settings-item {
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      .item-name {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
      }

      &:hover {
        background-color: var(--bg-tertiary);

        .item-name {
          color: var(--text-primary);
        }
      }

      &.active {
        background-color: var(--primary-color-20);

        .item-name {
          color: var(--primary-dark);
        }
      }
    }
  }
}

// 右侧内容区
.settings-content {
  flex: 1;
  padding: 0 15px 15px;
  overflow-y: auto;
  font-size: var(--font-size-sm);
}

.settings-dl {
  margin: 0;
}

// 设置分组标题
:deep(.settings-dt) {
  border-left: 4px solid var(--primary-color);
  padding: 3px 7px;
  margin: 15px 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

// 设置分组内容
:deep(.settings-dd) {
  margin-left: 0;
  padding: 0 15px;

  > div {
    padding: 3px 0;
  }
}
</style>
