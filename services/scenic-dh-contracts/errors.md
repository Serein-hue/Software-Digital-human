# scenic-dh Error Contract

All services return a consistent envelope:

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "trace_id": "trace_..."
}
```

`code = 0` means success. Non-zero codes describe business or system errors.

## Common Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `40000` | 400 | Request validation failed |
| `40001` | 400 | Missing authentication header |
| `40100` | 401 | Invalid credential |
| `40101` | 401 | Expired or invalid token |
| `40300` | 403 | Permission denied |
| `40400` | 404 | Resource not found |
| `42900` | 429 | Rate limit exceeded |
| `50000` | 500 | Internal service error |
| `50200` | 502 | Upstream service error |
| `50300` | 503 | Service unavailable |
| `50301` | 503 | Fay runtime offline |
| `50400` | 504 | Upstream timeout |

## Authentication Errors

All protected endpoints use:

```http
Authorization: Bearer <token>
```

- Business internal calls use `SERVICE_TOKEN`.
- Admin calls use a session token returned by `POST /v1/auth/login`.
- Visitor calls use a visitor session token where applicable.

Fixed admin tokens such as historical local demo values are not part of the current contract.
