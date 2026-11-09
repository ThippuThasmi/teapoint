import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Category } from '../api';

export default function Home() {
  const [cats, setCats] = useState<Category[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories().then(setCats).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Welcome to TeaPoint</h1>
        <p>Chai, coffee, fresh juices, milkshakes, snacks and ice creams. Made fresh, served warm.</p>
        <Link to="/menu" className="btn">
          Order now
        </Link>
      </section>
      <h2>Browse by category</h2>
      {error && <p className="error">Could not load categories: {error}</p>}
      <div className="grid">
        {cats.map((c) => (
          <Link key={c.id} to={`/menu/${c.slug}`} className="card cat">
            <span className="emoji">{c.emoji}</span>
            <strong>{c.name}</strong>
            <small>{c.description}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
