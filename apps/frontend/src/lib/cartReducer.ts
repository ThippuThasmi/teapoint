export interface CartItem {
  productId: number;
  name: string;
  emoji: string;
  priceMinor: number;
  quantity: number;
}

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'> }
  | { type: 'setQty'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find((i) => i.productId === action.item.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === existing.productId ? { ...i, quantity: Math.min(i.quantity + 1, 50) } : i,
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case 'setQty':
      if (action.quantity <= 0) return state.filter((i) => i.productId !== action.productId);
      return state.map((i) =>
        i.productId === action.productId ? { ...i, quantity: Math.min(action.quantity, 50) } : i,
      );
    case 'remove':
      return state.filter((i) => i.productId !== action.productId);
    case 'clear':
      return [];
  }
}

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);
