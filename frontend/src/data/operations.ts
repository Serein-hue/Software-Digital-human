import {
  Bell,
  Bot,
  CalendarClock,
  FileCheck2,
  MapPinned,
  Megaphone,
  Navigation,
  Radio,
  ShieldCheck,
  TicketCheck,
  UsersRound
} from "lucide-react";
import type { ActionItem, ApprovalStep, AvatarTask, ChartPoint, ContentItem, MapPoint, MetricItem } from "../types/domain";

export const operationsMetrics: MetricItem[] = [
  { label: "今日入园", value: "23,681", note: "较昨日 +12.6%", tone: "success" },
  { label: "在园人数", value: "8,842", note: "实时估算", tone: "neutral" },
  { label: "排队峰值", value: "1,253", note: "九龙灌浴", tone: "warning" },
  { label: "待处理工单", value: "32", note: "P0 事件 2 个", tone: "danger" },
  { label: "广播覆盖", value: "91.4%", note: "核心景点在线", tone: "success" }
];

export const mapPoints: MapPoint[] = [
  { id: "jiulong", name: "九龙灌浴", summary: "候场 1,253 人", lon: 120.09524, lat: 31.42663, x: 46, y: 31, tone: "warning", layer: "crowd", value: 1253 },
  { id: "wuyin", name: "五印坛城", summary: "客流平稳", lon: 120.09812, lat: 31.42664, x: 33, y: 52, tone: "success", layer: "crowd", value: 612 },
  { id: "fangong", name: "梵宫", summary: "讲解任务运行中", lon: 120.0975, lat: 31.43073, x: 48, y: 64, tone: "success", layer: "broadcast", value: 86 },
  { id: "buddha", name: "灵山大佛", summary: "游客聚集可控", lon: 120.09151, lat: 31.43205, x: 68, y: 53, tone: "accent", layer: "broadcast", value: 94 },
  { id: "parking", name: "票务入口", summary: "核验通道 6 条", lon: 120.09876, lat: 31.42207, x: 78, y: 39, tone: "success", layer: "device", value: 126 },
  { id: "emergency", name: "应急设备告警", summary: "低温 / 电力中断", lon: 120.10056, lat: 31.42796, x: 73, y: 41, tone: "danger", layer: "alert", value: 2 }
];

export const quickActions: ActionItem[] = [
  { id: "queue", label: "排队调度", icon: Navigation, description: "聚焦拥堵点位" },
  { id: "broadcast", label: "发布广播", icon: Megaphone, description: "创建全园播报" },
  { id: "work-order", label: "应急工单", icon: FileCheck2, description: "打开事件处理" },
  { id: "avatar", label: "数字人接管", icon: Bot, description: "进入口播控制" },
  { id: "device-alert", label: "设备告警", icon: Bell, description: "筛选离线设备" },
  { id: "traffic", label: "客流监测", icon: ShieldCheck, description: "刷新运营数据" }
];

export const avatarMetrics: MetricItem[] = [
  { label: "开机时长", value: "08:32:16", note: "Fay runtime 在线", tone: "success" },
  { label: "今日会话", value: "1,268", note: "游客问答", tone: "neutral" },
  { label: "好评率", value: "96.3%", note: "游客反馈", tone: "success" }
];

export const capabilityMetrics: MetricItem[] = [
  { label: "语音识别", value: "正常", note: "ASR", tone: "success" },
  { label: "TTS 合成", value: "正常", note: "口播", tone: "success" },
  { label: "RAG 检索", value: "正常", note: "知识引用", tone: "success" },
  { label: "知识库", value: "v4.2.0", note: "最近同步", tone: "neutral" }
];

export const avatarTasks: AvatarTask[] = [
  { id: "welcome", title: "景区日常欢迎语", time: "08:00-23:00 每日", state: "播报中", tone: "success" },
  { id: "water-show", title: "水幕电影通知", time: "12:00 开始", state: "待播", tone: "neutral" },
  { id: "weather", title: "极端天气提醒", time: "13:30 开始", state: "待审核", tone: "warning" },
  { id: "campaign", title: "活动宣传 - 花开灵山", time: "15:00 开始", state: "待播", tone: "neutral" },
  { id: "closing", title: "闭园提醒", time: "22:00 开始", state: "待播", tone: "neutral" }
];

export const hotQuestions: ChartPoint[] = [
  { label: "景区开放时间", value: 326 },
  { label: "梵宫怎么去", value: 289 },
  { label: "门票价格", value: 254 },
  { label: "素斋餐厅位置", value: 201 },
  { label: "停车场位置", value: 198 }
];

