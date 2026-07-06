<script lang="ts" setup>
import { ref } from 'vue'
import { getSessionId } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '反馈',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const form = ref({
  type: 'feedback',
  content: '',
  contact: '',
})
const submitting = ref(false)
const submitted = ref(false)

const types = [
  { value: 'feedback', label: '意见建议' },
  { value: 'complaint', label: '投诉' },
  { value: 'question', label: '咨询' },
  { value: 'other', label: '其他' },
]

async function submit() {
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请填写反馈内容', icon: 'none' })
    return
  }
  submitting.value = true

  const sessionId = getSessionId()
  if (sessionId) {
    const { submitFeedback } = await import('@/api/scenic')
    const ok = await submitFeedback(sessionId, {
      type: form.value.type,
      content: form.value.content,
    })
    if (ok) {
      submitted.value = true
      uni.showToast({ title: '提交成功，感谢您的反馈', icon: 'success' })
    } else {
      uni.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  } else {
    // 模拟提交
    await new Promise(r => setTimeout(r, 600))
    submitted.value = true
    uni.showToast({ title: '提交成功', icon: 'success' })
  }
  submitting.value = false
}

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page bg-[#f4f7f3] min-h-screen px-4 pb-8 pt-4">
    <view v-if="submitted" class="panel text-center py-10">
      <view class="i-carbon-checkmark-filled text-48px text-[#1f6d58]" />
      <view class="mt-4 text-18px text-[#17362e] font-800">感谢您的反馈</view>
      <view class="mt-2 text-13px text-[#66756f]">我们会认真处理您的问题</view>
      <button class="mt-6 submit-btn max-w-200" @click="goBack">返回</button>
    </view>

    <template v-else>
      <view class="panel">
        <view class="title">反馈与投诉</view>
        <view class="mt-2 text-13px text-[#66756f]">
          告诉我们您遇到的问题或建议，我们会尽快处理。
        </view>
      </view>

      <view class="panel mt-4">
        <view class="text-15px text-[#17362e] font-700 mb-3">问题类型</view>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="t in types" :key="t.value"
            class="type-chip"
            :class="{ active: form.type === t.value }"
            @click="form.type = t.value"
          >
            {{ t.label }}
          </view>
        </view>
      </view>

      <view class="panel mt-4">
        <view class="text-15px text-[#17362e] font-700 mb-3">描述</view>
        <textarea
          v-model="form.content"
          class="textarea"
          placeholder="请详细描述您的问题或建议..."
          maxlength="500"
        />
        <view class="text-right text-12px text-[#66756f] mt-1">{{ form.content.length }}/500</view>
      </view>

      <view class="panel mt-4">
        <view class="text-15px text-[#17362e] font-700 mb-3">联系方式（选填）</view>
        <input
          v-model="form.contact"
          class="input"
          placeholder="手机号或微信号，方便我们联系您"
        />
      </view>

      <button class="submit-btn mt-6" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }
.panel {
  border-radius: 8px; background: #fff; padding: 18px;
  box-shadow: 0 10px 22px rgba(29,54,46,0.07);
}
.title { font-size: 18px; font-weight: 800; color: #17362e; }

.type-chip {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  background: #f4f8f5; color: #66756f;
}
.type-chip.active { background: #1f6d58; color: #fff; }

.textarea {
  width: 100%; height: 140px; padding: 12px; box-sizing: border-box;
  border-radius: 8px; background: #f7faf8; font-size: 14px; color: #20372f;
  resize: none; border: 0; outline: none; line-height: 1.6;
}

.input {
  width: 100%; height: 40px; padding: 0 12px; box-sizing: border-box;
  border-radius: 8px; background: #f7faf8; font-size: 14px; color: #20372f;
  border: 0; outline: none;
}

.submit-btn {
  width: 100%; display: flex; align-items: center; justify-content: center;
  height: 48px; border: 0; border-radius: 8px;
  background: #1f6d58; color: #fff; font-size: 16px; font-weight: 700; line-height: 48px;
}
.submit-btn:disabled { opacity: 0.6; }
</style>
