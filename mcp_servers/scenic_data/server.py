#!/usr/bin/env python3
"""
景区实时数据 MCP Server — 完全独立，仅通过 HTTP 调 admin-api

提供给 Fay 数字人的实时运营数据工具：
- get_weather: 当前天气
- get_spot_heat: 各景点实时人数热度
- get_queue_time: 排队等待时间
- get_route_eta: 当前→目标景点预计步行时间
- get_crowd_flow: 客流时段分布
- get_visitor_overview: 运营概览

使用方式：python mcp_servers/scenic_data/server.py
或由 Fay MCP manager 自动启动。
"""

import asyncio
import json
import logging
import math
import os
import sys
from typing import Any

import httpx

try:
    from mcp.server import Server, stdio
    from mcp.types import Tool, TextContent
except ImportError:
    print("缺少 mcp 库，请先安装: pip install mcp", file=sys.stderr)
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s", stream=sys.stderr)
logger = logging.getLogger("scenic_data")

# ── 配置 ──────────────────────────────────────────────────────────

ADMIN_API_URL = os.getenv("ADMIN_API_URL", "http://localhost:8002/v1")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "adm-dev-token")

# 灵山各景点坐标（用于 ETA 计算）
SPOT_COORDS: dict[str, dict[str, float]] = {
    "灵山大佛":   {"lat": 31.4355, "lng": 120.0952},
    "灵山梵宫":   {"lat": 31.4322, "lng": 120.0913},
    "九龙灌浴":   {"lat": 31.4338, "lng": 120.0928},
    "五印坛城":   {"lat": 31.4317, "lng": 120.0897},
    "祥符禅寺":   {"lat": 31.4342, "lng": 120.0935},
    "曼飞龙塔":   {"lat": 31.4328, "lng": 120.0905},
    "灵山大照壁": {"lat": 31.4308, "lng": 120.0922},
    "五智门":     {"lat": 31.4315, "lng": 120.0930},
    "游客中心":   {"lat": 31.4305, "lng": 120.0915},
    "南门入口":   {"lat": 31.4302, "lng": 120.0918},
    "曼飞龙塔":   {"lat": 31.4328, "lng": 120.0905},
}


