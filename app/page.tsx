'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCards } from '@/lib/storage';
import { getSession, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BusinessCard } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus,
  ArrowUpRight,
  BookOpen,
  Search,
  X,
  Copy,
  Check,
  LogOut,
  LogIn
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoad() {
      const session = await getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      if (!isMounted) return;
      setIsLoggedIn(true);

      const clientCards = await getCards();
      if (!isMounted) return;
      setCards(clientCards);
      setLoading(false);
    }

    checkAuthAndLoad();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/card/${slug}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedSlug(slug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  const filteredCards = cards.filter(card => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      card.name.toLowerCase().includes(query) ||
      (card.tagline && card.tagline.toLowerCase().includes(query))
    );
  });

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main id="main-landing" className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 font-sans text-slate-800 relative">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <img src="/logo-navy.svg" alt="VCARDS SPACE" className="h-7 w-auto" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">Admin Console</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-xl text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Hero Branding Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 pt-8 md:pt-0 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <img 
              src="/logo-navy.svg" 
              alt="VCARDS SPACE Logo" 
              className="h-16 w-auto object-contain mx-auto" 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50/70 text-indigo-700 rounded-full text-xs font-mono font-bold tracking-widest uppercase mb-4 border border-indigo-100"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> VCARDS SPACE • NFC Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight"
          >
            VCARDS SPACE
          </motion.h1>
        </div>

        {/* Action Callouts */}
        <div className="mb-16">
          {/* Prompt to Admin Portal */}
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-3 max-w-2xl">
              <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">Management Suite</span>
              <h3 className="font-serif text-2xl font-bold text-slate-900">Provision Client Landing Page</h3>
              <p className="text-slate-500 text-sm font-sans leading-relaxed">
                Add business credentials, select custom brand themes, define primary contact methods, and generate an instantly operational card endpoint.
              </p>
            </div>

            <button
              onClick={() => router.push('/admin')}
              className="w-full md:w-auto shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-4 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Add Client Card
            </button>
          </div>
        </div>

        {/* Client Directories Section */}
        <div className="border-t border-slate-200 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">Active Client Pages</h2>
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mt-1">Directory database</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {cards.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-xs placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <span className="text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-3 py-2 sm:py-1 rounded-full shadow-xs shrink-0 self-start sm:self-auto text-center">
                {loading ? '--' : searchQuery ? `${filteredCards.length} of ${cards.length} Active` : `${cards.length} Active`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white h-44 rounded-3xl animate-pulse border border-dashed border-slate-200" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8 flex flex-col items-center">
              <div className="w-44 h-44 sm:w-52 sm:h-52 mb-6 overflow-hidden rounded-3xl shadow-md border border-slate-100 bg-slate-50 group transition-transform hover:scale-105 duration-300">
                <img
                  src="/images/empty_db.jpg"
                  alt="Empty database illustration"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">No Custom Landers Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Your VCARDS SPACE client cards database is empty. Visit the management portal to configure your first client card.
              </p>
              <button
                onClick={() => router.push('/admin')}
                className="bg-slate-900 text-white text-xs font-mono uppercase tracking-widest font-bold py-3.5 px-7 rounded-2xl hover:bg-slate-800 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Card
              </button>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8 flex flex-col items-center">
              <div className="w-44 h-44 sm:w-52 sm:h-52 mb-6 overflow-hidden rounded-3xl shadow-md border border-slate-100 bg-slate-50 group transition-transform hover:scale-105 duration-300">
                <img
                  src="/images/no_matches.jpg"
                  alt="No search results illustration"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">No Client Matches Found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                No custom card configurations match your query &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-slate-900 text-white text-xs font-mono uppercase tracking-widest font-bold py-3.5 px-7 rounded-2xl hover:bg-slate-800 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCards.map((card) => {
                return (
                  <motion.div
                    key={card.slug}
                    variants={itemVariants}
                    whileHover={{ y: -6, scale: 1.025 }}
                    className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between min-h-[224px] relative overflow-hidden"
                  >
                    {/* Top Stripe Decoration */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5" 
                      style={{ backgroundColor: card.themeColor }}
                    />

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate">
                            /{card.slug}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {card.layout === 'design2' ? 'Design 2' : 'Design 1'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(card.slug, e)}
                          title="Copy full NFC public card link to clipboard"
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer border shadow-2xs shrink-0 ${
                            copiedSlug === card.slug
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {copiedSlug === card.slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy NFC URL</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3.5">
                        {card.logo ? (
                          <img 
                            src={card.logo} 
                            alt={card.name} 
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 object-cover p-0 bg-white border border-slate-100 shrink-0 shadow-xs overflow-hidden" 
                            style={{ borderRadius: (card.avatar_border_radius ?? 50) >= 45 ? '9999px' : '22%' }}
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 flex items-center justify-center text-white text-lg font-bold font-serif shrink-0 shadow-xs overflow-hidden"
                            style={{ 
                              backgroundColor: card.themeColor,
                              borderRadius: (card.avatar_border_radius ?? 50) >= 45 ? '9999px' : '22%'
                            }}
                          >
                            {card.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {card.name}
                          </h3>
                          <p className="text-[9.5px] font-mono tracking-wider text-slate-400 font-bold uppercase mt-0.5 line-clamp-2">
                            {card.tagline || 'NFC Client Card'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                      <span className="text-[10px] font-mono text-slate-400">
                        CTA: <strong className="text-slate-600 uppercase font-bold">{card.primary_action}</strong>
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/admin?edit=${card.slug}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-slate-200 text-xs" aria-hidden="true">|</span>
                        <button
                          onClick={() => router.push(`/card/${card.slug}`)}
                          className="flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                          style={{ color: card.themeColor }}
                        >
                          Visit Card
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </div>

      </div>
    </main>
  );
}

