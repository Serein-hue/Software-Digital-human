# scenic-dh-contracts

Shared API contracts for the scenic digital-human service stack.

## Files

| File | Purpose |
| --- | --- |
| `openapi.yaml` | OpenAPI endpoint contract |
| `auth.md` | Authentication and token contract |
| `errors.md` | Error envelope and code contract |
| `dto_examples.json` | Representative payload examples |
| `collections/` | Postman and shell smoke-test assets |

## Services

| Service | Port | Responsibility |
| --- | --- | --- |
| scenic-dh-business-api | 8001 | Visitor-facing guide APIs |
| scenic-dh-admin-api | 8002 | Operator and runtime management APIs |
| RAG service | 5010 | Retrieval and answer generation |
| Fay runtime | 5000 | Optional local digital-human runtime |

## Current Auth Headers

| Scenario | Header |
| --- | --- |
| Admin API | `Authorization: Bearer <login-issued-token>` |
| Internal service calls | `Authorization: Bearer <SERVICE_TOKEN>` |
| Visitor session calls | `Authorization: Bearer <session-token>` |

Do not use the removed `x-admin-token` or fixed local admin token in new clients.
