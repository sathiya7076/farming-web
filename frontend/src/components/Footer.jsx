import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-bold text-white">
            <span className="rounded-xl bg-brand-600 p-1.5"><Leaf className="h-5 w-5" /></span> AgriConnect
          </div>
          <p className="mt-3 text-sm text-brand-200">Fresh from farmers to your table. Fair prices for growers, honest food for families.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/products">Products</Link></li>
            <li><Link className="hover:text-white" to="/farmers">Our Farmers</Link></li>
            <li><Link className="hover:text-white" to="/about">About Us</Link></li>
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Join us</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/register">Sell as a Farmer</Link></li>
            <li><Link className="hover:text-white" to="/register">Shop as a Customer</Link></li>
            <li><Link className="hover:text-white" to="/login">Login</Link></li>
            <li><Link className="hover:text-white" to="/forgot-password">Forgot password</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@agriconnect.com</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98000 00000</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-300">
        © {new Date().getFullYear()} AgriConnect – Smart Farming Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
