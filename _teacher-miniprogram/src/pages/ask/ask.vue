<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { questions } from '../shared/guide-data'
import { createSession, getSessionId, sendMessage } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '问一下',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

interface Message {
  role: 'visitor' | 'guide'
  text: string
}

const draft = ref('')
const messages = ref<Message[]>([
  { role: 'guide', text: '你好！我是 Fay，灵山景区的 AI 导游。想问路线、景点、演出还是吃饭的事，尽管说~' },
])
const sending = ref(false)
const sessionReady = ref(false)

onMounted(async () => {
  // 初始化会话
  if (!getSessionId()) {
    try {
      await createSession()
    } catch {
      console.warn('[Ask] session init failed, using local mock')
    }
  }
  sessionReady.value = true
})

const hotQuestions = questions.slice(0, 6)

function pickQuestion(question: string) {
  draft.value = question
  sendQuestion()
}

async function sendQuestion() {
  const text = draft.value.trim()
  if (!text || sending.value) return

  sending.value = true
  messages.value = [...messages.value, { role: 'visitor', text }]
  draft.value = ''

  const sid = getSessionId()
  if (sid) {
    const result = await sendMessage(sid, text)
    if (result?.content || result?.text || result?.answer) {
      const reply = result.content || result.text || result.answer || ''
      messages.value = [...messages.value, { role: 'guide', text: reply }]
      sending.value = false
      return
    }
  }

  // Fallback: 本地简单回复
  let fallback = ''
  if (text.includes('老人') || text.includes('小孩')) {
    fallback = '建议走轻松路线：入口 → 灵山大佛 → 九龙灌浴 → 梵宫。台阶多的地方慢一点，中途休息几次。'
  } else if (text.includes('表演') || text.includes('演出')) {
    fallback = '今天的演出信息可以在"服务 → 看演出"里查看，建议提前 15 分钟到场。'
  } else if (text.includes('休息') || text.includes('厕所') || text.includes('卫生间')) {
    fallback = '最近的休息区在广场右侧，旁边有卫生间和饮水点。'
  } else if (text.includes('门票') || text.includes('价格') || text.includes('多少钱')) {
    fallback = '成人票 210 元，学生票 105 元，70 岁以上免票。建议通过官方小程序提前购票。'
  } else {
    fallback = '这个问题我需要查一下资料才能回答。你可以试试问路线、演出时间或景点介绍。'
  }
  messages.value = [...messages.value, { role: 'guide', text: fallback }]
  sending.value = false
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        想问什么？
      </view>
      <view class="mt-2 text-13px text-[#66756f] leading-5">
        可以直接问路线、景点、演出、吃饭和附近设施。
      </view>
      <view class="ask-box mt-4" @click="sendQuestion">
        <input
          v-model="draft"
          class="flex-1 text-14px text-[#20372f] outline-none bg-transparent"
          placeholder="例如：下一场演出在哪里看？"
          :confirm-type="'send'"
          @confirm="sendQuestion"
        />
        <view class="i-carbon-send text-20px text-[#2b765f]" @click="sendQuestion" />
      </view>
    </view>

    <!-- 热门问题 -->
    <view class="panel mt-4">
      <view class="title">
        试着这样问
      </view>
      <view class="mt-3 space-y-2">
        <view
          v-for="item in hotQuestions"
          :key="item"
          class="question"
          @click="pickQuestion(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 对话记录 -->
    <view class="panel mt-4">
      <view class="title">
        最近对话
      </view>
      <view v-if="sending" class="mt-3 text-13px text-[#66756f]">
        Fay 正在输入...
      </view>
      <view class="mt-3 space-y-3">
        <view v-for="item in messages.slice(-10)" :key="item.text + Math.random()" :class="item.role === 'visitor' ? 'bubble mine' : 'bubble'">
          {{ item.text }}
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
  font-size: 18px;
  font-weight: 800;
  color: #17362e;
}

.ask-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background: #f4f8f5;
  padding: 12px 14px;
}

.question {
  border-radius: 8px;
  background: #f7faf8;
  color: #41554f;
  font-size: 14px;
  line-height: 20px;
  padding: 12px 14px;
}

.question.active {
  background: #e8f2ed;
  color: #1f6d58;
  font-weight: 700;
}

.bubble {
  border-radius: 8px;
  background: #f7faf8;
  color: #41554f;
  font-size: 14px;
  line-height: 22px;
  padding: 12px 14px;
  max-width: 85%;
}

.bubble.mine {
  background: #1f6d58;
  color: #fff;
  margin-left: auto;
}
</style>
