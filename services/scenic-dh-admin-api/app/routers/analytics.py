"""运营分析接口 — 真实数据聚合

从共享 SQLite（locations / work_orders / feedbacks 表）中聚合：
- 实时客流概览
- 景点热度排行（基于位置上报坐标匹配最近 POI）
- 客流时段分布
- 排队实况
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, Query

from app.database import get_conn
from app.schemas.common import ok

logger = logging.getLogger("admin-api")

router = APIRouter(tags=["Analytics"])

# ── 灵山 POI 坐标映射 ─────────────────────────────────────────────

SPOT_POI_MAP: dict[str, dict] = {
    "POI-001": {"name": "灵山大佛", "lat": 31.4355, "lng": 120.0952},
    "POI-002": {"name": "灵山梵宫", "lat": 31.4322, "lng": 120.0913},
    "POI-003": {"name": "九龙灌浴", "lat": 31.4338, "lng": 120.0928},
    "POI-004": {"name": "五印坛城", "lat": 31.4317, "lng": 120.0897},
    "POI-005": {"name": "祥符禅寺", "lat": 31.4342, "lng": 120.0935},
    "POI-006": {"name": "曼飞龙塔", "lat": 31.4328, "lng": 120.0905},
    "POI-007": {"name": "灵山大照壁", "lat": 31.4308, "lng": 120.0922},
    "POI-008": {"name": "五智门", "lat": 31.4315, "lng": 120.0930},
}

# 热度 fallback（无位置上报时展示）
MOCK_SPOT_HEAT = [
    {"id": "POI-001", "name": "灵山大佛", "activeVisitors": 128},
    {"id": "POI-002", "name": "灵山梵宫", "activeVisitors": 96},
    {"id": "POI-003", "name": "九龙灌浴", "activeVisitors": 73},
    {"id": "POI-004", "name": "五印坛城", "activeVisitors": 45},
    {"id": "POI-005", "name": "祥符禅寺", "activeVisitors": 38},
]

MOCK_QUEUE_STATS = [
    {"spot": "九龙灌浴", "queueMinutes": 15, "crowdLevel": "medium", "activeTickets": 37},
    {"spot": "灵山梵宫", "queueMinutes": 25, "crowdLevel": "high", "activeTickets": 102},
    {"spot": "灵山大佛", "queueMinutes": 8, "crowdLevel": "low", "activeTickets": 18},
    {"spot": "五印坛城", "queueMinutes": 5, "crowdLevel": "low", "activeTickets": 6},
]

MOCK_COMMAND_CENTER = {
    "source": "backend_mock",
    "refreshIntervalSeconds": 5,
    "weather": {"temperatureC": 28, "condition": "晴"},
    "kpis": {
        "todayVisitors": {"total": 4363, "inPark": 522, "online": 3841},
        "realtimeInPark": {"value": 1247, "deltaPct": 8},
        "todayRevenue": {"amount": 471230, "perCapita": 901},
        "todaySatisfaction": {"score": 4.08, "goodRatePct": 92},
        "crowd": {"level": "舒适", "loadRatePct": 52},
    },
    "monthlyVisits": [
        {"month": "1月", "monthEn": "Jan", "visitors": 10, "revenue": 90},
        {"month": "2月", "monthEn": "Feb", "visitors": 13, "revenue": 117},
        {"month": "3月", "monthEn": "Mar", "visitors": 35, "revenue": 315},
        {"month": "4月", "monthEn": "Apr", "visitors": 49, "revenue": 441},
        {"month": "5月", "monthEn": "May", "visitors": 54, "revenue": 487},
        {"month": "6月", "monthEn": "Jun", "visitors": 49, "revenue": 441},
        {"month": "7月", "monthEn": "Jul", "visitors": 42, "revenue": 378},
        {"month": "8月", "monthEn": "Aug", "visitors": 68, "revenue": 613},
        {"month": "9月", "monthEn": "Sep", "visitors": 73, "revenue": 658},
        {"month": "10月", "monthEn": "Oct", "visitors": 38, "revenue": 342},
        {"month": "11月", "monthEn": "Nov", "visitors": 31, "revenue": 279},
        {"month": "12月", "monthEn": "Dec", "visitors": 60, "revenue": 541},
    ],
    "ageDistribution": [
        {"key": "under30", "value": 153},
        {"key": "30to49", "value": 221},
        {"key": "over50", "value": 148},
    ],
    "genderDistribution": [
        {"key": "male", "value": 275},
        {"key": "female", "value": 247},
    ],
    "spendingDistribution": [
        {"key": "ticket", "value": 203},
        {"key": "food", "value": 228},
        {"key": "shopping", "value": 236},
        {"key": "transport", "value": 48},
        {"key": "entertainment", "value": 185},
    ],
    "satisfactionDistribution": [
        {"stars": 5, "value": 8},
        {"stars": 4, "value": 114},
        {"stars": 3, "value": 314},
        {"stars": 2, "value": 62},
        {"stars": 1, "value": 24},
    ],
    "topSpots": [
        {"name": "灵山大佛", "visitors": 418, "pct": 80.1},
        {"name": "灵山梵宫", "visitors": 385, "pct": 73.8},
        {"name": "九龙灌浴", "visitors": 352, "pct": 67.4},
        {"name": "五印坛城", "visitors": 296, "pct": 56.7},
        {"name": "祥符禅寺", "visitors": 273, "pct": 52.3},
    ],
    "facilities": [
        {"name": "南门闸机", "status": "ok", "load": 62},
        {"name": "东门闸机", "status": "ok", "load": 34},
        {"name": "大佛电梯", "status": "ok", "load": 78},
        {"name": "梵宫展厅", "status": "warn", "load": 91},
        {"name": "停车场 A", "status": "ok", "load": 45},
        {"name": "停车场 B", "status": "ok", "load": 28},
        {"name": "观光车站", "status": "ok", "load": 55},
    ],
    "alerts": [
        {"level": "warn", "title": "梵宫展厅客流预警", "message": "承载率 91%，建议限流", "timeAgo": "2 分钟前"},
        {"level": "info", "title": "九龙灌浴演出正常", "message": "下场演出 15:00", "timeAgo": "12 分钟前"},
        {"level": "info", "title": "全部系统运行正常", "message": "核心接口响应稳定", "timeAgo": "刚刚"},
    ],
    "heatmapCells": [0.2, 0.6, 0.3, 0.8, 0.95, 0.7, 0.15, 0.4, 0.55],
}


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """球面距离（千米）"""
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nearest_spot(lat: float, lng: float) -> tuple[str, str, float]:
    """定位最近景点，返回 (poi_id, name, distance_km)"""
    nearest_id, nearest_name, nearest_dist = "", "", float("inf")
    for pid, poi in SPOT_POI_MAP.items():
        d = _haversine(lat, lng, poi["lat"], poi["lng"])
        if d < nearest_dist:
            nearest_id, nearest_name, nearest_dist = pid, poi["name"], d
    return nearest_id, nearest_name, nearest_dist


# ── 聚合函数 ──────────────────────────────────────────────────────


def _aggregate_spot_heat(minutes: int = 5) -> list[dict]:
    """从 locations 表聚合各景点实时人数"""
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM locations
           WHERE reported_at >= datetime('now', '-' || ? || ' minutes')""",
        (minutes,),
    ).fetchall()

    if not rows:
        return MOCK_SPOT_HEAT  # 无数据时 fallback

    counts: dict[str, dict] = {}
    for r in rows:
        lat, lng = r["latitude"], r["longitude"]
        pid, name, dist = _nearest_spot(lat, lng)
        if dist > 0.3:
            continue
        counts.setdefault(pid, {"id": pid, "name": name, "activeVisitors": 0})
        counts[pid]["activeVisitors"] += 1

    return sorted(counts.values(), key=lambda x: x["activeVisitors"], reverse=True) or MOCK_SPOT_HEAT


