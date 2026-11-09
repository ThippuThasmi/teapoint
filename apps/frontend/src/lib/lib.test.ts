import { describe, expect, it } from 'vitest';
import { cartCount, cartReducer, cartTotal, type CartItem } from './cartReducer';
import { formatPrice } from './format';

const chai = { productId: 1, name: 'Masala Chai', emoji: '🍵', priceMinor: 2000 };

describe('cartReducer', () => {
  it('adds a new item with quantity 1', () => {
    const s = cartReducer([], { type: 'add', item: chai });
    expect(s).toEqual([{ ...chai, quantity: 1 }]);
  });

  it('increments an existing item', () => {
    let s: CartItem[] = [];
    s = cartReducer(s, { type: 'add', item: chai });
    s = cartReducer(s, { type: 'add', item: chai });
    expect(s[0].quantity).toBe(2);
  });

  it('removes an item when quantity set to 0', () => {
    const s = cartReducer([{ ...chai, quantity: 2 }], { type: 'setQty', productId: 1, quantity: 0 });
    expect(s).toEqual([]);
  });

  it('computes totals and counts', () => {
    const s: CartItem[] = [
      { ...chai, quantity: 2 },
      { productId: 2, name: 'Samosa', emoji: '🥟', priceMinor: 3000, quantity: 1 },
    ];
    expect(cartTotal(s)).toBe(7000);
    expect(cartCount(s)).toBe(3);
    expect(cartReducer(s, { type: 'clear' })).toEqual([]);
  });
});

describe('formatPrice', () => {
  it('formats paise as rupees', () => {
    expect(formatPrice(2000)).toContain('20.00');
  });
});
