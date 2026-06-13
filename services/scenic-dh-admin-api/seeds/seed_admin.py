"""seed_admin — 创建默认管理员、角色和权限"""

import hashlib
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models_admin import AdminUser, Role, Permission


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed():
    init_db()
    db = SessionLocal()

    try:
        if db.query(Role).count() > 0 and db.query(AdminUser).count() > 0:
            return

        # 角色
        admin_role = Role(id="ROLE_ADMIN", name="超级管理员", description="系统管理员，拥有所有权限")
        editor_role = Role(id="ROLE_EDITOR", name="内容编辑", description="内容编辑，可以管理内容但无法修改系统设置")
        db.add(admin_role)
        db.add(editor_role)
        db.flush()

        # 权限
        resources = ["spots", "notices", "events", "services", "tickets", "routes", "map_pois", "qr_codes", "knowledge", "personas", "broadcasts", "system"]
        actions = ["create", "read", "update", "delete", "publish"]
        for resource in resources:
            for action in actions:
                db.add(Permission(role_id="ROLE_ADMIN", resource=resource, action=action))
        # 编辑角色只有内容权限
        for resource in ["spots", "notices", "events", "services", "tickets", "routes"]:
            for action in ["create", "read", "update"]:
                db.add(Permission(role_id="ROLE_EDITOR", resource=resource, action=action))
        db.flush()

        # 默认管理员
        admin = AdminUser(
            username="admin",
            password_hash=_hash_password("admin123"),
            display_name="系统管理员",
            role_id="ROLE_ADMIN",
            is_active=True,
        )
        editor = AdminUser(
            username="editor",
            password_hash=_hash_password("editor123"),
            display_name="内容编辑",
            role_id="ROLE_EDITOR",
            is_active=True,
        )
        db.add(admin)
        db.add(editor)
        db.commit()
        print("  ✓ 默认管理员/角色已创建 (admin/admin123, editor/editor123)")

    except Exception as e:
        db.rollback()
        print(f"  ⚠ Admin seed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
