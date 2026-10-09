import { apiFetch } from './client';
import type { AddCartItemInput, Cart, CartItem, UpdateCartItemInput } from './types';

export function getCart(): Promise<Cart> {
  return apiFetch<Cart>('/cart');
}

// The mutation endpoints below return the single CartItem they
// created/updated/deleted — NOT the full Cart — so callers must invalidate
// (not optimistically overwrite) the cart query. See hooks/useCart.ts.

export function addCartItem(input: AddCartItemInput): Promise<CartItem> {
  return apiFetch<CartItem>('/cart/items', {
    method: 'POST',
    body: input,
  });
}

export function updateCartItem(itemId: string, input: UpdateCartItemInput): Promise<CartItem> {
  return apiFetch<CartItem>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function removeCartItem(itemId: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}
