<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getStaffRealtime, type StaffRealtime } from '@/api/staff'

definePage({
  style: {
    navigationBarTitleText: '实时看板',
    navigationBarBackgroundColor: '#155d58',
    navigationBarTextStyle: 'white',
  },
})

const data = ref<StaffRealtime | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  data.value = await getStaffRealtime()
  loading.value = false
}

onMounted(load)
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen px-4 pb-8">
    <view v-if="loading" class="flex justify-center mt-20">
      <view class="i-carbon-loading animate-spin text-28px text-[#1f6d58]" />
    </view>

    <template v-else-if="data">
      <!-- KPI 卡片 -->
      <view class="kpi-grid mt-4">
        <view class="kpi-card">
          <view class="kpi-icon i-carbon-user text-22px text-[#1f6d58]" />
          <view class="kpi-value">{{ data.activeVisitors }}</view>
          <view class="kpi-label">实时在园</view>
        </view>
        <view class="kpi-card">
          <view class="kpi-icon i-carbon-document text-22px text-[#e89460]" />
          <view class="kpi-value">{{ data.pendingWorkOrders }}</view>
          <view class="kpi-label">待处理工单</view>
        </view>
        <view class="kpi-card">
          <view class="kpi-icon i-carbon-warning-alt text-22px text-[#c0392b]" />
          <view class="kpi-value">{{ data.pendingEmergencies }}</view>
          <view class="kpi-label">待处理应急</view>
        </view>
        <view class="kpi-card">
          <view class="kpi-icon i-carbon-star text-22px text-[#c1a15a]" />
          <view class="kpi-value">{{ data.todayAvgRating ?? '-' }}</view>
          <view class="kpi-label">今日满意度</view>
        </view>
      </view>

      <!-- 景点客流分布 -->
      <view class="section mt-4">
        <view class="section-title">景点客流分布</view>
        <view v-if="data.spotDistribution?.length" class="mt-3 space-y-2">
          <view v-for="s in data.spotDistribution" :key="s.id" class="spot-row">
            <text class="text-13px text-[#20372f] font-700">{{ s.id }}</text>
            <view class="bar-track">
              <view class="bar-fill" :style="{ width: Math.min(s.count / 5 * 100, 100) + '%' }" />
            </view>
            <text class="text-12px text-[#66756f]">{{ s.count }} 人</text>
          </view>
        </view>
        <view v-else class="mt-3 text-13px text-[#9aa8a2] text-center py-4">暂无位置上报数据</view>
      </view>

      <!-- 排队实况 -->
      <view class="section mt-4">
        <view class="section-title">排队实况</view>
        <view v-if="data.mockQueueStats?.length" class="mt-3 space-y-2">
          <view v-for="q in data.mockQueueStats" :key="q.spot" class="queue-row">
            <view class="flex items-center gap-2">
              <text class="text-14px text-[#20372f] font-700">{{ q.spot }}</text>
              <text
                class="text-11px px-2 py-0.5 rounded-full"
                :class="{
                  'bg-green-100 text-green-700': q.crowdLevel === 'low',
                  'bg-yellow-100 text-yellow-700': q.crowdLevel === 'medium',
                  'bg-red-100 text-red-700': q.crowdLevel === 'high',
                }"
              >{{ { low: '空闲', medium: '适中', high: '拥挤' }[q.crowdLevel] }}</text>
            </view>
            <text class="text-13px text-[#66756f]">{{ q.queueMinutes }} min</text>
          </view>
        </view>
        <view v-else class="mt-3 text-13px text-[#9aa8a2] text-center py-4">暂无数据</view>
      </view>

      <!-- 更新时间 -->
      <view class="mt-4 text-center">
        <text class="text-11px text-[#9aa8a2]">更新于 {{ data.updatedAt }}</text>
      </view>
    </template>

    <view v-else class="empty-state mt-20">
      <view class="i-carbon-data-unavailable text-48px text-[#9aa8a2]" />
      <text class="mt-3 text-15px text-[#66756f]">加载数据失败</text>
      <button class="retry-btn mt-4" @click="load">重试</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }

.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.kpi-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 16px; border-radius: 10px; background: #fff;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.kpi-icon {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; background: #f4f8f5;
}
.kpi-value { font-size: 28px; font-weight: 900; color: #17362e; margin-top: 8px; }
.kpi-label { font-size: 12px; color: #66756f; margin-top: 2px; }

.section { border-radius: 10px; background: #fff; padding: 16px; box-shadow: 0 4px 12px rgba(29,54,46,0.04); }
.section-title { font-size: 17px; font-weight: 800; color: #17362e; }

.spot-row {
  display: flex; align-items: center; gap: 8px;
}
.bar-track {
  flex: 1; height: 8px; border-radius: 999px; background: #eef2ef; overflow: hidden;
}
.bar-fill {
  height: 100%; border-radius: 999px; background: linear-gradient(90deg, #1f6d58, #15bba0);
  transition: width 0.3s;
}

.queue-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 8px; background: #f7faf8;
}

.empty-state { display: flex; flex-direction: column; align-items: center; }
.retry-btn { padding: 8px 24px; border: 0; border-radius: 8px; background: #1f6d58; color: #fff; font-size: 14px; }
</style>
