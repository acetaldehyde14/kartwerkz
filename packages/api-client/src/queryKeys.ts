/** Centralised query key factories so invalidations stay in sync across hooks. */
export const queryKeys = {
  products: () => ['products'] as const,
  product: (idOrSlug: string) => ['products', idOrSlug] as const,
  kartManufacturers: () => ['kart-manufacturers'] as const,
  kartModels: (manufacturerId?: string) => ['kart-models', manufacturerId ?? 'all'] as const,
  kartModel: (id: string) => ['kart-models', 'detail', id] as const,
  graphicsDesigns: (kartModelId?: string) => ['graphics-designs', kartModelId ?? 'all'] as const,
  graphicsDesign: (id: string) => ['graphics-designs', 'detail', id] as const,
  configuration: (id: string) => ['configurations', id] as const,
  cart: () => ['cart'] as const,
  orders: () => ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  orderProofs: (orderId: string) => ['orders', orderId, 'proofs'] as const,
  currentUser: () => ['auth', 'me'] as const,
  adminDashboard: () => ['admin', 'dashboard'] as const,
};
