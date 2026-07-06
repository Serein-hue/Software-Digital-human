<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getQueues, takeQueueTicket, getQueueTicket, cancelQueueTicket, type QueueResource, type QueueTicket } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '排队取号',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const queues = ref<QueueResource[]>([])
const myTickets = ref<QueueTicket[]>([])
const loading = ref(true)
const taking = ref<string | null>(null)
const showMyTickets = ref(false)

onMounted(async () => {
  const [qData] = await Promise.all([
    getQueues(),
  ])
  queues.value = qData.length ? qData : [
    { id: 'q1', name: '九龙灌浴·最佳观赏位', currentNumber: 37, waitTime: 15, status: 'open' },
    { id: 'q2', name: '梵宫·《吉祥颂》演出', currentNumber: 102, waitTime: 25, status: 'open' },
    { id: 'q3', name: '灵山大佛·登顶通道', currentNumber: 18, waitTime: 8, status: 'open' },
  ] as QueueResource[]
  loading.value = false
})

async function takeTicket(queueId: string) {
  taking.value = queueId
  const ticket = await takeQueueTicket(queueId)
  if (ticket) {
    myTickets.value = [...myTickets.value, ticket]
    uni.showToast({ title: '取号成功', icon: 'success' })
  } else {
    uni.showToast({ title: '取号失败，请重试', icon: 'none' })
  }
  taking.value = null
}

async function cancelTicket(ticketId: string) {
  const ok = await cancelQueueTicket(ticketId)
  if (ok) {
    myTickets.value = myTickets.value.filter(t => t.id !== ticketId)
    uni.showToast({ title: '已取消', icon: 'success' })
  }
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen pb-8 px-4 pt-4">
    <!-- 我的排队 -->
    <view v-if="myTickets.length" class="panel mb-4">
      <view class="flex items-center justify-between">
        <view class="title">我的排队</view>
        <text class="text-12px text-[#1f6d58] font-700">{{ myTickets.length }} 个</text>
      </view>
      <view v-for="t in myTickets" :key="t.id" class="my-ticket mt-3">
        <view class="flex items-center justify-between">
          <view>
            <view class="text-14px text-[#20372f] font-700">排队号 {{ t.number }}</view>
            <view class="text-12px text-[#66756f] mt-1">等待 {{ t.waitCount || '—' }} 位</view>
          </view>
          <view class="flex items-center gap-2">
            <view class="status-badge">
              {{ t.status === 'waiting' ? '等待中' : t.status }}
            </view>
            <button class="cancel-btn" @click="cancelTicket(t.id)">取消</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 可排队资源 -->
    <view class="panel">
      <view class="title">当前可排队</view>
      <view class="mt-2 text-13px text-[#66756f]">
        取号后留意叫号提醒，过号需重新取号。
      </view>
    </view>

    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>
    <view v-else class="mt-4 space-y-3">
      <view v-for="q in queues" :key="q.id" class="queue-card">
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0 flex-1">
            <view class="text-16px text-[#20372f] font-800">{{ q.name }}</view>
            <view class="flex items-center gap-4 mt-2 text-12px text-[#66756f]">
              <text>当前 {{ q.currentNumber }} 号</text>
              <text>预计等待 {{ q.waitTime }} 分钟</text>
            </view>
          </view>
          <view class="queue-number">
            <text class="text-20px font-900">{{ q.currentNumber }}</text>
            <text class="text-10px">当前号</text>
          </view>
        </view>
        <view class="mt-4 flex gap-2">
          <button
            class="take-btn"
            :disabled="taking === q.id"
            @click="takeTicket(q.id)"
          >
            <view v-if="taking === q.id" class="i-carbon-loading animate-spin" />
            {{ taking === q.id ? '取号中...' : '取号' }}
          </button>
          <button class="refresh-btn" @click="getQueues">
            刷新
          </button>
        </view>
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

.queue-card {
  border-radius: 8px; background: #fff; padding: 16px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.queue-number {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 64px; height: 64px; border-radius: 50%;
  background: #e5f2ec; color: #246b58;
}
.take-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 40px; border: 0; border-radius: 8px;
  background: #1f6d58; color: #fff; font-size: 14px; font-weight: 700; line-height: 40px;
}
.take-btn:disabled { opacity: 0.6; }
.refresh-btn {
  width: 80px; height: 40px; border: 0; border-radius: 8px;
  background: #f4f8f5; color: #66756f; font-size: 14px; font-weight: 600; line-height: 40px;
}
.my-ticket {
  border-radius: 8px; background: #f7faf8; padding: 14px;
}
.status-badge {
  display: flex; align-items: center; height: 28px; padding: 0 10px;
  border-radius: 6px; background: #e8f2ed; color: #1f6d58;
  font-size: 12px; font-weight: 700;
}
.cancel-btn {
  height: 28px; padding: 0 12px; border: 0; border-radius: 6px;
  background: #fce8e4; color: #c0392b; font-size: 12px; font-weight: 600; line-height: 28px;
}
</style>
