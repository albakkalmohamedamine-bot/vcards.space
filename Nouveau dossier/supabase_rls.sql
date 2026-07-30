-- Supabase Row Level Security (RLS) Policy Setup
-- This script configures RLS on the business_cards table (and businesses table) so that:
-- 1. Reading (SELECT) is open to the public for public digital business card views.
-- 2. Writing (INSERT, UPDATE, DELETE) requires an authenticated Supabase user session.

-- Enable Row Level Security
ALTER TABLE IF EXISTS business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- POLICIES FOR business_cards TABLE
-- ----------------------------------------------------

-- Drop existing policies if re-applying
DROP POLICY IF EXISTS "Public Read Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Insert Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Update Access on business_cards" ON business_cards;
DROP POLICY IF EXISTS "Authenticated Delete Access on business_cards" ON business_cards;

-- Policy 1: SELECT (Public Read)
CREATE POLICY "Public Read Access on business_cards"
ON business_cards
FOR SELECT
USING (true);

-- Policy 2: INSERT (Authenticated Only)
CREATE POLICY "Authenticated Insert Access on business_cards"
ON business_cards
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: UPDATE (Authenticated Only)
CREATE POLICY "Authenticated Update Access on business_cards"
ON business_cards
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: DELETE (Authenticated Only)
CREATE POLICY "Authenticated Delete Access on business_cards"
ON business_cards
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');


-- ----------------------------------------------------
-- POLICIES FOR businesses TABLE (IF ALIASED)
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Public Read Access on businesses" ON businesses;
DROP POLICY IF EXISTS "Authenticated Insert Access on businesses" ON businesses;
DROP POLICY IF EXISTS "Authenticated Update Access on businesses" ON businesses;
DROP POLICY IF EXISTS "Authenticated Delete Access on businesses" ON businesses;

CREATE POLICY "Public Read Access on businesses"
ON businesses
FOR SELECT
USING (true);

CREATE POLICY "Authenticated Insert Access on businesses"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access on businesses"
ON businesses
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Access on businesses"
ON businesses
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');


-- ----------------------------------------------------
-- STORAGE POLICIES FOR 'logos' BUCKET
-- ----------------------------------------------------

-- Allow public read of logos bucket
CREATE POLICY "Public Read Logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated upload/update/delete of logos
CREATE POLICY "Authenticated Upload Logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
