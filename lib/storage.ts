import { BusinessCard } from './types';
import { INITIAL_MOCK_CARDS } from './mockCards';
import { supabase } from './supabase';

const isClient = typeof window !== 'undefined';
const LOCAL_STORAGE_KEY = 'vcard_business_cards_local_v1';
const DB_NAME = 'vcard_db';
const DB_VERSION = 1;
const STORE_NAME = 'cards';

let memoryCardsCache: BusinessCard[] | null = null;

// Convert DB row to BusinessCard object
function mapRowToCard(row: any): BusinessCard {
  return {
    slug: row.slug,
    name: row.name || '',
    tagline: row.tagline || '',
    themeColor: row.theme_color || '#25394d',
    logo: row.logo || '',
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

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isClient || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not available'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slug' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function getCardsFromIndexedDB(): Promise<BusinessCard[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return [];
  }
}

async function saveCardsToIndexedDB(cards: BusinessCard[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const card of cards) {
      store.put(card);
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

// Helper to retrieve cards from localStorage
function getStoredCardsSync(): BusinessCard[] {
  if (!isClient) return INITIAL_MOCK_CARDS;
  if (memoryCardsCache && memoryCardsCache.length > 0) {
    return memoryCardsCache;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CARDS));
      } catch {
        // ignore quota error on initial seed
      }
      memoryCardsCache = INITIAL_MOCK_CARDS;
      return INITIAL_MOCK_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCardsCache = parsed;
      return parsed;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CARDS));
    } catch {
      // ignore
    }
    memoryCardsCache = INITIAL_MOCK_CARDS;
    return INITIAL_MOCK_CARDS;
  } catch (err) {
    console.error('Error reading cards from localStorage:', err);
    memoryCardsCache = INITIAL_MOCK_CARDS;
    return INITIAL_MOCK_CARDS;
  }
}

// Helper to write cards back safely to localStorage with fallback
function setStoredCardsSync(cards: BusinessCard[]) {
  if (!isClient) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    try {
      const lightweightCards = cards.map(c => {
        const isMenuTooBig = Boolean(c.menu_pdf && c.menu_pdf.length > 30000);
        const isLogoTooBig = Boolean(c.logo && c.logo.length > 30000);
        if (isMenuTooBig || isLogoTooBig) {
          return {
            ...c,
            menu_pdf: isMenuTooBig ? '' : c.menu_pdf,
            logo: isLogoTooBig ? '' : c.logo,
          };
        }
        return c;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightCards));
    } catch (fallbackErr) {
      console.warn('localStorage quota exceeded. Cards remain persisted in IndexedDB and memory cache.', fallbackErr);
    }
  }
}

async function persistCards(cards: BusinessCard[]): Promise<void> {
  memoryCardsCache = cards;

  if (isClient) {
    await saveCardsToIndexedDB(cards);
  }

  setStoredCardsSync(cards);
}

function mergeWithLocalCache(fetchedCards: BusinessCard[]): BusinessCard[] {
  const localCards = memoryCardsCache || (isClient ? getStoredCardsSync() : null) || [];
  const localMap = new Map<string, BusinessCard>();
  localCards.forEach(c => {
    if (c.slug) localMap.set(c.slug, c);
  });

  return fetchedCards.map(c => {
    const local = localMap.get(c.slug);
    if (local) {
      return {
        ...c,
        wifi_password: c.wifi_password || local.wifi_password || '',
        wifi_password_label: c.wifi_password_label || local.wifi_password_label || 'WiFi Password',
        delivery_enabled: c.delivery_enabled !== undefined ? Boolean(c.delivery_enabled) : (local.delivery_enabled ?? false),
        delivery_number: c.delivery_number || local.delivery_number || '',
        delivery_label: c.delivery_label || local.delivery_label || 'Delivery',
      };
    }
    return c;
  });
}

export async function getCards(): Promise<BusinessCard[]> {
  try {
    const { data: rows, error } = await supabase
      .from('business_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(rows) && rows.length > 0) {
      let cards = rows.map(mapRowToCard);
      cards = mergeWithLocalCache(cards);
      memoryCardsCache = cards;
      if (isClient) {
        saveCardsToIndexedDB(cards).catch(() => {});
        setStoredCardsSync(cards);
      }
      return cards;
    }
  } catch (err) {
    console.warn('Error fetching cards from Supabase:', err);
  }

  if (!isClient) return INITIAL_MOCK_CARDS;

  if (memoryCardsCache && memoryCardsCache.length > 0) {
    return memoryCardsCache;
  }

  const idbCards = await getCardsFromIndexedDB();
  if (idbCards && idbCards.length > 0) {
    memoryCardsCache = idbCards;
    setStoredCardsSync(idbCards);
    return idbCards;
  }

  const localCards = getStoredCardsSync();
  if (localCards && localCards.length > 0) {
    memoryCardsCache = localCards;
    saveCardsToIndexedDB(localCards).catch(() => {});
    return localCards;
  }

  memoryCardsCache = INITIAL_MOCK_CARDS;
  return INITIAL_MOCK_CARDS;
}

export async function getCardBySlug(slug: string): Promise<BusinessCard | undefined> {
  try {
    const { data: row, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && row) {
      const card = mapRowToCard(row);
      const localCards = memoryCardsCache || (isClient ? getStoredCardsSync() : null) || [];
      const localCard = localCards.find(c => c.slug === slug);
      if (localCard) {
        if (!card.wifi_password && localCard.wifi_password) {
          card.wifi_password = localCard.wifi_password;
        }
        if (!card.wifi_password_label && localCard.wifi_password_label) {
          card.wifi_password_label = localCard.wifi_password_label;
        }
        if (card.delivery_enabled === undefined && localCard.delivery_enabled !== undefined) {
          card.delivery_enabled = localCard.delivery_enabled;
        }
        if (!card.delivery_number && localCard.delivery_number) {
          card.delivery_number = localCard.delivery_number;
        }
        if (!card.delivery_label && localCard.delivery_label) {
          card.delivery_label = localCard.delivery_label;
        }
      }
      return card;
    }
  } catch (err) {
    console.warn('Error fetching card by slug from Supabase:', err);
  }

  const cards = await getCards();
  return cards.find(c => c.slug === slug);
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

  let uploadedPdf = card.menu_pdf;
  if (uploadedPdf && (uploadedPdf.startsWith('data:') || uploadedPdf.startsWith('blob:'))) {
    uploadedPdf = await uploadBase64ToSupabaseStorage(uploadedPdf, `${targetSlug}-menu`);
  }

  return {
    ...card,
    slug: targetSlug,
    logo: uploadedLogo,
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

  if (dbError && (dbError.message?.includes('wifi_password') || dbError.code === 'PGRST204' || dbError.message?.includes('column'))) {
    const fallbackRow: any = { ...row };
    delete fallbackRow.wifi_password;
    delete fallbackRow.wifi_password_label;
    
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

    const cards = await getCards();
    const updatedCards = [cardToSave, ...cards.filter(c => c.slug !== uniqueSlug)];
    await persistCards(updatedCards);

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

    const cards = await getCards();
    const index = cards.findIndex(c => c.slug === originalSlug);

    let updatedCards: BusinessCard[];
    if (index >= 0) {
      updatedCards = [...cards];
      updatedCards[index] = cardToUpdate;
    } else {
      updatedCards = [cardToUpdate, ...cards];
    }

    await persistCards(updatedCards);
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
    }

    const cards = await getCards();
    const updatedCards = cards.filter(c => c.slug !== slug);
    await persistCards(updatedCards);
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


