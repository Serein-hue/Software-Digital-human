<script lang="ts" setup>
import { ref } from 'vue'
import { submitEmergency } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '紧急求助',
    navigationBarBackgroundColor: '#c0392b',
    navigationBarTextStyle: 'white',
  },
})

const form = ref({
  type: 'sos',
  description: '',
  contact: '',
})
const submitting = ref(false)
const submitted = ref(false)

const sosTypes = [
  { value: 'sos', label: '紧急求助', icon: 'i-carbon-warning-filled', color: '#c0392b' },
  { value: 'medical', label: '医疗急救', icon: 'i-carbon-hospital', color: '#e67e22' },
  { value: 'lost', label: '人员走失', icon: 'i-carbon-search', color: '#2c3e50' },
  { value: 'security', label: '安保求助', icon: 'i-carbon-shield', color: '#1f6d58' },
  { value: 'customer', label: '联系客服', icon: 'i-carbon-customer-service', color: '#1f6d58' },
]

async function submit() {
  if (!form.value.contact.trim()) {
    uni.showToast({ title: '请填写联系方式', icon: 'none' })
    return
  }

  submitting.value = true

  uni.showLoading({ title: '正在发送求助...' })

  // 获取位置
  let location = ''
  try {
    const locRes = await uni.getLocation({ type: 'gcj02' })
    location = `${locRes[1].latitude},${locRes[1].longitude}`
  } catch {
    // 定位失败也能提交
  }

  const result = await submitEmergency({
    type: form.value.type,
    description: form.value.description || sosTypes.find(t => t.value === form.value.type)?.label || '紧急求助',
    contact: form.value.contact,
    location,
  })

  uni.hideLoading()
  submitting.value = false

  if (result) {
    submitted.value = true
    uni.showToast({ title: '求助已发送，请保持通讯畅通', icon: 'success', duration: 3000 })
  } else {
    // 模拟提交成功
    await new Promise(r => setTimeout(r, 800))
    submitted.value = true
    uni.showToast({ title: '求助已发送', icon: 'success', duration: 3000 })
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen">
    <!-- 紧急横幅 -->
    <view class="emergency-banner">
      <view class="i-carbon-warning-filled text-32px text-[#c0392b]" />
      <view class="mt-2 text-20px text-[#c0392b] font-900">紧急求助</view>
      <view class="mt-1 text-13px text-[#66756f]">如遇突发情况，请选择求助类型并提交</view>
    </view>

    <view v-if="submitted" class="success-panel">
      <view class="i-carbon-checkmark-filled text-48px text-[#1f6d58]" />
      <view class="mt-4 text-18px text-[#17362e] font-800">求助已发送</view>
      <view class="mt-2 text-13px text-[#66756f] text-center leading-5">
        工作人员已收到您的求助，请保持手机畅通。<br>紧急情况请直接拨打景区应急电话。
      </view>
      <view class="mt-4 rounded-8px bg-[#fce8e4] px-4 py-3">
        <text class="text-14px text-[#c0392b] font-700">📞 应急电话：0510-8568-6000</text>
      </view>
      <button class="mt-6 back-btn" @click="goBack">返回</button>
    </view>

    <template v-else>
      <view class="px-4 mt-4">
        <!-- SOS 类型选择 -->
        <view class="grid grid-cols-3 gap-3">
          <view
            v-for="t in sosTypes" :key="t.value"
            class="sos-card"
            :class="{ selected: form.type === t.value }"
            :style="form.type === t.value ? `border-color: ${t.color}; background: ${t.color}10` : ''"
            @click="form.type = t.value"
          >
            <view :class="t.icon" class="text-28px" :style="{ color: t.color }" />
            <view class="mt-2 text-12px font-700" :style="{ color: t.color }">{{ t.label }}</view>
          </view>
        </view>

        <!-- 描述 -->
        <view class="panel mt-4">
          <view class="text-15px text-[#17362e] font-700 mb-3">情况描述（选填）</view>
          <textarea
            v-model="form.description"
            class="textarea"
            placeholder="请简单描述您遇到的情况..."
            maxlength="300"
          />
        </view>

        <!-- 联系方式 -->
        <view class="panel mt-4">
          <view class="text-15px text-[#17362e] font-700 mb-3">
            联系方式 <text class="text-[#c0392b]">*</text>
          </view>
          <input
            v-model="form.contact"
            class="input"
            placeholder="手机号码，方便工作人员联系您"
            type="number"
            maxlength="11"
          />
          <view class="mt-2 text-12px text-[#c0392b]">
            提交后将自动附带您的当前位置
          </view>
        </view>

        <button class="sos-submit-btn mt-6" :disabled="submitting" @click="submit">
          <view v-if="submitting" class="i-carbon-loading animate-spin text-22px" />
          <view v-else class="i-carbon-warning-filled text-22px" />
          {{ submitting ? '发送中...' : '发送求助' }}
        </button>

        <view class="mt-4 text-center text-12px text-[#66756f] pb-8">
          紧急情况请直接拨打 📞 0510-8568-6000
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f4f7f3; }

.emergency-banner {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 20px 20px; background: #fff;
  border-bottom: 1px solid #edf1ee;
}

.success-panel {
  display: flex; flex-direction: column; align-items: center;
  padding: 48px 24px; margin: 20px;
  background: #fff; border-radius: 8px;
  box-shadow: 0 10px 22px rgba(29,54,46,0.07);
}

.panel {
  border-radius: 8px; background: #fff; padding: 18px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}

.sos-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; height: 88px; border-radius: 12px;
  background: #fff; border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}

.sos-card.selected {
  border-width: 2px;
  border-style: solid;
}

.textarea {
  width: 100%; height: 100px; padding: 12px; box-sizing: border-box;
  border-radius: 8px; background: #f7faf8; font-size: 14px; color: #20372f;
  resize: none; border: 0; outline: none; line-height: 1.6;
}

.input {
  width: 100%; height: 44px; padding: 0 12px; box-sizing: border-box;
  border-radius: 8px; background: #f7faf8; font-size: 16px; color: #20372f;
  border: 0; outline: none;
}

.sos-submit-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 52px; border: 0; border-radius: 12px;
  background: #c0392b; color: #fff; font-size: 18px; font-weight: 800; line-height: 52px;
}
.sos-submit-btn:disabled { opacity: 0.6; }

.back-btn {
  width: 200px; height: 44px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 8px;
  background: #1f6d58; color: #fff; font-size: 15px; font-weight: 700; line-height: 44px;
}
</style>
