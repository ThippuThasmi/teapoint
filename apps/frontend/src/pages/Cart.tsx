import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatPrice } from '../lib/format';
import { useApp } from '../state';

export default function Cart() {
  const { cart, dispatch, total, user } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<{ id: number; totalMinor: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const order = await api.placeOrder({
        customerName: name,
        phone,
        notes: notes || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      dispatch({ type: 'clear' });
      setPlaced(order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <div className="card">
        <h1>Thank you! 🎉</h1>
        <p>
          Your order <strong>#{placed.id}</strong> for {formatPrice(placed.totalMinor)} has been placed. Pay at the
          counter on pickup.
        </p>
        <Link to="/menu" className="btn">
          Order more
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/menu" className="btn">
          Browse menu
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      <table className="table">
        <tbody>
          {cart.map((i) => (
            <tr key={i.productId}>
              <td>
                {i.emoji} {i.name}
              </td>
              <td>{formatPrice(i.priceMinor)}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={50}
                  aria-label={`Quantity for ${i.name}`}
                  value={i.quantity}
                  onChange={(e) => dispatch({ type: 'setQty', productId: i.productId, quantity: Number(e.target.value) })}
                />
              </td>
              <td>{formatPrice(i.priceMinor * i.quantity)}</td>
              <td>
                <button className="link" onClick={() => dispatch({ type: 'remove', productId: i.productId })}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="price large">Total: {formatPrice(total)}</p>

      <form onSubmit={submit} className="form">
        <h2>Place order (pay on pickup)</h2>
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>
        <label>
          Phone
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} minLength={7} maxLength={20} />
        </label>
        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? 'Placing…' : 'Place order'}
        </button>
      </form>
    </>
  );
}