async def _admin_get(path: str) -> dict | None:
    """调 admin-api 接口"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{ADMIN_API_URL}{path}",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            )
            if resp.status_code == 200:
                body = resp.json()
                if body.get("code") == 0:
                    return body.get("data")
    except Exception as e:
        logger.warning(f"admin-api 请求失败 [{path}]: {e}")
    return None


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2)**2
    return 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _call_admin_api(path: str, fallback: dict) -> dict:
    """调 admin-api，失败返回 fallback"""
    data = await _admin_get(path)
    return data or fallback


# ═══════════════════════════════════════════════════════════════════
# 工具实现
# ═══════════════════════════════════════════════════════════════════


async def tool_get_weather(params: dict) -> str:
    data = await _call_admin_api("/weather", {"temperature": "--", "weather": "未知"})
    return json.dumps({
        "temperature": data.get("temperature"),
        "weather": data.get("weather"),
        "humidity": data.get("humidity"),
        "windSpeed": data.get("windSpeed"),
    }, ensure_ascii=False)


async def tool_get_spot_heat(params: dict) -> str:
    data = await _call_admin_api("/admin/analytics/spot-heat", {})
    items = data.get("items", [])
    total = data.get("totalActive", 0)
    if not items:
        return json.dumps({"totalActiveVisitors": 0, "spots": []}, ensure_ascii=False)
    return json.dumps({
        "totalActiveVisitors": total,
        "spots": [{"name": i["name"], "activeVisitors": i["activeVisitors"]} for i in items],
    }, ensure_ascii=False)


async def tool_get_queue_time(params: dict) -> str:
    data = await _call_admin_api("/admin/analytics/queue", {})
    items = data.get("items", [])
    if not items:
        return json.dumps({"queues": []}, ensure_ascii=False)
    return json.dumps({
        "queues": [{"spot": i["spot"], "queueMinutes": i["queueMinutes"],
                     "crowdLevel": i["crowdLevel"], "activeTickets": i["activeTickets"]}
                   for i in items]
    }, ensure_ascii=False)


async def tool_get_route_eta(params: dict) -> str:
    target = params.get("target_spot", "")
    if not target:
        return json.dumps({"error": f"请指定目标景点", "availableSpots": list(SPOT_COORDS.keys())}, ensure_ascii=False)

    target_coord = SPOT_COORDS.get(target)
    if not target_coord:
        # 模糊匹配
        matched = [s for s in SPOT_COORDS if target in s]
        if len(matched) == 1:
            target_coord = SPOT_COORDS[matched[0]]
            target = matched[0]
        else:
            return json.dumps({"error": f"未知景点: {target}", "availableSpots": list(SPOT_COORDS.keys())}, ensure_ascii=False)

    lat = params.get("current_lat")
    lng = params.get("current_lng")
    source_name = "接口传入"

    if lat is None or lng is None:
        # 从热度接口获取最新上报位置作为近似
        data = await _call_admin_api("/admin/analytics/spot-heat", {})
        items = data.get("items", [])
        if items:
            # 取热度最高的景点坐标作为"当前位置"
            top = items[0]
            top_name = top.get("name", "")
            if top_name in SPOT_COORDS:
                lat = SPOT_COORDS[top_name]["lat"]
                lng = SPOT_COORDS[top_name]["lng"]
                source_name = f"近似（{top_name}）"
            else:
                lat = 31.433
                lng = 120.093
        else:
            lat = 31.433
            lng = 120.093

    dist_km = _haversine(float(lat), float(lng), target_coord["lat"], target_coord["lng"])
    walk_min = max(1, int(dist_km * 1000 / 66))  # 4km/h 步行速度

    return json.dumps({
        "targetSpot": target,
        "distanceMeters": int(dist_km * 1000),
        "walkTimeMinutes": walk_min,
        "currentLocationSource": source_name,
    }, ensure_ascii=False)


async def tool_get_crowd_flow(params: dict) -> str:
    data = await _call_admin_api("/admin/analytics/crowd-flow", {})
    items = data.get("items", [])
    return json.dumps({"periods": items} if items else {"periods": []}, ensure_ascii=False)


async def tool_get_visitor_overview(params: dict) -> str:
    data = await _call_admin_api("/admin/analytics/overview", {})
    return json.dumps(data, ensure_ascii=False)


TOOL_HANDLERS: dict[str, callable] = {
    "get_weather": tool_get_weather,
    "get_spot_heat": tool_get_spot_heat,
    "get_queue_time": tool_get_queue_time,
    "get_route_eta": tool_get_route_eta,
    "get_crowd_flow": tool_get_crowd_flow,
    "get_visitor_overview": tool_get_visitor_overview,
}

server = Server("scenic_data")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(name="get_weather",
             description="获取灵山胜境当前实时天气（温度、天气状况、湿度、风速）",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="get_spot_heat",
             description="获取各景点实时人数热度（哪些景点人多/人少），用于推荐游览路线避开拥挤",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="get_queue_time",
             description="获取各景点当前排队等待时间（分钟），用于帮游客规划游览顺序避免排长队",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="get_route_eta",
             description="从游客当前位置到目标景点的预计步行时间，回答'走过去要多久'",
             inputSchema={
                 "type": "object",
                 "properties": {
                     "target_spot": {"type": "string", "description": "目标景点，如 灵山大佛/九龙灌浴/灵山梵宫"},
                 },
                 "required": ["target_spot"],
             }),
        Tool(name="get_crowd_flow",
             description="获取今日客流时段分布，了解景区什么时间段人最多/最少",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="get_visitor_overview",
             description="获取景区实时运营概览（在园人数、待办工单、应急数）",
             inputSchema={"type": "object", "properties": {}}),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    logger.info(f"tool call: {name} {arguments}")
    handler = TOOL_HANDLERS.get(name)
    if not handler:
        return [TextContent(type="text", text=json.dumps({"error": f"未知工具: {name}"}))]
    try:
        result = await handler(arguments)
        return [TextContent(type="text", text=result)]
    except Exception as e:
        logger.exception(f"tool {name} error")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}))]


async def main():
    async with stdio.stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
