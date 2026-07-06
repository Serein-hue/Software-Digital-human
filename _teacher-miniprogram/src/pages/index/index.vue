<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getSpots, getNotices, getEvents, getRoutes, type SpotItem, type NoticeItem, type EventItem, type RouteItem, createSession } from '@/api/scenic'

defineOptions({
  name: 'Home',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '导览',
  },
})

interface QuickAction {
  title: string
  desc: string
  icon: string
  tone: string
  url: string
}

const quickActions: QuickAction[] = [
  {
    title: '问一句',
    desc: '景点、演出、路线都可以问',
    icon: 'i-carbon-chat',
    tone: 'from-[#2c7a67] to-[#4aa284]',
    url: '/pages/ask/ask',
  },
  {
    title: '听讲解',
    desc: '走到哪里，听到哪里',
    icon: 'i-carbon-volume-up',
    tone: 'from-[#335c8a] to-[#5b7fb0]',
    url: '/pages/audio/audio',
  },
  {
    title: '看路线',
    desc: '少绕路，轻松逛完重点',
    icon: 'i-carbon-map',
    tone: 'from-[#9a6a28] to-[#c08d42]',
    url: '/pages/route/route',
  },
]

const spots = ref<SpotItem[]>([])
const notices = ref<NoticeItem[]>([])
const events = ref<EventItem[]>([])
const topRoutes = ref<RouteItem[]>([])
const loading = ref(true)

