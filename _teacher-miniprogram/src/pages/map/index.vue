<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getMapPOIs, getMapLayers, type MapPOI } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '地图',
    navigationBarBackgroundColor: '#17372f',
    navigationBarTextStyle: 'white',
  },
})

const pois = ref<MapPOI[]>([])
const layers = ref<any[]>([])
const loading = ref(true)
const activeFilter = ref('全部')
const selectedPOI = ref<MapPOI | null>(null)
const showPanel = ref(false)

const filters = ['全部', '景点', '设施', '出入口', '关闭区域']

// 地图中心（默认灵山胜境）
const centerLat = ref(31.433)
const centerLng = ref(120.093)

// 当前定位
const myLatitude = ref(31.433)
const myLongitude = ref(120.093)
const gotLocation = ref(false)

// 筛选后的 POI
const filteredPOIs = computed(() => {
  if (activeFilter.value === '全部') return pois.value
  const map: Record<string, string> = { '景点': 'spot', '设施': 'service', '出入口': 'entrance', '关闭区域': 'danger' }
  const type = map[activeFilter.value]
  return pois.value.filter(p => p.type === type)
})

// 地图标记
const markers = computed(() => {
  const result: any[] = []
  // POI 标记
  const colorMap: Record<string, string> = {
    spot: '#2b765f',
    facility: '#8c6128',
    entrance: '#335c8a',
    danger: '#c0392b',
    service: '#2b765f',
  }
  filteredPOIs.value.forEach((poi, idx) => {
    result.push({
      id: idx + 1,
      latitude: poi.latitude,
      longitude: poi.longitude,
      width: 28,
      height: 36,
      callout: {
        content: poi.name,
        fontSize: 12,
        borderRadius: 4,
        padding: '3px 8px',
        bgColor: poi.type === 'danger' ? '#c0392b' : (colorMap[poi.type] || '#1f6d58'),
        color: '#fff',
        display: 'BYCLICK',
      },
    })
  })
  return result
})

onMounted(async () => {
  // 获取定位
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      myLatitude.value = res.latitude
      myLongitude.value = res.longitude
      centerLat.value = res.latitude
      centerLng.value = res.longitude
      gotLocation.value = true
    },
    fail: () => {
      console.warn('[Map] 定位失败，使用默认位置')
    },
  })

  // 加载 POI 数据
  const [poiData, layerData] = await Promise.all([
    getMapPOIs(),
    getMapLayers(),
  ])
  pois.value = poiData.length ? poiData : getMockPOIs()
  layers.value = layerData
  loading.value = false
})

function onMarkerTap(e: any) {
  const { markerId } = e.detail
  const idx = markerId - 1
  if (idx < 0 || idx >= filteredPOIs.value.length) return
  const poi = filteredPOIs.value[idx]
  if (poi) {
    selectedPOI.value = poi
    showPanel.value = true
  }
}

function closePanel() {
  showPanel.value = false
  selectedPOI.value = null
}

function goToSpot() {
  if (!selectedPOI.value) return
  uni.navigateTo({ url: `/pages/spots/spots` })
}

function getMockPOIs(): MapPOI[] {
  return [
    { id: 'm1', name: '灵山大佛', type: 'spot', latitude: 31.435, longitude: 120.095, description: '世界最高露天青铜立像' },
    { id: 'm2', name: '九龙灌浴', type: 'spot', latitude: 31.4335, longitude: 120.0925, description: '动态音乐群雕表演' },
    { id: 'm3', name: '梵宫', type: 'spot', latitude: 31.432, longitude: 120.091, description: '佛教艺术殿堂' },
    { id: 'm4', name: '南门入口', type: 'entrance', latitude: 31.4305, longitude: 120.092, description: '主入口' },
    { id: 'm5', name: '卫生间', type: 'facility', latitude: 31.4338, longitude: 120.0935, description: '广场右侧' },
    { id: 'm6', name: '游客中心', type: 'service', latitude: 31.431, longitude: 120.0915, description: '咨询/寄存/投诉' },
    { id: 'm7', name: '餐饮区', type: 'facility', latitude: 31.4325, longitude: 120.094, description: '简餐/饮品' },
    { id: 'm8', name: '施工区域', type: 'danger', latitude: 31.4345, longitude: 120.090, description: '临时施工，请绕行' },
    { id: 'm9', name: '停车场', type: 'service', latitude: 31.429, longitude: 120.0905, description: 'P1南门停车场' },
    { id: 'm10', name: '五印坛城', type: 'spot', latitude: 31.4315, longitude: 120.0895, description: '藏传佛教文化' },
  ]
}
</script>

