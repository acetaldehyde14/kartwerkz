# API

NestJS, versioned REST under `/api/v1`, documented live via Swagger at
`/api/docs` (OpenAPI JSON at `/api/docs-json`). This document covers
conventions; the Swagger UI is the authoritative, always-current route list.

## Auth model

Server-managed sessions, not JWT-in-localStorage:

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login` set an **HttpOnly,
  SameSite=Lax** cookie (`SESSION_COOKIE_NAME`, default `kw_session`). The
  cookie holds an opaque session id; the corresponding `Session.tokenHash` is
  a sha256 hash, so a stolen database export can't be replayed as a cookie.
- `POST /api/v1/auth/logout` deletes the `Session` row.
- `GET /api/v1/auth/me` returns the current user or 401.
- Guests get a separate `GUEST_SESSION_COOKIE_NAME` cookie (default
  `kw_guest`), issued automatically on first cart/configurator interaction,
  backing a `GuestSession` row used for ownership checks on guest-owned
  carts/configurations/orders.
- Admin-only routes are behind `@Roles('ADMIN')` + `RolesGuard` — enforced
  server-side regardless of what the storefront's admin UI hides.
- CSRF: cookies are `SameSite=Lax` and all mutating routes require
  `Content-Type: application/json` (not form-encoded), which mitigates
  classic CSRF without custom tokens; revisit if third-party form posts are
  ever needed.

## Error conventions

Validation errors use Nest's `ValidationPipe` (whitelist + transform) and
return `400` with a `message` array of field errors. Ownership/authorization
failures return `403` (not `404`) only when leaking existence isn't a
concern; order lookups return `404` for both "doesn't exist" and "not yours"
to avoid confirming order-id existence to unauthorized callers.

## Representative routes

```
GET    /api/v1/health
GET    /api/v1/products
GET    /api/v1/products/:id

GET    /api/v1/kart-manufacturers
GET    /api/v1/kart-models?manufacturerId=

GET    /api/v1/graphics-designs?kartModelId=

POST   /api/v1/configurations
GET    /api/v1/configurations/:id
PATCH  /api/v1/configurations/:id

POST   /api/v1/uploads
GET    /api/v1/uploads/:id/signed-url

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id

POST   /api/v1/checkout/session
POST   /api/v1/webhooks/stripe

GET    /api/v1/orders
GET    /api/v1/orders/:id
GET    /api/v1/orders/:id/proofs
POST   /api/v1/orders/:id/proofs/:proofId/approve
POST   /api/v1/orders/:id/proofs/:proofId/request-revision

GET    /api/v1/admin/dashboard
GET    /api/v1/admin/orders
PATCH  /api/v1/admin/orders/:id/status
POST   /api/v1/admin/orders/:id/proofs/:proofId/revisions
POST   /api/v1/admin/orders/:id/proofs/:proofId/revisions/:revisionId/send
POST   /api/v1/admin/orders/:id/send-to-supplier
GET    /api/v1/admin/pricing-rules
POST   /api/v1/admin/pricing-rules
PATCH  /api/v1/admin/pricing-rules/:id
```

These are the agreed route _shapes_; exact signatures live in Swagger. New
routes should follow the same `/api/v1/<resource>` pattern and be documented
with `@ApiTags`/`@ApiOperation` decorators so Swagger stays authoritative.

## Idempotency

`POST /webhooks/stripe` verifies the Stripe signature
(`STRIPE_WEBHOOK_SECRET`) and checks `Payment.processedEventIds` before
applying any effect — replays of the same event id are a no-op. This is the
_only_ code path allowed to mark an order `PAID`.

## Rate limiting

Global default via `@nestjs/throttler` (~60 req/min/IP), with stricter limits
on `/auth/login` and `/checkout/session`. Nginx adds a second layer
(`limit_req_zone`) in production — see `infrastructure/nginx/prod.conf`.
