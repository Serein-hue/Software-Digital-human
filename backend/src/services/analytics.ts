import { ANALYTICS } from '../data.js'

export function getAnalytics(now = new Date()) {
  return {
    ...ANALYTICS,
    dataSource: 'static-demo',
    updatedAt: now.toISOString(),
    refreshIntervalSeconds: 300,
  }
}

export function getRealtimeAnalytics(now = new Date()) {
  return {
    currentVisitors: ANALYTICS.todayVisitors,
    trend: ANALYTICS.weekTrend,
    alerts: ANALYTICS.alerts,
    facilityStatus: ANALYTICS.facilityStatus,
    updatedAt: now.toISOString(),
    dataSource: 'static-demo',
    refreshIntervalSeconds: 5,
  }
}
