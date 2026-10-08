import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomeLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cookie check mudiyura varai, illa already login pannitaa form kaatadhu
  if (loading || user) return null;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(form.email, form.password);
      if (u?.role === 'admin') navigate('/admin');
      else if (u?.role === 'farmer') navigate('/farmer');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Check email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mx-auto w-full max-w-sm p-6">
      <h2 className="font-display text-xl font-bold text-gray-900">Welcome back</h2>
      <p className="mb-4 text-sm text-gray-500">Login to continue</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-700"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="Password"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-700"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        New here? <Link to="/register" className="font-semibold text-brand-700">Register</Link>
      </p>
    </div>
  );
}