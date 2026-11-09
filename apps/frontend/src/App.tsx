import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Home from './pages/Home';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import ProductDetail from './pages/ProductDetail';
import { useApp } from './state';

export default function App() {
  const { count, user, setSession } = useApp();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          🍵 TeaPoint
        </Link>
        <nav>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/cart">Cart ({count})</NavLink>
          {user && <NavLink to="/orders">My orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <button className="link" onClick={() => setSession(null, null)}>
              Sign out ({user.name})
            </button>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:category" element={<Menu />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer className="footer">© TeaPoint · teapoint.shop</footer>
    </>
  );
}
