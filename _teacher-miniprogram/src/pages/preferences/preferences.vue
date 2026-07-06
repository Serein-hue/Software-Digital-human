<script lang="ts" setup>
import { ref } from 'vue'
import { preferences } from '../shared/guide-data'

definePage({
  style: {
    navigationBarTitleText: '偏好',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const selected = ref<Record<string, string>>(
  preferences.reduce((result, item) => ({ ...result, [item.label]: item.value }), {}),
)

const options: Record<string, string[]> = {
  讲解节奏: ['慢一点，多讲故事', '短一点，只听重点'],
  同行人: ['亲子 / 长辈同行', '朋友同行', '一个人逛'],
  重点关注: ['文化典故、演出时间', '拍照点、休息点', '路线、省时间'],
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        怎么逛更舒服？
      </view>
      <view class="mt-2 text-13px text-[#66756f]">
        路线和讲解可以按你的节奏来。
      </view>
    </view>
    <view class="panel mt-4">
      <view v-for="item in preferences" :key="item.label" class="row">
        <view class="text-13px text-[#66756f]">
          {{ item.label }}
        </view>
        <view class="mt-2 flex flex-wrap gap-2">
          <view
            v-for="option in options[item.label]"
            :key="option"
            class="chip"
            :class="{ active: selected[item.label] === option }"
            @click="selected[item.label] = option"
          >
            {{ option }}
          </view>
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

.row {
  border-bottom: 1px solid #edf1ee;
  padding: 13px 0;

  &:last-child {
    border-bottom: 0;
  }
}

.chip {
  border-radius: 999px;
  background: #f7faf8;
  color: #48645b;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 11px;
}

.chip.active {
  background: #1f6d58;
  color: #fff;
}
</style>
