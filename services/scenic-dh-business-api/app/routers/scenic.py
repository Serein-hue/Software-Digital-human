"""景区基础信息、公告、活动、服务设施、天气、排队、票务"""

import httpx
from fastapi import APIRouter, Request

from app.config import settings
from app.schemas.common import ok, err

router = APIRouter(tags=["Scenic Info"])

# 灵山胜境坐标
LAT = settings.WEATHER_LATITUDE
LON = settings.WEATHER_LONGITUDE


@router.get("/scenic-areas/{scenic_id}")
def get_scenic_area(scenic_id: str, request: Request):
    trace_id = request.state.trace_id
    return ok(
        {
            "id": scenic_id,
            "name": "灵山胜境",
            "nameEn": "Lingshan Buddhist Scenic Spot",
            "level": "5A",
            "city": "无锡",
            "intro": "灵山胜境位于无锡太湖国家旅游度假区，是中国著名的佛教文化主题景区...",
            "openTime": "07:00-17:30",
            "rules": ["请勿在佛像前大声喧哗", "保持景区卫生", "禁止无人机未经许可飞行"],
            "source": "public_demo_package",
            "freshnessLevel": "static",
        },
        trace_id,
    )


@router.get("/notices")
def list_notices(type: str = None, active: bool = True, request: Request = None):
    trace_id = request.state.trace_id
    notices = [
        {"id": "NT-001", "type": "info", "title": "梵宫内部修缮通知", "content": "梵宫部分展厅将于6月5日-6月10日进行内部修缮...", "active": True, "expiresAt": "2026-06-10T18:00:00Z"},
        {"id": "NT-002", "type": "alert", "title": "景区入园须知", "content": "五一期间游客较多，建议提前预约门票...", "active": True, "expiresAt": "2026-06-30T18:00:00Z"},
    ]
    return ok({"items": notices}, trace_id)


