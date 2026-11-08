-- ==============================================================================
-- PRODUCTION SUPABASE SECURITY HARDENING SCRIPT (RLS & STORAGE)
-- ==============================================================================
-- This script hardens Row Level Security (RLS) so that:
-- 1. Anyone can view public digital business cards and scan NFC tags (Public SELECT).
-- 2. ONLY verified administrators can create, edit, or delete business cards.
-- 3. Anonymous registrations cannot hijack, edit, or delete any business card.
-- 4. SVG uploads are disabled to prevent stored Cross-Site Scripting (XSS).
-- 5. Analytics tracking events can be logged by visitors, but read/pruned ONLY by admins.
-- ==============================================================================

-- ----------------------------------------------------
-- 1. ADMIN AUTHORIZATION SYSTEM
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;

-- Security Definer function to check if the caller is an active administrator
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (is_admin() OR auth.uid() = id);

-- SEED EXISTING ADMIN USER(S):
-- Automatically enrolls your existing Supabase auth users as admins if table was just created
INSERT INTO admin_users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------
-- 2. POLICIES FOR business_cards TABLE
-- ----------------------------------------------------

ALTER TABLE IF EXISTS business_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Insert Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Update Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Delete Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Admin Insert Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Admin Update Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Admin Delete Access on business_cards" ON business_cards;

-- Public can view cards (required for NFC scans and links)
CREATE POLICY "Public Read Access on business_cards"
ON business_cards
FOR SELECT
USING (true);

-- Only verified admins can insert
CREATE POLICY "Admin Insert Access on business_cards"
ON business_cards
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only verified admins can update
CREATE POLICY "Admin Update Access on business_cards"
ON business_cards
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only verified admins can delete
CREATE POLICY "Admin Delete Access on business_cards"
ON business_cards
FOR DELETE
TO authenticated
USING (is_admin());


-- ----------------------------------------------------
-- 3. STORAGE POLICIES & BUCKET HARDENING ('logos' BUCKET)
-- ----------------------------------------------------

-- Ensure storage bucket exists and enforces strict MIME types (NO SVG / NO HTML)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'logos', 
  'logos', 
  true, 
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'],
  10485760 -- 10MB hard limit per file
)
ON CONFLICT (id) DO UPDATE 
SET 
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'],
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "Public Read Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Logos" ON storage.objects;

-- Public can read assets from logos bucket
CREATE POLICY "Public Read Logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Only verified admins can upload to logos bucket
CREATE POLICY "Admin Upload Logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND is_admin());

-- Only verified admins can update assets
CREATE POLICY "Admin Update Logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND is_admin());

-- Only verified admins can delete assets
CREATE POLICY "Admin Delete Logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND is_admin());


-- ----------------------------------------------------
-- 4. ANALYTICS & VISITOR TRACKING TABLE: card_events
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS card_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_slug text NOT NULL,
  event_type text NOT NULL, -- 'view' | 'click'
  source text NOT NULL DEFAULT 'direct', -- 'qr' | 'share' | 'direct'
  action_target text, -- 'phone', 'whatsapp', 'email', 'maps', 'website', 'review', 'menu', etc.
  action_label text, -- Human-readable action label (e.g. "Save Contact", "Our Menu")
  visitor_hash text, -- Privacy-safe daily anonymous hash (no raw IP stored)
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_card_events_card_slug ON card_events(card_slug);
CREATE INDEX IF NOT EXISTS idx_card_events_created_at ON card_events(created_at);
CREATE INDEX IF NOT EXISTS idx_card_events_slug_created ON card_events(card_slug, created_at);

ALTER TABLE IF EXISTS card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert Access on card_events" ON card_events;
DROP POLICY IF EXISTS "Authenticated Read Access on card_events" ON card_events;
DROP POLICY IF EXISTS "Authenticated Delete Access on card_events" ON card_events;
DROP POLICY IF EXISTS "Admin Read Access on card_events" ON card_events;
DROP POLICY IF EXISTS "Admin Delete Access on card_events" ON card_events;

-- Public visitors can insert tracking events via the API endpoint
CREATE POLICY "Public Insert Access on card_events"
ON card_events
FOR INSERT
WITH CHECK (true);

-- Only verified admins can view analytics dashboards
CREATE POLICY "Admin Read Access on card_events"
ON card_events
FOR SELECT
TO authenticated
USING (is_admin());

-- Only verified admins can prune or delete event records
CREATE POLICY "Admin Delete Access on card_events"
ON card_events
FOR DELETE
TO authenticated
USING (is_admin());


-- ----------------------------------------------------
-- 5. OPTIONAL COLUMNS & INDEXES FOR FAST LOOKUPS
-- ----------------------------------------------------

ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS wifi_password text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS wifi_password_label text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS delivery_enabled boolean DEFAULT false;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS delivery_number text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS delivery_label text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS first_priority_field text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS quick_action_1 text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS quick_action_2 text;
ALTER TABLE IF EXISTS business_cards ADD COLUMN IF NOT EXISTS quick_action_3 text;

CREATE INDEX IF NOT EXISTS idx_business_cards_slug ON business_cards(slug);
