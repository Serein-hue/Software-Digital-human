"""种子数据初始化 — 将 MVP 种子数据导入 SQLite

用法:
  cd services/scenic-dh-business-api
  python seed_db.py
"""

import sys, os, json, uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, init_db, SessionLocal
from app.models import (
    Spot, Route, RouteStop, Notice, Event, ServiceFacility,
    POI, QRCode, TicketEntitlement, OfflinePackage,
)
from shared.database import Base

SEEDS_DIR = os.path.join(os.path.dirname(__file__), "seeds")


def _load_json(filename):
    path = os.path.join(SEEDS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def seed_business_db():
    print("创建 business-api 表...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Spots ──
        spots_data = _load_json("lingshan_spots.json")
        if spots_data and "spots" in spots_data:
            count = 0
            for s in spots_data["spots"]:
                existing = db.query(Spot).filter(Spot.id == s.get("id")).first()
                if existing:
                    continue
                db.add(Spot(
                    id=s.get("id"),
                    name=s.get("name", ""),
                    name_en=s.get("nameEn", ""),
                    tags=s.get("tags", []),
                    location=s.get("location", ""),
                    summary=s.get("summary", ""),
                    intro=s.get("intro", ""),
                    highlights=s.get("highlights", []),
                    images=s.get("images", []),
                    guide_short=s.get("guide_short", ""),
                    guide_brief=s.get("guide_brief", ""),
                    guide_long=s.get("guide_long", ""),
                    guide_fallback=s.get("guide_fallback", ""),
                    source=s.get("source", "public_demo_package"),
                    freshness_level=s.get("freshnessLevel", "high"),
                ))
                count += 1
            print(f"  Spots: {count} 条")

        # ── Routes ──
        routes_data = _load_json("lingshan_routes.json")
        if routes_data and "routes" in routes_data:
            count = 0
            for r in routes_data["routes"]:
                existing = db.query(Route).filter(Route.id == r.get("id")).first()
                if existing:
                    continue
                route = Route(
                    id=r.get("id"),
                    name=r.get("name", ""),
                    type=r.get("type", "culture"),
                    duration=r.get("duration", ""),
                    persona=r.get("persona", ""),
                    tips=r.get("tips", ""),
                    source=r.get("source", "public_demo_package"),
                )
                db.add(route)
                db.flush()
                for i, stop in enumerate(r.get("stops", [])):
                    db.add(RouteStop(
                        route_id=route.id,
                        order=stop.get("order", i + 1),
                        spot_id=stop.get("spotId", ""),
                        spot_name=stop.get("spotName", ""),
                        stay_duration=stop.get("stayDuration", ""),
                        description=stop.get("description", ""),
                    ))
                count += 1
            print(f"  Routes: {count} 条")

        # ── Notices ──
        if db.query(Notice).count() == 0:
            db.add_all([
                Notice(id="NO-001", type="announcement", title="梵宫大修通知",
                       content="梵宫即日起进行为期三个月的修缮工作，期间部分区域关闭。",
                       active=True, priority="normal", expires_at=None),
                Notice(id="NO-002", type="info", title="五一假期入园须知",
                       content="五一期间每日限流30000人，请提前预约购票。",
                       active=True, priority="high", expires_at=None),
            ])
            print("  Notices: 2 条")

        # ── Events ──
        if db.query(Event).count() == 0:
            db.add_all([
                Event(id="EV-001", title="九龙灌浴表演", description="每日多场大型音乐喷泉表演",
                      spot_id="LS-004", active=True),
                Event(id="EV-002", title="梵宫祈福法会", description="每周六上午举行",
                      spot_id="LS-011", active=True),
            ])
            print("  Events: 2 条")

        # ── Service Facilities ──
        if db.query(ServiceFacility).count() == 0:
            db.add_all([
                ServiceFacility(id="SF-001", category="toilet", name="大佛广场卫生间", location="灵山大佛广场东侧"),
                ServiceFacility(id="SF-002", category="restaurant", name="素食餐厅", location="梵宫一层"),
                ServiceFacility(id="SF-003", category="parking", name="P1 停车场", location="景区入口西侧"),
                ServiceFacility(id="SF-004", category="medical", name="医务室", location="游客中心旁"),
                ServiceFacility(id="SF-005", category="rest_area", name="菩提大道休息区", location="菩提大道中段"),
            ])
            print("  ServiceFacilities: 5 条")

        # ── POIs ──
        if db.query(POI).count() == 0:
            db.add_all([
                POI(id="POI-001", name="灵山大佛", category="spot", lat=31.4245, lng=120.1089),
                POI(id="POI-002", name="九龙灌浴", category="spot", lat=31.4230, lng=120.1060),
                POI(id="POI-003", name="梵宫", category="spot", lat=31.4220, lng=120.1045),
                POI(id="POI-004", name="五印坛城", category="spot", lat=31.4210, lng=120.1030),
                POI(id="POI-005", name="景区入口", category="entrance", lat=31.4200, lng=120.1000),
                POI(id="POI-006", name="景区出口", category="exit", lat=31.4190, lng=120.1010),
                POI(id="POI-007", name="P1 停车场", category="parking", lat=31.4195, lng=120.0995),
                POI(id="POI-008", name="素食餐厅", category="restaurant", lat=31.4222, lng=120.1048),
            ])
            print("  POIs: 8 条")

        # ── QR Codes ──
        if db.query(QRCode).count() == 0:
            db.add_all([
                QRCode(id="QR-001", code="LS001_SCAN", type="spot", target_id="LS-001",
                       target_name="灵山大佛", action="navigate_guide"),
                QRCode(id="QR-002", code="LS004_SCAN", type="spot", target_id="LS-004",
                       target_name="九龙灌浴", action="navigate_guide"),
                QRCode(id="QR-003", code="LS011_SCAN", type="spot", target_id="LS-011",
                       target_name="梵宫", action="navigate_guide"),
                QRCode(id="QR-004", code="TICKET_DEMO_001", type="ticket", target_id="TK-001",
                       target_name="成人票", action="verify_ticket"),
            ])
            print("  QRCodes: 4 条")

        # ── Ticket Entitlements ──
        if db.query(TicketEntitlement).count() == 0:
            db.add_all([
                TicketEntitlement(id="TK-001", product_id="TK-001", product_name="成人票", price=210.0,
                                  applicable_group="成人", official_jump_url="https://weixin.qq.com/buyticket/lingshan"),
                TicketEntitlement(id="TK-002", product_id="TK-002", product_name="学生票", price=105.0,
                                  applicable_group="学生（持有效学生证）",
                                  official_jump_url="https://weixin.qq.com/buyticket/lingshan"),
                TicketEntitlement(id="TK-003", product_id="TK-003", product_name="老人票", price=105.0,
                                  applicable_group="60岁以上老人",
                                  official_jump_url="https://weixin.qq.com/buyticket/lingshan"),
            ])
            print("  TicketEntitlements: 3 条")

        # ── Offline Package ──
        if db.query(OfflinePackage).count() == 0:
            db.add(OfflinePackage(
                id="OFF-001", version="1.0.0", size_bytes=2_400_000,
                manifest_spots=16, manifest_guides=16, manifest_notices=2, manifest_maps=1,
                checksum="sha256:placeholder", force_update=False,
                release_notes="灵山胜境离线包 v1.0.0"
            ))
            print("  OfflinePackage: 1 条")

        db.commit()
        print("\nbusiness-api 种子数据导入完成 ✓")
    except Exception as e:
        db.rollback()
        print(f"错误: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_business_db()
