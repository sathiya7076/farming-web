import Loader from './Loader.jsx';
import ErrorState from './ErrorState.jsx';
import EmptyState from './EmptyState.jsx';

// Wraps a data-driven section: loading → error → empty → content.
export default function QueryBoundary({ loading, error, reload, isEmpty = false, empty, children }) {
  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (isEmpty) return empty || <EmptyState />;
  return children;
}
