import { BusinessCard } from './types';
import { supabase } from './supabase';

// Convert DB row to BusinessCard object
function mapRowToCard(row: any): BusinessCard {
  return {
    slug: row.slug,
    name: row.name || '',
    tagline: row.tagline || '',
    themeColor: row.theme_color || '#25394d',
    logo: row.logo || '',
    cover_photo_url: row.cover_photo_url || row.cover_photo || '',
    language: row.language || 'en',
    layout: row.layout || 'design1',
    phone: row.phone || '',
    landline: row.landline || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    address: row.address || '',
    address_type: row.address_type || 'address',
    google_maps: row.google_maps || '',
    instagram: row.instagram || '',
    facebook: row.facebook || '',
    tiktok: row.tiktok || '',
    snapchat: row.snapchat || '',
    linkedin: row.linkedin || '',
    twitter: row.twitter || '',
    youtube: row.youtube || '',
    website: row.website || '',
    primary_action: row.primary_action || 'phone',
    primary_action_label: row.primary_action_label || '',
    avatar_border_radius: row.avatar_border_radius ?? 50,
    menu_pdf: row.menu_pdf || '',
    menu_pdf_name: row.menu_pdf_name || '',
    menu_label: row.menu_label || 'Our Menu',
    wifi_password: row.wifi_password || '',
    wifi_password_label: row.wifi_password_label || 'WiFi Password',
    instagram_label: row.instagram_label || 'Instagram',
    facebook_label: row.facebook_label || 'Facebook',
    tiktok_label: row.tiktok_label || 'TikTok',
    snapchat_label: row.snapchat_label || 'Snapchat',
    linkedin_label: row.linkedin_label || 'LinkedIn',
    twitter_label: row.twitter_label || 'X (Twitter)',
    youtube_label: row.youtube_label || 'YouTube',
    whatsapp_label: row.whatsapp_label || 'WhatsApp',
    email_label: row.email_label || 'Email',
    localisation_label: row.localisation_label || 'Location',
    website_label: row.website_label || 'Website',
    mobile_label: row.mobile_label || 'Call Us',
    landline_label: row.landline_label || 'Office Line',
    qr_logo_enabled: row.qr_logo_enabled ?? true,
    rate_us_enabled: row.rate_us_enabled ?? true,
    review_url: row.review_url || '',
    rate_us_label: row.rate_us_label || 'Rate Us / Leave 5 Stars',
    delivery_enabled: row.delivery_enabled ?? false,
    delivery_number: row.delivery_number || '',
    delivery_label: row.delivery_label || 'Delivery',
    first_priority_field: row.first_priority_field || '',
    quick_action_1: row.quick_action_1 || '',
    quick_action_2: row.quick_action_2 || '',
    quick_action_3: row.quick_action_3 || '',
  };
}

// Convert BusinessCard object to DB row
function mapCardToRow(card: BusinessCard) {
  return {
    slug: card.slug,
    name: card.name || '',
    tagline: card.tagline || '',
    theme_color: card.themeColor || '#25394d',
    logo: card.logo || null,
    cover_photo_url: card.cover_photo_url || null,
    language: card.language || 'en',
    layout: card.layout || 'design1',
    phone: card.phone || '',
    landline: card.landline || '',
    whatsapp: card.whatsapp || '',
    email: card.email || '',
    address: card.address || '',
    address_type: card.address_type || 'address',
    google_maps: card.google_maps || '',
    instagram: card.instagram || '',
    facebook: card.facebook || '',
    tiktok: card.tiktok || '',
    snapchat: card.snapchat || '',
    linkedin: card.linkedin || '',
    twitter: card.twitter || '',
    youtube: card.youtube || '',
    website: card.website || '',
    primary_action: card.primary_action || 'phone',
    primary_action_label: card.primary_action_label || null,
    avatar_border_radius: card.avatar_border_radius ?? 50,
    menu_pdf: card.menu_pdf || null,
    menu_pdf_name: card.menu_pdf_name || null,
    menu_label: card.menu_label || 'Our Menu',
    wifi_password: card.wifi_password || '',
    wifi_password_label: card.wifi_password_label || null,
    instagram_label: card.instagram_label || null,
    facebook_label: card.facebook_label || null,
    tiktok_label: card.tiktok_label || null,
    snapchat_label: card.snapchat_label || null,
    linkedin_label: card.linkedin_label || null,
    twitter_label: card.twitter_label || null,
    youtube_label: card.youtube_label || null,
    whatsapp_label: card.whatsapp_label || null,
    email_label: card.email_label || null,
    localisation_label: card.localisation_label || null,
    website_label: card.website_label || null,
    mobile_label: card.mobile_label || null,
    landline_label: card.landline_label || null,
    qr_logo_enabled: card.qr_logo_enabled ?? true,
    rate_us_enabled: card.rate_us_enabled ?? true,
    review_url: card.review_url || null,
    rate_us_label: card.rate_us_label || null,
    delivery_enabled: card.delivery_enabled ?? false,
    delivery_number: card.delivery_number || null,
    delivery_label: card.delivery_label || null,
    first_priority_field: card.first_priority_field || null,
    quick_action_1: card.quick_action_1 || null,
    quick_action_2: card.quick_action_2 || null,
    quick_action_3: card.quick_action_3 || null,
  };
}

