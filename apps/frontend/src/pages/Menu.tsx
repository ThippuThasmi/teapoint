import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Category, type Product } from '../api';
import { formatPrice } from '../lib/format';
import { useApp } from '../state';

export default function Menu() {
  const { category } = useParams();
  const { dispatch } = useApp();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories().then(setCats).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    api.products(category).then(setProducts).catch((e: Error) => setError(e.message));
  }, [category]);

  return (
    <>
      <h1>Menu</h1>
      <div className="tabs">
        <Link className={!category ? 'active' : ''} to="/menu">
          All
        </Link>
        {cats.map((c) => (
          <Link key={c.id} className={category === c.slug ? 'active' : ''} to={`/menu/${c.slug}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {products.map((p) => (
          <div key={p.id} className="card">
            <Link to={`/product/${p.id}`} className="emoji big">
              {p.emoji}
            </Link>
            <Link to={`/product/${p.id}`}>
              <strong>{p.name}</strong>
            </Link>
            <small>{p.description}</small>
            <div className="row">
              <span className="price">{formatPrice(p.priceMinor)}</span>
              <button
                className="btn small"
                onClick={() =>
                  dispatch({
                    type: 'add',
                    item: { productId: p.id, name: p.name, emoji: p.emoji, priceMinor: p.priceMinor },
                  })
                }
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
