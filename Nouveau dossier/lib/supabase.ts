import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yykckgcvvoazpbxnurid.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a2NrZ2N2dm9henBieG51cmlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDIxNDUsImV4cCI6MjEwMDMxODE0NX0.ZyNBEJ_upkU2KomxpvOGvjNQ33Y345PFTzu7_n8mE6k';

export const supabase = createClient(supabaseUrl, supabaseKey);
