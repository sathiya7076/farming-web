import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Leaf, Menu, ShoppingCart, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/farmers', label: 'Farmers' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, isClient } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const linkCls = ({ isActive }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-brand-700'}`;

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-brand-800">
          <span className="rounded-xl bg-brand-600 p-1.5 text-white"><Leaf className="h-5 w-5" /></span>
          AgriConnect
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => <NavLink key={l.to} {...l} className={linkCls}>{l.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isClient && (
            <Link to="/client/cart" className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-earth-500 px-1 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          )}
          {user ? (
            <>
              <Link to={`/${user.role}`} className="btn-primary btn-sm">Dashboard</Link>
              <button onClick={handleLogout} className="btn-ghost btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        <button className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 py-2">
            {LINKS.map((l) => <NavLink key={l.to} {...l} className={linkCls} onClick={() => setOpen(false)}>{l.label}</NavLink>)}
            {isClient && <NavLink to="/client/cart" className={linkCls} onClick={() => setOpen(false)}>Cart ({count})</NavLink>}
          </div>
          <div className="flex gap-2">
            {user ? (
              <>
                <Link to={`/${user.role}`} className="btn-primary flex-1" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="btn-outline flex-1">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