@router.get("/events")
def list_events(date: str = None, spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    events = [
        {"id": "EV-001", "name": "九龙灌浴表演", "spotId": "LS-003", "time": "每日 10:00, 14:00, 16:00", "description": "大型音乐喷泉表演，再现释迦牟尼诞生场景"},
        {"id": "EV-002", "name": "梵宫祈福法会", "spotId": "LS-002", "time": "每周六 09:30", "description": "梵宫大殿内举行的祈福仪式"},
    ]
    return ok({"items": events}, trace_id)


@router.get("/services")
def list_services(category: str = None, nearby_spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    services = [
        {"id": "SV-001", "category": "toilet", "name": "南门卫生间", "location": "景区南门入口右侧"},
        {"id": "SV-002", "category": "restaurant", "name": "灵山蔬食馆", "location": "大佛广场东侧"},
        {"id": "SV-003", "category": "parking", "name": "P1 停车场", "location": "景区正门外"},
        {"id": "SV-004", "category": "help_point", "name": "游客服务中心", "location": "景区南门入口"},
    ]
    return ok({"items": services}, trace_id)


# ── 地图 POI ──────────────────────────────────────────────────────

SCENIC_POIS = [
    # 景点
    {"id": "POI-001", "name": "灵山大佛", "type": "spot", "latitude": 31.4355, "longitude": 120.0952, "description": "世界最高露天青铜释迦牟尼立像，通高88米"},
    {"id": "POI-002", "name": "灵山梵宫", "type": "spot", "latitude": 31.4322, "longitude": 120.0913, "description": "佛教艺术殿堂，世界佛教论坛永久会址"},
    {"id": "POI-003", "name": "九龙灌浴", "type": "spot", "latitude": 31.4338, "longitude": 120.0928, "description": "大型音乐动态群雕，重现花开见佛"},
    {"id": "POI-004", "name": "五印坛城", "type": "spot", "latitude": 31.4317, "longitude": 120.0897, "description": "藏传佛教文化，小布达拉宫"},
    {"id": "POI-005", "name": "祥符禅寺", "type": "spot", "latitude": 31.4342, "longitude": 120.0935, "description": "唐代古刹，玄奘法师弟子开坛讲经之地"},
    {"id": "POI-006", "name": "曼飞龙塔", "type": "spot", "latitude": 31.4328, "longitude": 120.0905, "description": "南传佛教标志性白塔建筑"},
    {"id": "POI-007", "name": "灵山大照壁", "type": "spot", "latitude": 31.4308, "longitude": 120.0922, "description": "华夏第一壁，赵朴初题字"},
    {"id": "POI-008", "name": "五智门", "type": "spot", "latitude": 31.4315, "longitude": 120.0930, "description": "五门六柱石牌坊，禅意圣地门户"},
    # 出入口
    {"id": "POI-010", "name": "南门入口", "type": "entrance", "latitude": 31.4302, "longitude": 120.0918, "description": "景区主入口，靠近P1停车场"},
    {"id": "POI-011", "name": "东门出口", "type": "entrance", "latitude": 31.4330, "longitude": 120.0965, "description": "东侧出口，通往拈花湾方向"},
    # 服务设施
    {"id": "POI-020", "name": "游客服务中心", "type": "service", "latitude": 31.4305, "longitude": 120.0915, "description": "咨询、寄存、投诉、失物招领"},
    {"id": "POI-021", "name": "南门卫生间", "type": "facility", "latitude": 31.4308, "longitude": 120.0925, "description": "南门入口右侧"},
    {"id": "POI-022", "name": "广场卫生间", "type": "facility", "latitude": 31.4340, "longitude": 120.0932, "description": "九龙灌浴广场右侧"},
    {"id": "POI-023", "name": "梵宫卫生间", "type": "facility", "latitude": 31.4320, "longitude": 120.0910, "description": "梵宫地下一层"},
    {"id": "POI-024", "name": "灵山蔬食馆", "type": "facility", "latitude": 31.4345, "longitude": 120.0940, "description": "大佛广场东侧，人均68元"},
    {"id": "POI-025", "name": "梵宫自助餐厅", "type": "facility", "latitude": 31.4325, "longitude": 120.0908, "description": "梵宫一层，人均88元"},
    {"id": "POI-026", "name": "P1 停车场", "type": "service", "latitude": 31.4290, "longitude": 120.0905, "description": "南门主停车场，5000车位"},
    {"id": "POI-027", "name": "休息区", "type": "service", "latitude": 31.4335, "longitude": 120.0920, "description": "广场西侧，有座椅和饮水机"},
    # 关闭/危险区域
    {"id": "POI-030", "name": "梵宫修缮区域", "type": "danger", "latitude": 31.4328, "longitude": 120.0918, "description": "部分展厅临时封闭修缮中"},
    {"id": "POI-031", "name": "施工路段", "type": "danger", "latitude": 31.4348, "longitude": 120.0895, "description": "道路施工，请绕行"},
]


@router.get("/map/pois")
def list_map_pois(types: str = None, nearby_lat: float = None, nearby_lng: float = None, request: Request = None):
    trace_id = request.state.trace_id
    pois = SCENIC_POIS
    if types:
        allowed = types.split(",")
        pois = [p for p in pois if p["type"] in allowed]
    return ok({"items": pois}, trace_id)


@router.get("/map/layers")
def list_map_layers(request: Request = None):
    trace_id = request.state.trace_id
    layers = [
        {"id": "LAYER-SPOT", "name": "景点", "type": "spot", "visible": True},
        {"id": "LAYER-SERVICE", "name": "服务设施", "type": "facility", "visible": True},
        {"id": "LAYER-ENTRANCE", "name": "出入口", "type": "entrance", "visible": True},
        {"id": "LAYER-DANGER", "name": "关闭区域", "type": "danger", "visible": True},
    ]
    return ok({"items": layers}, trace_id)


@router.get("/weather")
async def get_weather(scenic_id: str = None, request: Request = None):
    trace_id = request.state.trace_id

    # 如果没有配置 API key，返回 fallback 数据并标记为 mock
    if not settings.QWEATHER_API_KEY:
        return ok(
            {
                "scenicId": scenic_id or settings.DEFAULT_SCENIC_ID,
                "temperature": 26,
                "weather": "多云",
                "humidity": 60,
                "windSpeed": "3级",
                "warning": None,
                "source": "mock（未配置天气 API key）",
            },
            trace_id,
        )

    # 调用和风天气实时天气 API
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{settings.QWEATHER_BASE_URL}/weather/now",
                params={"location": f"{LON},{LAT}", "key": settings.QWEATHER_API_KEY},
            )
            data = resp.json()

        if data.get("code") == "200":
            now = data.get("now", {})
            return ok(
                {
                    "scenicId": scenic_id or settings.DEFAULT_SCENIC_ID,
                    "temperature": int(now.get("temp", 0)),
                    "weather": now.get("text", "未知"),
                    "humidity": int(now.get("humidity", 0)),
                    "windSpeed": now.get("windDir", "") + now.get("windScale", "") + "级",
                    "icon": now.get("icon", ""),
                    "warning": None,
                    "source": "和风天气",
                },
                trace_id,
            )
        else:
            return ok(
                {
                    "scenicId": scenic_id or settings.DEFAULT_SCENIC_ID,
                    "temperature": 26,
                    "weather": "多云",
                    "warning": None,
                    "source": f"mock（和风天气返回异常: {data.get('code')}）",
                },
                trace_id,
            )
    except Exception as e:
        return ok(
            {
                "scenicId": scenic_id or settings.DEFAULT_SCENIC_ID,
                "temperature": 26,
                "weather": "多云",
                "warning": None,
                "source": f"mock（天气 API 请求失败: {str(e)}）",
            },
            trace_id,
        )


@router.get("/queues")
def get_queues(spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok(
        {
            "spotId": spot_id or "LS-001",
            "queueMinutes": 15,
            "crowdLevel": "medium",
            "source": "mock",
        },
        trace_id,
    )


@router.get("/tickets/products")
def get_tickets(date: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok(
        {
            "items": [
                {"id": "TK-001", "name": "灵山胜境成人票", "price": 210, "status": "available", "source": "public_demo_package"},
                {"id": "TK-002", "name": "灵山胜境学生票", "price": 105, "status": "available", "source": "public_demo_package"},
            ]
        },
        trace_id,
    )


@router.get("/analytics/visitor-behavior")
def get_visitor_behavior(attraction_name: str = None, date_range: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok(
        {
            "totalSamples": 140448,
            "avgSatisfaction": 4.2,
            "avgStayDuration": "3.5h",
            "avgTotalCost": 280,
            "source": "public_demo_package",
        },
        trace_id,
    )
