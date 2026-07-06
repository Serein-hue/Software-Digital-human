<script lang="ts" setup>
definePage({
  style: {
    navigationBarTitleText: '服务',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

interface ServiceCard {
  title: string
  desc: string
  icon: string
  note: string
  url: string
}

const services: ServiceCard[] = [
  {
    title: '看地图',
    desc: '查看景区全景、当前位置和设施分布。',
    icon: 'i-carbon-map',
    note: '导航',
    url: '/pages/map/index',
  },
  {
    title: '扫码',
    desc: '扫景点码听讲解，扫票码入园核验。',
    icon: 'i-carbon-qr-code',
    note: '扫码',
    url: '/pages/qrcode/index',
  },
  {
    title: '找厕所',
    desc: '看最近的卫生间、休息区和游客中心。',
    icon: 'i-carbon-location',
    note: '就近',
    url: '/pages/service/facilities',
  },
  {
    title: '看演出',
    desc: '查时间、位置和适合提前到达的时段。',
    icon: 'i-carbon-time',
    note: '提醒',
    url: '/pages/service/shows',
  },
  {
    title: '改路线',
    desc: '累了、赶时间、带孩子，都可以重新排。',
    icon: 'i-carbon-direction-straight-right',
    note: '少绕路',
    url: '/pages/route/route',
  },
  {
    title: '排队取号',
    desc: '热门点位线上取号，省去现场等待。',
    icon: 'i-carbon-list',
    note: '取号',
    url: '/pages/queue/index',
  },
  {
    title: '问一句',
    desc: '景点、门票、停车、吃饭，直接问一句。',
    icon: 'i-carbon-chat',
    note: '随时问',
    url: '/pages/ask/ask',
  },
  {
    title: '反馈投诉',
    desc: '遇到的问题、意见建议，告诉我们。',
    icon: 'i-carbon-flag',
    note: '反馈',
    url: '/pages/feedback/index',
  },
]

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="service-page min-h-screen bg-[#f4f7f3] px-4 pb-26 pt-4">
    <view class="intro">
      <view class="text-12px text-[#347561] font-700">
        路上用得上
      </view>
      <view class="mt-2 text-24px text-[#17362e] font-800 leading-tight">
        临时要找、要改、要问的事
      </view>
      <view class="mt-3 text-14px text-[#5f716b] leading-6">
        逛着逛着，总会临时要找点东西。常用的几件事放在这里，打开就能用。
      </view>
    </view>

    <view class="grid grid-cols-2 mt-5 gap-3">
      <view v-for="item in services" :key="item.title" class="service-card" @click="go(item.url)">
        <view class="flex items-center justify-between">
          <view class="icon-box">
            <view :class="item.icon" class="text-23px" />
          </view>
          <view class="note">
            {{ item.note }}
          </view>
        </view>
        <view class="mt-4 text-17px text-[#1f382f] font-800">
          {{ item.title }}
        </view>
        <view class="mt-2 text-12px text-[#66756f] leading-5">
          {{ item.desc }}
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="section mt-5">
      <view class="section-title">
        需要帮助？
      </view>
      <view class="mt-4 space-y-2">
        <view class="help-row" @click="go('/pages/feedback/index')">
          <view class="i-carbon-flag text-20px text-[#2b765f]" />
          <text class="text-14px text-[#41554f]">反馈与投诉</text>
        </view>
        <view class="help-row emergency" @click="go('/pages/emergency/index')">
          <view class="i-carbon-warning-filled text-20px text-[#c0392b]" />
          <text class="text-14px text-[#c0392b] font-700">紧急求助</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.intro,
.service-card,
.section {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(29, 54, 46, 0.07);
}

.intro,
.section {
  padding: 18px;
}

.service-card {
  min-height: 154px;
  padding: 15px;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #e8f2ed;
  color: #2b765f;
}

.note {
  border-radius: 999px;
  background: #fff2d8;
  padding: 4px 9px;
  color: #8c6128;
  font-size: 11px;
  font-weight: 700;
}

.section-title {
  color: #17362e;
  font-size: 18px;
  font-weight: 800;
}

.help-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  background: #f7faf8;
  padding: 14px;
}

.help-row.emergency {
  background: #fce8e4;
}
</style>