<template>
  <view class="map-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="goToSpot">
        <view class="i-carbon-search text-16px text-[#66756f]" />
        <text class="ml-2 text-13px text-[#66756f]">搜索景点、设施...</text>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-bar">
      <view
        v-for="f in filters" :key="f"
        class="filter-chip"
        :class="{ active: activeFilter === f }"
        @click="activeFilter = f"
      >
        {{ f }}
      </view>
    </view>

    <!-- 地图 -->
    <view class="map-container">
      <map
        :latitude="centerLat"
        :longitude="centerLng"
        :markers="markers"
        :show-location="gotLocation"
        scale="16"
        class="map-inner"
        @markertap="onMarkerTap"
      />
    </view>

    <!-- POI 详情面板 -->
    <view v-if="showPanel && selectedPOI" class="poi-panel">
      <view class="poi-panel-handle" @click="closePanel">
        <view class="handle-bar" />
      </view>
      <view class="poi-panel-content">
        <view class="flex items-center justify-between">
          <view class="min-w-0 flex-1">
            <view class="text-17px text-[#20372f] font-800">
              {{ selectedPOI.name }}
            </view>
            <view class="mt-1 text-12px text-[#66756f]">
              {{ selectedPOI.description || typeLabel(selectedPOI.type) }}
            </view>
          </view>
          <view v-if="selectedPOI.type === 'spot'" class="poi-badge">景点</view>
          <view v-else-if="selectedPOI.type === 'danger'" class="poi-badge danger">⚠️ 关闭</view>
          <view v-else class="poi-badge">{{ selectedPOI.type }}</view>
        </view>
        <view class="mt-4 flex gap-2">
          <button class="action-btn primary" @click="goToSpot">
            <view class="i-carbon-navigation text-16px" />
            去看看
          </button>
          <button class="action-btn" @click="closePanel">
            关闭
          </button>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-overlay">
      <text class="text-13px text-[#66756f]">加载地图数据...</text>
    </view>
  </view>
</template>

<script lang="ts">
function typeLabel(type: string): string {
  const map: Record<string, string> = {
    spot: '景点',
    facility: '服务设施',
    entrance: '出入口',
    danger: '关闭区域',
    service: '服务中心',
  }
  return map[type] || type
}
</script>

<style scoped lang="scss">
.map-page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f7f3;
}

.search-bar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 10;
}

.search-input {
  display: flex;
  align-items: center;
  height: 40px;
  border-radius: 20px;
  background: #fff;
  padding: 0 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.filter-bar {
  position: absolute;
  top: 62px;
  left: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.filter-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255,255,255,0.9);
  color: #66756f;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.filter-chip.active {
  background: #1f6d58;
  color: #fff;
}

.map-container {
  flex: 1;
  position: relative;
}

.map-inner {
  width: 100%;
  height: 100%;
}

.poi-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  border-radius: 16px 16px 0 0;
  background: #fff;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
}

.poi-panel-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}

.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #dfe9e4;
}

.poi-panel-content {
  padding: 4px 18px 24px;
}

.poi-badge {
  display: flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  background: #e8f2ed;
  color: #1f6d58;
  font-size: 11px;
  font-weight: 700;
}

.poi-badge.danger {
  background: #fce8e4;
  color: #c0392b;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  background: #f4f8f5;
  color: #66756f;
  line-height: 40px;
}

.action-btn.primary {
  background: #1f6d58;
  color: #fff;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.8);
  z-index: 5;
}
</style>
