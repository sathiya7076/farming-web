import { useState } from 'react';

// Image that falls back to a soft green placeholder if the URL fails to load.
export default function SafeImage({ src, alt = '', className = '', emoji = '🌾' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-100 to-earth-100 text-4xl ${className}`} aria-label={alt}>
        {emoji}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
