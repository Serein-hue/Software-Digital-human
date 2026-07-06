<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getWorkOrders, handleWorkOrder, resolveWorkOrder, closeWorkOrder, type WorkOrderItem } from '@/api/staff'

definePage({
  style: {
    navigationBarTitleText: '工单管理',
    navigationBarBackgroundColor: '#1f6d58',
    navigationBarTextStyle: 'white',
  },
})

const items = ref<WorkOrderItem[]>([])
const loading = ref(true)
const actionLoading = ref<string | null>(null)
const page = ref(1)
const totalPages = ref(1)
const statusFilter = ref('')
const expandedId = ref<string | null>(null)

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
]

const CATEGORY_MAP: Record<string, string> = {
  complaint: '投诉', suggestion: '建议', repair: '维修', other: '其他',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#e89460', processing: '#15bba0', resolved: '#155d58', closed: '#6b7280',
}
const STATUS_LABELS: Record<string, string> = {
  pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭',
}

async function load() {
  loading.value = true
  const result = await getWorkOrders(page.value, 20, statusFilter.value || undefined)
  if (result) {
    items.value = result.items
    totalPages.value = result.pagination.total_pages
  }
  loading.value = false
}

onMounted(load)

function filterBy(s: string) {
  statusFilter.value = s
  page.value = 1
  load()
}

async function doAction(id: string, action: () => Promise<boolean>, msg: string) {
  actionLoading.value = id
  const ok = await action()
  if (ok) {
    uni.showToast({ title: msg, icon: 'success' })
    load()
  } else {
    uni.showToast({ title: '操作失败', icon: 'error' })
  }
  actionLoading.value = null
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen px-4 pb-8">
    <!-- 状态筛选 -->
    <view class="filter-bar mt-3">
      <view
        v-for="opt in STATUS_OPTIONS" :key="opt.value"
        class="filter-chip"
        :class="{ active: statusFilter === opt.value }"
        @click="filterBy(opt.value)"
      >
        {{ opt.label }}
      </view>
    </view>

    <!-- 列表 -->
    <view v-if="loading" class="flex justify-center mt-20">
      <view class="i-carbon-loading animate-spin text-28px text-[#1f6d58]" />
    </view>

    <view v-else-if="items.length === 0" class="empty-state mt-20">
      <view class="i-carbon-document text-48px text-[#9aa8a2]" />
      <text class="mt-3 text-15px text-[#66756f]">暂无工单</text>
    </view>

    <template v-else>
      <view class="mt-4 space-y-3">
        <view
          v-for="item in items" :key="item.id"
          class="order-card"
          :class="{ expanded: expandedId === item.id }"
        >
          <view class="card-main" @click="toggleExpand(item.id)">
            <view class="flex items-center gap-2 flex-1 min-w-0">
              <text class="category-tag">{{ CATEGORY_MAP[item.category] || item.category }}</text>
              <text class="desc text-13px text-[#20372f] truncate">{{ item.description }}</text>
            </view>
            <view class="flex items-center gap-2 shrink-0">
              <text class="status-badge" :style="{ color: STATUS_COLORS[item.status], background: STATUS_COLORS[item.status] + '18' }">
                {{ STATUS_LABELS[item.status] || item.status }}
              </text>
              <view class="i-carbon-chevron-down text-16px text-[#9aa8a2]" :class="{ open: expandedId === item.id }" />
            </view>
          </view>

          <view v-if="expandedId === item.id" class="card-detail">
            <view class="detail-section">
              <text class="text-13px text-[#66756f]">{{ item.description }}</text>
              <view class="meta-grid mt-3">
                <text v-if="item.location">📍 {{ item.location }}</text>
                <text v-if="item.contact">📞 {{ item.contact }}</text>
                <text v-if="item.handler">👤 处理人: {{ item.handler }}</text>
                <text v-if="item.resolution">✅ 解决: {{ item.resolution }}</text>
                <text>🕐 {{ item.createdAt }}</text>
              </view>
            </view>
            <view class="action-bar mt-3">
              <button
                v-if="item.status === 'pending'"
                class="action-btn primary"
                :disabled="actionLoading === item.id"
                @click="doAction(item.id, () => handleWorkOrder(item.id), '已受理')"
              >
                <view v-if="actionLoading === item.id" class="i-carbon-loading animate-spin" />受理
              </button>
              <button
                v-if="item.status === 'processing'"
                class="action-btn success"
                :disabled="actionLoading === item.id"
                @click="doAction(item.id, () => resolveWorkOrder(item.id), '已解决')"
              >
                <view v-if="actionLoading === item.id" class="i-carbon-loading animate-spin" />解决
              </button>
              <button
                v-if="item.status === 'resolved'"
                class="action-btn"
                :disabled="actionLoading === item.id"
                @click="doAction(item.id, () => closeWorkOrder(item.id), '已关闭')"
              >
                <view v-if="actionLoading === item.id" class="i-carbon-loading animate-spin" />关闭
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 分页 -->
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

.filter-bar {
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
}
.filter-chip {
  padding: 6px 14px; border-radius: 999px; font-size: 12px; white-space: nowrap;
  background: #eef2ef; color: #66756f;
  &.active { background: #1f6d58; color: #fff; }
}

.order-card {
  border-radius: 10px; background: #fff; overflow: hidden;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.card-main {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; gap: 8px;
}
.category-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
  background: #e8f2ed; color: #2b765f; white-space: nowrap;
}
.status-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap;
}
.i-carbon-chevron-down { transition: transform 0.2s; }
.i-carbon-chevron-down.open { transform: rotate(180deg); }

.card-detail {
  padding: 0 16px 16px; border-top: 1px solid #edf1ee;
}
.meta-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
  > text { font-size: 12px; color: #66756f; }
}
.action-bar {
  display: flex; gap: 8px;
}
.action-btn {
  display: flex; align-items: center; gap: 4px;
  height: 34px; padding: 0 14px; border: 0; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  background: #eef2ef; color: #66756f;
  &.primary { background: #1f6d58; color: #fff; }
  &.success { background: #15bba0; color: #fff; }
  &:disabled { opacity: 0.5; }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
}

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.page-btn {
  padding: 6px 14px; border: 0; border-radius: 8px;
  background: #eef2ef; font-size: 12px; color: #66756f;
  &:disabled { opacity: 0.4; }
}
</style>
