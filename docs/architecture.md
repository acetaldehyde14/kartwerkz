# Architecture

## Overview

Kartwerkz is a modular monolith split into three deployable units, fronted
by Nginx:

```
                 INTERNET
                    |
                    v
                  NGINX  (TLS termination, routing, rate limiting)
                    |
          +---------+---------+
          |                   |
          v                   v
     NEXT.JS STOREFRONT    NESTJS API
     (SSR/RSC + client         |
      3D configurator)    +----+------+-------+
                           |    |      |       |
                           v    v      v       v
                       Postgres Redis MinIO  Stripe/SMTP
                                 ^
                                 |
                            BullMQ WORKER
                        (emails, upload scan)
```

The storefront never connects to Postgres, Redis, or MinIO directly — every
piece of persisted or private data flows through the NestJS API over HTTP.
This keeps a clean trust boundary: the API is the only component holding
database credentials, S3 credentials, and the Stripe secret key.

## Why a modular monolith

Microservices would add deployment and operational complexity this project
doesn't need yet (single VPS target, one team, one database). Instead,
`apps/api/src/modules/*` enforces service boundaries in code: each domain
(auth, products, configurations, cart, checkout, orders, artwork, suppliers,
admin...) is a self-contained Nest module with its own controller/service/DTO
layer. If a module's load eventually justifies it, it can be extracted into
its own deployable without touching unrelated modules, because the
module boundary already exists.

## Request flow: configuring and buying a kit

1. Storefront loads `GET /kart-manufacturers`, `GET /kart-models`,
   `GET /graphics-designs` to populate the configurator.
2. As the customer edits colours/driver/finish/logos, state lives client-side
   in a Zustand store — no network round-trip per keystroke.
3. Logo uploads go through `POST /uploads` (multipart, validated, stored in
   MinIO under a random object key, queued for the `scan-upload` BullMQ job).
4. "Save configuration" calls `POST /configurations` with the full
   `KitConfiguration` JSON (validated against the shared zod schema). Guests
   are identified by an HttpOnly `GUEST_SESSION_COOKIE_NAME` cookie backed by
   a `GuestSession` row — no login required to save or cart a design.
5. "Add to cart" computes price server-side via `PricingService` and stores a
   `CartItem` referencing the `SavedConfiguration` — the client-submitted
   price, if any, is never trusted.
6. "Checkout" creates an `Order` (`PENDING_PAYMENT`) with immutable
   `OrderItem.configurationSnapshot` JSON, then opens a Stripe Checkout
   Session (or the dev adapter — see below).
7. Stripe's webhook (`POST /webhooks/stripe`), verified and idempotent, is the
   _only_ path that marks an order `PAID`.
8. Admin uploads artwork proof revisions; the customer approves the exact
   revision; only an approved-and-current revision can be sent to the
   supplier (`SENT_TO_SUPPLIER`), enforced in `OrderStatusService`.

## Pricing engine

All prices are integer minor units (`Money = { amountMinorUnits, currency }`,
`@kartwerkz/shared/money.ts`) — never floating point. `PricingService` sums:

```
Base Graphics Kit (Product.basePriceMinorUnits)
+ Material Finish surcharge   (PricingRule: FINISH_SURCHARGE)
+ Design tier fee             (PricingRule: DESIGN_TIER_FEE, premade = 0)
+ Shipping                    (PricingRule: SHIPPING_FLAT)
= Total
```

`PricingRule` rows are admin-editable (`/admin/pricing-rules`), so changing a
surcharge never requires a deploy. Development pricing
(`DEV_BASE_PRICE_MINOR_UNITS` in `.env`) is clearly labeled as non-final —
see Rule 8 of the product spec and `AGENTS.md`.

## Order state machine

`OrderStatus` transitions are declared once, in
`@kartwerkz/shared/enums.ts` (`ORDER_STATUS_TRANSITIONS`), and enforced only
in `OrderStatusService.transition()` on the API side. Every transition writes
an `OrderStatusEvent` (from, to, actor, note, timestamp). No other code path
may write `Order.status` directly — this is the single invariant that keeps
the fulfillment pipeline auditable.

## Payments

`PaymentProvider` is an interface with a `StripeProvider` implementation and
a `DevPaymentAdapter` fallback used only when `STRIPE_SECRET_KEY` is unset
and `NODE_ENV !== 'production'`. The dev adapter never represents a real
payment and logs a loud warning on every use — see `docs/deployment.md` for
what must be configured before go-live.

## Supplier fulfillment

`SupplierAdapter` is a strategy interface (`submitProductionPackage`,
keyed off `Supplier.integrationMethod`). Only `ManualFulfillmentAdapter` is
implemented today — an admin reviews the order and marks it submitted. Email/
API/Webhook/Portal adapters are stubbed behind the same interface so adding
real integrations later doesn't touch order/controller code. See
`docs/supplier-integration.md`.

## Background jobs

BullMQ (Redis-backed) runs in `apps/worker`, decoupled from request/response
cycles: `send-email` (all customer notifications, rendered HTML, SMTP via
nodemailer) and `scan-upload` (currently a stub that marks uploads `CLEAN` —
real AV scanning is a documented TODO).

## Frontend rendering strategy

Marketing/content pages (`/custom-graphics`, `/gallery`, `/how-it-works`,
legal pages) are React Server Components for SEO and fast first paint. The
homepage hero and `/configurator` isolate all Three.js/R3F/GSAP work inside
client components, dynamically imported (`next/dynamic`, `ssr: false`) so the
3D runtime never inflates the server-rendered bundle or blocks non-3D pages.
