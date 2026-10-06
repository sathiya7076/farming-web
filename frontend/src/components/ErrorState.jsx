import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline btn-sm">Try again</button>}
    </div>
  );
}
