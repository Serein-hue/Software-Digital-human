/**
 * 位置追踪 Hook — 每隔 30 秒获取当前位置并上报服务端
 * 用于后台实时客流统计
 */
import { onHide, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getSessionId, reportLocation } from '@/api/scenic'

// 上报间隔（毫秒）
const REPORT_INTERVAL = 30_000

let timer: ReturnType<typeof setInterval> | null = null
const isTracking = ref(false)

/** 开始定时上报位置 */
export function useLocationTracker() {
  onShow(() => {
    if (timer) return
    startTracking()
  })

  onHide(() => {
    stopTracking()
  })

  return { isTracking }
}

/** 主动启动追踪 */
export function startTracking() {
  if (timer) return
  isTracking.value = true

  // 立即上报一次
  reportOnce()

  // 每 30 秒上报一次
  timer = setInterval(() => {
    reportOnce()
  }, REPORT_INTERVAL)
}

/** 主动停止追踪 */
export function stopTracking() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isTracking.value = false
}

async function reportOnce() {
  const sessionId = getSessionId()
  if (!sessionId) return

  try {
    const res = await uni.getLocation({
      type: 'gcj02',
      fail: () => {}, // 定位失败不阻塞
    })
    if (res[1]) {
      const { latitude, longitude } = res[1]
      // 静默上报，失败不重要
      reportLocation(sessionId, latitude, longitude).catch(() => {})
    }
  } catch {
    // 定位失败不阻塞
  }
}
