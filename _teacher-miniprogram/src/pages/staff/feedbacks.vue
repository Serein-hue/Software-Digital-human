<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getFeedbacks, type FeedbackItem } from '@/api/staff'

definePage({
  style: {
    navigationBarTitleText: '用户反馈',
    navigationBarBackgroundColor: '#2b765f',
    navigationBarTextStyle: 'white',
  },
})

const items = ref<FeedbackItem[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const filterLow = ref(false)

async function load() {
  loading.value = true
  const result = await getFeedbacks(page.value, 20, filterLow.value ? 3 : undefined)
  if (result) {
    items.value = result.items
    totalPages.value = result.pagination.total_pages
  }
  loading.value = false
}

onMounted(load)

function toggleLowFilter() {
  filterLow.value = !filterLow.value
  page.value = 1
  load()
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen px-4 pb-8">
    <!-- 筛选 -->
    <view class="filter-bar mt-3">
      <view class="filter-row">
        <text class="text-13px text-[#66756f]">满意度评分 1-5 星</text>
        <label class="toggle-label" @click="toggleLowFilter">
          <text class="text-12px">{{ filterLow ? '仅看低分' : '全部' }}</text>
          <view class="toggle-track" :class="{ active: filterLow }">
            <view class="toggle-thumb" :class="{ active: filterLow }" />
          </view>
        </label>
      </view>
    </view>

    <view v-if="loading" class="flex justify-center mt-20">
      <view class="i-carbon-loading animate-spin text-28px text-[#1f6d58]" />
    </view>

    <view v-else-if="items.length === 0" class="empty-state mt-20">
      <view class="i-carbon-chat text-48px text-[#9aa8a2]" />
      <text class="mt-3 text-15px text-[#66756f]">{{ filterLow ? '没有低分反馈' : '暂无反馈' }}</text>
    </view>

    <template v-else>
      <view class="mt-4 space-y-3">
        <view v-for="item in items" :key="item.id" class="feedback-card">
          <view class="card-main">
            <view class="stars">
              <view
                v-for="i in 5" :key="i"
                class="star"
                :class="{ filled: i <= (item.rating || 0) }"
              >★</view>
              <text class="ml-2 text-13px text-[#66756f]">{{ item.rating || '-' }}</text>
            </view>
            <view class="resolve-badge" :class="{ resolved: item.resolved, unresolved: !item.resolved }">
              {{ item.resolved ? '已解决' : '未解决' }}
            </view>
          </view>
          <view v-if="item.comment" class="comment">{{ item.comment }}</view>
          <view class="time">🕐 {{ item.createdAt }}</view>
        </view>
      </view>

      <view v-if="totalPages > 1" class="pagination mt-4">
        <button class="page-btn" :disabled="page <= 1" @click="page--; load()">上一页</button>
        <text class="text-13px text-[#66756f]">{{ page }} / {{ totalPages }}</text>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++; load()">下一页</button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }
.filter-bar { padding: 12px 0; }
.filter-row {
  display: flex; align-items: center; justify-content: space-between;
}
.toggle-label {
  display: flex; align-items: center; gap: 6px;
}
.toggle-track {
  width: 36px; height: 20px; border-radius: 999px; background: #dfe9e4; position: relative; transition: 0.2s;
  &.active { background: #1f6d58; }
}
.toggle-thumb {
  width: 16px; height: 16px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: 0.2s;
  &.active { left: 18px; }
}

.feedback-card {
  border-radius: 10px; background: #fff; padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.card-main {
  display: flex; align-items: center; justify-content: space-between;
}
.stars { display: flex; align-items: center; }
.star { font-size: 16px; color: #d9d2c1; margin-right: 2px; &.filled { color: #c1a15a; } }
.resolve-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
  &.resolved { background: #e8f5f0; color: #155d58; }
  &.unresolved { background: #fef8f0; color: #e89460; }
}
.comment { margin-top: 8px; font-size: 13px; color: #66756f; line-height: 1.5; }
.time { margin-top: 6px; font-size: 11px; color: #9aa8a2; }

.empty-state { display: flex; flex-direction: column; align-items: center; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; }
.page-btn { padding: 6px 14px; border: 0; border-radius: 8px; background: #eef2ef; font-size: 12px; color: #66756f; &:disabled { opacity: 0.4; } }
</style>
