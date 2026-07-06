export interface SpotItem {
  id: string
  name: string
  tag: string
  time: string
  desc: string
  tip: string
}

export interface FacilityItem {
  name: string
  distance: string
  desc: string
}

export const spots: SpotItem[] = [
  {
    id: 'buddha',
    name: '灵山大佛',
    tag: '先去这里',
    time: '建议 35 分钟',
    desc: '适合从这里开始，先听一段背景，再慢慢往九龙灌浴方向走。',
    tip: '台阶较多，带长辈同行时可以放慢节奏。',
  },
  {
    id: 'bath',
    name: '九龙灌浴',
    tag: '别错过',
    time: '下一场 14:30',
    desc: '演出前 15 分钟到达更从容，旁边也方便短暂停留休息。',
    tip: '想拍完整画面，建议站在广场中后方。',
  },
  {
    id: 'palace',
    name: '梵宫',
    tag: '慢慢看',
    time: '建议 45 分钟',
    desc: '室内参观节奏可以放慢，适合安排在午后或天气较热时。',
    tip: '室内空间较大，适合安排在需要休整的时候。',
  },
]

export const routeSteps = ['入口', '灵山大佛', '九龙灌浴', '梵宫']

export const facilities: FacilityItem[] = [
  { name: '游客中心', distance: '约 180 米', desc: '咨询、寄存、投诉建议' },
  { name: '卫生间', distance: '约 90 米', desc: '靠近广场右侧' },
  { name: '休息区', distance: '约 260 米', desc: '有座椅和饮水点' },
  { name: '餐饮点', distance: '约 420 米', desc: '简餐、饮品、儿童餐' },
]

export const questions = [
  '我只有两个小时，怎么逛最合适？',
  '老人一起走，哪条路更省力？',
  '下一场表演在哪里看？',
  '附近哪里可以休息一下？',
]

export const preferences = [
  { label: '讲解节奏', value: '慢一点，多讲故事' },
  { label: '同行人', value: '亲子 / 长辈同行' },
  { label: '重点关注', value: '文化典故、演出时间' },
]

export const history = [
  '九龙灌浴下一场几点开始？',
  '哪条路线不走回头路？',
  '梵宫适合老人慢慢看吗？',
]
