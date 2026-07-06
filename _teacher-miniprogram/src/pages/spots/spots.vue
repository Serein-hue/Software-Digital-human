<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getSpots, type SpotItem } from '@/api/scenic'

definePage({
  style: {
    navigationBarTitleText: '景点',
    navigationBarBackgroundColor: '#f4f7f3',
    navigationBarTextStyle: 'black',
  },
})

const spots = ref<SpotItem[]>([])
const favoriteIds = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  const data = await getSpots({ limit: 50 })
  spots.value = data.length ? data : [
    { id: 'demo-1', name: '灵山大佛', summary: '世界最高露天青铜释迦牟尼立像', tags: ['必游'] },
    { id: 'demo-2', name: '九龙灌浴', summary: '大型音乐动态群雕表演', tags: ['演出'] },
    { id: 'demo-3', name: '梵宫', summary: '佛教艺术殿堂，世界佛教论坛永久会址', tags: ['室内'] },
  ]
  loading.value = false
})

function toggleFavorite(id: string) {
  favoriteIds.value = favoriteIds.value.includes(id)
    ? favoriteIds.value.filter(item => item !== id)
    : [...favoriteIds.value, id]
}

function go(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page bg-[#f4f7f3] px-4 pb-8 pt-4">
    <view class="header">
      <view class="text-24px text-[#17362e] font-800">
        现在适合去
      </view>
      <view class="mt-2 text-13px text-[#66756f] leading-5">
        按当前路线和游览节奏整理，先看重点，再慢慢逛。
      </view>
    </view>

    <view v-if="loading" class="mt-8 text-center text-13px text-[#66756f]">
      加载中...
    </view>
    <view v-else class="mt-4 space-y-3">
      <view v-for="spot in spots" :key="spot.id" class="card">
        <view class="flex items-start justify-between gap-3">
          <view>
            <view class="text-17px text-[#20372f] font-800">
              {{ spot.name }}
            </view>
            <view v-if="spot.tags?.length" class="mt-1 text-12px text-[#8c6128]">
              {{ spot.tags.join(' · ') }}
            </view>
          </view>
          <view
            :class="favoriteIds.includes(spot.id) ? 'i-carbon-star-filled' : 'i-carbon-star'"
            class="text-20px text-[#d2a447]"
            @click="toggleFavorite(spot.id)"
          />
        </view>
        <view class="mt-3 text-13px text-[#66756f] leading-5">
          {{ spot.summary || spot.shortIntro || '' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; }
.header {
  border-radius: 8px; background: #fff; padding: 18px;
  box-shadow: 0 10px 22px rgba(29,54,46,0.07);
}
.card {
  border-radius: 8px; background: #fff; padding: 16px;
  box-shadow: 0 4px 12px rgba(29,54,46,0.04);
}
</style>
