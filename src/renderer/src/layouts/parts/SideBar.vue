/**
 * 侧边栏导航组件
 * 包含 Logo 和导航菜单
 */

<template>
  <div class="sidebar">
    <!-- Logo -->
    <div class="logo">摇光</div>

    <!-- 导航菜单 -->
    <div class="menu-list">
      <!-- 歌单 -->
      <div
        class="menu-item"
        :class="{ active: activeNav === 'playlist' }"
        @click="handleNavClick('playlist')"
        title="歌单"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>

      <!-- 专辑 -->
      <div
        class="menu-item"
        :class="{ active: activeNav === 'album' }"
        @click="handleNavClick('album')"
        title="专辑"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M6 12c0-1.7.7-3.2 1.8-4.2"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>
        </svg>
      </div>

      <!-- 歌手 -->
      <div
        class="menu-item"
        :class="{ active: activeNav === 'singer' }"
        @click="handleNavClick('singer')"
        title="歌手"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-vocal-icon lucide-mic-vocal">
          <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/>
          <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/>
          <circle cx="16" cy="7" r="5"/>
        </svg>
      </div>

      <!-- 设置 -->
      <div
        class="menu-item"
        :class="{ active: activeNav === 'settings' }"
        @click="handleNavClick('settings')"
        title="设置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNavStore } from '@/stores/navStore'

const navStore = useNavStore()

// 当前激活的导航
const activeNav = computed(() => navStore.activeNav)

// ========== 事件处理 ==========

const handleNavClick = (nav) => {
  navStore.setActiveNav(nav)
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 6.5%;
  min-width: 60px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  container-type: inline-size;

  .logo {
    padding: 15px 0;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 2px;
    -webkit-app-region: drag;
  }

  .menu-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    gap: 5px;

    .menu-item {
      width: 80%;
      aspect-ratio: 1 / 1;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s ease;

      svg {
        width: 40cqw;
        height: 40cqw;
        color: rgba(255, 255, 255, 0.7);
        transition: color 0.2s ease;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.15);

        svg {
          color: #ffffff;
        }
      }

      &.active {
        background-color: rgba(255, 255, 255, 0.2);

        svg {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
