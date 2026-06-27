# scenic-dh Authentication Contract

Version: 1.1.0

## Authentication Layers

| Layer | Credential | Header | Scope |
| --- | --- | --- | --- |
| Visitor session | `sess-<uuid>` | `Authorization: Bearer sess-xxx` | Visitor-owned session data |
| Internal service | `SERVICE_TOKEN` | `Authorization: Bearer <SERVICE_TOKEN>` | Service-to-service calls |
| Admin session | Login-issued `adm_<uuid>` | `Authorization: Bearer adm_xxx` | Admin API operations |

## Admin Login

Admin clients must call:

```http
POST /v1/auth/login
Content-Type: application/json

{"username":"<admin-user>","password":"<admin-password>"}
```

The returned `data.token` is then sent as:

```http
Authorization: Bearer <data.token>
```

The old fixed admin token is disabled by default. `ALLOW_LEGACY_ADMIN_TOKEN=true` is only allowed for local compatibility demos and must not be enabled in exposed environments.

## Bootstrap User

Set `ADMIN_BOOTSTRAP_PASSWORD` before the first admin-api start to create the initial admin user. If the variable is empty, the service creates roles only and no default password can be used to log in.

## Security Boundaries

- `/health`, `/docs`, `/redoc`, `/openapi.json`, and `/v1/auth/login` are public.
- All other admin-api endpoints require a valid admin session token.
- Internal endpoints use `SERVICE_TOKEN`; do not reuse admin session tokens for service-to-service calls.
- Environment-specific tokens and passwords must be injected through `.env`, deployment secrets, or CI/CD secret storage.
