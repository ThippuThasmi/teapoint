import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, type Category, type Order, type Product } from '../api';
import { formatPrice } from '../lib/format';
import { useApp } from '../state';

const STATUSES = ['placed', 'preparing', 'ready', 'completed', 'cancelled'];

export default function Admin() {
  const { user } = useApp();
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', emoji: '🍵', price: '', categoryId: 0 });

  const load = useCallback(() => {
    api.admin.orders().then(setOrders).catch((e: Error) => setError(e.message));
    api.admin.products().then(setProducts).catch((e: Error) => setError(e.message));
    api.categories().then((c) => {
      setCats(c);
      setForm((f) => (f.categoryId ? f : { ...f, categoryId: c[0]?.id ?? 0 }));
    });
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user, load]);

  if (user?.role !== 'admin') return <p>Admin access required.</p>;

  async function addProduct(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.admin.createProduct({
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        emoji: form.emoji,
        priceMinor: Math.round(Number(form.price) * 100),
        available: true,
      });
      setForm({ ...form, name: '', description: '', price: '' });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggle(p: Product) {
    await api.admin.updateProduct(p.id, {
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      emoji: p.emoji,
      priceMinor: p.priceMinor,
      available: !p.available,
    });
    load();
  }

  return (
    <>
      <h1>Admin</h1>
      <div className="tabs">
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          Products
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {tab === 'orders' &&
        orders.map((o) => (
          <div key={o.id} className="card">
            <div className="row">
              <strong>
                #{o.id} · {o.customerName} · {o.phone}
              </strong>
              <select
                value={o.status}
                onChange={(e) => api.admin.setStatus(o.id, e.target.value).then(load).catch((er: Error) => setError(er.message))}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <ul>
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.quantity} × {i.name}
                </li>
              ))}
            </ul>
            {o.notes && <small>Note: {o.notes}</small>}
            <strong>{formatPrice(o.totalMinor)}</strong>
          </div>
        ))}

      {tab === 'products' && (
        <>
          <form onSubmit={addProduct} className="form">
            <h2>Add product</h2>
            <label>
              Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Description
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Emoji
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={8} />
            </label>
            <label>
              Price (INR)
              <input type="number" min="1" step="0.5" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label>
              Category
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn">Add</button>
          </form>
          <table className="table">
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.emoji} {p.name}
                  </td>
                  <td>{p.categoryName}</td>
                  <td>{formatPrice(p.priceMinor)}</td>
                  <td>
                    <button className="link" onClick={() => toggle(p)}>
                      {p.available ? 'Hide' : 'Show'}
                    </button>{' '}
                    <button className="link" onClick={() => api.admin.deleteProduct(p.id).then(load)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
