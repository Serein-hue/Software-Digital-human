import type { LucideIcon } from "lucide-react";

export type PageId = "overview" | "avatar" | "data" | "content";
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "accent";
export type QuickActionId =
  | "queue"
  | "broadcast"
  | "work-order"
  | "avatar"
  | "device-alert"
  | "traffic"
  | "refresh"
  | "export"
  | "filter"
  | "create";

export interface NavItem {
  id: PageId;
  index: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface MetricItem {
  label: string;
  value: string;
  note: string;
  tone?: StatusTone;
}

export interface MapPoint {
  id: string;
  name: string;
  summary: string;
  lon: number;
  lat: number;
  x: number;
  y: number;
  tone: StatusTone;
  layer: "crowd" | "device" | "broadcast" | "alert";
  value: number;
}

export interface ActionItem {
  id: QuickActionId;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface AvatarTask {
  id: string;
  title: string;
  time: string;
  state: string;
  tone: StatusTone;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  version: string;
  owner: string;
  updatedAt: string;
  channels: string;
  scope: string;
  description: string;
  priority?: StatusTone;
}

export interface ApprovalStep {
  title: string;
  note: string;
  tone: StatusTone;
}
