<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getStaffOverview, getStaffRealtime, type StaffOverview, type StaffRealtime } from '@/api/staff'

definePage({
  style: {
    navigationBarTitleText: '员工工作台',
    navigationBarBackgroundColor: '#1f6d58',
    navigationBarTextStyle: 'white',
  },
})

const overview = ref<StaffOverview | null>(null)
const realtime = ref<StaffRealtime | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  const [ov, rt] = await Promise.all([
    getStaffOverview(),
    getStaffRealtime(),
  ])
  overview.value = ov
  realtime.value = rt
  loading.value = false
})

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen px-4 pb-8">
    <!-- 员工信息头 -->
    <view class="staff-header">
      <view class="flex items-center gap-3">
        <view class="staff-avatar i-carbon-user-avatar text-28px text-white" />
        <view>
          <view class="text-18px text-white font-800">{{ overview?.staffName || '工作人员' }}</view>
          <view class="text-12px text-white/70 mt-1">{{ overview?.staffTitle || '景区服务' }}</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="flex justify-center mt-20">
      <view class="i-carbon-loading animate-spin text-32px text-[#1f6d58]" />
    </view>

    <template v-else>
      <!-- 待处理概览 -->
      <view class="stats-grid mt-4">
        <view class="stat-card warn" @click="go('/pages/staff/work-orders')">
          <view class="stat-num">{{ overview?.pendingWorkOrders ?? '-' }}</view>
          <view class="stat-label">待处理工单</view>
        </view>
        <view class="stat-card danger" @click="go('/pages/staff/emergencies')">
          <view class="stat-num">{{ overview?.pendingEmergencies ?? '-' }}</view>
          <view class="stat-label">待派单应急</view>
        </view>
        <view class="stat-card info">
          <view class="stat-num">{{ overview?.activeVisitors5min ?? '-' }}</view>
          <view class="stat-label">在园人数</view>
        </view>
        <view class="stat-card neutral">
          <view class="stat-num">{{ overview?.recentFeedbacks24h ?? '-' }}</view>
          <view class="stat-label">24h反馈</view>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="section mt-4">
        <view class="section-title">快捷操作</view>
        <view class="grid grid-cols-2 gap-3 mt-4">
          <view class="action-card" @click="go('/pages/staff/work-orders')">
            <view class="i-carbon-document text-24px text-[#1f6d58]" />
            <text class="mt-2 text-14px font-700">工单管理</text>
          </view>
          <view class="action-card" @click="go('/pages/staff/emergencies')">
            <view class="i-carbon-warning-alt text-24px text-[#c0392b]" />
            <text class="mt-2 text-14px font-700">应急求助</text>
          </view>
          <view class="action-card" @click="go('/pages/staff/feedbacks')">
            <view class="i-carbon-chat text-24px text-[#2b765f]" />
            <text class="mt-2 text-14px font-700">用户反馈</text>
          </view>
          <view class="action-card" @click="go('/pages/staff/dashboard')">
            <view class="i-carbon-dashboard text-24px text-[#e89460]" />
            <text class="mt-2 text-14px font-700">实时看板</text>
          </view>
        </view>
      </view>

      <!-- 实时排队概况 -->
      <view class="section mt-4">
        <view class="section-title">排队实况</view>
        <view v-if="realtime?.mockQueueStats?.length" class="mt-3 space-y-2">
          <view v-for="q in realtime.mockQueueStats" :key="q.spot" class="queue-row">
            <view class="flex items-center gap-2">
              <view class="text-14px font-700 text-[#20372f]">{{ q.spot }}</view>
              <view
                class="text-11px px-2 py-0.5 rounded-full"
                :class="{
                  'bg-green-100 text-green-700': q.crowdLevel === 'low',
                  'bg-yellow-100 text-yellow-700': q.crowdLevel === 'medium',
                  'bg-red-100 text-red-700': q.crowdLevel === 'high',
                }"
              >
                {{ { low: '空闲', medium: '适中', high: '拥挤' }[q.crowdLevel] || q.crowdLevel }}
              </view>
            </view>
            <view class="text-13px text-[#66756f]">排队约 {{ q.queueMinutes }} 分钟</view>
          </view>
        </view>
        <view v-else class="mt-3 text-13px text-[#9aa8a2] text-center py-4">暂无数据</view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }

.staff-header {
  margin: 0 -16px;
  padding: 16px 20px 24px;
  background: linear-gradient(135deg, #1f6d58, #155d48);
}
.staff-avatar {
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  border-radius: 12px; background: rgba(255,255,255,0.2);
}

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-card {
  padding: 16px; border-radius: 10px; text-align: center;
  &.warn { background: #fef8f0; }
  &.danger { background: #fce8e4; }
  &.info { background: #e8f5f0; }
  &.neutral { background: #f4f8f5; }
}
.stat-num { font-size: 28px; font-weight: 900; color: #17362e; }
.stat-label { font-size: 12px; color: #66756f; margin-top: 4px; }

.section { border-radius: 10px; background: #fff; padding: 16px; box-shadow: 0 4px 12px rgba(29,54,46,0.04); }
.section-title { font-size: 17px; font-weight: 800; color: #17362e; }

.action-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 18px 10px; border-radius: 10px; background: #f7faf8; text-align: center;
}

.queue-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-radius: 8px; background: #f7faf8;
}
</style>
