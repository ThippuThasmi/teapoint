import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Order } from '../api';
import { formatPrice } from '../lib/format';
import { useApp } from '../state';

export default function Orders() {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) api.myOrders().then(setOrders).catch((e: Error) => setError(e.message));
  }, [user]);

  if (!user) return <p>Please <Link to="/login">sign in</Link> to see your orders.</p>;

  return (
    <>
      <h1>My orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && !error && <p>No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card">
          <div className="row">
            <strong>Order #{o.id}</strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <small>{new Date(o.createdAt).toLocaleString()}</small>
          <ul>
            {o.items.map((i, idx) => (
              <li key={idx}>
                {i.quantity} × {i.name}
              </li>
            ))}
          </ul>
          <strong>{formatPrice(o.totalMinor)}</strong>
        </div>
      ))}
    </>
  );
}