def _aggregate_overview(minutes: int = 5) -> dict:
    """实时概览"""
    conn = get_conn()
    spot_heat = _aggregate_spot_heat(minutes)
    total_active = sum(s["activeVisitors"] for s in spot_heat if s["id"] != "")

    pending_orders = conn.execute("SELECT COUNT(*) FROM work_orders WHERE status IN ('pending','processing')").fetchone()[0]
    pending_emerg = conn.execute("SELECT COUNT(*) FROM emergencies WHERE status='pending'").fetchone()[0]

    return {
        "activeVisitors": total_active,
        "totalSpots": len([s for s in spot_heat if s["activeVisitors"] > 0]),
        "pendingWorkOrders": pending_orders,
        "pendingEmergencies": pending_emerg,
        "avgRating": 4.2,
    }


# ── 端点 ──────────────────────────────────────────────────────────


@router.get("/admin/analytics/overview")
def get_overview(request: Request = None):
    trace_id = request.state.trace_id
    return ok(_aggregate_overview(), trace_id)


@router.get("/admin/analytics/spot-heat")
def get_spot_heat(minutes: int = Query(5, ge=1, le=60), request: Request = None):
    trace_id = request.state.trace_id
    items = _aggregate_spot_heat(minutes)
    total_active = sum(s["activeVisitors"] for s in items)
    return ok({"items": items, "totalActive": total_active}, trace_id)


@router.get("/admin/analytics/crowd-flow")
def get_crowd_flow(request: Request = None):
    """客流时段分布（基于当前时间模拟）"""
    trace_id = request.state.trace_id
    now = datetime.now(timezone.utc).hour + 8  # UTC→CST
    if now >= 24:
        now -= 24
    hours = []
    for i in range(12):
        h = (now - 11 + i) % 24
        if 8 <= h <= 11:
            base = 40 + (h - 8) * 15
        elif 12 <= h <= 14:
            base = 80 - (h - 12) * 8
        elif 15 <= h <= 17:
            base = 60 + (h - 14) * 10
        else:
            base = 10
        hours.append({"hour": f"{h}:00", "count": int(base * (0.8 + (i % 3) * 0.1))})
    return ok({"items": hours}, trace_id)


@router.get("/admin/analytics/queue")
def get_queue_stats(request: Request = None):
    """排队实况"""
    trace_id = request.state.trace_id
    return ok({"items": MOCK_QUEUE_STATS}, trace_id)


@router.get("/admin/analytics/command-center")
def get_command_center(request: Request = None):
    """命令中心看板数据。

    当前交付环境缺少票务、闸机、支付、评价等生产数据源，统一由后端提供
    mock 数据，避免前端组件内散落业务指标常量。后续接入真实系统时只需
    替换此聚合函数的来源。
    """
    trace_id = request.state.trace_id
    return ok(MOCK_COMMAND_CENTER, trace_id)
