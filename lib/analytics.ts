import { supabase } from './supabase';

export interface CardTrackEvent {
  card_slug: string;
  event_type: 'view' | 'click';
  source?: 'qr' | 'share' | 'direct' | string;
  action_target?: string;
  action_label?: string;
}

export interface ActionMetric {
  target: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DailyDataPoint {
  date: string;
  displayDate: string;
  views: number;
  qrViews: number;
  shareViews: number;
  clicks: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  qrViews: number;
  qrPercentage: number;
  shareViews: number;
  sharePercentage: number;
  directViews: number;
  directPercentage: number;
  totalClicks: number;
  conversionRate: number; // Percentage of views that produced a click
  actionBreakdown: ActionMetric[];
  dailyActivity: DailyDataPoint[];
  tableConfigured: boolean;
  errorMessage?: string;
}

/**
 * Client-side non-blocking event tracker.
 * Dispatches asynchronously using sendBeacon or keepalive fetch so it never halts page speed or button clicks.
 */
export function trackCardEvent(event: CardTrackEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const payload = JSON.stringify(event);

    // Prefer navigator.sendBeacon for instant unload safety
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/track', blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive: true
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Intentionally silent: analytics errors should never break user interactions
    });
  } catch {
    // Silent catch
  }
}

/**
 * Derives the active visitor source from the URL search query.
 */
export function getVisitorSourceFromUrl(): 'qr' | 'share' | 'direct' {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('src') || params.get('source') || '').toLowerCase().trim();
    if (src === 'qr' || src === 'qrcode') return 'qr';
    if (src === 'share' || src === 'link' || src === 'whatsapp' || src === 'social') return 'share';
  } catch {
    // Fall back to direct
  }
  return 'direct';
}

/**
 * Human-friendly labels for common button targets
 */
export const ACTION_TARGET_LABELS: Record<string, string> = {
  phone: 'Mobile Call',
  landline: 'Landline (Fixe) Call',
  whatsapp: 'WhatsApp Message',
  email: 'Send Email',
  maps: 'Google Maps Directions',
  website: 'Website Visit',
  review: 'Google 5-Star Review',
  vcard: 'Save Contact (vCard)',
  menu: 'View Menu (PDF)',
  delivery: 'Delivery Order',
  wifi: 'Copy WiFi Password',
  instagram: 'Instagram Profile',
  facebook: 'Facebook Profile',
  tiktok: 'TikTok Profile',
  snapchat: 'Snapchat Profile',
  linkedin: 'LinkedIn Profile',
  twitter: 'X (Twitter) Profile',
  youtube: 'YouTube Channel',
};

/**
 * Fetches and calculates analytics metrics for the Admin Dashboard.
 */
export async function getAnalyticsSummary(
  slug?: string | null,
  timeRange: 'today' | '7d' | '30d' | 'all' = '30d'
): Promise<AnalyticsSummary> {
  const emptySummary: AnalyticsSummary = {
    totalViews: 0,
    uniqueVisitors: 0,
    qrViews: 0,
    qrPercentage: 0,
    shareViews: 0,
    sharePercentage: 0,
    directViews: 0,
    directPercentage: 0,
    totalClicks: 0,
    conversionRate: 0,
    actionBreakdown: [],
    dailyActivity: [],
    tableConfigured: true,
  };

  try {
    let query = supabase.from('card_events').select('*');

    // Filter by card slug if specified
    if (slug && slug !== 'all') {
      query = query.eq('card_slug', slug);
    }

    // Filter by timeframe
    const now = new Date();
    if (timeRange === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', startOfToday);
    } else if (timeRange === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', sevenDaysAgo);
    } else if (timeRange === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyDaysAgo);
    }

    query = query.order('created_at', { ascending: true });

    const { data: rows, error } = await query;

    if (error) {
      // Table doesn't exist yet in Supabase
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          ...emptySummary,
          tableConfigured: false,
          errorMessage: 'Table "card_events" not found in Supabase. Please run the SQL migration script.',
        };
      }
      return {
        ...emptySummary,
        errorMessage: error.message,
      };
    }

    if (!rows || rows.length === 0) {
      return emptySummary;
    }

    let totalViews = 0;
    let qrViews = 0;
    let shareViews = 0;
    let directViews = 0;
    let totalClicks = 0;
    const uniqueVisitorHashes = new Set<string>();
    const actionCounts: Record<string, { label: string; count: number }> = {};
    const dailyMap: Record<string, { views: number; qrViews: number; shareViews: number; clicks: number }> = {};

    rows.forEach((row) => {
      const dateKey = row.created_at ? row.created_at.slice(0, 10) : 'unknown';
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { views: 0, qrViews: 0, shareViews: 0, clicks: 0 };
      }

      if (row.event_type === 'view') {
        totalViews++;
        dailyMap[dateKey].views++;

        if (row.visitor_hash) {
          uniqueVisitorHashes.add(row.visitor_hash);
        }

        const src = (row.source || '').toLowerCase();
        if (src === 'qr') {
          qrViews++;
          dailyMap[dateKey].qrViews++;
        } else if (src === 'share') {
          shareViews++;
          dailyMap[dateKey].shareViews++;
        } else {
          directViews++;
        }
      } else if (row.event_type === 'click') {
        totalClicks++;
        dailyMap[dateKey].clicks++;

        const target = row.action_target || 'other';
        const label = row.action_label || ACTION_TARGET_LABELS[target] || target;
        if (!actionCounts[target]) {
          actionCounts[target] = { label, count: 0 };
        }
        actionCounts[target].count++;
      }
    });

    const qrPercentage = totalViews > 0 ? Math.round((qrViews / totalViews) * 100) : 0;
    const sharePercentage = totalViews > 0 ? Math.round((shareViews / totalViews) * 100) : 0;
    const directPercentage = totalViews > 0 ? Math.round((directViews / totalViews) * 100) : 0;
    const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

    // Action breakdown sorted descending
    const actionBreakdown: ActionMetric[] = Object.entries(actionCounts)
      .map(([target, data]) => ({
        target,
        label: data.label,
        count: data.count,
        percentage: totalClicks > 0 ? Math.round((data.count / totalClicks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Build timeline sorted chronologically
    const dailyActivity: DailyDataPoint[] = Object.keys(dailyMap)
      .sort()
      .map((dateStr) => {
        let displayDate = dateStr;
        try {
          const [y, m, d] = dateStr.split('-');
          displayDate = `${d}/${m}`;
        } catch {
          // Keep raw
        }
        return {
          date: dateStr,
          displayDate,
          views: dailyMap[dateStr].views,
          qrViews: dailyMap[dateStr].qrViews,
          shareViews: dailyMap[dateStr].shareViews,
          clicks: dailyMap[dateStr].clicks,
        };
      });

    return {
      totalViews,
      uniqueVisitors: uniqueVisitorHashes.size || totalViews,
      qrViews,
      qrPercentage,
      shareViews,
      sharePercentage,
      directViews,
      directPercentage,
      totalClicks,
      conversionRate,
      actionBreakdown,
      dailyActivity,
      tableConfigured: true,
    };
  } catch (err: any) {
    return {
      ...emptySummary,
      errorMessage: err?.message || 'Failed to fetch analytics',
    };
  }
}
