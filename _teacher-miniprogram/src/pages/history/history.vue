<script lang="ts" setup>
import { history } from '../shared/guide-data'

definePage({
  style: {
    navigationBarTitleText: '问过',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        最近问过
      </view>
      <view class="mt-2 text-13px text-[#66756f]">
        常问的事留在这里，下次打开还能接着看。
      </view>
    </view>
    <view class="panel mt-4">
      <view v-for="item in history" :key="item" class="question" @click="go('/pages/ask/ask')">
        {{ item }}
        <view class="mt-2 text-12px text-[#2b765f] font-800">
          接着问
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
}

.panel {
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

.question {
  border-radius: 8px;
  background: #fff7e6;
  color: #80602f;
  font-size: 13px;
  line-height: 20px;
  margin-top: 9px;
  padding: 10px 12px;

  &:first-child {
    margin-top: 0;
  }
}
</style>
