import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { api, tokenStore, type User } from './api';
import { cartCount, cartReducer, cartTotal, type CartAction, type CartItem } from './lib/cartReducer';

const CART_KEY = 'teapoint.cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

interface AppState {
  cart: CartItem[];
  dispatch: (a: CartAction) => void;
  count: number;
  total: number;
  user: User | null;
  setSession: (token: string | null, user: User | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable */
    }
  }, [cart]);

  useEffect(() => {
    if (tokenStore.get()) {
      api.me().then(setUser).catch(() => tokenStore.set(null));
    }
  }, []);

  const value = useMemo<AppState>(
    () => ({
      cart,
      dispatch,
      count: cartCount(cart),
      total: cartTotal(cart),
      user,
      setSession: (token, u) => {
        tokenStore.set(token);
        setUser(u);
      },
    }),
    [cart, user],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppProvider missing');
  return v;
}
