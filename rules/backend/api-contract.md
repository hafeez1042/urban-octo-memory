# API Contract

## Response envelope

Every response is `IAPIV1Response<T>` from `@repo/types`. Controllers build it with
`v1Response()`; the error handler builds the failure form. Never assemble it by hand.

```jsonc
// success
{ "version": "v1", "success": true, "data": {}, "meta": { "total": 412, "limit": 50 }, "requestId": "…" }

// failure
{ "version": "v1", "success": false, "errors": ["Not Found"], "code": "not_found", "requestId": "…" }

// validation failure (422)
{ "version": "v1", "success": false, "code": "validation_failed",
  "validationErrors": { "title": ["String must contain at least 1 character(s)"] } }
```

- `code` is the machine-readable reason integrations branch on; `errors` is for humans.
- `requestId` is echoed in the body and the `x-request-id` header for support and tracing.

## Status codes

| Situation | Status | `code` |
|---|---|---|
| Read, update, delete succeeded | 200 | — |
| Create succeeded | 201 | — |
| Malformed request | 400 | `bad_request` |
| Missing or invalid token | 401 | `not_authorized` |
| Authenticated but not permitted | 403 | `forbidden` |
| No such record or route | 404 | `not_found` |
| Constraint or state conflict | 409 | `conflict` |
| Field validation failed | 422 | `validation_failed` |
| Rate limit exceeded | 429 | `rate_limited` |
| Unexpected fault | 500 | `internal_error` |
| Database or dependency unavailable | 503 | `database_unavailable` / `service_unavailable` |

Throw the matching error from `@repo/backend/lib/errors/*`; never send an error response
from a controller. Sequelize failures are translated centrally — driver messages,
constraint names and SQL must never reach a client.

## Query parameters

Collections take a single JSON-encoded `query` parameter shaped as `IQueryStringParams`:

```
GET /api/v1/orders?query={"q":"widget","filter":{"status":{"in":["Pending","Confirmed"]}},"orderBy":"created_at","order":"dsc","limit":50}
```

| Field | Effect |
|---|---|
| `q` | Full-text search through the repository's `getSearchQuery` |
| `filter` | Per-field conditions: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `nin`, `contains`, `startsWith`, `endsWith` |
| `orderBy` / `order` | Sort column and direction (`asc` \| `dsc`) |
| `limit` / `skip` | Offset pagination; `limit` makes the response include `meta.total` |
| `cursor` | Keyset pagination; response includes `meta.nextCursor` |
| `expand` | Eager-load the repository's declared associations |
| `deleted` | Include soft-deleted rows |
| `updatedSince` | Delta retrieval for integrations reconciling after downtime |

- `cursor` wins over `limit`/`skip`. Integrations use cursors: offsets shift under
  concurrent inserts and a client can miss rows.
- An unpaginated list is a bug waiting to happen on a table sized for long
  retention; pass `limit` from every list view.
