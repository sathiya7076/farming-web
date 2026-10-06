import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api';

// Optional quick-fill buttons, configured through VITE_DEMO_* in .env (see .env.example)
const DEMOS = [
  ['Admin', import.meta.env.VITE_DEMO_ADMIN],
  ['Farmer', import.meta.env.VITE_DEMO_FARMER],
  ['Client', import.meta.env.VITE_DEMO_CLIENT],
].filter(([, v]) => v);

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from && from.startsWith(`/${u.role}`) ? from : from?.startsWith('/products') ? from : `/${u.role}`, { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><Leaf className="h-6 w-6" /></span>
          <h1 className="mt-3 font-display text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500">Log in to your AgriConnect account</p>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} required autoComplete="current-password" className="input pr-10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-brand-700">Forgot password?</Link></div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
        {DEMOS.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-xs text-gray-500">Demo accounts (run <code>npm run seed</code> first)</p>
            <div className="flex justify-center gap-2">
              {DEMOS.map(([label, v]) => {
                const [email, password] = v.split(':');
                return <button key={label} type="button" className="btn-outline btn-sm" onClick={() => setForm({ email, password })}>{label}</button>;
              })}
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-gray-500">New here? <Link to="/register" className="font-semibold text-brand-700">Create an account</Link></p>
      </div>
    </div>
  );
}