export const dataMetrics: MetricItem[] = [
  { label: "今日入园", value: "23,681", note: "较昨日 +12.6%", tone: "success" },
  { label: "在园人数", value: "8,842", note: "实时", tone: "neutral" },
  { label: "瞬时客流", value: "1,253", note: "峰值 2,156", tone: "warning" },
  { label: "平均排队", value: "26 分钟", note: "较昨日 -8 分钟", tone: "success" },
  { label: "游客满意度", value: "96.2%", note: "较昨日 +1.3%", tone: "success" },
  { label: "待处理工单", value: "32", note: "未完成 8", tone: "warning" }
];

export const queueTrend: ChartPoint[] = [
  { label: "00:00", value: 8 },
  { label: "06:00", value: 18 },
  { label: "09:00", value: 28 },
  { label: "12:00", value: 42 },
  { label: "15:00", value: 34 },
  { label: "18:00", value: 22 },
  { label: "24:00", value: 18 }
];

export const workOrderTrend: ChartPoint[] = [
  { label: "05-14", value: 34 },
  { label: "05-15", value: 28 },
  { label: "05-16", value: 42 },
  { label: "05-17", value: 31 },
  { label: "05-18", value: 49 },
  { label: "05-19", value: 38 },
  { label: "05-20", value: 44 }
];

export const contentItems: ContentItem[] = [
  {
    id: "c-jiulong",
    title: "九龙灌浴活动介绍",
    type: "活动",
    status: "已发布",
    version: "v2.3.0",
    owner: "张明昕",
    updatedAt: "2026-06-09 10:30",
    channels: "游客小程序、官网、智能终端",
    scope: "全景开放",
    description: "活动介绍、动线提醒、排队建议和现场服务方式。",
    priority: "success"
  },
  {
    id: "c-buddha",
    title: "灵山大佛景点介绍",
    type: "景点",
    status: "已发布",
    version: "v1.8.0",
    owner: "雷晓晴",
    updatedAt: "2026-06-09 08:41",
    channels: "游客端、数字人、大屏",
    scope: "核心景点",
    description: "景点讲解、历史背景、参观提醒和无障碍路线。",
    priority: "success"
  },
  {
    id: "c-wuyin",
    title: "五印坛城导览话术",
    type: "导览话术",
    status: "待审核",
    version: "v1.2.1",
    owner: "王小林",
    updatedAt: "2026-06-09 09:28",
    channels: "数字人、导览屏",
    scope: "五印坛城区域",
    description: "导览口径、讲解节奏和低置信兜底回复。",
    priority: "warning"
  },
  {
    id: "c-traffic",
    title: "景区交通指引",
    type: "攻略",
    status: "已发布",
    version: "v1.5.0",
    owner: "陈志远",
    updatedAt: "2026-06-08 10:20",
    channels: "游客小程序、官网",
    scope: "全景开放",
    description: "停车、接驳、步行路线和拥堵绕行建议。",
    priority: "success"
  },
  {
    id: "c-ticket",
    title: "门票政策说明",
    type: "票务",
    status: "已发布",
    version: "v3.1.0",
    owner: "李雨晴",
    updatedAt: "2026-06-08 16:55",
    channels: "游客端、票务终端、数字人",
    scope: "票务服务",
    description: "票种、核验规则、儿童票和退改说明。",
    priority: "success"
  }
];

export const approvalSteps: ApprovalStep[] = [
  { title: "提交审核", note: "赵晓晴提交于 06-09 09:15", tone: "success" },
  { title: "内容主管", note: "李雨晴审核通过 06-09 09:32", tone: "success" },
  { title: "运营总监", note: "陈志远审核通过 06-09 10:05", tone: "success" },
  { title: "发布记录", note: "已发布 06-09 10:30", tone: "accent" }
];

export const contentMenu: ActionItem[] = [
  { id: "filter", label: "内容对象", icon: FileCheck2 },
  { id: "create", label: "来源入库", icon: Radio },
  { id: "broadcast", label: "发布记录", icon: Megaphone },
  { id: "avatar", label: "角色权限", icon: UsersRound },
  { id: "work-order", label: "审核中心", icon: ShieldCheck },
  { id: "refresh", label: "审计日志", icon: CalendarClock },
  { id: "queue", label: "票务口径", icon: TicketCheck },
  { id: "traffic", label: "点位内容", icon: MapPinned }
];
