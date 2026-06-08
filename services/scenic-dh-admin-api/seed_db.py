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
