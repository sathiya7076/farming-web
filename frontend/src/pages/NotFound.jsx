import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl">🌾</p>
      <h1 className="mt-4 font-display text-4xl font-bold">404 – Page not found</h1>
      <p className="mt-2 text-gray-500">The page you’re looking for has gone back to the field.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
