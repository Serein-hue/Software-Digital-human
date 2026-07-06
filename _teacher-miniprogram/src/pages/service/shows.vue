<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getEvents, type EventItem } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '演出',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const events = ref<EventItem[]>([])
const reminded = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  const data = await getEvents()
  events.value = data.length ? data : [
    { id: 'demo-1', name: '九龙灌浴', time: '每日 10:00, 14:00, 16:00', description: '大型音乐喷泉表演' },
    { id: 'demo-2', name: '灵山吉祥颂', time: '10:35, 11:30, 14:00, 16:00', description: '梵宫圣坛' },
  ]
  loading.value = false
})

function toggleReminder(name: string) {
  reminded.value = reminded.value.includes(name)
    ? reminded.value.filter(item => item !== name)
    : [...reminded.value, name]
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        今天的演出
      </view>
      <view class="mt-2 text-13px text-[#66756f]">
        时间可能随天气和现场客流调整。
      </view>
    </view>
    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>
    <view v-else class="mt-4 space-y-3">
      <view v-for="item in events" :key="item.id" class="show-card">
        <view class="time">
          {{ item.time || '全天' }}
        </view>
        <view class="min-w-0 flex-1">
          <view class="text-16px text-[#20372f] font-800">
            {{ item.name }}
          </view>
          <view class="mt-1 text-12px text-[#66756f]">
            {{ item.spotId ? '景点 · ' + item.spotId : item.description || '' }}
          </view>
        </view>
        <button class="remind-btn" :class="{ active: reminded.includes(item.name) }" @click="toggleReminder(item.name)">
          {{ reminded.includes(item.name) ? '已提醒' : '提醒' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }
.panel {
  border-radius: 8px; background: #fff; padding: 18px;
  box-shadow: 0 10px 22px rgba(29,54,46,0.07);
}
.title { font-size: 18px; font-weight: 800; color: #17362e; }
.show-card {
  display: flex; gap: 14px; align-items: center;
  border-radius: 8px; background: #fff; padding: 16px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.time {
  display: flex; align-items: center; justify-content: center;
  min-width: 64px; height: 48px; border-radius: 8px;
  background: #e8f2ed; color: #1f6d58;
  font-size: 12px; font-weight: 800; text-align: center;
}
.remind-btn {
  height: 32px; border: 0; border-radius: 8px;
  background: #f4f7f3; color: #66756f; font-size: 12px; font-weight: 700;
  line-height: 32px; padding: 0 12px;
  white-space: nowrap;
}
.remind-btn.active { background: #1f6d58; color: #fff; }
</style>
