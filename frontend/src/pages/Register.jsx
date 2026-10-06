import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ShoppingBasket, Tractor } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api';

const ROLES = [
  { value: 'client', label: 'I want to buy', icon: ShoppingBasket, text: 'Shop fresh produce' },
  { value: 'farmer', label: 'I am a farmer', icon: Tractor, text: 'Sell your harvest' },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', farmName: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [k]: value }));
    // clear that field's error as soon as the user edits it
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe));
  };
  const fe = (k) => fieldErrors[k] && <p className="mt-1 text-xs text-red-600">{fieldErrors[k]}</p>;

  // FIX: check `pending` BEFORE `user`. Otherwise, if the context stores the farmer as
  // `user` after registering, the redirect below fires and the "Registration received"
  // screen never shows.
  if (pending) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-brand-600" />
        <h1 className="font-display text-2xl font-bold">Registration received!</h1>
        <p className="text-gray-600">Thanks for joining as a farmer. Our admin team will review your account. You can log in as soon as it is approved.</p>
        <Link to="/" className="btn-primary">Back to home</Link>
      </div>
    );
  }

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return; // block double clicks
    setError('');
    setFieldErrors({});

    if (form.password !== form.confirm) return setFieldErrors({ confirm: 'Passwords do not match' });
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return setFieldErrors({ password: 'Password needs at least one letter and one number' });
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role,
      };
      if (role === 'farmer') {
        Object.assign(payload, { farmName: form.farmName.trim(), location: form.location.trim() });
      }

      await register(payload);

      if (role === 'farmer') {
        setPending(true);
      } else {
        toast.success('Account created. Welcome to AgriConnect!');
        navigate('/client', { replace: true });
      }
    } catch (err) {
      const list = err?.response?.data?.errors;
      if (Array.isArray(list) && list.length) {
        setFieldErrors(Object.fromEntries(list.map((x) => [x.field, x.message])));
        setError('Please fix the highlighted fields.');
      } else {
        setError(errMsg(err)); // e.g. "Email already registered"
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-center font-display text-2xl font-bold">Create your account</h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`rounded-2xl border-2 p-4 text-left transition ${role === r.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-200'}`}
            >
              <r.icon className={`h-6 w-6 ${role === r.value ? 'text-brand-700' : 'text-gray-400'}`} />
              <p className="mt-2 text-sm font-semibold">{r.label}</p>
              <p className="text-xs text-gray-500">{r.text}</p>
            </button>
          ))}
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="r-name">Full name</label>
              <input id="r-name" required minLength={2} className="input" value={form.name} onChange={set('name')} />
              {fe('name')}
            </div>
            <div>
              <label className="label" htmlFor="r-phone">Phone</label>
              <input id="r-phone" type="tel" className="input" value={form.phone} onChange={set('phone')} />
              {fe('phone')}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="r-email">Email</label>
            <input id="r-email" type="email" required className="input" value={form.email} onChange={set('email')} />
            {fe('email')}
          </div>

          {role === 'farmer' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="r-farm">Farm name</label>
                <input id="r-farm" required minLength={2} className="input" value={form.farmName} onChange={set('farmName')} />
                {fe('farmName')}
              </div>
              <div>
                <label className="label" htmlFor="r-loc">Farm location</label>
                <input id="r-loc" required minLength={2} className="input" placeholder="Village, District, State" value={form.location} onChange={set('location')} />
                {fe('location')}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="r-pw">Password</label>
              <input id="r-pw" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />
              {fe('password')}
            </div>
            <div>
              <label className="label" htmlFor="r-cpw">Confirm password</label>
              <input id="r-cpw" type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
              {fe('confirm')}
            </div>
          </div>
          <p className="text-xs text-gray-500">At least 8 characters with a letter and a number.</p>

          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account…' : 'Register'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already registered? <Link to="/login" className="font-semibold text-brand-700">Login</Link>
        </p>
      </div>
    </div>
  );
}