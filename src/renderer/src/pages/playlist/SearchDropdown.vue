/**
 * 搜索下拉列表
 * 显示搜索结果的歌曲名小列表
 */

<template>
  <div v-show="visible" class="search-dropdown">
    <!-- 有结果 -->
    <div v-if="results.length > 0" class="result-list">
      <div
        v-for="song in results"
        :key="song.id"
        class="result-item"
        @click="handleSelect(song)"
      >
        <!-- 类型图标 -->
        <span class="type-icon" :class="song.type === 0 ? 'music' : 'video'">
          <svg v-if="song.type === 0" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </span>
        <span class="song-name text-ellipsis">{{ song.name }}</span>
        <span class="artist-name text-ellipsis">{{ song.artist }}</span>
      </div>
    </div>
    <!-- 无结果 -->
    <div v-else class="no-result">
      <span>无结果</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  results: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const handleSelect = (song) => {
  emit('select', song)
}
</script>

<style lang="scss" scoped>
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;

  .result-list {
    padding: 6px;

    .result-item {
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--bg-secondary);
      }

      .type-icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;

        &.music {
          background-color: var(--primary-color-20);
          svg {
            color: var(--primary-color);
          }
        }

        &.video {
          background-color: rgba(114, 46, 209, 0.2);
          svg {
            color: #722ed1;
          }
        }
      }

      .song-name {
        flex: 1;
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .artist-name {
        flex: 1;
        font-size: var(--font-size-xs);
        color: var(--text-icon);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .no-result {
    padding: 20px;
    text-align: center;
    color: var(--text-icon);
    font-size: var(--font-size-sm);
  }
}
</style>
