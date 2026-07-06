<script lang="ts" setup>
import { ref } from 'vue'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '登录',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const loading = ref(false)

async function handleWxLogin() {
  loading.value = true
  try {
    await tokenStore.wxLogin()
    uni.showToast({ title: '登录成功', icon: 'success' })
    // 登录成功后返回上一页
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    console.error('登录失败:', e)
    uni.showToast({ title: '登录失败，请重试', icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login-page min-h-screen bg-[#f4f7f3] flex flex-col items-center justify-center px-8">
    <view class="login-card">
      <view class="logo-area">
        <view class="logo-icon i-carbon-user-avatar text-48px text-[#1f6d58]" />
        <view class="mt-4 text-22px text-[#17362e] font-900">
          灵山胜境 · AI导游
        </view>
        <view class="mt-2 text-14px text-[#66756f]">
          登录保存行程和提问记录
        </view>
      </view>

      <view class="mt-10 w-full">
        <button
          class="wx-login-btn"
          :disabled="loading"
          @click="handleWxLogin"
        >
          <view v-if="loading" class="i-carbon-loading animate-spin text-22px" />
          <view v-else class="i-carbon-logo-wechat text-22px" />
          {{ loading ? '登录中...' : '微信一键登录' }}
        </button>

        <view class="mt-4 text-center">
          <text class="text-12px text-[#9aa8a2]">
            登录即表示同意《用户协议》和《隐私政策》
          </text>
        </view>
      </view>

      <view class="mt-8 w-full">
        <view class="divider">
          <text class="text-12px text-[#9aa8a2]">或</text>
        </view>
        <view class="mt-4 text-center">
          <text class="text-14px text-[#66756f]" @click="uni.navigateBack()">
            先逛逛再说
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(29, 54, 46, 0.08);
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #e8f2ed;
}

.wx-login-btn {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  background: #1f6d58;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 50px;
}

.wx-login-btn:disabled {
  opacity: 0.6;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e9e6;
    margin: 0 12px;
  }
}
</style>
