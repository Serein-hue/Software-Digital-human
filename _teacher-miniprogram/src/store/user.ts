import type { IUserInfoRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getCurrentUser,
} from '@/api/login'

// 初始化状态
const userInfoState: IUserInfoRes = {
  userId: -1,
  username: '',
  nickname: '',
  avatar: '/static/images/default-avatar.png',
  role: 'visitor',
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })
    // 设置用户信息
    const setUserInfo = (val: any) => {
      console.log('设置用户信息', val)
      userInfo.value = {
        userId: val.id || val.userId || -1,
        username: val.username || val.nickname || '',
        nickname: val.nickname || val.displayName || '',
        avatar: val.avatar || userInfoState.avatar,
        role: val.role || 'visitor',
        staffName: val.staffName || undefined,
        staffTitle: val.staffTitle || undefined,
      }
    }
    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar
    }
    // 删除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('user')
    }

    /**
     * 获取用户信息
     */
    const fetchUserInfo = async () => {
      try {
        const res = await getCurrentUser()
        if (res) {
          setUserInfo(res)
        }
        return res
      } catch {
        return null
      }
    }

    return {
      userInfo,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setUserAvatar,
    }
  },
  {
    persist: true,
  },
)
