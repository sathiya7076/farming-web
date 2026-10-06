import { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

// Multiple-image picker with preview and validation.
// existing: images already saved on the server; removed: ids (publicId or url) marked for deletion.
export default function ImageUploader({ existing = [], files, setFiles, removed = [], setRemoved = () => {}, max = 5 }) {
  const inputRef = useRef(null);
  const kept = existing.filter((i) => !removed.includes(i.publicId || i.url));
  const slots = max - kept.length - files.length;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const onPick = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const ok = [];
    picked.forEach((f) => {
      if (!OK_TYPES.includes(f.type)) toast.error(`${f.name}: only JPG, PNG or WEBP allowed`);
      else if (f.size > MAX_MB * 1024 * 1024) toast.error(`${f.name}: larger than ${MAX_MB} MB`);
      else ok.push(f);
    });
    if (ok.length > slots) {
      toast.error(`You can add only ${Math.max(slots, 0)} more image(s) (max ${max})`);
      ok.length = Math.max(slots, 0);
    }
    if (ok.length) setFiles([...files, ...ok]);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {kept.map((img) => (
          <div key={img.publicId || img.url} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => setRemoved([...removed, img.publicId || img.url])} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Remove image">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {previews.map((src, i) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-xl border-2 border-brand-300">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white">NEW</span>
            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Remove image">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {slots > 0 && (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-500 hover:text-brand-700">
            <ImagePlus className="h-6 w-6" /> Add
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={OK_TYPES.join(',')} multiple hidden onChange={onPick} />
      <p className="mt-2 text-xs text-gray-500">Up to {max} images · JPG, PNG or WEBP · max {MAX_MB} MB each</p>
    </div>
  );
}
