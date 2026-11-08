'use client';

import React, { useState, useEffect } from 'react';
import { BusinessCard } from '@/lib/types';
import { 
  getAnalyticsSummary, 
  AnalyticsSummary, 
  ACTION_TARGET_LABELS 
} from '@/lib/analytics';
import { 
  QrCode, 
  Share2, 
  Eye, 
  Users, 
  Sparkles, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  RefreshCw, 
  Phone, 
  PhoneCall, 
  MessageSquare, 
  Star, 
  Mail, 
  MapPin, 
  Globe, 
  Download, 
  Check, 
  Copy, 
  Database, 
  ChevronDown, 
  ExternalLink, 
  Info,
  Wifi,
  FileText
} from 'lucide-react';
import { GoogleLogo } from './GoogleLogo';
import { motion, AnimatePresence } from 'motion/react';

interface AdminAnalyticsDashboardProps {
  cards: BusinessCard[];
  initialSelectedSlug?: string;
  onNavigateToCard?: (slug: string) => void;
}

export function AdminAnalyticsDashboard({
  cards,
  initialSelectedSlug,
  onNavigateToCard,
}: AdminAnalyticsDashboardProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSelectedSlug || 'all');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const fetchAnalytics = React.useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAnalyticsSummary(selectedSlug, timeRange);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSlug, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const selectedCard = selectedSlug !== 'all' ? cards.find((c) => c.slug === selectedSlug) : null;

  const handleCopySql = () => {
    const sqlScript = `-- Create card_events analytics table in Supabase
CREATE TABLE IF NOT EXISTS card_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_slug text NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  action_target text,
  action_label text,
  visitor_hash text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_events_card_slug ON card_events(card_slug);
CREATE INDEX IF NOT EXISTS idx_card_events_created_at ON card_events(created_at);
CREATE INDEX IF NOT EXISTS idx_card_events_event_type ON card_events(event_type);
CREATE INDEX IF NOT EXISTS idx_card_events_source ON card_events(source);

ALTER TABLE IF EXISTS card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert Access on card_events" ON card_events;
DROP POLICY IF EXISTS "Authenticated Read Access on card_events" ON card_events;

CREATE POLICY "Public Insert Access on card_events"
ON card_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated Read Access on card_events"
ON card_events FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(sqlScript);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    }
  };

  const getActionIcon = (target: string) => {
    switch (target) {
      case 'phone': return <Phone className="w-4 h-4 text-emerald-600" />;
      case 'landline': return <PhoneCall className="w-4 h-4 text-emerald-600" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'email': return <Mail className="w-4 h-4 text-sky-600" />;
      case 'maps': return <MapPin className="w-4 h-4 text-rose-500" />;
      case 'website': return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'review': return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'vcard': return <Download className="w-4 h-4 text-indigo-600" />;
      case 'menu': return <FileText className="w-4 h-4 text-amber-600" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-cyan-600" />;
      default: return <ArrowUpRight className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Missing Table Setup Warning Banner (if applicable) */}
      {summary && !summary.tableConfigured && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">Supabase Analytics Table Setup Needed</h4>
              <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                The <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">card_events</code> table is not present in your Supabase database yet. Copy the SQL setup snippet and run it once in your Supabase SQL Editor to begin capturing QR and visitor events.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="shrink-0 px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            {sqlCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {sqlCopied ? 'SQL Script Copied!' : 'Copy Supabase SQL'}
          </button>
        </div>
      )}

      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Card Filter Dropdown */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label htmlFor="card-filter-select" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </label>
          <div className="relative flex-1 max-w-sm">
            <select
              id="card-filter-select"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-2xs"
            >
              <option value="all">All Client Cards (Platform Aggregated)</option>
              {cards.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedCard && (
            <a
              href={`/card/${selectedCard.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
              title="Open public card in new tab"
            >
              <span>View Card</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Right: Time Range Segmented Buttons & Refresh */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          
          {/* Time range segmented buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((tab) => {
              const active = timeRange === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* SQL Snippet View Trigger */}
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            title="View Supabase SQL schema"
          >
            <Database className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 Metric Surfaces) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Visits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Total Visits</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight">
              {loading ? '--' : summary?.totalViews.toLocaleString() || 0}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong className="font-mono tabular-nums text-slate-700">{summary?.uniqueVisitors || 0}</strong> unique visitors
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: QR Code Scans */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">QR Code Scans</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{loading ? '--' : summary?.qrViews.toLocaleString() || 0}</span>
              {summary && summary.totalViews > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {summary.qrPercentage}%
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Physical in-person scans (NFC, table stands, flyers)
            </p>
          </div>
        </div>

        {/* Metric 3: Shared Links */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Shared Links</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{loading ? '--' : summary?.shareViews.toLocaleString() || 0}</span>
              {summary && summary.totalViews > 0 && (
                <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                  {summary.sharePercentage}%
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Digital referrals (WhatsApp, bio links, direct shares)
            </p>
          </div>
        </div>

        {/* Metric 4: Action Clicks & CTR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Conversions & CTR</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{loading ? '--' : summary?.totalClicks.toLocaleString() || 0}</span>
              {summary && summary.totalViews > 0 && (
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                  {summary.conversionRate}% CTR
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Total customer contact actions triggered
            </p>
          </div>
        </div>

      </div>

      {/* Traffic Acquisition Source Breakdown Bar */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Traffic Acquisition Channels</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of physical QR scans vs. digital shared links vs. direct visits.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {summary ? `${summary.totalViews} total visits recorded` : ''}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="space-y-3">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            {summary && summary.totalViews > 0 ? (
              <>
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${summary.qrPercentage}%` }}
                  title={`QR Code Scans: ${summary.qrViews} (${summary.qrPercentage}%)`}
                />
                <div 
                  className="bg-sky-500 h-full transition-all duration-500"
                  style={{ width: `${summary.sharePercentage}%` }}
                  title={`Shared Links: ${summary.shareViews} (${summary.sharePercentage}%)`}
                />
                <div 
                  className="bg-slate-400 h-full transition-all duration-500"
                  style={{ width: `${summary.directPercentage}%` }}
                  title={`Direct Web Visits: ${summary.directViews} (${summary.directPercentage}%)`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-slate-200" />
            )}
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">QR Code Scans: </span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {summary?.qrViews || 0} ({summary?.qrPercentage || 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Shared Links: </span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {summary?.shareViews || 0} ({summary?.sharePercentage || 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Direct / Other: </span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">
                  {summary?.directViews || 0} ({summary?.directPercentage || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Split: Actions Breakdown (Left 7 cols) + Daily Timeline (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Action Conversions Breakdown (The Client ROI Section) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Action Button Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact visitor interactions: WhatsApp, calls, Google Reviews, maps, menu views.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              {summary?.totalClicks || 0} Total Clicks
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 py-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !summary || summary.actionBreakdown.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No Button Clicks Logged Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
                When visitors open the digital card and tap WhatsApp, Call Us, Google Maps, or Save Contact, each action appears ranked here.
              </p>
              {selectedCard && (
                <a
                  href={`/card/${selectedCard.slug}?src=qr`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Card Interaction</span>
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {summary.actionBreakdown.map((item, idx) => (
                <div key={item.target} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 font-mono text-[11px] text-slate-400 font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                        {getActionIcon(item.target)}
                      </div>
                      <span className="font-bold text-slate-800 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {item.count} clicks
                      </span>
                      <span className="text-slate-400 text-[11px] tabular-nums">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Daily Activity Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Daily Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">Day-by-day activity breakdown.</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !summary || summary.dailyActivity.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No activity recorded in this date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-bold">Date</th>
                    <th className="py-2.5 font-bold text-right">Views</th>
                    <th className="py-2.5 font-bold text-right text-emerald-600">QR</th>
                    <th className="py-2.5 font-bold text-right text-amber-600">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.dailyActivity.slice(-10).reverse().map((day) => (
                    <tr key={day.date} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-mono font-medium text-slate-600">{day.date}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-900 text-right tabular-nums">{day.views}</td>
                      <td className="py-2.5 font-mono font-bold text-emerald-600 text-right tabular-nums">{day.qrViews}</td>
                      <td className="py-2.5 font-mono font-bold text-amber-600 text-right tabular-nums">{day.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* SQL Migration Modal */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-serif text-lg font-bold text-slate-900">Supabase SQL Schema</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Run this SQL query in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to create the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600">card_events</code> table and Row-Level Security policies.
              </p>

              <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
{`CREATE TABLE IF NOT EXISTS card_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_slug text NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  action_target text,
  action_label text,
  visitor_hash text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_events_card_slug ON card_events(card_slug);
CREATE INDEX IF NOT EXISTS idx_card_events_created_at ON card_events(created_at);
CREATE INDEX IF NOT EXISTS idx_card_events_event_type ON card_events(event_type);
CREATE INDEX IF NOT EXISTS idx_card_events_source ON card_events(source);

ALTER TABLE IF EXISTS card_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Insert Access on card_events"
ON card_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated Read Access on card_events"
ON card_events FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');`}
              </pre>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
