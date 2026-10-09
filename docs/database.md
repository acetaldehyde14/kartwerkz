# Database

PostgreSQL 16, accessed exclusively through Prisma from `apps/api`. Full
schema: `apps/api/prisma/schema.prisma` (source of truth — this document is a
guide to _why_, not a field-by-field restatement).

## Entity groups

**Identity**: `User`, `CustomerProfile`, `Address`, `Session` (server-managed,
token is sha256-hashed before storage, the raw token lives only in an
HttpOnly cookie), `EmailVerificationToken`, `PasswordResetToken`,
`GuestSession` (anonymous identity backing cart/configurator ownership before
signup — see below).

**Catalog**: `Product` (exactly one row expected: the Custom Kart Graphics
Kit), `KartManufacturer` → `KartModel` (many-to-many with `Product` via
`ProductKartModel`, so future products could reuse kart models),
`GraphicsDesign` (with `tier`: PREMADE/SEMI_CUSTOM/FULL_CUSTOM) →
`GraphicsAsset` (per-bodywork-region preview textures), `PricingRule`
(admin-editable surcharges/fees, generic `type` + `scopeKey` so new fee types
don't require a migration).

**Uploads & configuration**: `UploadedAsset` (private, status
PENDING_SCAN→CLEAN/QUARANTINED/REJECTED), `SavedConfiguration`
(`schemaVersion`-tagged JSON-equivalent fields + relations, ownable by either
a `User` or a `GuestSession`), `LogoPlacement` (normalized [0,1] coordinates
within a bodywork region's printable area, FK to an owned `UploadedAsset`).

**Commerce**: `Cart`/`CartItem` (price snapshotted at add-time, revalidated at
checkout), `Order`/`OrderItem` (configuration **frozen** into
`OrderItem.configurationSnapshot` — catalog/pricing changes after purchase
must never retroactively change a sold item), `OrderStatusEvent` (append-only
audit trail), `Payment` (idempotency via `processedEventIds`).

**Fulfillment**: `ArtworkProof` → `ArtworkRevision` → `ArtworkApproval`
(approval is scoped to one exact revision id), `Supplier` → `SupplierOrder`,
`Shipment`.

**Audit**: `AuditLog`, a generic `(action, entityType, entityId, metadata)`
trail for admin-sensitive operations (status overrides, pricing changes,
proof approvals, supplier submission).

## Why a `GuestSession` table instead of just a cookie

A signed cookie alone can't be revoked, listed, or joined against in SQL. A
`GuestSession` row gives every guest-owned `SavedConfiguration`, `Cart`,
`UploadedAsset`, and `Order` a real foreign key, so ownership checks
(`savedConfiguration.guestSessionId === currentGuestSessionId`) are ordinary
database constraints instead of ad-hoc cookie parsing, and the row has a
real `expiresAt` for cleanup.

## Why configuration JSON is versioned

`SavedConfiguration` stores structured columns (colours, driver, finish,
etc.) rather than one opaque JSON blob, but the _wire format_ exchanged with
the client and frozen into `OrderItem.configurationSnapshot` is the
versioned `KitConfiguration` type (`@kartwerkz/shared/configuration.ts`,
`schemaVersion: 1` today). When the shape needs to change (e.g. adding a
second logo slot type), bump the version and add a migration function instead
of mutating historical order snapshots.

## Invariants worth knowing

- `ArtworkApproval` is never deleted or mutated. "Does this order have valid
  approval for production" is a _query_ (`isRevisionApprovedForProduction`:
  latest revision for the proof has an `APPROVED` approval), not a flag that
  gets flipped — so the audit trail of every approval/revision-request stays
  intact even after a new revision supersedes it.
- `Order.totalMinorUnits` and every `OrderItem.unitPriceMinorUnits` are
  computed server-side at checkout and never recalculated from "current"
  catalog prices afterward — orders are a receipt, not a live view.
- Every FK that represents ownership (`userId` _or_ `guestSessionId`) is
  nullable on both sides deliberately — a row is owned by exactly one of the
  two, enforced in application code (Prisma doesn't have a native XOR
  constraint; see the relevant service's `assertOwnership` helper).

## Migrations & seed

```bash
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # apps/api/prisma/seed.ts — idempotent (upsert by slug)
```

The seed creates exactly: one `Product`, a handful of `KartManufacturer` +
one demo `KartModel` each (`isDemo: true`), three `GraphicsDesign` rows
(`design-001`/`-002`/`-003`, clearly-labeled demo names), and one manual
`Supplier`. See Rule 5/6 in `AGENTS.md` — this is intentionally small and
clearly flagged as placeholder data, not a real catalog.
