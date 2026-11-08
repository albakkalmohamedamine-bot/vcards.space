'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCards } from '@/lib/storage';
import { getSession, signOut, AUTH_DISABLED_FOR_DEVELOPMENT } from '@/lib/auth';
import { BusinessCard } from '@/lib/types';
import { AdminAnalyticsDashboard } from '@/components/AdminAnalyticsDashboard';
import { ArrowLeft, BookOpen, LogOut, BarChart3, Plus } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoad() {
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/login?redirect=/admin/analytics');
          return;
        }

        if (!isMounted) return;
        setIsAuthenticated(true);

        const loadedCards = await getCards();
        if (!isMounted) return;
        setCards(loadedCards);
      } catch (err) {
        console.error('Failed to load cards for analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuthAndLoad();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 md:p-8 font-sans antialiased text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Visitor & QR Analytics</span>
              </h1>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                VCARDS SPACE Performance Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Card</span>
            </button>

            {!AUTH_DISABLED_FOR_DEVELOPMENT ? (
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}
                className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-2xl transition-all text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/90 px-2.5 py-1 rounded-xl shadow-2xs">
                Auth Paused
              </span>
            )}
          </div>
        </div>

        {/* Dashboard Component */}
        <AdminAnalyticsDashboard cards={cards} />

      </div>
    </div>
  );
}
