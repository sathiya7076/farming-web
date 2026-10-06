import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Leaf, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import { initials } from '../utils/format.js';
import { NAV, PANEL_TITLE } from './navConfig.js';

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // `_` changes on navigation so the unread badge refreshes after visiting pages
  const { data: unread } = useFetch('/notifications/unread-count', { _: pathname });

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white shadow' : 'text-brand-100 hover:bg-brand-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 p-4 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="rounded-xl bg-brand-600 p-1.5"><Leaf className="h-5 w-5" /></span> AgriConnect
          </Link>
          <button className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV[role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkCls}>
              <Icon className="h-5 w-5" /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-red-600/80 hover:text-white">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
            <h2 className="hidden font-display text-lg font-semibold sm:block">{PANEL_TITLE[role]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/products" className="hidden text-sm font-medium text-gray-600 hover:text-brand-700 sm:block">View marketplace</Link>
            <Link to={`/${role}/notifications`} className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{initials(user?.name)}</span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs capitalize text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