onMounted(async () => {
  // 先初始化会话
  createSession().catch(() => {})

  // 并发加载首页数据
  const [spotsData, noticesData, eventsData, routesData] = await Promise.all([
    getSpots({ limit: 3 }).catch(() => [] as SpotItem[]),
    getNotices().catch(() => [] as NoticeItem[]),
    getEvents().catch(() => [] as EventItem[]),
    getRoutes().catch(() => [] as RouteItem[]),
  ])
  spots.value = spotsData
  notices.value = noticesData.filter(n => n.active !== false).slice(0, 2)
  events.value = eventsData.slice(0, 3)
  topRoutes.value = routesData.slice(0, 1)
  loading.value = false
})

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="guide-page min-h-screen bg-[#f4f7f3] pb-26 pt-safe">
    <view class="hero px-5 pb-7 pt-5 text-white">
      <view class="flex items-center justify-between">
        <view>
          <view class="text-13px opacity-82">
            灵山景区
          </view>
          <view class="mt-1 text-26px font-700 leading-tight">
            今天想怎么逛？
          </view>
        </view>
        <view class="status-pill">
          游客导览
        </view>
      </view>

      <!-- 公告横幅 -->
      <view v-if="notices.length" class="mt-4">
        <view
          v-for="n in notices" :key="n.id"
          class="rounded-8px px-3 py-2 mb-2"
          :class="n.type === 'warning' ? 'bg-[rgba(255,200,50,0.2)]' : 'bg-white/12'"
        >
          <text class="text-12px font-600">{{ n.type === 'warning' ? '⚠️ ' : '📢 ' }}{{ n.title }}</text>
        </view>
      </view>

      <view class="mt-4 rounded-8px bg-white/12 p-4 backdrop-blur">
        <view class="flex items-center gap-3">
          <view class="avatar-ring">
            <view class="i-carbon-user-avatar-filled text-42px" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="text-17px font-600">
              Fay 在这儿
            </view>
            <view class="mt-1 text-13px leading-5 opacity-82">
              告诉我你有多少时间、想看什么，我来帮你安排。
            </view>
          </view>
        </view>
        <view class="mt-4 flex gap-2">
          <button class="primary-btn flex-1" @click="go('/pages/ask/ask')">
            <view class="i-carbon-microphone text-18px" />
            开始问
          </button>
          <button class="ghost-btn" @click="go('/pages/audio/audio')">
            <view class="i-carbon-headphones text-18px" />
          </button>
        </view>
        <view class="mt-3 flex gap-2">
          <button class="secondary-btn flex-1" @click="go('/pages/map/index')">
            <view class="i-carbon-map text-14px" />
            地图
          </button>
          <button class="secondary-btn flex-1" @click="go('/pages/qrcode/index')">
            <view class="i-carbon-qr-code text-14px" />
            扫码
          </button>
        </view>
      </view>
    </view>

    <view class="px-4 -mt-4">
      <view class="grid grid-cols-3 gap-3">
        <view
          v-for="item in quickActions"
          :key="item.title"
          class="action-card"
          :class="`bg-gradient-to-br ${item.tone}`"
          @click="go(item.url)"
        >
          <view :class="item.icon" class="text-24px text-white" />
          <view class="mt-3 text-15px text-white font-700">
            {{ item.title }}
          </view>
          <view class="mt-1 text-11px text-white/82 leading-4">
            {{ item.desc }}
          </view>
        </view>
      </view>
    </view>

    <!-- 推荐路线 -->
    <view v-if="topRoutes.length" class="mt-5 px-4">
      <view class="section-title">
        推荐路线
      </view>
      <view class="route-panel" @click="go('/pages/route/route')">
        <view class="flex items-center justify-between">
          <view>
            <view class="text-18px text-[#17362e] font-700">
              {{ topRoutes[0].name || '推荐游览路线' }}
            </view>
            <view class="mt-1 text-12px text-[#65746f]">
              {{ topRoutes[0].duration || '约 3-4 小时' }}
            </view>
          </view>
          <view class="route-score">
            {{ topRoutes[0].difficulty || '轻松' }}
          </view>
        </view>
        <view v-if="topRoutes[0].stops?.length" class="grid grid-cols-4 mt-4 gap-2">
          <view v-for="step in topRoutes[0].stops.slice(0, 4)" :key="step.spotName" class="route-step">
            {{ step.spotName }}
          </view>
        </view>
      </view>
    </view>

    <!-- 现在适合去 -->
    <view class="mt-5 px-4">
      <view class="mb-3 flex items-center justify-between">
        <view class="section-title">
          现在适合去
        </view>
        <view class="text-12px text-[#2f7c68]" @click="go('/pages/spots/spots')">
          查看全部
        </view>
      </view>

      <view v-if="loading" class="py-8 text-center text-13px text-[#66756f]">
        加载中...
      </view>
      <view v-else class="space-y-3">
        <view v-for="spot in spots" :key="spot.id" class="spot-card" @click="go('/pages/spots/spots')">
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0 flex-1">
              <view class="flex items-center gap-2">
                <view class="spot-dot" />
                <view class="text-16px text-[#20372f] font-700">
                  {{ spot.name }}
                </view>
              </view>
              <view class="mt-2 text-13px text-[#66746f] leading-5">
                {{ spot.summary || spot.shortIntro || '' }}
              </view>
            </view>
            <view class="text-right">
              <view v-if="spot.tags?.length" class="tag">
                {{ spot.tags[0] }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 今日演出 -->
    <view v-if="events.length" class="mt-5 px-4">
      <view class="section-title">
        今日演出
      </view>
      <view class="mt-3 space-y-2">
        <view v-for="ev in events" :key="ev.id" class="event-row" @click="go('/pages/service/shows')">
          <view class="text-14px text-[#20372f] font-700">
            {{ ev.name }}
          </view>
          <view class="mt-1 text-12px text-[#66756f]">
            {{ ev.time || '' }} {{ ev.description ? '· ' + ev.description : '' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.guide-page {
  color: #20372f;
}

.hero {
  background:
    radial-gradient(circle at 80% 10%, rgba(255, 222, 155, 0.22), transparent 30%),
    linear-gradient(145deg, #17372f 0%, #275f51 58%, #7f6637 100%);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.status-pill,
.tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
}

.status-pill {
  background: rgba(255, 255, 255, 0.16);
  color: #eaf7ef;
}

.avatar-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
}

.primary-btn,
.ghost-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  line-height: 42px;
}

.primary-btn {
  gap: 6px;
  background: #f5d58d;
  color: #17372f;
}

.ghost-btn {
  width: 48px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 36px;
}

.action-card,
.route-panel,
.spot-card {
  border-radius: 8px;
  box-shadow: 0 10px 22px rgba(29, 54, 46, 0.07);
}

.action-card {
  min-height: 118px;
  padding: 14px 12px;
}

.event-row {
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
  box-shadow: 0 4px 12px rgba(29, 54, 46, 0.04);
}

.section-title {
  font-size: 17px;
  font-weight: 800;
  color: #17362e;
}

.route-panel,
.spot-card {
  background: #fff;
  padding: 16px;
}

.route-score {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #e5f2ec;
  color: #246b58;
  font-size: 13px;
  font-weight: 800;
}

.route-step {
  min-height: 42px;
  border-radius: 8px;
  background: #f2f6f3;
  padding: 10px 6px;
  color: #48645b;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}

.spot-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d7a647;
}

.tag {
  background: #fff2d8;
  color: #8c6128;
}
</style>
