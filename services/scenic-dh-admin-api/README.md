# scenic-dh-admin-api

Operations management API for knowledge governance, digital-human runtime control, analytics, work orders, and audit views.

## Run

```bash
cd services/scenic-dh-admin-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Useful URLs:

- Health: <http://localhost:8002/health>
- OpenAPI: <http://localhost:8002/docs>

## Authentication

Production and normal demos use session login:

```http
POST /v1/auth/login
Content-Type: application/json

{"username":"admin","password":"<ADMIN_BOOTSTRAP_PASSWORD>"}
```

Use the returned token as:

```http
Authorization: Bearer <token>
```

Legacy fixed-token auth is disabled by default. It can only be enabled for local compatibility demos with:

```env
ALLOW_LEGACY_ADMIN_TOKEN=true
ADMIN_TOKEN=<local-only-token>
```

Do not enable legacy fixed-token auth in exposed environments.

Set `ADMIN_BOOTSTRAP_PASSWORD` before the first start to create the initial admin user. The service does not ship with a usable default password.

## CORS

Set `CORS_ORIGINS` to a comma-separated allowlist, for example:

```env
CORS_ORIGINS=http://localhost:5173,https://serein-hue.github.io
```

Avoid wildcard CORS on admin endpoints.
