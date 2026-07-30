'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CardIndexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const slug = searchParams.get('slug');
    if (slug) {
      router.replace(`/card/${encodeURIComponent(slug)}`);
    } else {
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider">Redirecting...</p>
      </div>
    </div>
  );
}

export default function CardIndexPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider">Redirecting...</p>
        </div>
      </div>
    }>
      <CardIndexContent />
    </Suspense>
  );
}
