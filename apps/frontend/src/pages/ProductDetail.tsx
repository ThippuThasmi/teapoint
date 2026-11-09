import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type Product } from '../api';
import { formatPrice } from '../lib/format';
import { useApp } from '../state';

export default function ProductDetail() {
  const { id = '' } = useParams();
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.product(id).then(setProduct).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading…</p>;

  return (
    <div className="detail">
      <span className="emoji huge">{product.emoji}</span>
      <div>
        <p>
          <Link to={`/menu/${product.categorySlug}`}>← {product.categoryName}</Link>
        </p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p className="price large">{formatPrice(product.priceMinor)}</p>
        <button
          className="btn"
          onClick={() => {
            dispatch({
              type: 'add',
              item: {
                productId: product.id,
                name: product.name,
                emoji: product.emoji,
                priceMinor: product.priceMinor,
              },
            });
            navigate('/cart');
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
