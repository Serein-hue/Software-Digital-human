"""admin-api 种子数据：默认角色 + 管理员

用法:
  cd services/scenic-dh-admin-api
  python seed_db.py
"""

import sys, os, hashlib, secrets

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, Base, SessionLocal
from app.models import Role, User, ConfigEntry


DEFAULT_PERMISSIONS = {
    "superadmin": [
        "content:read", "content:write", "content:approve", "content:revoke",
        "users:read", "users:write", "users:manage",
        "roles:read", "roles:write",
        "work_orders:read", "work_orders:assign", "work_orders:resolve",
        "broadcasts:create", "broadcasts:cancel",
        "knowledge:read", "knowledge:rebuild",
        "runtime:read", "runtime:control",
        "analytics:read",
        "audit:read",
        "config:read", "config:write",
    ],
    "editor": [
        "content:read", "content:write",
        "broadcasts:create",
        "work_orders:read",
        "analytics:read",
    ],
    "reviewer": [
        "content:read", "content:approve", "content:revoke",
        "work_orders:read", "work_orders:assign",
        "analytics:read",
    ],
    "viewer": [
        "content:read",
        "analytics:read",
        "work_orders:read",
    ],
}


def _hash_password(password: str) -> str:
    """简单的密码哈希（生产应使用 passlib bcrypt）"""
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    return f"sha256${salt}${h}"


def _verify_password(password: str, hashed: str) -> bool:
    """验证密码（供 auth router 使用）"""
    try:
        algo, salt, h = hashed.split("$", 2)
        return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == h
    except (ValueError, AttributeError):
        return False


def seed_admin_db():
    print("创建 admin-api 表...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Roles ──
        roles = {}
        for name, perms in DEFAULT_PERMISSIONS.items():
            existing = db.query(Role).filter(Role.name == name).first()
            if existing:
                roles[name] = existing
            else:
                role = Role(name=name, description=f"{name} 角色", permissions=perms)
                db.add(role)
                db.flush()
                roles[name] = role
        print(f"  Roles: {len(roles)} 个 (superadmin, editor, reviewer, viewer)")

        # ── Default Admin User ──
        if db.query(User).filter(User.username == "admin").first() is None:
            superadmin = roles["superadmin"]
            admin = User(
                username="admin",
                password_hash=_hash_password("admin123"),
                display_name="超级管理员",
                role_id=superadmin.id,
                status="active",
            )
            db.add(admin)
            print("  User: admin/admin123 (超级管理员) ✓")

        # ── Default Configs ──
        defaults = [
            ("mock_enabled", True, "boolean", "是否启用 mock 数据"),
            ("fay_runtime_url", "http://localhost:8005/internal/v1", "string", "Fay 运行时地址"),
            ("rag_service_url", "http://localhost:8003/api/v1", "string", "RAG 服务地址"),
            ("business_api_url", "http://localhost:8001/v1", "string", "Business API 地址"),
            ("auto_publish_content", False, "boolean", "内容审核通过后是否自动发布"),
        ]
        for key, val, vtype, desc in defaults:
            existing = db.query(ConfigEntry).filter(ConfigEntry.key == key).first()
            if not existing:
                db.add(ConfigEntry(key=key, value=val, value_type=vtype, description=desc))
        print(f"  Configs: {len(defaults)} 项默认配置")

        # ── Default Personas ──
        from app.models import Persona, DataGap
        if db.query(Persona).count() == 0:
            db.add_all([
                Persona(id="P1", name="灵山小导游",
                        description="活泼友好的景区导游，适合家庭游客",
                        tone="friendly",
                        fallback_policy={"low_confidence": "admit_unsure", "off_topic": "redirect"}),
                Persona(id="P2", name="灵山文化导览",
                        description="专业严谨的文化讲解员，适合文化深度游客",
                        tone="professional",
                        fallback_policy={"low_confidence": "cite_source", "off_topic": "decline"}),
            ])
            print("  Personas: 2 个 (P1 灵山小导游, P2 灵山文化导览)")

        # ── Default Data Gaps ──
        if db.query(DataGap).count() == 0:
            db.add_all([
                DataGap(id="GAP-001", data_type="GPS/定位", description="游客真实 GPS 位置",
                        impact="无法做精确到达检测", status="pending", mock_strategy="默认灵山坐标", priority="P0", owner="接口"),
                DataGap(id="GAP-002", data_type="实时天气", description="景区实时天气数据",
                        impact="天气提醒不准确", status="pending", mock_strategy="固定多云26℃", priority="P1", owner="接口"),
                DataGap(id="GAP-003", data_type="实时客流", description="各景点实时人数",
                        impact="无法计算准确排队时间", status="pending", mock_strategy="固定15分钟", priority="P1", owner="接口"),
                DataGap(id="GAP-004", data_type="票务核销", description="第三方票务系统对接",
                        impact="只能展示票种跳转购买", status="pending", mock_strategy="模拟票码验证", priority="P0", owner="接口"),
            ])
            print("  DataGaps: 4 个")

        db.commit()
        print("\nadmin-api 种子数据导入完成 ✓")
        print("  登录: POST /v1/auth/login {\"username\":\"admin\",\"password\":\"admin123\"}")
    except Exception as e:
        db.rollback()
        print(f"错误: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_db()
