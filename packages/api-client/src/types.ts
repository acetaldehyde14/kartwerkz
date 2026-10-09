/**
 * Response/request shapes for the Kartwerkz API contract.
 *
 * These are reconciled directly against apps/api's actual Prisma
 * models/controllers (not speculative — verified by hitting the running
 * API). The API returns raw-ish Prisma records rather than a hand-curated
 * DTO layer in most places, which is why these shapes carry
 * `xMinorUnits`/`currency` pairs instead of a nested `Money`, and why
 * `SavedConfiguration` is flat fields rather than a nested `configuration`
 * object. `@kartwerkz/shared`'s `Money`/`KitConfiguration` are still the
 * right types to construct *requests* with (see CreateConfigurationInput) —
 * they just don't describe what comes back over the wire.
 *
 * Known NOT-YET-RECONCILED gaps (API returns richer/different shapes than
 * modeled below — fix when actually wiring up the corresponding UI):
 * User/auth (`register`/`login` currently return `{id,email}` only, no
 * role — `useCurrentUser()` consumers should treat `role` as absent),
 * UploadedAsset.
 */
import type {
  KitConfiguration,
  MaterialFinish,
  Money,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@kartwerkz/shared';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePriceMinorUnits: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KartManufacturer {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export interface KartModel {
  id: string;
  manufacturerId: string;
  slug: string;
  name: string;
  modelYear: number | null;
  glbAssetPath: string;
  bodyworkRegions: string[];
  isDemo: boolean;
  isActive: boolean;
  manufacturer?: KartManufacturer;
}

export interface GraphicsDesign {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: 'PREMADE' | 'SEMI_CUSTOM' | 'FULL_CUSTOM';
  thumbnailUrl: string;
  defaultColours: { primary: string; secondary: string; accent: string };
  priceAdjustmentMinorUnits: number;
  isDemo: boolean;
  isActive: boolean;
}

export interface SavedConfiguration {
  id: string;
  schemaVersion: number;
  userId: string | null;
  guestSessionId: string | null;
  kartModelId: string;
  graphicsDesignId: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  driverName: string | null;
  raceNumber: string | null;
  countryCode: string | null;
  finish: MaterialFinish;
  specialInstructions: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfigurationInput {
  configuration: KitConfiguration;
  name?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  savedConfigurationId: string;
  quantity: number;
  unitPriceMinorUnits: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  savedConfiguration?: SavedConfiguration;
}

export interface Cart {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  currency: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

/** Client-side helper — the API has no computed cart-level total, so sum this from `Cart.items`. */
export function cartSubtotal(cart: Pick<Cart, 'items' | 'currency'>): Money {
  const amountMinorUnits = cart.items.reduce(
    (sum, item) => sum + item.unitPriceMinorUnits * item.quantity,
    0,
  );
  return { amountMinorUnits, currency: cart.currency };
}

export interface AddCartItemInput {
  productId: string;
  savedConfigurationId: string;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CheckoutSessionResponse {
  orderId: string;
  orderNumber: string;
  checkoutSessionId: string;
  checkoutUrl: string;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/** The API currently accepts `contactEmail` + an optional pre-saved `shippingAddressId` — full inline address creation isn't wired up yet. */
export interface CreateCheckoutSessionInput {
  contactEmail: string;
  shippingAddressId?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceMinorUnits: number;
  totalPriceMinorUnits: number;
  currency: string;
  configurationSnapshot: KitConfiguration;
  createdAt: string;
}

export interface OrderStatusEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  actor: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatus;
  amountMinorUnits: number;
  currency: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestSessionId: string | null;
  contactEmail: string;
  shippingAddressId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalMinorUnits: number;
  shippingMinorUnits: number;
  totalMinorUnits: number;
  currency: string;
  items: OrderItem[];
  statusEvents: OrderStatusEvent[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

/** One revision of an uploaded proof. Approval status must be read from `approvals` — scoped to this exact revision. */
export interface ArtworkRevision {
  id: string;
  artworkProofId: string;
  revisionNumber: number;
  fileObjectKey: string;
  previewImageUrl: string | null;
  notes: string | null;
  sentToCustomerAt: string | null;
  createdAt: string;
  approvals: Array<{
    id: string;
    status: 'APPROVED' | 'REVISION_REQUESTED';
    comment: string | null;
    createdAt: string;
  }>;
}

/** A proof groups all revisions for one order. Revisions are returned newest-first — `revisions[0]` is the current one to act on. */
export interface ArtworkProof {
  id: string;
  orderId: string;
  createdAt: string;
  revisions: ArtworkRevision[];
}

export interface RequestRevisionInput {
  comment: string;
}

export interface UploadedAsset {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export interface AdminDashboardStats {
  totalOrders: number;
  pendingPayment: number;
  awaitingArtwork: number;
  awaitingApproval: number;
  approved: number;
  inProduction: number;
  shipped: number;
  salesSummaryMinorUnits: number;
  currency: string;
}

export type { MaterialFinish };
