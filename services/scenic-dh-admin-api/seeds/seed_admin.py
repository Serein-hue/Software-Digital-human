"""Initialize admin roles and the optional bootstrap admin user."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import init_db


def seed() -> None:
    init_db()
    if settings.ADMIN_BOOTSTRAP_PASSWORD:
        print(f"Admin bootstrap user is ready: {settings.ADMIN_BOOTSTRAP_USERNAME}")
    else:
        print("Admin roles are ready. Set ADMIN_BOOTSTRAP_PASSWORD to create the first admin user.")


if __name__ == "__main__":
    seed()
