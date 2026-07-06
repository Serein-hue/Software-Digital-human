<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getServices, type ServiceItem } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '附近',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const filters = ['全部', '卫生间', '休息', '餐饮', '游客中心']
const activeFilter = ref('全部')
const allFacilities = ref<ServiceItem[]>([])
const loading = ref(true)

onMounted(async () => {
  const data = await getServices()
  if (!data.length) {
    // Fallback
    allFacilities.value = [
      { id: 'demo-1', name: '游客中心', type: '游客中心', description: '咨询、寄存、投诉建议' },
      { id: 'demo-2', name: '卫生间', type: '卫生间', description: '靠近广场右侧' },
      { id: 'demo-3', name: '休息区', type: '休息', description: '有座椅和饮水点' },
      { id: 'demo-4', name: '餐饮点', type: '餐饮', description: '简餐、饮品、儿童餐' },
    ]
  } else {
    allFacilities.value = data
  }
  loading.value = false
})

const visibleFacilities = computed(() => {
  if (activeFilter.value === '全部') return allFacilities.value
  return allFacilities.value.filter(
    item => item.name.includes(activeFilter.value) || item.type?.includes(activeFilter.value),
  )
})
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="panel">
      <view class="title">
        附近服务
      </view>
      <view class="mt-2 text-13px text-[#66756f]">
        从当前位置出发，先找最近、最顺路的地方。
      </view>
      <view class="chips mt-4">
        <view
          v-for="item in filters" :key="item"
          class="chip" :class="{ active: item === activeFilter }"
          @click="activeFilter = item"
        >
          {{ item }}
        </view>
      </view>
    </view>
    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>
    <view v-else class="mt-4 space-y-3">
      <view v-for="item in visibleFacilities" :key="item.id || item.name" class="facility">
        <view class="i-carbon-location-filled text-22px text-[#2b765f]" />
        <view class="min-w-0 flex-1">
          <view class="text-16px text-[#20372f] font-800">
            {{ item.name }}
          </view>
          <view class="mt-1 text-12px text-[#66756f]">
            {{ item.description || '' }}
          </view>
        </view>
        <view class="distance">
          {{ item.distance || '—' }}
        </view>
        <button class="go-btn">
          去这
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }

.panel {
  border-radius: 8px; background: #fff; padding: 18px;
  box-shadow: 0 10px 22px rgba(29,54,46,0.07);
}
.title { font-size: 18px; font-weight: 800; color: #17362e; }

.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;
  background: #f4f8f5; color: #66756f;
}
.chip.active { background: #1f6d58; color: #fff; }

.facility {
  display: flex; gap: 12px; align-items: center;
  border-radius: 8px; background: #fff; padding: 14px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
.distance {
  font-size: 12px; color: #66756f; white-space: nowrap;
}
.go-btn {
  height: 32px; border: 0; border-radius: 8px;
  background: #1f6d58; color: #fff; font-size: 12px; font-weight: 700;
  line-height: 32px; padding: 0 14px;
}
</style>
