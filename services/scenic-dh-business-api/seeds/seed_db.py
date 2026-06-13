"""seed_db — 将灵山种子数据灌入数据库

用法:  cd services/scenic-dh-business-api && python -m seeds.seed_db
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import (
    Spot, SpotGuide, Route, RouteStop,
    Notice, Event, ServiceFacility, TicketProduct,
    MapPOI, QRCodeRule, QueueResource, OfflinePackage,
)

# ── 从 routers 中提取的种子数据 ──────────────────────────────────────

_SEED_SPOTS = [
    {"id": "LS-001", "scenicId": "SA-001", "name": "灵山大佛", "nameEn": "Lingshan Giant Buddha", "tags": ["佛教文化", "标志性建筑", "必游"], "location": "景区中轴线北端", "summary": "高 88 米的青铜释迦牟尼立像，灵山胜境核心标志", "intro": "灵山大佛高 88 米，加上基座总高达 101.5 米...", "highlights": ["抱佛脚祈福", "登高望远"], "source": "public_demo_package", "freshnessLevel": "high"},
    {"id": "LS-002", "scenicId": "SA-001", "name": "灵山梵宫", "nameEn": "Lingshan Brahma Palace", "tags": ["建筑艺术", "佛教文化", "必游"], "location": "大佛广场东侧", "summary": "融合中国传统与佛教艺术的宏伟宫殿", "intro": "梵宫是灵山胜境的核心建筑之一，以华藏世界为设计理念...", "highlights": ["华藏世界大殿", "琉璃艺术墙"], "source": "public_demo_package", "freshnessLevel": "high"},
    {"id": "LS-003", "scenicId": "SA-001", "name": "九龙灌浴", "nameEn": "Nine Dragons Bathing", "tags": ["表演", "标志性景观", "必游"], "location": "景区入口中轴线", "summary": "大型音乐喷泉，再现释迦牟尼诞生场景", "intro": "九龙灌浴是灵山胜境的标志性景观之一...", "highlights": ["喷泉表演", "太子佛像出浴"], "source": "public_demo_package", "freshnessLevel": "high"},
    {"id": "LS-004", "scenicId": "SA-001", "name": "五印坛城", "nameEn": "Five Mudra Mandala", "tags": ["藏传佛教", "建筑", "文化"], "location": "梵宫东北侧", "summary": "藏传佛教风格建筑，展示藏文化魅力", "intro": "五印坛城是一座藏传佛教风格的建筑...", "highlights": ["坛城建筑群", "藏文化展览"], "source": "public_demo_package", "freshnessLevel": "high"},
    {"id": "LS-005", "scenicId": "SA-001", "name": "祥符禅寺", "nameEn": "Xiangfu Temple", "tags": ["历史", "禅宗", "古寺"], "location": "大佛脚下南侧", "summary": "千年古寺，灵山佛教文化的起点", "intro": "祥符禅寺始建于唐代，是灵山地区最早的佛教寺院...", "highlights": ["古寺建筑", "钟楼"], "source": "public_demo_package", "freshnessLevel": "high"},
    {"id": "LS-006", "scenicId": "SA-001", "name": "阿育王柱", "nameEn": "Ashoka Pillar", "tags": ["历史遗迹", "石刻"], "location": "景区入口广场", "summary": "印度阿育王时代的石柱风格遗迹", "intro": "阿育王柱是仿印度阿育王时代的石柱...", "highlights": ["石柱雕刻", "经文"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-007", "scenicId": "SA-001", "name": "降魔浮雕", "nameEn": "Demon-Subduing Relief", "tags": ["浮雕", "佛教故事"], "location": "大佛基座周围", "summary": "讲述释迦牟尼悟道降魔的大型浮雕", "intro": "降魔浮雕以生动的画面展现了佛陀降魔成道的故事...", "highlights": ["浮雕艺术", "佛教故事"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-008", "scenicId": "SA-001", "name": "百子戏弥勒", "nameEn": "Maitreya with Children", "tags": ["雕塑", "弥勒"], "location": "南门附近", "summary": "弥勒菩萨与百名童子的欢乐雕塑群", "intro": "百子戏弥勒是一座大型铜雕...", "highlights": ["铜雕群像", "互动拍照"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-009", "scenicId": "SA-001", "name": "天下第一掌", "nameEn": "Giant Hand of Buddha", "tags": ["雕塑", "互动"], "location": "大佛广场", "summary": "灵山大佛右手 1:1 复制铜像", "intro": "天下第一掌是灵山大佛右手的等比例复制品...", "highlights": ["摸手祈福", "铜像工艺"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-010", "scenicId": "SA-001", "name": "曼飞龙塔", "nameEn": "Manfeilong Pagoda", "tags": ["佛塔", "建筑"], "location": "景区西侧", "summary": "仿云南傣族风格的白塔群", "intro": "曼飞龙塔是仿照云南西双版纳曼飞龙白塔建造...", "highlights": ["白塔群", "民族风情"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-011", "scenicId": "SA-001", "name": "香水海", "nameEn": "Perfume Sea", "tags": ["水景", "休闲"], "location": "梵宫前广场", "summary": "梵宫前的大型水景广场", "intro": "香水海是梵宫前的大型水景...", "highlights": ["水景倒影", "夜景灯光"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-012", "scenicId": "SA-001", "name": "灵山胜境博物馆", "nameEn": "Lingshan Museum", "tags": ["博物馆", "展览"], "location": "景区南侧服务中心", "summary": "展示灵山佛教文化历史的博物馆", "intro": "博物馆收藏了大量佛教文物和灵山历史资料...", "highlights": ["文物展览", "历史文化"], "source": "public_demo_package", "freshnessLevel": "low"},
    {"id": "LS-013", "scenicId": "SA-001", "name": "菩提大道", "nameEn": "Bodhi Avenue", "tags": ["景观道", "休闲"], "location": "景区南门至大佛广场", "summary": "连接景区大门与大佛广场的主景观道", "intro": "菩提大道两侧种植银杏和菩提树...", "highlights": ["林荫大道", "石刻经文"], "source": "public_demo_package", "freshnessLevel": "medium"},
    {"id": "LS-014", "scenicId": "SA-001", "name": "转经廊", "nameEn": "Prayer Wheel Corridor", "tags": ["藏传佛教", "互动"], "location": "五印坛城旁", "summary": "藏式转经筒长廊", "intro": "转经廊共有 108 个转经筒...", "highlights": ["转经体验", "藏文化"], "source": "manual_seed", "freshnessLevel": "low"},
    {"id": "LS-015", "scenicId": "SA-001", "name": "灵山茶室", "nameEn": "Lingshan Tea House", "tags": ["餐饮", "休闲"], "location": "菩提大道中段", "summary": "景区内品茶休息的场所", "intro": "茶室提供灵山特色素茶和点心...", "highlights": ["品茶休憩", "素斋体验"], "source": "manual_seed", "freshnessLevel": "low"},
    {"id": "LS-016", "scenicId": "SA-001", "name": "佛足坛", "nameEn": "Buddha Foot Altar", "tags": ["佛教", "石刻"], "location": "祥符禅寺旁", "summary": "刻有佛陀足印的石坛", "intro": "佛足坛供奉着佛陀足印的石刻...", "highlights": ["足印石刻", "祈福仪式"], "source": "manual_seed", "freshnessLevel": "low"},
]

_SEED_GUIDES = {
    "LS-001": {"shortText": "灵山大佛", "briefText": "灵山大佛高88米，是世界上最高的青铜释迦牟尼立像，灵山胜境的核心标志。", "longText": "灵山大佛高88米，加上基座总高达101.5米。大佛采用青铜铸造，面容慈祥庄严。您可以登临大佛基座，近距离感受佛法的庄严与慈悲。在这里，您可以抱佛脚祈福，也可以远眺太湖美景。", "fallbackText": "灵山大佛是灵山胜境的标志，建议您前往大佛广场近距离观赏。"},
    "LS-002": {"shortText": "灵山梵宫", "briefText": "梵宫是融合中国传统与佛教艺术的宏伟宫殿，以华藏世界为设计理念。", "longText": "梵宫是灵山胜境的核心建筑之一，建筑面积达7万平方米。内部以华藏世界为设计理念，融合了敦煌壁画、琉璃艺术、木雕、石雕等多种艺术形式。大殿中央的华藏世界是整个梵宫的精华所在，金碧辉煌，令人叹为观止。", "fallbackText": "梵宫是灵山必游景点，建议您前往参观华藏世界大殿。"},
    "LS-003": {"shortText": "九龙灌浴", "briefText": "大型音乐喷泉表演，再现释迦牟尼诞生时九龙吐水的场景。", "longText": "九龙灌浴是灵山胜境的标志性景观之一。每天定时上演的大型音乐喷泉表演，九条金龙环绕莲座，随着音乐缓缓升起，再现释迦牟尼太子诞生时九龙吐水沐浴的庄严场景。表演时间：每日10:00、14:00、16:00。", "fallbackText": "九龙灌浴表演每日三场，分别为10点、14点和16点。"},
    "LS-004": {"shortText": "五印坛城", "briefText": "藏传佛教风格建筑群，展示藏族文化与佛教艺术的完美融合。", "longText": "五印坛城是一座典型的藏传佛教风格建筑，仿照西藏大昭寺而建。坛城内部展示了丰富的藏族文化元素，包括唐卡、酥油花、藏文经书等，让游客感受到浓郁的藏文化气息。", "fallbackText": "五印坛城展示了藏传佛教的独特魅力，值得一游。"},
    "LS-005": {"shortText": "祥符禅寺", "briefText": "千年古寺，灵山佛教文化的历史起点。", "longText": "祥符禅寺始建于唐代，距今已有千年历史。寺院虽然规模不大，但古朴幽静，是灵山地区最早的佛教寺院。寺内有钟楼、大雄宝殿等传统建筑，钟声悠远，让人心生宁静。", "fallbackText": "祥符禅寺位于大佛脚下南侧，是灵山历史最悠久的寺院。"},
}

_SEED_ROUTES = [
    {
        "id": "RT-001", "scenicId": "SA-001", "name": "历史文化深度游", "type": "culture", "duration": "约 6 小时",
        "persona": "对佛教文化和历史感兴趣的游客",
        "stops": [
            {"order": 1, "spotId": "LS-006", "spotName": "阿育王柱", "stayDuration": "15 分钟", "description": "了解古印度佛教文化的影响"},
            {"order": 2, "spotId": "LS-005", "spotName": "祥符禅寺", "stayDuration": "40 分钟", "description": "探访千年古寺，聆听钟声"},
            {"order": 3, "spotId": "LS-007", "spotName": "降魔浮雕", "stayDuration": "20 分钟", "description": "欣赏佛陀降魔成道的大型浮雕"},
            {"order": 4, "spotId": "LS-001", "spotName": "灵山大佛", "stayDuration": "90 分钟", "description": "登临大佛基座，抱佛脚祈福"},
            {"order": 5, "spotId": "LS-002", "spotName": "灵山梵宫", "stayDuration": "90 分钟", "description": "参观华藏世界大殿和琉璃艺术"},
            {"order": 6, "spotId": "LS-004", "spotName": "五印坛城", "stayDuration": "60 分钟", "description": "感受藏传佛教文化魅力"},
        ],
        "tips": "建议上午 8:30 入园，先参观历史遗迹再登大佛，中午在灵山蔬食馆用餐。",
        "source": "public_demo_package",
    },
    {
        "id": "RT-002", "scenicId": "SA-001", "name": "自然风光休闲游", "type": "nature", "duration": "约 5 小时",
        "persona": "喜欢自然景观和轻松游览的家庭游客",
        "stops": [
            {"order": 1, "spotId": "LS-009", "spotName": "天下第一掌", "stayDuration": "20 分钟", "description": "摸佛手祈福"},
            {"order": 2, "spotId": "LS-008", "spotName": "百子戏弥勒", "stayDuration": "30 分钟", "description": "欣赏百子铜雕，适合亲子互动"},
            {"order": 3, "spotId": "LS-003", "spotName": "九龙灌浴", "stayDuration": "40 分钟", "description": "观看音乐喷泉表演"},
            {"order": 4, "spotId": "LS-001", "spotName": "灵山大佛", "stayDuration": "60 分钟", "description": "远观大佛，漫步广场"},
            {"order": 5, "spotId": "LS-011", "spotName": "香水海", "stayDuration": "30 分钟", "description": "欣赏水景，拍照留念"},
        ],
        "tips": "适合带老人小孩的家庭，节奏轻松。九龙灌浴表演 10:00 场次是必看的。",
        "source": "public_demo_package",
    },
    {
        "id": "RT-003", "scenicId": "SA-001", "name": "亲子家庭欢乐游", "type": "family", "duration": "约 4 小时",
        "persona": "带孩子的亲子家庭",
        "stops": [
            {"order": 1, "spotId": "LS-008", "spotName": "百子戏弥勒", "stayDuration": "40 分钟", "description": "孩子最喜欢的雕塑群，互动拍照"},
            {"order": 2, "spotId": "LS-009", "spotName": "天下第一掌", "stayDuration": "20 分钟", "description": "摸摸大佛手，许个小心愿"},
            {"order": 3, "spotId": "LS-003", "spotName": "九龙灌浴", "stayDuration": "40 分钟", "description": "观看震撼的喷泉表演"},
            {"order": 4, "spotId": "LS-015", "spotName": "灵山茶室", "stayDuration": "30 分钟", "description": "休息补给，品尝素斋点心"},
        ],
        "tips": "行程紧凑，适合下午入园。九龙灌浴 14:00 场次最适合亲子观看。",
        "source": "public_demo_package",
    },
]

_SEED_NOTICES = [
    {"id": "NT-001", "type": "info", "title": "梵宫内部修缮通知", "content": "梵宫部分展厅将于6月5日-6月10日进行内部修缮，期间部分区域暂停开放。", "active": True, "expiresAt": "2026-06-10T18:00:00Z"},
    {"id": "NT-002", "type": "alert", "title": "景区入园须知", "content": "五一期间游客较多，建议提前预约门票，错峰出行。", "active": True, "expiresAt": "2026-06-30T18:00:00Z"},
]

_SEED_EVENTS = [
    {"id": "EV-001", "name": "九龙灌浴表演", "spotId": "LS-003", "time": "每日 10:00, 14:00, 16:00", "description": "大型音乐喷泉表演，再现释迦牟尼诞生场景"},
    {"id": "EV-002", "name": "梵宫祈福法会", "spotId": "LS-002", "time": "每周六 09:30", "description": "梵宫大殿内举行的祈福仪式"},
]

_SEED_SERVICES = [
    {"id": "SV-001", "category": "toilet", "name": "南门卫生间", "location": "景区南门入口右侧"},
    {"id": "SV-002", "category": "restaurant", "name": "灵山蔬食馆", "location": "大佛广场东侧"},
    {"id": "SV-003", "category": "parking", "name": "P1 停车场", "location": "景区正门外"},
    {"id": "SV-004", "category": "help_point", "name": "游客服务中心", "location": "景区南门入口"},
]

_SEED_TICKETS = [
    {"id": "TK-001", "name": "灵山胜境成人票", "price": 210, "status": "available", "source": "public_demo_package"},
    {"id": "TK-002", "name": "灵山胜境学生票", "price": 105, "status": "available", "source": "public_demo_package"},
]

# ── P0 新数据 ──────────────────────────────────────────────────────

_SEED_MAP_POIS = [
    # 景点 POI（用已有景点数据补充坐标）
    {"id": "POI-LS-001", "name": "灵山大佛", "name_en": "Lingshan Giant Buddha", "category": "spot", "latitude": 31.4325, "longitude": 120.0980},
    {"id": "POI-LS-002", "name": "灵山梵宫", "name_en": "Lingshan Brahma Palace", "category": "spot", "latitude": 31.4310, "longitude": 120.0995},
    {"id": "POI-LS-003", "name": "九龙灌浴", "name_en": "Nine Dragons Bathing", "category": "spot", "latitude": 31.4300, "longitude": 120.0960},
    {"id": "POI-LS-004", "name": "五印坛城", "category": "spot", "latitude": 31.4328, "longitude": 120.1010},
    {"id": "POI-LS-005", "name": "祥符禅寺", "category": "spot", "latitude": 31.4335, "longitude": 120.0975},
    {"id": "POI-LS-008", "name": "百子戏弥勒", "category": "spot", "latitude": 31.4295, "longitude": 120.0955},
    # 出入口
    {"id": "POI-ENT-01", "name": "南门入口", "category": "entrance", "latitude": 31.4260, "longitude": 120.0950},
    {"id": "POI-EXT-01", "name": "北门出口", "category": "exit", "latitude": 31.4355, "longitude": 120.0985},
    # 服务设施
    {"id": "POI-SV-001", "name": "南门卫生间", "category": "toilet", "latitude": 31.4262, "longitude": 120.0955},
    {"id": "POI-SV-002", "name": "灵山蔬食馆", "category": "restaurant", "latitude": 31.4315, "longitude": 120.0990},
    {"id": "POI-SV-003", "name": "P1 停车场", "category": "parking", "latitude": 31.4250, "longitude": 120.0940},
    {"id": "POI-SV-004", "name": "游客服务中心", "category": "help_point", "latitude": 31.4265, "longitude": 120.0952},
]

_SEED_QR_CODES = [
    {"id": "QR-001", "code": "SPOT-LS-001", "target_type": "spot", "target_id": "LS-001", "description": "灵山大佛扫码讲解", "active": True},
    {"id": "QR-002", "code": "SPOT-LS-002", "target_type": "spot", "target_id": "LS-002", "description": "灵山梵宫扫码讲解", "active": True},
    {"id": "QR-003", "code": "SPOT-LS-003", "target_type": "spot", "target_id": "LS-003", "description": "九龙灌浴扫码讲解", "active": True},
    {"id": "QR-004", "code": "EVENT-EV-001", "target_type": "event", "target_id": "EV-001", "description": "九龙灌浴表演预约", "active": True},
]

_SEED_QUEUE_RESOURCES = [
    {"id": "QR-RES-001", "name": "九龙灌浴 10:00 场次", "resource_type": "show", "spot_id": "LS-003", "capacity": 500, "schedule": "每日 10:00"},
    {"id": "QR-RES-002", "name": "九龙灌浴 14:00 场次", "resource_type": "show", "spot_id": "LS-003", "capacity": 500, "schedule": "每日 14:00"},
    {"id": "QR-RES-003", "name": "九龙灌浴 16:00 场次", "resource_type": "show", "spot_id": "LS-003", "capacity": 400, "schedule": "每日 16:00"},
    {"id": "QR-RES-004", "name": "灵山大佛登顶排队", "resource_type": "spot", "spot_id": "LS-001", "capacity": 100, "schedule": "全天"},
]

_SEED_OFFLINE_PACKAGES = [
    {"id": "OFF-001", "version": "1.0.0", "platform": "all", "url": "https://static.lingshan.com/offline/1.0.0.zip", "file_hash": "abc123...", "size_bytes": 52428800, "changelog": "初始离线包：基础地图、景点列表、讲解词", "mandatory": True},
]


def _seed_table(db, model, items, builder_fn, label):
    """如果表为空则灌入数据"""
    if db.query(model).count() > 0:
        return False
    for item in items:
        db.add(builder_fn(item))
    db.flush()
    print(f"  ✓ {len(items)} {label}")
    return True


def seed():
    init_db()
    db = SessionLocal()

    try:
        seeded = False

        seeded |= _seed_table(db, Spot, _SEED_SPOTS, lambda s: Spot(
            id=s["id"], scenic_id=s.get("scenicId", "SA-001"),
            name=s["name"], name_en=s.get("nameEn", ""),
            tags=s.get("tags", []), location=s.get("location", ""),
            summary=s.get("summary", ""), intro=s.get("intro", ""),
            highlights=s.get("highlights", []),
            source=s.get("source", "public_demo_package"),
            freshness_level=s.get("freshnessLevel", "high"),
        ), "景点")

        seeded |= _seed_table(db, SpotGuide, _SEED_GUIDES.items(), lambda g: SpotGuide(
            id=f"G-{g[0]}", spot_id=g[0],
            short_text=g[1]["shortText"], brief_text=g[1]["briefText"],
            long_text=g[1]["longText"], fallback_text=g[1]["fallbackText"],
        ), "讲解词")

        if db.query(Route).count() == 0:
            for r in _SEED_ROUTES:
                db.add(Route(
                    id=r["id"], scenic_id=r.get("scenicId", "SA-001"),
                    name=r["name"], type=r.get("type", "general"),
                    duration=r.get("duration", ""), persona=r.get("persona", ""),
                    tips=r.get("tips", ""), source=r.get("source", "public_demo_package"),
                ))
                for stop in r.get("stops", []):
                    db.add(RouteStop(
                        id=f"{r['id']}-S{stop['order']:02d}", route_id=r["id"],
                        order=stop["order"], spot_id=stop.get("spotId", ""),
                        spot_name=stop.get("spotName", ""),
                        stay_duration=stop.get("stayDuration", ""),
                        description=stop.get("description", ""),
                    ))
            db.flush()
            print(f"  ✓ {len(_SEED_ROUTES)} 路线")
            seeded = True

        seeded |= _seed_table(db, Notice, _SEED_NOTICES, lambda n: Notice(
            id=n["id"], type=n["type"], title=n["title"], content=n["content"],
            active=n["active"], expires_at=n["expiresAt"],
        ), "公告")

        seeded |= _seed_table(db, Event, _SEED_EVENTS, lambda ev: Event(
            id=ev["id"], name=ev["name"], spot_id=ev["spotId"],
            time=ev["time"], description=ev["description"],
        ), "活动")

        seeded |= _seed_table(db, ServiceFacility, _SEED_SERVICES, lambda sv: ServiceFacility(
            id=sv["id"], category=sv["category"], name=sv["name"], location=sv["location"],
        ), "服务设施")

        seeded |= _seed_table(db, TicketProduct, _SEED_TICKETS, lambda tk: TicketProduct(
            id=tk["id"], name=tk["name"], price=tk["price"], status=tk["status"],
        ), "票种")

        # ── P0 新数据 ──
        seeded |= _seed_table(db, MapPOI, _SEED_MAP_POIS, lambda p: MapPOI(
            id=p["id"], name=p["name"], name_en=p.get("name_en", ""),
            category=p["category"], latitude=p["latitude"], longitude=p["longitude"],
        ), "地图 POI")

        seeded |= _seed_table(db, QRCodeRule, _SEED_QR_CODES, lambda q: QRCodeRule(
            id=q["id"], code=q["code"], target_type=q["target_type"],
            target_id=q["target_id"], description=q.get("description", ""),
            active=q.get("active", True),
        ), "二维码规则")

        seeded |= _seed_table(db, QueueResource, _SEED_QUEUE_RESOURCES, lambda q: QueueResource(
            id=q["id"], name=q["name"], resource_type=q["resource_type"],
            spot_id=q["spot_id"], capacity=q["capacity"], schedule=q.get("schedule", ""),
        ), "排队资源")

        seeded |= _seed_table(db, OfflinePackage, _SEED_OFFLINE_PACKAGES, lambda p: OfflinePackage(
            id=p["id"], version=p["version"], platform=p.get("platform", "all"),
            url=p["url"], file_hash=p["file_hash"], size_bytes=p["size_bytes"],
            changelog=p.get("changelog", ""), mandatory=p.get("mandatory", False),
        ), "离线包")

        if seeded:
            db.commit()
            print("✅ 数据入库完成")
        else:
            print("  ℹ️  所有表已有数据，跳过 seed")

    except Exception as e:
        db.rollback()
        print(f"❌ 入库失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
