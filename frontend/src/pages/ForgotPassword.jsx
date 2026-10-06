import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api, { errMsg } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center">
        {sent ? (
          <>
            <MailCheck className="mx-auto h-14 w-14 text-brand-600" />
            <h1 className="mt-3 font-display text-2xl font-bold">Check your inbox</h1>
            <p className="mt-2 text-sm text-gray-600">If an account exists for <b>{email}</b>, a reset link has been sent. It expires in 30 minutes.</p>
            <p className="mt-2 text-xs text-gray-400">Development: the link is printed in the backend console.</p>
            <Link to="/login" className="btn-primary mt-6">Back to login</Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">Forgot password?</h1>
            <p className="mt-1 text-sm text-gray-500">Enter your email and we’ll send a reset link.</p>
            {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={submit} className="mt-5 space-y-4 text-left">
              <div><label className="label" htmlFor="fp-email">Email</label><input id="fp-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
            </form>
            <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-700">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
