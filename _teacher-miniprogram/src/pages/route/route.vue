<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getRoutes, type RouteItem } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '路线',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const routes = ref<RouteItem[]>([])
const expandedId = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  const data = await getRoutes()
  routes.value = data.length ? data : [
    {
      id: 'demo-1',
      name: '半日轻松逛（默认）',
      description: '适合第一次来的游客',
      duration: '约 3.5 小时',
      difficulty: '轻松',
      stops: [
        { spotName: '入口', stayDuration: '—', description: '扫码入园' },
        { spotName: '灵山大佛', stayDuration: '35分钟', description: '登顶抱佛脚' },
        { spotName: '九龙灌浴', stayDuration: '20分钟', description: '看表演' },
        { spotName: '梵宫', stayDuration: '45分钟', description: '室内参观' },
      ],
    },
  ]
  loading.value = false
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="route-page min-h-screen bg-[#f4f7f3] pb-8">
    <view class="flex items-center gap-3 px-4 pt-4 pb-2">
      <button class="back-btn" @click="goBack">◀</button>
      <view class="text-20px text-[#17362e] font-800">游览路线</view>
    </view>

    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>
    <view v-else class="px-4 space-y-3">
      <view v-for="route in routes" :key="route.id" class="route-card" :class="{ expanded: expandedId === route.id }">
        <view class="p-4" @click="toggleExpand(route.id)">
          <view class="flex items-start justify-between">
            <view class="min-w-0 flex-1">
              <view class="text-17px text-[#20372f] font-800">
                {{ route.name }}
              </view>
              <view class="mt-1 text-12px text-[#66756f]">
                {{ route.description || '' }}
              </view>
            </view>
            <view class="route-badge">
              {{ route.difficulty || '中等' }}
            </view>
          </view>
          <view class="flex gap-4 mt-2 text-12px text-[#66756f]">
            <text>⏱ {{ route.duration || '—' }}</text>
            <text v-if="route.stops?.length">📍 {{ route.stops.length }} 站</text>
          </view>
        </view>

        <view v-if="expandedId === route.id && route.stops?.length" class="border-t border-[#edf1ee] px-4 py-3">
          <view v-for="(stop, idx) in route.stops" :key="stop.spotName" class="flex gap-3 mb-3">
            <view class="flex flex-col items-center w-6">
              <view class="w-5 h-5 rounded-full bg-[#1f6d58] text-white text-11px font-700 flex items-center justify-center">
                {{ idx + 1 }}
              </view>
              <view v-if="idx < route.stops.length - 1" class="w-0.5 flex-1 bg-[#dfe9e4] mt-1" />
            </view>
            <view class="min-w-0 flex-1 pb-2">
              <view class="text-15px text-[#20372f] font-700">{{ stop.spotName }}</view>
              <view v-if="stop.stayDuration" class="text-11px text-[#1f6d58]">{{ stop.stayDuration }}</view>
              <view v-if="stop.description" class="text-12px text-[#66756f]">{{ stop.description }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.route-page { min-height: 100vh; background: #f4f7f3; }
.back-btn {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: 0; background: #e8f2ed; color: #1f6d58; font-size: 14px;
}
.route-card {
  border-radius: 8px; background: #fff; overflow: hidden;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.route-card.expanded { box-shadow: 0 4px 16px rgba(29,54,46,0.1); }
.route-badge {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 50%;
  background: #e5f2ec; color: #246b58; font-size: 12px; font-weight: 800;
}
</style>