// Helper to upload base64 file data URL or blob URL to Supabase storage bucket 'logos'
async function uploadBase64ToSupabaseStorage(fileData: string, prefix: string): Promise<string> {
  if (!fileData) return fileData;
  if (!fileData.startsWith('data:') && !fileData.startsWith('blob:')) {
    return fileData;
  }

  try {
    let contentType = 'application/octet-stream';
    let bytes: Uint8Array | null = null;
    let ext = 'png';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'image/gif'];

    if (fileData.startsWith('data:')) {
      const matches = fileData.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1].toLowerCase();
        if (!allowedTypes.includes(contentType)) {
          throw new Error(`Invalid file type: ${contentType}`);
        }
        const base64String = matches[2];
        if (contentType.includes('pdf')) ext = 'pdf';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('png')) ext = 'png';

        const binaryStr = atob(base64String);
        const len = binaryStr.length;
        bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
      }
    } else if (fileData.startsWith('blob:')) {
      try {
        const res = await fetch(fileData);
        if (res.ok) {
          const blob = await res.blob();
          contentType = (blob.type || 'application/pdf').toLowerCase();
          if (!allowedTypes.includes(contentType)) {
            throw new Error(`Invalid file type: ${contentType}`);
          }
          if (contentType.includes('pdf')) ext = 'pdf';
          else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('svg')) ext = 'svg';
          else if (contentType.includes('gif')) ext = 'gif';
          else if (contentType.includes('png')) ext = 'png';
          const buffer = await blob.arrayBuffer();
          bytes = new Uint8Array(buffer);
        }
      } catch (err) {
        console.warn('Could not fetch blob URL:', err);
        throw err;
      }
    }

    if (!bytes) {
      if (fileData.startsWith('blob:')) {
        console.warn('Expired blob URL cannot be uploaded to storage:', fileData);
        return '';
      }
      return fileData;
    }

    const fileName = `${prefix}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('logos')
      .upload(fileName, bytes, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error);
      return fileData;
    }

    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || fileData;
  } catch (err) {
    console.warn('Error uploading file to Supabase storage:', err);
    return fileData;
  }
}

export async function getCards(): Promise<BusinessCard[]> {
  try {
    const { data: rows, error } = await supabase
      .from('business_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(rows)) {
      return rows.map(mapRowToCard);
    }
    if (error) {
      console.error('Error fetching cards from Supabase:', error);
    }
  } catch (err) {
    console.error('Error fetching cards from Supabase:', err);
  }
  return [];
}

export async function getCardBySlug(slug: string): Promise<BusinessCard | undefined> {
  try {
    const { data: row, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && row) {
      return mapRowToCard(row);
    }
    if (error) {
      console.error('Error fetching card by slug from Supabase:', error);
    }
  } catch (err) {
    console.error('Error fetching card by slug from Supabase:', err);
  }
  return undefined;
}

export async function generateUniqueSlug(baseSlug: string, originalSlug?: string): Promise<string> {
  const cleanBase = slugify(baseSlug) || 'card';
  if (originalSlug && cleanBase === originalSlug) {
    return originalSlug;
  }

  const cards = await getCards();
  const existingSlugs = new Set(cards.map(c => c.slug));
  if (originalSlug) {
    existingSlugs.delete(originalSlug);
  }

  if (!existingSlugs.has(cleanBase)) {
    return cleanBase;
  }

  let counter = 2;
  while (existingSlugs.has(`${cleanBase}-${counter}`)) {
    counter++;
  }
  return `${cleanBase}-${counter}`;
}

async function processCardAssets(card: BusinessCard, targetSlug: string): Promise<BusinessCard> {
  let uploadedLogo = card.logo;
  if (uploadedLogo && (uploadedLogo.startsWith('data:') || uploadedLogo.startsWith('blob:'))) {
    uploadedLogo = await uploadBase64ToSupabaseStorage(uploadedLogo, `${targetSlug}-logo`);
  }

  let uploadedCover = card.cover_photo_url;
  if (uploadedCover && (uploadedCover.startsWith('data:') || uploadedCover.startsWith('blob:'))) {
    uploadedCover = await uploadBase64ToSupabaseStorage(uploadedCover, `${targetSlug}-cover`);
  }

  let uploadedPdf = card.menu_pdf;
  if (uploadedPdf && (uploadedPdf.startsWith('data:') || uploadedPdf.startsWith('blob:'))) {
    uploadedPdf = await uploadBase64ToSupabaseStorage(uploadedPdf, `${targetSlug}-menu`);
  }

  return {
    ...card,
    slug: targetSlug,
    logo: uploadedLogo,
    cover_photo_url: uploadedCover,
    menu_pdf: uploadedPdf,
    landline: card.landline || '',
    avatar_border_radius: card.avatar_border_radius ?? 50,
    address_type: card.address_type || 'address',
    google_maps: card.google_maps || ''
  };
}

async function performDatabaseOperation(row: any, originalSlug?: string) {
  let query = supabase.from('business_cards');
  let result;
  
  if (originalSlug) {
    result = await query.update(row).eq('slug', originalSlug);
  } else {
    result = await query.insert(row);
  }
  
  let { error: dbError } = result;

  if (dbError && (dbError.message?.includes('wifi_password') || dbError.message?.includes('quick_action') || dbError.code === 'PGRST204' || dbError.message?.includes('column'))) {
    const fallbackRow: any = { ...row };
    delete fallbackRow.wifi_password;
    delete fallbackRow.wifi_password_label;
    delete fallbackRow.quick_action_1;
    delete fallbackRow.quick_action_2;
    delete fallbackRow.quick_action_3;
    
    let retryQuery = supabase.from('business_cards');
    const { error: retryError } = originalSlug 
      ? await retryQuery.update(fallbackRow).eq('slug', originalSlug)
      : await retryQuery.insert(fallbackRow);
      
    if (!retryError) {
      dbError = null;
    }
  }

  if (dbError) {
    console.error(`Supabase DB ${originalSlug ? 'Update' : 'Insert'} error:`, dbError);
  }
  
  return dbError;
}

export async function saveCard(newCard: BusinessCard): Promise<{ success: boolean; error?: string; finalSlug?: string }> {
  try {
    const uniqueSlug = await generateUniqueSlug(newCard.slug);
    const cardToSave = await processCardAssets(newCard, uniqueSlug);
    const row = mapCardToRow(cardToSave);
    
    const dbError = await performDatabaseOperation(row);

    if (dbError) {
      return { success: false, error: dbError.message || 'Network error or database failure. Please try again.' };
    }

    return { success: true, finalSlug: uniqueSlug };
  } catch (err: any) {
    console.error('Error saving card:', err);
    return { success: false, error: err?.message || 'Failed to save card.' };
  }
}

export async function updateCard(originalSlug: string, updatedCard: BusinessCard): Promise<{ success: boolean; error?: string; finalSlug?: string }> {
  try {
    const targetSlug = await generateUniqueSlug(updatedCard.slug, originalSlug);
    const cardToUpdate = await processCardAssets(updatedCard, targetSlug);
    const row = mapCardToRow(cardToUpdate);
    
    const dbError = await performDatabaseOperation(row, originalSlug);

    if (dbError) {
      return { success: false, error: dbError.message || 'Network error or database failure. Please try again.' };
    }

    return { success: true, finalSlug: targetSlug };
  } catch (err: any) {
    console.error('Error updating card:', err);
    return { success: false, error: err?.message || 'Failed to update card.' };
  }
}

export async function deleteCard(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: dbError } = await supabase
      .from('business_cards')
      .delete()
      .eq('slug', slug);

    if (dbError) {
      console.error('Supabase DB Delete error:', dbError);
      return { success: false, error: dbError.message || 'Failed to delete card.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting card:', err);
    return { success: false, error: err?.message || 'Failed to delete card.' };
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
