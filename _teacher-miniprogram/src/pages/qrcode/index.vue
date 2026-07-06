<script lang="ts" setup>
import { ref } from 'vue'
import { resolveQRCode } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '扫码',
    navigationBarBackgroundColor: '#17372f',
    navigationBarTextStyle: 'white',
  },
})

const scanning = ref(false)
const result = ref<{ type: string; targetId: string; action: string; name?: string } | null>(null)
const error = ref('')

function startScan() {
  scanning.value = true
  error.value = ''
  result.value = null

  // #ifdef MP-WEIXIN
  uni.scanCode({
    onlyFromCamera: false,
    scanType: ['qrCode', 'barCode'],
    success: async (res) => {
      const code = res.result
      try {
        const data = await resolveQRCode(code)
        if (data) {
          result.value = data
          // 根据类型自动跳转
          handleResult(data)
        } else {
          error.value = '未识别的二维码'
        }
      } catch {
        error.value = '二维码解析失败，请重试'
      }
      scanning.value = false
    },
    fail: (err) => {
      scanning.value = false
      if (err.errMsg !== 'scanCode:fail cancel') {
        error.value = '扫码失败，请重试'
      }
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  // H5 模拟
  setTimeout(() => {
    result.value = { type: 'spot', targetId: 'LS-001', action: 'guide', name: '灵山大佛' }
    handleResult(result.value)
    scanning.value = false
  }, 1000)
  // #endif
}

function handleResult(data: { type: string; targetId: string; action: string; name?: string }) {
  if (data.action === 'guide' || data.type === 'spot') {
    uni.navigateTo({ url: `/pages/audio/audio` })
  } else if (data.action === 'verify' || data.type === 'ticket') {
    uni.navigateTo({ url: `/pages/ticket/ticket` })
  } else if (data.action === 'queue') {
    uni.navigateTo({ url: `/pages/queue/index` })
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="scan-page">
    <view class="scan-header">
      <button class="back-btn" @click="goBack">◀</button>
      <text class="text-17px text-white font-800">扫码</text>
      <view style="width:36px" />
    </view>

    <view class="scan-content">
      <!-- 扫码框 -->
      <view class="viewfinder">
        <view class="viewfinder-frame">
          <view class="corner tl" />
          <view class="corner tr" />
          <view class="corner bl" />
          <view class="corner br" />
          <view class="scan-line" />
        </view>
      </view>

      <text class="text-14px text-white/82 mt-4 text-center">
        将二维码置于框内，自动识别
      </text>

      <!-- 结果 -->
      <view v-if="error" class="mt-6 rounded-8px bg-[rgba(192,57,43,0.2)] px-4 py-3">
        <text class="text-13px text-[#f5a097]">{{ error }}</text>
      </view>

      <view v-if="result" class="mt-6 rounded-8px bg-white/12 px-4 py-3">
        <text class="text-13px text-white/90">✅ 已识别：{{ result.name || result.targetId }}</text>
      </view>

      <!-- 按钮 -->
      <button class="scan-btn mt-10" :disabled="scanning" @click="startScan">
        <view v-if="scanning" class="i-carbon-loading text-22px animate-spin" />
        <view v-else class="i-carbon-qr-code text-22px" />
        <text>{{ scanning ? '识别中...' : '开始扫码' }}</text>
      </button>

      <!-- 快捷选项 -->
      <view class="mt-8 w-full px-8">
        <text class="text-12px text-white/50 block text-center mb-3">也可以手动输入</text>
        <view class="flex gap-3 justify-center">
          <view class="quick-chip" @click="startScan">
            <view class="i-carbon-camera text-18px" />
            <text class="text-12px mt-1">景点码</text>
          </view>
          <view class="quick-chip" @click="startScan">
            <view class="i-carbon-ticket text-18px" />
            <text class="text-12px mt-1">票务码</text>
          </view>
          <view class="quick-chip" @click="startScan">
            <view class="i-carbon-event text-18px" />
            <text class="text-12px mt-1">活动码</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.scan-page {
  min-height: 100vh;
  background: #0d1f1a;
  display: flex;
  flex-direction: column;
}

.scan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 14px;
}

.scan-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.viewfinder {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewfinder-frame {
  position: relative;
  width: 100%;
  height: 100%;
}

.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: #1f6d58;
  border-style: solid;
}

.corner.tl { top: 0; left: 0; border-width: 4px 0 0 4px; }
.corner.tr { top: 0; right: 0; border-width: 4px 4px 0 0; }
.corner.bl { bottom: 0; left: 0; border-width: 0 0 4px 4px; }
.corner.br { bottom: 0; right: 0; border-width: 0 4px 4px 0; }

.scan-line {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  background: #1f6d58;
  box-shadow: 0 0 12px rgba(31,109,88,0.6);
  animation: scanMove 2.4s linear infinite;
}

@keyframes scanMove {
  0% { top: 12px; }
  50% { top: calc(100% - 12px); }
  100% { top: 12px; }
}

.scan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 200px;
  height: 48px;
  border: 0;
  border-radius: 24px;
  background: #1f6d58;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 48px;
}

.scan-btn:active {
  background: #155546;
}

.quick-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 72px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
}
</style>
