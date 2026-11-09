const BASE = import.meta.env.VITE_API_URL ?? '';

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  emoji: string;
}
export interface Product {
  id: number;
  name: string;
  description: string;
  emoji: string;
  priceMinor: number;
  available: boolean;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
}
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}
export interface Order {
  id: number;
  customerName: string;
  phone: string;
  notes: string | null;
  status: string;
  totalMinor: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPriceMinor: number }[];
}

const TOKEN_KEY = 'teapoint.token';
export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  categories: () => request<Category[]>('/api/categories'),
  products: (category?: string) =>
    request<Product[]>(`/api/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  product: (id: string) => request<Product>(`/api/products/${id}`),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', json('POST', { email, password })),
  register: (email: string, name: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/register', json('POST', { email, name, password })),
  me: () => request<User>('/api/auth/me'),
  placeOrder: (body: {
    customerName: string;
    phone: string;
    notes?: string;
    items: { productId: number; quantity: number }[];
  }) => request<{ id: number; totalMinor: number }>('/api/orders', json('POST', body)),
  myOrders: () => request<Order[]>('/api/orders/mine'),
  admin: {
    orders: () => request<Order[]>('/api/admin/orders'),
    setStatus: (id: number, status: string) =>
      request<unknown>(`/api/admin/orders/${id}/status`, json('PATCH', { status })),
    products: () => request<Product[]>('/api/admin/products'),
    createProduct: (p: Record<string, unknown>) => request<unknown>('/api/admin/products', json('POST', p)),
    updateProduct: (id: number, p: Record<string, unknown>) =>
      request<unknown>(`/api/admin/products/${id}`, json('PUT', p)),
    deleteProduct: (id: number) => request<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),
  },
};
