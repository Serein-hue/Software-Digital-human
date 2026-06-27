# Current Runtime Architecture

This repository contains several historical API surfaces. The deployable path is:

1. `services/scenic-dh-business-api` on port `8001`
   - Visitor-facing API for scenic data, routes, sessions, messages, arrivals, feedback, operations, and RAG proxy.
2. `services/scenic-dh-admin-api` on port `8002`
   - Operator API for knowledge management, personas, broadcasts, audit, analytics, runtime control, and work orders.
3. `rag/run_rag_server.py` on port `5010`
   - RAG ingest, retrieval, stats, and answer generation service.
4. Fay runtime on port `5000`
   - Optional local digital-human runtime used by admin runtime controls and broadcasts.
5. `docs/app`
   - Static web artifact for GitHub Pages.

## Legacy Surface

`backend/` is a legacy Express API kept for historical demos and narrow compatibility checks. New code should not add endpoints there. New visitor endpoints belong in `services/scenic-dh-business-api`; new operator endpoints belong in `services/scenic-dh-admin-api`.

## Configuration

Both FastAPI services read `.env` through `pydantic-settings`.

- `CORS_ORIGINS` is a comma-separated allowlist. Do not use `*` for admin-api.
- `ADMIN_TOKEN` is disabled by default. `ALLOW_LEGACY_ADMIN_TOKEN=true` is only for local demos.
- Admin clients should authenticate with `POST /v1/auth/login` and then use the returned bearer token.
- RAG, Fay, weather, and internal service tokens must be supplied from environment-specific config.

## Health Checks

Use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1
```

This checks business-api, admin-api, RAG, and optional Fay connectivity.
