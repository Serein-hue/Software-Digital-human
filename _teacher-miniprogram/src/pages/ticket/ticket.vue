<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getTicketOrders, getTicketProducts, type TicketOrder, type TicketProduct } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '门票',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const showCode = ref(true)
const orders = ref<TicketOrder[]>([])
const products = ref<TicketProduct[]>([])
const loading = ref(true)

onMounted(async () => {
  const [orderData, productData] = await Promise.all([
    getTicketOrders(),
    getTicketProducts(),
  ])
  orders.value = orderData
  products.value = productData
  loading.value = false
})

const currentOrder = ref(orders.value[0] || null)
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>

    <!-- 有订单时展示 -->
    <template v-else-if="orders.length">
      <view v-for="order in orders" :key="order.id" class="ticket">
        <view class="text-13px text-[#347561] font-700">
          {{ order.status === 'paid' ? '待入园核验' : order.status }}
        </view>
        <view class="mt-2 text-24px text-[#17362e] font-900">
          {{ order.productName }}
        </view>
        <view class="mt-2 text-13px text-[#66756f]">
          {{ order.quantity }} 张 · 订单号 {{ order.orderNo }}
        </view>
        <view class="qr mt-6" @click="showCode = !showCode">
          <view v-if="showCode" class="i-carbon-qr-code text-82px text-[#1f6d58]" />
          <view v-else class="text-center text-13px text-[#66756f] leading-5">
            已隐藏二维码<br>轻点再次显示
          </view>
        </view>
        <view class="mt-4 text-center text-12px text-[#66756f]">
          到检票口出示二维码
        </view>
      </view>
      <view class="panel mt-4">
        <view class="row">
          <text>入园时间</text>
          <text>{{ orders[0].visitDate || '今天 09:00-17:00' }}</text>
        </view>
        <view class="row">
          <text>使用人数</text>
          <text>{{ orders.reduce((s, o) => s + o.quantity, 0) }} 人</text>
        </view>
        <view class="row">
          <text>检票口</text>
          <text>主入口</text>
        </view>
      </view>
    </template>

    <!-- 无订单时展示票种 -->
    <template v-else>
      <view class="ticket">
        <view class="text-13px text-[#347561] font-700">
          门票信息
        </view>
        <view class="mt-2 text-13px text-[#66756f]">
          暂无订单，可通过官方渠道购票
        </view>
      </view>
      <view v-if="products.length" class="panel mt-4">
        <view class="text-15px text-[#17362e] font-800 mb-3">票种一览</view>
        <view v-for="p in products" :key="p.id" class="row">
          <text>{{ p.name }}</text>
          <text>¥{{ p.price }}</text>
        </view>
      </view>
      <view class="panel mt-4">
        <view class="text-13px text-[#66756f] text-center py-3">
          <text>🎫 通过官方小程序购票后，订单将自动显示在此处</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
}

.ticket,
.panel {
  border-radius: 8px;
  background: #fff;
  padding: 22px;
  box-shadow: 0 10px 22px rgba(29, 54, 46, 0.07);
}

.row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #edf1ee;
  color: #66756f;
  font-size: 13px;
  padding: 12px 0;

  &:last-child {
    border-bottom: 0;
  }

  text:last-child {
    color: #17362e;
    font-weight: 800;
  }
}

.qr {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  border-radius: 8px;
  background: #f7faf8;
}
</style>
