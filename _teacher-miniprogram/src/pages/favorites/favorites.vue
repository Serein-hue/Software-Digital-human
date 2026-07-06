<script lang="ts" setup>
import { ref } from 'vue'
import { spots } from '../shared/guide-data'

definePage({
  style: {
    navigationBarTitleText: '收藏',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const selectedIds = ref(spots.map(item => item.id))

function toggleSpot(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        想看的点位
      </view>
      <view class="mt-2 text-13px text-[#66756f]">
        先收藏起来，路线里会优先安排。
      </view>
    </view>
    <view class="mt-4 space-y-3">
      <view v-for="spot in spots" :key="spot.id" class="item" @click="toggleSpot(spot.id)">
        <view>
          <view class="text-16px text-[#20372f] font-800">
            {{ spot.name }}
          </view>
          <view class="mt-1 text-12px text-[#66756f]">
            {{ spot.time }}
          </view>
        </view>
        <view :class="selectedIds.includes(spot.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" class="text-22px text-[#d2a447]" />
      </view>
    </view>
    <button class="primary-btn mt-4" @click="go('/pages/route/route')">
      按收藏排路线
    </button>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
}

.panel,
.item {
  border-radius: 8px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 10px 22px rgba(29, 54, 46, 0.07);
}

.title {
  color: #17362e;
  font-size: 20px;
  font-weight: 800;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.primary-btn {
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: #1f6d58;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  line-height: 42px;
}
</style>
