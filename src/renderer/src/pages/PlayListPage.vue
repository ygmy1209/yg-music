/**
 * 歌单页面
 * 整合左侧歌单列表和右侧歌单详情
 */

<template>
  <div class="playlist-page">
    <!-- 左侧歌单列表 -->
    <PlayListSidebar />

    <!-- 右侧歌单详情 -->
    <div class="playlist-detail">
      <!-- 工具栏 -->
      <PlayListToolbar />

      <!-- 歌曲表格 -->
      <div class="song-table-wrapper">
        <SongTable />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePlaylistStore } from '@/stores/playlistStore'
import PlayListSidebar from './playlist/PlayListSidebar.vue'
import PlayListToolbar from './playlist/PlayListToolbar.vue'
import SongTable from './playlist/SongTable.vue'

const playlistStore = usePlaylistStore()

// 初始化数据
onMounted(() => {
  playlistStore.init()
})
</script>

<style lang="scss" scoped>
.playlist-page {
  height: 100%;
  display: flex;

  .playlist-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;

    .song-table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
