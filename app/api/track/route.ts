import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'anonymous';

    // Apply strict per-IP rate limiting (max 60 event pings per minute)
    const rateLimit = checkRateLimit(ip, { limit: 60, windowMs: 60000 });
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('text/plain') || contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    } else {
      try {
        body = await req.json();
      } catch {
        const text = await req.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    const { card_slug, event_type, source, action_target, action_label } = body;

    // Strict slug validation (alphanumeric, underscores, hyphens, max 100 chars)
    if (!card_slug || typeof card_slug !== 'string' || !/^[a-z0-9_-]{1,100}$/i.test(card_slug.trim())) {
      return NextResponse.json({ error: 'Invalid or missing card_slug' }, { status: 400 });
    }

    const validEventType = event_type === 'click' ? 'click' : 'view';
    const validSource = ['qr', 'share', 'direct'].includes(source) ? source : 'direct';

    // Privacy-safe daily visitor hash: SHA-256 of (IP + User-Agent + today's date in YYYY-MM-DD)
    // Never stores the IP or User-Agent directly
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const today = new Date().toISOString().slice(0, 10);
    const visitorHash = crypto
      .createHash('sha256')
      .update(`${ip}-${userAgent}-${today}`)
      .digest('hex')
      .slice(0, 16);

    const payload = {
      card_slug: card_slug.trim().toLowerCase(),
      event_type: validEventType,
      source: validSource,
      action_target: action_target ? String(action_target).slice(0, 50).replace(/[^\w-]/g, '') : null,
      action_label: action_label ? String(action_label).slice(0, 100).replace(/[\r\n]/g, ' ').trim() : null,
      visitor_hash: visitorHash,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('card_events').insert(payload);

    if (error) {
      console.warn('Analytics event insertion notice:', error.message);
      return NextResponse.json({ 
        success: false, 
        warning: 'Event not recorded. Analytics table might be pending migration.'
      }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Analytics endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
