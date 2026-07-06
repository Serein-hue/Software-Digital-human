<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getSpots, type SpotItem } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '听讲解',
    navigationBarBackgroundColor: '#17372f',
    navigationBarTextStyle: 'white',
  },
})

const spots = ref<SpotItem[]>([])
const currentId = ref('')
const isPlaying = ref(true)
const loading = ref(true)

onMounted(async () => {
  const data = await getSpots({ limit: 10 })
  spots.value = data.length ? data : [
    { id: 'demo-1', name: '灵山大佛', summary: '世界最高露天青铜立像' },
    { id: 'demo-2', name: '九龙灌浴', summary: '大型音乐动态群雕' },
    { id: 'demo-3', name: '梵宫', summary: '佛教艺术殿堂' },
  ] as SpotItem[]
  currentId.value = spots.value[0]?.id || ''
  loading.value = false
})

const currentSpot = computed(() => spots.value.find(item => item.id === currentId.value) || spots.value[0])

function chooseSpot(id: string) {
  currentId.value = id
  isPlaying.value = true
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
}
</script>

<template>
  <view v-if="loading" class="page bg-[#17372f] px-4 pb-8 pt-4 text-white">
    <view class="mt-20 text-center text-14px opacity-72">加载中...</view>
  </view>
  <view v-else class="page bg-[#17372f] px-4 pb-8 pt-4 text-white">
    <view class="player">
      <view class="text-13px opacity-75">
        正在播放
      </view>
      <view class="mt-2 text-24px font-800">
        {{ currentSpot?.name || '景点讲解' }}
      </view>
      <view class="mt-2 text-13px leading-5 opacity-78">
        {{ currentSpot?.summary || currentSpot?.shortIntro || '' }}
      </view>
      <view class="mt-8 flex items-center justify-center" @click="togglePlay">
        <view class="play">
          <view :class="isPlaying ? 'i-carbon-pause-filled' : 'i-carbon-play-filled-alt'" class="text-34px" />
        </view>
      </view>
      <view class="bar mt-8">
        <view class="bar-inner" />
      </view>
      <view class="mt-2 flex justify-between text-11px opacity-72">
        <text>02:18</text>
        <text>08:40</text>
      </view>
    </view>

    <view class="list mt-5">
      <view class="mb-3 text-17px text-[#17362e] font-800">
        接下来听
      </view>
      <view v-for="spot in spots" :key="spot.id" class="row" :class="{ active: spot.id === currentId }" @click="chooseSpot(spot.id)">
        <view>
          <view class="text-15px text-[#20372f] font-800">
            {{ spot.name }}
          </view>
          <view class="mt-1 text-12px text-[#66756f]">
            {{ spot.tags?.join(' · ') || spot.category || '' }}
          </view>
        </view>
        <view :class="spot.id === currentId && isPlaying ? 'i-carbon-pause-filled' : 'i-carbon-play-filled-alt'" class="text-20px text-[#2b765f]" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
}

.player,
.list {
  border-radius: 8px;
}

.player {
  background:
    radial-gradient(circle at 78% 8%, rgba(245, 213, 141, 0.24), transparent 30%),
    linear-gradient(145deg, #17372f 0%, #275f51 100%);
  padding: 22px;
}

.play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: #f5d58d;
  color: #17372f;
}

.bar {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.bar-inner {
  width: 34%;
  height: 100%;
  background: #f5d58d;
}

.list {
  background: #fff;
  padding: 18px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1ee;
  padding: 12px 0;

  &:last-child {
    border-bottom: 0;
  }
}

.row.active {
  border-radius: 8px;
  background: #f7faf8;
  margin: 0 -8px;
  padding: 12px 8px;
}
</style>
