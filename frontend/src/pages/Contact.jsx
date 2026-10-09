import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Phone } from 'lucide-react';
import api, { errMsg } from '../services/api';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/public/contact', form);
      toast.success(data.message);
      setForm(EMPTY);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-10 text-center"><h1 className="section-title">Contact Us</h1><p className="mt-2 text-gray-500">Questions, feedback or want to partner with us? We’d love to hear from you.</p></div>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {[[Mail, 'Email', 'sathi2392005@gmail.com'], [Phone, 'Phone', '+91 8270300239'], [MapPin, 'Address', 'AgriConnect HQ, India']].map(([Icon, l, v]) => (
            <div key={l} className="card flex items-center gap-4 p-5">
              <span className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon className="h-5 w-5" /></span>
              <div><p className="text-xs uppercase text-gray-500">{l}</p><p className="font-medium">{v}</p></div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="c-name">Your name</label><input id="c-name" className="input" required minLength={2} value={form.name} onChange={set('name')} /></div>
            <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" required value={form.email} onChange={set('email')} /></div>
          </div>
          <div><label className="label" htmlFor="c-subject">Subject</label><input id="c-subject" className="input" required minLength={3} value={form.subject} onChange={set('subject')} /></div>
          <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" rows={5} className="input" required minLength={10} maxLength={2000} value={form.message} onChange={set('message')} /></div>
          <button className="btn-primary w-full sm:w-auto" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </div>
  );
}
