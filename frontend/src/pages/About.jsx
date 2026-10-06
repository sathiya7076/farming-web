import { Link } from 'react-router-dom';
import { Heart, Leaf, Users } from 'lucide-react';

const VALUES = [
  { icon: Leaf, title: 'Freshness first', text: 'Produce goes from field to doorstep with as few hands as possible.' },
  { icon: Heart, title: 'Fair to farmers', text: 'Growers set their own prices and receive the lion’s share of every sale.' },
  { icon: Users, title: 'Built on trust', text: 'Admin-approved farmers, verified reviews and transparent order tracking.' },
];

export default function About() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-800 to-brand-600 py-16 text-center text-white">
        <div className="container-page">
          <h1 className="font-display text-4xl font-bold text-white">About AgriConnect</h1>
          <p className="mx-auto mt-3 max-w-2xl text-brand-50">We connect farmers with customers so good food travels a shorter, fairer path.</p>
        </div>
      </section>
      <div className="container-page max-w-4xl space-y-12 py-14">
        <section>
          <h2 className="section-title">Our story</h2>
          <p className="mt-4 text-gray-600">AgriConnect started with a simple observation: farmers often earn little while customers pay a lot, because produce passes through many middlemen. Our marketplace lets farmers list their harvest directly, lets customers order with confidence, and keeps the whole process transparent from the first click to delivery.</p>
        </section>
        <section className="grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><v.icon className="h-6 w-6" /></div>
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{v.text}</p>
            </div>
          ))}
        </section>
        <section>
          <h2 className="section-title">How the platform works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-600">
            <li>Farmers register and are approved by our admin team.</li>
            <li>Farmers list products with photos, price, quantity and harvest date; admin approves each listing.</li>
            <li>Customers browse, add to cart and place orders.</li>
            <li>Farmers accept, process and ship; customers track every step and review after delivery.</li>
          </ol>
        </section>
        <div className="text-center"><Link to="/register" className="btn-primary">Join AgriConnect</Link></div>
      </div>
    </div>
  );
}
