"use client";
import { useEffect, useState } from 'react';

// Lightweight listener to show a toast when import completes if layout toast isn't available
export default function BannerImportListener() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail as { listId: string; result?: any } | undefined;
      const count = detail?.result?.found?.length ?? detail?.result?.found ?? undefined;
      setMessage(`Import complete${typeof count === 'number' ? `: ${count} influencer${count === 1 ? '' : 's'} added` : ''}`);
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener('import-complete', onComplete as EventListener);
    return () => window.removeEventListener('import-complete', onComplete as EventListener);
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="pointer-events-auto bg-[#1a1f2e] border border-gray-700 rounded-[12px] px-4 py-3 shadow-xl text-sm min-w-[260px] max-w-sm toast-enter">
        <div className="text-gray-50 font-semibold mb-1">Import finished</div>
        <div className="text-gray-300">{message}</div>
      </div>
    </div>
  );
}


