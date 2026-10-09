import { apiFetch } from './client';
import type { Product } from './types';

/** There is exactly one sellable product (the custom kart graphics kit). */
export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/products');
}

export function getProduct(idOrSlug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${idOrSlug}`);
}
