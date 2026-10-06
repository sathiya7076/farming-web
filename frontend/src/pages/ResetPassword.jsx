import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl font-bold">Set a new password</h1>
        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label className="label" htmlFor="cnp">Confirm password</label><input id="cnp" type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <p className="text-xs text-gray-500">At least 8 characters with a letter and a number.</p>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Update password'}</button>
        </form>
        <p className="mt-4 text-center text-sm"><Link to="/login" className="font-medium text-brand-700">Back to login</Link></p>
      </div>
    </div>
  );
}
