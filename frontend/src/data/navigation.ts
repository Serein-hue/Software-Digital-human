import { Activity, Bot, FileCheck2, MapPinned } from "lucide-react";
import type { NavItem } from "../types/domain";

export const navigationItems: NavItem[] = [
  {
    id: "overview",
    index: "01",
    label: "空间态势",
    description: "地图 / 客流 / 告警",
    icon: MapPinned
  },
  {
    id: "avatar",
    index: "02",
    label: "数字人值守",
    description: "形象 / 口播 / 队列",
    icon: Bot
  },
  {
    id: "data",
    index: "03",
    label: "数据研判",
    description: "趋势 / 画像 / 质量",
    icon: Activity
  },
  {
    id: "content",
    index: "04",
    label: "内容治理",
    description: "OA / 审核 / 知识",
    icon: FileCheck2
  }
];
