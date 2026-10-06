import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { useCart } from '../../context/CartContext.jsx';
import QueryBoundary from '../../components/QueryBoundary.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ProductCard from '../../components/ProductCard.jsx';

export default function Wishlist() {
  const { data, loading, error, reload } = useFetch('/wishlist');
  const { wishIds } = useCart();
  // Hearts toggled elsewhere update wishIds; hide items the user has un-hearted here.
  const list = (data || []).filter((p) => wishIds.includes(p._id));

  return (
    <div>
      <PageHeader title="Wishlist" subtitle="Products you saved for later" />
      <QueryBoundary
        loading={loading} error={error} reload={reload} isEmpty={!list.length}
        empty={<EmptyState icon={Heart} title="Your wishlist is empty" message="Tap the heart on any product to save it here." action={<Link to="/client/browse" className="btn-primary btn-sm">Browse products</Link>} />}
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{list.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      </QueryBoundary>
    </div>
  );
}
