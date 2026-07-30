'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider">Redirecting to Directory...</p>
      </div>
    </div>
  );
}
