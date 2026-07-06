<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { history, preferences } from '../shared/guide-data'

definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()

const isLoggedIn = computed(() => tokenStore.hasLogin)
const userInfo = computed(() => userStore.userInfo)
const isStaff = computed(() => userInfo.value?.role === 'staff')
const displayName = computed(() => {
  if (!isLoggedIn.value) return '未登录'
  return userInfo.value?.staffName || userInfo.value?.nickname || '游客'
})
const displayDesc = computed(() => {
  if (!isLoggedIn.value) return '登录后保存行程和提问记录'
  if (isStaff.value) {
    return userInfo.value?.staffTitle || '景区工作人员'
  }
  return '游客 · 登录后可保存记录'
})

interface ServiceItem {
  title: string
  desc: string
  icon: string
  url: string
}

const services: ServiceItem[] = [
  { title: '门票', desc: '待入园核验', icon: 'i-carbon-ticket', url: '/pages/ticket/ticket' },
  { title: '收藏', desc: '3 个想看的点位', icon: 'i-carbon-star', url: '/pages/favorites/favorites' },
  { title: '附近服务', desc: '休息区、餐饮、卫生间', icon: 'i-carbon-location-filled', url: '/pages/service/facilities' },
  { title: '反馈投诉', desc: '意见建议或遇到的问题', icon: 'i-carbon-flag', url: '/pages/feedback/index' },
  { title: '排队取号', desc: '热门点位线上排队', icon: 'i-carbon-list', url: '/pages/queue/index' },
]

function go(url: string) {
  uni.navigateTo({ url })
}

async function handleLogin() {
  if (isLoggedIn.value) return
  // 先尝试微信登录
  try {
    await tokenStore.wxLogin()
  } catch {
    // 如果登录失败，跳转到登录页
    uni.navigateTo({ url: '/pages/login/index' })
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新登录',
    success: (res) => {
      if (res.confirm) {
        tokenStore.logout()
      }
    },
  })
}
</script>

<template>
  <view class="me-page min-h-screen bg-[#f4f7f3] px-4 pb-26 pt-4">
    <!-- 用户信息卡片 -->
    <view class="profile-card" @click="handleLogin">
      <view class="flex items-center gap-4">
        <image
          :src="userInfo?.avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
          class="avatar"
        />
        <view class="min-w-0 flex-1">
          <view class="text-20px text-[#17362e] font-800">
            {{ displayName }}
            <text v-if="isStaff" class="ml-2 text-12px bg-[#1f6d58] text-white px-2 py-0.5 rounded-full">员工</text>
          </view>
          <view class="mt-1 text-13px text-[#66756f]">
            {{ displayDesc }}
          </view>
        </view>
        <button v-if="!isLoggedIn" class="login-btn">登录</button>
      </view>

      <view class="grid grid-cols-3 mt-5 gap-3">
        <view class="stat">
          <view class="stat-num">3.5h</view>
          <view class="stat-label">预计用时</view>
        </view>
        <view class="stat">
          <view class="stat-num">4</view>
          <view class="stat-label">已选点位</view>
        </view>
        <view class="stat">
          <view class="stat-num">35%</view>
          <view class="stat-label">行程进度</view>
        </view>
      </view>
    </view>

    <!-- 员工工作台入口（仅 staff 可见） -->
    <view v-if="isStaff" class="section staff-section mt-4" @click="go('/pages/staff/index')">
      <view class="flex items-center gap-3">
        <view class="staff-icon i-carbon-tool-box text-24px text-[#1f6d58]" />
        <view class="flex-1">
          <view class="text-17px text-[#17362e] font-800">员工工作台</view>
          <view class="text-12px text-[#66756f] mt-1">工单 · 应急 · 反馈 · 实时看板</view>
        </view>
        <view class="i-carbon-chevron-right text-18px text-[#9aa8a2]" />
      </view>
    </view>

    <!-- 游客常用服务 -->
    <view class="section mt-5">
      <view class="section-title">常用</view>
      <view class="mt-4 space-y-3">
        <view v-for="item in services" :key="item.title" class="service-row" @click="go(item.url)">
          <view class="service-icon">
            <view :class="item.icon" class="text-20px" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="text-15px text-[#20372f] font-800">{{ item.title }}</view>
            <view class="mt-1 text-12px text-[#66756f]">{{ item.desc }}</view>
          </view>
          <view class="i-carbon-chevron-right text-18px text-[#9aa8a2]" />
        </view>
      </view>
    </view>

    <view class="section mt-5">
      <view class="section-title">偏好</view>
      <view class="mt-4 space-y-3" @click="go('/pages/preferences/preferences')">
        <view v-for="item in preferences" :key="item.label" class="preference-row">
          <text class="text-13px text-[#66756f]">{{ item.label }}</text>
          <text class="text-13px text-[#17362e] font-800">{{ item.value }}</text>
        </view>
      </view>
    </view>

    <!-- 紧急求助 -->
    <view class="emergency-card mt-5" @click="go('/pages/emergency/index')">
      <view class="i-carbon-warning-filled text-28px text-[#c0392b]" />
      <view class="ml-3">
        <view class="text-17px text-[#c0392b] font-800">紧急求助</view>
        <view class="mt-1 text-12px text-[#66756f]">SOS · 医疗 · 走失 · 安保</view>
      </view>
      <view class="i-carbon-chevron-right text-18px text-[#c0392b] ml-auto" />
    </view>

    <!-- 已登录才显示退出 -->
    <view v-if="isLoggedIn" class="mt-6 text-center">
      <text class="text-13px text-[#c0392b]" @click="handleLogout">退出登录</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.profile-card,
.section { border-radius: 8px; background: #fff; box-shadow: 0 10px 22px rgba(29, 54, 46, 0.07); }
.profile-card, .section { padding: 18px; }

.avatar { width: 58px; height: 58px; border-radius: 18px; background: #e8f2ed; }
.login-btn { height: 34px; border: 0; border-radius: 8px; background: #1f6d58; color: #fff; font-size: 13px; font-weight: 800; line-height: 34px; }

.stat { border-radius: 8px; background: #f4f8f5; padding: 11px 6px; text-align: center; }
.stat-num { color: #1f6d58; font-size: 18px; font-weight: 900; }
.stat-label { margin-top: 3px; color: #7a8b85; font-size: 11px; }

.staff-section {
  border-left: 3px solid #1f6d58;
}
.staff-icon {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border-radius: 10px; background: #e8f2ed;
}

.section-title { color: #17362e; font-size: 18px; font-weight: 800; }
.service-row, .preference-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.service-row { border-radius: 8px; background: #f7faf8; padding: 13px 14px; }
.service-icon { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: #e8f2ed; color: #2b765f; }
.preference-row { border-bottom: 1px solid #edf1ee; padding-bottom: 10px; &:last-child { border-bottom: 0; padding-bottom: 0; } }
.emergency-card { display: flex; align-items: center; border-radius: 8px; background: #fce8e4; padding: 16px 18px; box-shadow: 0 4px 12px rgba(192,57,43,0.1); }
</style>
