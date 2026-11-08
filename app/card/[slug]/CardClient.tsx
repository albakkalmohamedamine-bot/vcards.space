'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCardBySlug } from '@/lib/storage';
import { BusinessCard, PrimaryActionType, BusinessLanguage } from '@/lib/types';
import { getCardTranslation, TRANSLATIONS } from '@/lib/translations';
import { downloadVCard, downloadDeliveryVCard } from '@/lib/vcard';
import { GoogleLogo } from '@/components/GoogleLogo';
import { getNicheBackgroundImage } from '@/lib/businessNiches';
import { QRCodeCanvas } from 'qrcode.react';
import { trackCardEvent, getVisitorSourceFromUrl } from '@/lib/analytics';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Phone, 
  PhoneCall,
  MessageSquare,
  Star,
  Mail, 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  ArrowLeft,
  Sparkles,
  ExternalLink,
  UserPlus,
  Nfc,
  FileText,
  ArrowUpRight,
  Share2,
  Check,
  Copy,
  Download,
  Smartphone,
  X,
  ChevronRight,
  ChevronDown,
  PlusSquare,
  MoreVertical,
  BookmarkPlus,
  HelpCircle,
  Info,
  Wifi,
  Truck,
  SearchX
} from 'lucide-react';

const MotorcycleDeliveryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8h3" />
    <path d="M0.5 12h2.5" />
    <path d="M1.5 16h2" />
    <circle cx="7.5" cy="17.5" r="2.25" />
    <circle cx="18.5" cy="17.5" r="2.25" />
    <rect x="5" y="8" width="4" height="4.5" rx="0.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M7.5 17.5h6l2.5-6h-3.5" />
    <path d="M12.5 17.5l1.5-3.5h3" />
    <path d="M14.5 9l2 2.5h2" />
  </svg>
);

const RestaurantMenuIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {/* Menu Booklet / Folder */}
    <rect x="3" y="2" width="18" height="20" rx="2.5" ry="2.5" />
    {/* Book Binding Spine */}
    <path d="M6.5 2v20" strokeWidth="1.5" />
    {/* Decorative Header Accent */}
    <path d="M9.5 5h7" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* Fork (Left) */}
    <path d="M10 8v2.5a1 1 0 0 0 2 0V8" />
    <path d="M11 8v2.5" />
    <path d="M11 10.5v6.5" />
    {/* Knife (Right) */}
    <path d="M16 8v3a1.2 1.2 0 0 1-1.2-1.2V8a1 1 0 0 1 1.2 0z" fill="currentColor" fillOpacity="0.2" />
    <path d="M16 11v6" />
  </svg>
);

const ACTION_OPTIONS = [
  { value: 'website', label: 'Visit Website' },
  { value: 'whatsapp', label: 'WhatsApp Chat' },
  { value: 'phone', label: 'Direct Mobile Call' },
  { value: 'landline', label: 'Direct Landline Call (Fixe)' },
  { value: 'email', label: 'Send an Email' },
  { value: 'address', label: 'Get Directions' },
  { value: 'instagram', label: 'View Instagram' },
  { value: 'facebook', label: 'View Facebook' },
  { value: 'tiktok', label: 'View TikTok' },
  { value: 'snapchat', label: 'View Snapchat' },
  { value: 'linkedin', label: 'View LinkedIn' },
  { value: 'twitter', label: 'View X (Twitter)' },
  { value: 'youtube', label: 'View YouTube' },
];

const LANGUAGES: { code: BusinessLanguage; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ar', flag: '🇲🇦', label: 'العربية' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
];

const LANGUAGE_SECTION_LABEL: Record<BusinessLanguage, string> = {
  en: 'Language',
  fr: 'Langue',
  ar: 'اللغة',
  es: 'Idioma',
  de: 'Sprache',
  nl: 'Taal',
};

function isLightAccent(colorStr: string): boolean {
  if (!colorStr) return false;
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.68;
  }
  let hex = colorStr.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.68;
  }
  return false;
}

// Security Helper: Strictly whitelist safe external URL schemes (http:, https:) to prevent DOM XSS
function getSafeExternalUrl(raw?: string | null, fallback = ''): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return fallback;
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return fallback;
    }
  }
  try {
    const parsed = new URL(`https://${trimmed}`);
    if (parsed.protocol === 'https:' && parsed.hostname.includes('.')) {
      return `https://${trimmed}`;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function hasValueForAction(card: Partial<BusinessCard>, k: string | undefined): boolean {
  if (!k) return false;
  if (k === 'phone') return Boolean(card.phone);
  if (k === 'landline') return Boolean(card.landline);
  if (k === 'whatsapp') return Boolean(card.whatsapp);
  if (k === 'address') return Boolean(card.address || card.google_maps);
  if (k === 'email') return Boolean(card.email);
  if (k === 'website') return Boolean(card.website);
  if (k === 'instagram') return Boolean(card.instagram);
  if (k === 'facebook') return Boolean(card.facebook);
  if (k === 'tiktok') return Boolean(card.tiktok);
  if (k === 'snapchat') return Boolean(card.snapchat);
  if (k === 'linkedin') return Boolean(card.linkedin);
  if (k === 'twitter' || k === 'x') return Boolean(card.twitter);
  if (k === 'youtube') return Boolean(card.youtube);
  if (k === 'delivery' || k === 'delivery_number') return Boolean(card.delivery_enabled && card.delivery_number);
  if (k === 'wifi_password') return (card.layout === 'business' || !card.layout) && Boolean(card.wifi_password);
  return Boolean(card[k as keyof typeof card]);
}

function Design3CardView({
  card,
  themeColor,
  handleSaveClick,
  setShowDeliveryModal,
  setCopiedWifi,
  copiedWifi,
  getActionIcon,
  getActionHref,
  currentLang = 'en',
  cardDefaultLang = 'en',
}: {
  card: BusinessCard;
  themeColor: string;
  handleSaveClick: () => void;
  setShowDeliveryModal: (show: boolean) => void;
  setCopiedWifi: (copied: boolean) => void;
  copiedWifi: boolean;
  getActionIcon: (key: string, className?: string) => React.ReactNode;
  getActionHref: (key: string, val: string) => string;
  currentLang?: BusinessLanguage;
  cardDefaultLang?: BusinessLanguage;
}) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      if (imgRef.current.complete) {
        if (imgRef.current.naturalWidth === 0) {
          setCoverError(true);
        } else {
          setCoverLoaded(true);
        }
      }
    }
  }, [card.cover_photo_url]);

  // Google Maps URL derivation with safe scheme validation
  const mapUrl = card.address_type === 'text' && card.google_maps
    ? (card.google_maps.startsWith('http') ? getSafeExternalUrl(card.google_maps, '#') : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.google_maps)}`)
    : card.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`
      : '#';

  const translations = getCardTranslation(currentLang);
  const isOriginalLang = currentLang === cardDefaultLang;

  const getLabel = (customLabel: string | undefined, key: keyof ReturnType<typeof getCardTranslation>['defaultRowLabels']) => {
    const defaultVal = translations.defaultRowLabels[key];
    if (!isOriginalLang) return defaultVal;
    if (!customLabel || customLabel.trim() === '') return defaultVal;
    return customLabel;
  };

  // Resolve configured vs default quick action circular buttons
  const rawAction1 = card.quick_action_1 !== undefined && card.quick_action_1 !== '' ? card.quick_action_1 : 'phone';
  const rawAction2 = card.quick_action_2 !== undefined && card.quick_action_2 !== '' ? card.quick_action_2 : 'whatsapp';
  const rawAction3 = card.quick_action_3 !== undefined && card.quick_action_3 !== '' ? card.quick_action_3 : 'address';

  const quickActionKeys = [rawAction1, rawAction2, rawAction3].filter(
    (k): k is string => Boolean(k) && k !== 'none'
  );

  const activeHeaderCTAKeys = quickActionKeys.filter(k => hasValueForAction(card, k));

  const renderQuickActionButton = (actionKey: string, index: number) => {
    let href = '#';
    let onClick: (() => void) | undefined = undefined;
    let target: string | undefined = undefined;
    let rel: string | undefined = undefined;

    if (actionKey === 'phone') {
      if (!card.phone) return null;
      href = `tel:${card.phone}`;
    } else if (actionKey === 'landline') {
      if (!card.landline) return null;
      href = `tel:${card.landline}`;
    } else if (actionKey === 'whatsapp') {
      if (!card.whatsapp) return null;
      href = `https://wa.me/${card.whatsapp.replace(/\+/g, '')}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'address') {
      if (!card.address && !card.google_maps) return null;
      href = mapUrl;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'email') {
      if (!card.email) return null;
      href = `mailto:${card.email}`;
    } else if (actionKey === 'website') {
      if (!card.website) return null;
      href = card.website.startsWith('http') ? card.website : `https://${card.website}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'instagram') {
      if (!card.instagram) return null;
      href = card.instagram.startsWith('http') ? card.instagram : `https://instagram.com/${card.instagram.replace('@', '')}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'facebook') {
      if (!card.facebook) return null;
      href = card.facebook.startsWith('http') ? card.facebook : `https://facebook.com/${card.facebook}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'tiktok') {
      if (!card.tiktok) return null;
      href = card.tiktok.startsWith('http') ? card.tiktok : `https://tiktok.com/@${card.tiktok.replace('@', '')}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'snapchat') {
      if (!card.snapchat) return null;
      href = card.snapchat.startsWith('http') ? card.snapchat : `https://snapchat.com/add/${card.snapchat.replace('@', '')}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'linkedin') {
      if (!card.linkedin) return null;
      href = card.linkedin.startsWith('http') ? card.linkedin : `https://linkedin.com/in/${card.linkedin}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'twitter' || actionKey === 'x') {
      if (!card.twitter) return null;
      href = card.twitter.startsWith('http') ? card.twitter : `https://x.com/${card.twitter.replace('@', '')}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'youtube') {
      if (!card.youtube) return null;
      href = card.youtube.startsWith('http') ? card.youtube : `https://youtube.com/${card.youtube}`;
      target = "_blank";
      rel = "noopener noreferrer";
    } else if (actionKey === 'delivery' || actionKey === 'delivery_number') {
      if (!card.delivery_enabled || !card.delivery_number) return null;
      href = '#';
      onClick = () => setShowDeliveryModal(true);
    } else if (actionKey === 'wifi_password') {
      if (!card.wifi_password) return null;
      href = '#';
      onClick = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(card.wifi_password || '');
          setCopiedWifi(true);
          setTimeout(() => setCopiedWifi(false), 2000);
        }
      };
    } else {
      href = getActionHref(actionKey, (card[actionKey as keyof typeof card] as string) || '');
      target = "_blank";
      rel = "noopener noreferrer";
    }

    if (onClick) {
      return (
        <button
          key={`quick-${actionKey}-${index}`}
          type="button"
          onClick={onClick}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all cursor-pointer touch-manipulation"
          title={actionKey.toUpperCase()}
        >
          {getActionIcon(actionKey, "w-5 h-5 sm:w-6 sm:h-6")}
        </button>
      );
    }

    return (
      <a
        key={`quick-${actionKey}-${index}`}
        href={href}
        target={target}
        rel={rel}
        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all cursor-pointer touch-manipulation"
        title={actionKey.toUpperCase()}
      >
        {getActionIcon(actionKey, "w-5 h-5 sm:w-6 sm:h-6")}
      </a>
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-100/80 pb-20 pt-[env(safe-area-inset-top)] overflow-x-hidden font-sans">
      {/* Cover Photo Header - ONLY FOR DESIGN 3 */}
      {card.layout === 'design3' && (
        <div className="relative w-full h-52 sm:h-60 bg-slate-950 overflow-hidden">
          {card.cover_photo_url && !coverError ? (
            <>
              {!coverLoaded && (
                <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                </div>
              )}
              <img
                ref={imgRef}
                src={card.cover_photo_url}
                alt={card.name}
                referrerPolicy="no-referrer"
                onLoad={() => setCoverLoaded(true)}
                onError={() => {
                  setCoverLoaded(true);
                  setCoverError(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center relative"
              style={{
                background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18) 0%, transparent 70%), ${themeColor}`
              }}
            >
              <span className="font-serif text-white/25 text-3xl sm:text-4xl font-extrabold tracking-widest uppercase select-none px-6 text-center">
                {card.name}
              </span>
            </div>
          )}

          {/* Rich gradient overlay at the bottom of cover photo */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Signature Main Theme Header Block (Deep Gradient & Elevated Profile) */}
      <div 
        className={`relative pb-7 px-5 text-center text-white shadow-xl rounded-b-3xl ${
          card.layout === 'design3' ? 'pt-0' : 'pt-8 sm:pt-10'
        }`}
        style={{
          background: `linear-gradient(180deg, ${themeColor} 0%, rgba(0,0,0,0.28) 100%), ${themeColor}`,
          boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25)'
        }}
      >
        {/* Signature Avatar Ring */}
        <div className={`relative mb-3.5 inline-block z-10 ${
          card.layout === 'design3' ? '-mt-16 sm:-mt-18' : 'mt-0'
        }`}>
          <div 
            className="w-28 h-28 sm:w-32 sm:h-32 p-0 bg-white shadow-2xl shadow-black/30 border-0 overflow-hidden mx-auto flex items-center justify-center transition-transform hover:scale-105 duration-300"
            style={{ borderRadius: (card.avatar_border_radius ?? 50) >= 45 ? '50%' : '24%' }}
          >
            {card.logo ? (
              <img
                src={card.logo}
                alt={card.name}
                className="w-full h-full object-cover p-0"
                style={{ borderRadius: (card.avatar_border_radius ?? 50) >= 45 ? '50%' : '24%' }}
              />
            ) : (
              <span className="font-serif font-extrabold text-4xl sm:text-5xl text-slate-800 select-none">
                {card.name ? card.name.charAt(0).toUpperCase() : 'B'}
              </span>
            )}
          </div>
        </div>

        {/* Business Title in Fraunces / Serif with balanced tracking & leading */}
        <h1 className="font-serif text-2xl sm:text-[28px] font-extrabold tracking-tight sm:tracking-normal text-white uppercase drop-shadow-md break-words [overflow-wrap:anywhere] max-w-md mx-auto leading-snug sm:leading-tight">
          {card.name}
        </h1>

        {/* Tagline in crisp, legible font-sans */}
        {card.tagline && (
          <p className="mt-2 text-xs sm:text-[13px] font-medium tracking-wide text-white/95 max-w-sm mx-auto break-words [overflow-wrap:anywhere] leading-normal sm:leading-relaxed">
            {card.tagline}
          </p>
        )}

        {/* Quick Action Circular Buttons (Configurable up to 3) */}
        {quickActionKeys.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            {quickActionKeys.map((key, idx) => renderQuickActionButton(key, idx))}
          </div>
        )}
      </div>

      {/* Cards Section */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {/* Contact Details Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 shrink-0" style={{ color: themeColor }} />
              <span className="font-sans text-xs font-bold tracking-[0.15em] text-slate-500 uppercase">
                {translations.sectionContactDetails}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-3.5 py-2 rounded-full font-sans text-xs font-bold text-white flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer min-h-[38px] touch-manipulation shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              <span>{translations.saveContactUpper}</span>
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Mobile */}
            {card.phone && (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {getLabel(card.mobile_label, 'phone').toUpperCase()}
                  </span>
                  <a
                    href={`tel:${card.phone}`}
                    className="block font-sans font-semibold text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate mt-0.5 tracking-tight"
                  >
                    {card.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Landline */}
            {card.landline && (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-600">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {getLabel(card.landline_label, 'landline').toUpperCase()}
                  </span>
                  <a
                    href={`tel:${card.landline}`}
                    className="block font-sans font-semibold text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate mt-0.5 tracking-tight"
                  >
                    {card.landline}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {card.email && (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {getLabel(card.email_label, 'email').toUpperCase()}
                  </span>
                  <a
                    href={`mailto:${card.email}`}
                    className="block font-sans font-semibold text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate mt-0.5 break-all"
                  >
                    {card.email}
                  </a>
                </div>
              </div>
            )}

            {/* Website */}
            {card.website && (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {getLabel(card.website_label, 'website').toUpperCase()}
                  </span>
                  <a
                    href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-sans font-semibold text-sm hover:underline transition-colors truncate mt-0.5"
                    style={{ color: themeColor }}
                  >
                    {card.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              </div>
            )}

            {/* Address with View / Open on Map Button at the end of the address text */}
            {(card.address || card.google_maps) && (
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center shrink-0 text-slate-600 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                    {translations.sectionLocation}
                  </span>
                  <div className="mt-1 font-sans text-xs sm:text-sm text-slate-800 font-medium leading-relaxed break-words">
                    {card.address && (
                      <span className="mr-2 inline">{card.address}</span>
                    )}
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-sans text-[11px] font-bold tracking-wide text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all cursor-pointer my-0.5 align-middle"
                      style={{ backgroundColor: themeColor }}
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{translations.showOnMap}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Card */}
        {card.delivery_enabled && card.delivery_number && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowDeliveryModal(true)}
              className="w-full py-3.5 px-4 rounded-xl font-sans font-bold text-xs tracking-wide text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm hover:brightness-105 min-h-[44px]"
              style={{ backgroundColor: themeColor }}
            >
              <MotorcycleDeliveryIcon className="w-4 h-4" />
              <span className="tracking-wider uppercase">{getLabel(card.delivery_label, 'delivery')}</span>
            </button>
          </div>
        )}

        {/* Social Links ("Connect With Us" Circular Badge Grid) */}
        {(() => {
          const socialKeys = ['instagram', 'facebook', 'tiktok', 'snapchat', 'linkedin', 'twitter', 'youtube']
            .filter(k => {
              if (!Boolean(card[k as keyof typeof card])) return false;
              if (
                activeHeaderCTAKeys.includes(k) ||
                (k === 'twitter' && activeHeaderCTAKeys.includes('x')) ||
                (k === 'x' && activeHeaderCTAKeys.includes('twitter'))
              ) {
                return false;
              }
              return true;
            });

          if (socialKeys.length === 0) return null;

          return (
            <div className="mt-8 pt-6 border-t border-slate-200/60">
              <p className="font-sans text-xs font-bold tracking-[0.16em] text-slate-500 uppercase mb-6 text-center select-none">
                {translations.connectWithUs}
              </p>

              <div className="grid grid-cols-3 gap-y-7 gap-x-2 justify-items-center max-w-[320px] mx-auto">
                {socialKeys.map((actionKey) => {
                  const rawVal = card[actionKey as keyof typeof card] as string;
                  const href = getActionHref(actionKey, rawVal);
                  const label = translations.smallLabels[actionKey] || actionKey.toUpperCase();

                  return (
                    <a
                      key={actionKey}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center w-20 cursor-pointer"
                    >
                      <div
                        className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all group-hover:-translate-y-1 group-hover:shadow-md"
                        style={{
                          backgroundColor: `${themeColor}08`,
                          borderColor: `${themeColor}18`,
                          color: themeColor
                        }}
                      >
                        {getActionIcon(actionKey, 'w-6 h-6')}
                      </div>
                      <span className="text-[11px] font-bold font-sans text-slate-600 tracking-wide mt-2.5 uppercase transition-colors group-hover:text-slate-900 text-center truncate w-full">
                        {label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 5 Golden Stars Rate Us Section (Last section in the page) */}
        {card.rate_us_enabled !== false && (
          <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col items-center text-center">
            <a
              href={getSafeExternalUrl(card.review_url) || getSafeExternalUrl(card.google_maps) || (card.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}` : '') || 'https://maps.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full max-w-[280px] py-4 px-5 bg-transparent flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              <span className="text-xs font-bold font-sans tracking-[0.16em] text-slate-500 uppercase mb-1">
                {translations.reviewUs}
              </span>
              {/* 5 Big Golden Stars */}
              <div className="flex items-center gap-1.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110 drop-shadow-xs" />
                ))}
              </div>
              {/* Centered Google Logo on next line */}
              <div className="flex items-center justify-center pt-0.5">
                <GoogleLogo className="h-6 sm:h-7 w-auto transition-transform group-hover:scale-105" />
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CardClient({ 
  slug, 
  initialCard,
  previewCard,
  isPreview = false
}: { 
  slug?: string, 
  initialCard?: BusinessCard | null,
  previewCard?: Partial<BusinessCard>,
  isPreview?: boolean
}) {
  const router = useRouter();
  const [internalCard, setInternalCard] = useState<BusinessCard | null>(initialCard || null);
  const card = (previewCard || internalCard) as BusinessCard | null;

  const cardDefaultLang: BusinessLanguage = (card?.language as BusinessLanguage) || 'en';
  const [currentLang, setCurrentLang] = useState<BusinessLanguage>(cardDefaultLang);
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const closeShareBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (card?.language) {
      setCurrentLang(card.language as BusinessLanguage);
    }
  }, [card?.language]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) {
        setCardMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCardMenuOpen(false);
        setIsShareModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isShareModalOpen) {
      const timer = setTimeout(() => {
        closeShareBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isShareModalOpen]);

  const isOriginalLang = currentLang === cardDefaultLang;
  const translations = getCardTranslation(currentLang);

  const [isFetching, setIsFetching] = useState(!previewCard && !initialCard);
  const loading = !previewCard && isFetching && !internalCard;
  const [copied, setCopied] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [islandState, setIslandState] = useState<'idle' | 'dot' | 'expanded' | 'collapsed' | 'hidden'>('idle');

  // Scroll animations for Professional layout
  const { scrollY } = useScroll();
  const isDesign2 = (card?.layout || 'design1') === 'design2';
  
  const avatarScale = useTransform(scrollY, [0, 100], [1, isDesign2 ? (40/192) : (40/176)]);
  const avatarY = useTransform(scrollY, [0, 100], [0, isDesign2 ? -68 : -60]);
  const avatarX = useTransform(scrollY, [0, 100], [0, -82]);

  const pillOpacity = useTransform(scrollY, [50, 100], [0, 1]);
  const pillWidth = useTransform(scrollY, [50, 100], ['0px', '220px']);
  const pillY = useTransform(scrollY, [50, 100], [0, isDesign2 ? -68 : -60]);
  
  const nameOpacity = useTransform(scrollY, [70, 100], [0, 1]);
  const nameX = useTransform(scrollY, [70, 100], [20, 0]);
  const nameY = useTransform(scrollY, [70, 100], [0, isDesign2 ? -68 : -60]);

  // Save Modal & Shortcut States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [activeMultiLinkModal, setActiveMultiLinkModal] = useState<{
    key: string;
    title: string;
    icon: React.ReactNode;
    items: { label: string; url: string }[];
  } | null>(null);
  const [shortcutMode, setShortcutMode] = useState<'choice' | 'instructions'>('choice');
  const [deviceType, setDeviceType] = useState<'ios' | 'android'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        setDeviceType('ios');
      } else {
        setDeviceType('android');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const trackAction = (target: string, label?: string) => {
    if (!card?.slug || isPreview) return;
    const src = getVisitorSourceFromUrl();
    trackCardEvent({
      card_slug: card.slug,
      event_type: 'click',
      source: src,
      action_target: target,
      action_label: label,
    });
  };

  useEffect(() => {
    if (card?.slug && !isPreview) {
      const src = getVisitorSourceFromUrl();
      trackCardEvent({
        card_slug: card.slug,
        event_type: 'view',
        source: src,
      });
    }
  }, [card?.slug, isPreview]);

  const handleSaveClick = () => {
    if (card) {
      trackAction('vcard', 'Save Contact');
      downloadVCard(card);
    }
  };

  const publicBaseUrl = typeof window !== 'undefined'
    ? (card?.slug ? `${window.location.origin}/card/${card.slug}` : window.location.href.split('#')[0].split('?')[0])
    : (card?.slug ? `/card/${card.slug}` : '');

  const publicCardUrl = publicBaseUrl;
  const publicQrUrl = card?.slug && typeof window !== 'undefined' ? `${window.location.origin}/card/${card.slug}?src=qr` : publicCardUrl;
  const publicShareUrl = card?.slug && typeof window !== 'undefined' ? `${window.location.origin}/card/${card.slug}?src=share` : publicCardUrl;

  const handleCopyLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(publicShareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleNativeShare = async () => {
    if (!card) return;
    const shareData = {
      title: card.name || 'Digital Business Card',
      text: card.tagline ? `${card.name} - ${card.tagline}` : card.name,
      url: publicShareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing card:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    if (previewCard) return;
    if (slug) {
      getCardBySlug(slug)
        .then(foundCard => {
          if (foundCard) {
            setInternalCard(foundCard);
          }
        })
        .catch((err) => {
          console.warn('Failed to load card:', err);
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  }, [slug, initialCard, previewCard]);

  useEffect(() => {
    if (!loading && card) {
      const timer1 = setTimeout(() => {
        setIslandState('dot');
      }, 300);

      const timer2 = setTimeout(() => {
        setIslandState('expanded');
      }, 700);

      const timer3 = setTimeout(() => {
        setIslandState('collapsed');
      }, 2500);

      const timer4 = setTimeout(() => {
        setIslandState('hidden');
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [loading, card]);

  const getActionIcon = (actionType: string, className = "w-4 h-4") => {
    switch (actionType) {
      case 'delivery_number':
      case 'delivery': return <MotorcycleDeliveryIcon className={className} />;
      case 'phone': return <Phone className={className} />;
      case 'landline': return <PhoneCall className={className} />;
      case 'whatsapp': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.948.56 3.756 1.524 5.29L2.04 22l4.836-1.44c1.464.848 3.16 1.444 4.96 1.444 5.52 0 10-4.48 10-10C22.004 6.48 17.52 2 12.004 2zM12 20.334c-1.708 0-3.276-.484-4.608-1.32l-.328-.192-2.836.84.856-2.736-.216-.344a8.28 8.28 0 01-1.236-4.38c0-4.58 3.728-8.308 8.308-8.308 4.58 0 8.308 3.728 8.308 8.308s-3.728 8.308-8.308 8.308zm4.556-6.196c-.252-.124-1.48-.728-1.708-.812-.228-.084-.392-.124-.556.124-.164.248-.636.812-.78 1-.144.184-.288.208-.54.084-.252-.124-1.064-.392-2.024-1.252-.748-.668-1.252-1.492-1.4-1.74-.144-.252-.016-.388.108-.512.112-.112.252-.296.38-.444.124-.148.164-.252.248-.42.084-.168.04-.316-.02-.444-.06-.124-.556-1.336-.764-1.84-.2-.484-.404-.416-.556-.424-.144-.008-.308-.008-.472-.008s-.428.06-.652.3c-.224.24-.856.836-.856 2.04 0 1.204.876 2.368.996 2.532.12.164 1.724 2.632 4.176 3.692.584.252 1.04.404 1.396.516.588.188 1.124.16 1.548.1.472-.068 1.48-.604 1.684-1.16.204-.556.204-1.036.144-1.136-.06-.1-.224-.164-.476-.288z" clipRule="evenodd" />
        </svg>
      );
      case 'email': return <Mail className={className} />;
      case 'address': return <MapPin className={className} />;
      case 'website': return <Globe className={className} />;
      case 'instagram': return <Instagram className={className} />;
      case 'facebook': return <Facebook className={className} />;
      case 'tiktok': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.33V9.05a8.16 8.16 0 0 0 4.92 1.58V7.18a4.85 4.85 0 0 1-1-.49z"/>
        </svg>
      );
      case 'snapchat': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
        </svg>
      );
      case 'linkedin': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z"/>
        </svg>
      );
      case 'twitter':
      case 'x': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
      case 'youtube': return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
      case 'menu_pdf':
      case 'menu': return <RestaurantMenuIcon className={className} />;
      case 'wifi_password': return <Wifi className={className} />;
      default: return <ExternalLink className={className} />;
    }
  };

  const getLocalizedRowLabel = (customLabel: string | undefined, key: keyof ReturnType<typeof getCardTranslation>['defaultRowLabels'], lang: BusinessLanguage = 'en') => {
    const t = getCardTranslation(lang);
    const defaultVal = t.defaultRowLabels[key];

    // If visitor translates to a language different from the card's default language set by admin,
    // do not preserve customized text; use default translated text for that label.
    if (lang !== cardDefaultLang) {
      return defaultVal;
    }

    if (!customLabel || customLabel.trim() === '') return defaultVal;

    const isStandardDefault = [
      'Our Menu', 'Our Menu (PDF)', 'Notre Menu', 'Notre Carte / Menu', 'القائمة',
      'WiFi Password', 'Mot de passe Wi-Fi', 'كلمة سر الواي فاي',
      'Instagram', 'إنستغرام',
      'Facebook', 'فيسبوك',
      'TikTok', 'تيك توك',
      'WhatsApp', 'واتساب',
      'Email Us', 'Email', 'Envoyer un e-mail', 'إرسال بريد إلكتروني', 'راسلنا عبر البريد',
      'Our Location', 'Location', 'Adresse', 'Notre Emplacement', 'موقعنا',
      'Visit Website', 'Site Web', 'الموقع الإلكتروني',
      'Call Mobile', 'Mobile', 'اتصل بالجوال',
      'Office Line', 'Call Office Line', 'Ligne Fixe', 'الهاتف الثابت',
      'Delivery', 'Livraison', 'خدمة التوصيل',
      'Rate Us / Leave 5 Stars', 'Donnez votre avis (5 étoiles)', 'تقييمنا (5 نجوم)'
    ].includes(customLabel.trim());

    if (isStandardDefault) return defaultVal;
    return customLabel;
  };

  const getBusinessRows = (c: BusinessCard) => {
    const cardLang = currentLang;
    const t = getCardTranslation(cardLang);

    const rows: {
      id: string;
      label: string;
      icon: React.ReactNode;
      url?: string;
      onClick?: () => void;
      isRateUs?: boolean;
    }[] = [];

    // Helper to build a multi-link capable business row
    const buildMultiLinkRow = (
      key: string,
      mainVal: string | undefined,
      mainLabel: string | undefined,
      primarySubLabel: string | undefined,
      defaultLabelKey: keyof ReturnType<typeof getCardTranslation>['defaultRowLabels'],
      icon: React.ReactNode
    ) => {
      const items: { label: string; url: string }[] = [];
      const localizedDefault = getLocalizedRowLabel(undefined, defaultLabelKey, cardLang);
      const baseLabel = getLocalizedRowLabel(mainLabel, defaultLabelKey, cardLang);

      if (mainVal && mainVal.trim()) {
        const hasExtra = Boolean(c.multi_links?.[key]?.some(e => e && ((e.value && e.value.trim()) || ((e as any).url && (e as any).url.trim()))));
        const resolvedPrimarySub = primarySubLabel && primarySubLabel.trim()
          ? primarySubLabel.trim()
          : ((c.multi_links as any)?._primary_labels?.[key] || (c.multi_links as any)?.[`${key}_sub_label`] || '');

        const firstLabel = resolvedPrimarySub
          ? resolvedPrimarySub
          : (mainLabel && mainLabel.trim() ? mainLabel.trim() : (hasExtra ? `${localizedDefault} 1` : baseLabel));

        items.push({
          label: firstLabel,
          url: getActionHref(key, mainVal.trim()),
        });
      }

      const extras = c.multi_links?.[key] || [];
      extras.forEach((extra) => {
        const rawVal = extra ? (extra.value || (extra as any).url) : '';
        if (rawVal && rawVal.trim()) {
          const extraLabel = extra.label && extra.label.trim()
            ? extra.label.trim()
            : `${localizedDefault} ${items.length + 1}`;
          items.push({
            label: extraLabel,
            url: getActionHref(key, rawVal.trim()),
          });
        }
      });

      if (items.length === 0) return null;

      if (items.length === 1) {
        return {
          id: key,
          label: baseLabel,
          icon,
          url: items[0].url,
        };
      }

      return {
        id: key,
        label: baseLabel,
        icon,
        onClick: () => {
          setActiveMultiLinkModal({
            key,
            title: baseLabel,
            icon,
            items,
          });
        },
      };
    };

    if (c.menu_pdf) {
      const pdfUrl = c.menu_pdf;
      const menuLabel = getLocalizedRowLabel(c.menu_label, 'menu', cardLang);
      if (pdfUrl.startsWith('data:application/pdf;base64,')) {
        rows.push({
          id: 'menu_pdf',
          label: menuLabel,
          icon: <RestaurantMenuIcon className="w-5 h-5" />,
          onClick: () => {
            try {
              const base64Data = pdfUrl.slice('data:application/pdf;base64,'.length);
              const bstr = atob(base64Data);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank', 'noopener,noreferrer');
            } catch {
              // Ignore invalid blob error
            }
          }
        });
      } else if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        const safeUrl = getSafeExternalUrl(pdfUrl);
        if (safeUrl) {
          rows.push({
            id: 'menu_pdf',
            label: menuLabel,
            icon: <RestaurantMenuIcon className="w-5 h-5" />,
            url: safeUrl,
          });
        }
      }
    }

    if (c.wifi_password) {
      rows.push({
        id: 'wifi_password',
        label: copiedWifi ? t.copied : getLocalizedRowLabel(c.wifi_password_label, 'wifi', cardLang),
        icon: copiedWifi ? <Check className="w-5 h-5" /> : <Wifi className="w-5 h-5" />,
        onClick: async () => {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(c.wifi_password || '');
            } catch (err) {
              console.error('Failed to copy WiFi password:', err);
            }
          }
          setCopiedWifi(true);
          setTimeout(() => setCopiedWifi(false), 2000);
        }
      });
    }

    const instagramRow = buildMultiLinkRow('instagram', c.instagram, c.instagram_label, c.instagram_sub_label, 'instagram', <Instagram className="w-5 h-5" />);
    if (instagramRow) rows.push(instagramRow);

    const facebookRow = buildMultiLinkRow('facebook', c.facebook, c.facebook_label, c.facebook_sub_label, 'facebook', <Facebook className="w-5 h-5" />);
    if (facebookRow) rows.push(facebookRow);

    const tiktokRow = buildMultiLinkRow(
      'tiktok',
      c.tiktok,
      c.tiktok_label,
      c.tiktok_sub_label,
      'tiktok',
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.33V9.05a8.16 8.16 0 0 0 4.92 1.58V7.18a4.85 4.85 0 0 1-1-.49z"/>
      </svg>
    );
    if (tiktokRow) rows.push(tiktokRow);

    const snapchatRow = buildMultiLinkRow('snapchat', c.snapchat, c.snapchat_label, c.snapchat_sub_label, 'snapchat', getActionIcon('snapchat', 'w-5 h-5'));
    if (snapchatRow) rows.push(snapchatRow);

    const linkedinRow = buildMultiLinkRow('linkedin', c.linkedin, c.linkedin_label, c.linkedin_sub_label, 'linkedin', getActionIcon('linkedin', 'w-5 h-5'));
    if (linkedinRow) rows.push(linkedinRow);

    const twitterRow = buildMultiLinkRow('twitter', c.twitter, c.twitter_label, c.twitter_sub_label, 'twitter', getActionIcon('twitter', 'w-5 h-5'));
    if (twitterRow) rows.push(twitterRow);

    const youtubeRow = buildMultiLinkRow('youtube', c.youtube, c.youtube_label, c.youtube_sub_label, 'youtube', getActionIcon('youtube', 'w-5 h-5'));
    if (youtubeRow) rows.push(youtubeRow);

    const whatsappRow = buildMultiLinkRow('whatsapp', c.whatsapp, c.whatsapp_label, c.whatsapp_sub_label, 'whatsapp', getActionIcon('whatsapp', 'w-5 h-5'));
    if (whatsappRow) rows.push(whatsappRow);

    const emailRow = buildMultiLinkRow('email', c.email, c.email_label, c.email_sub_label, 'email', <Mail className="w-5 h-5" />);
    if (emailRow) rows.push(emailRow);

    const addressRow = buildMultiLinkRow('address', c.address, c.localisation_label, c.address_sub_label, 'address', <MapPin className="w-5 h-5" />);
    if (addressRow) rows.push(addressRow);

    const websiteRow = buildMultiLinkRow('website', c.website, c.website_label, c.website_sub_label, 'website', <Globe className="w-5 h-5" />);
    if (websiteRow) rows.push(websiteRow);

    const phoneRow = buildMultiLinkRow('phone', c.phone, c.mobile_label, c.phone_sub_label, 'phone', <Phone className="w-5 h-5" />);
    if (phoneRow) rows.push(phoneRow);

    const landlineRow = buildMultiLinkRow('landline', c.landline, c.landline_label, c.landline_sub_label, 'landline', <PhoneCall className="w-5 h-5" />);
    if (landlineRow) rows.push(landlineRow);

    if (c.delivery_enabled && c.delivery_number) {
      rows.push({
        id: 'delivery',
        label: getLocalizedRowLabel(c.delivery_label, 'delivery', cardLang),
        icon: <MotorcycleDeliveryIcon className="w-5 h-5" />,
        onClick: () => setShowDeliveryModal(true),
      });
    }

    const showRateUs = c.rate_us_enabled !== false;
    if (showRateUs) {
      const reviewUrl = getSafeExternalUrl(c.review_url) || getSafeExternalUrl(c.google_maps) || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '') || 'https://maps.google.com';
      rows.push({
        id: 'rate_us',
        label: getLocalizedRowLabel(c.rate_us_label, 'rateUs', cardLang),
        isRateUs: true,
        icon: <Star className="w-5 h-5 fill-amber-400 text-amber-400" />,
        url: reviewUrl,
      });
    }

    if (c.first_priority_field) {
      const priorityIndex = rows.findIndex(r => r.id === c.first_priority_field);
      if (priorityIndex > 0) {
        const [priorityRow] = rows.splice(priorityIndex, 1);
        rows.unshift(priorityRow);
      }
    }

    return rows;
  };

  const getGoogleMapsHref = (c: BusinessCard) => {
    const destination = (c.address_type === 'text' ? (c.google_maps || c.address) : c.address) || '';
    if (!destination) return '#';
    const trimmed = destination.trim();
    if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
      return '#';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return getSafeExternalUrl(trimmed, '#');
    }
    return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`;
  };

  const getActionHref = (actionType: string, value: string) => {
    if (!value) return '#';
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('blob:')
    ) {
      return '#';
    }
    switch (actionType) {
      case 'delivery_number':
      case 'phone': 
      case 'landline': {
        const cleanTel = trimmed.replace(/[^0-9+]/g, '');
        return cleanTel ? `tel:${cleanTel}` : '#';
      }
      case 'whatsapp': {
        if (lower.startsWith('http://') || lower.startsWith('https://')) {
          return getSafeExternalUrl(trimmed, '#');
        }
        let cleanNumber = trimmed.replace(/[^0-9]/g, '');
        if (cleanNumber.startsWith('00')) {
          cleanNumber = cleanNumber.slice(2);
        }
        return cleanNumber ? `https://wa.me/${cleanNumber}` : '#';
      }
      case 'email': {
        const cleanEmail = trimmed.replace(/[\r\n\s]/g, '');
        return cleanEmail ? `mailto:${encodeURIComponent(cleanEmail)}` : '#';
      }
      case 'address': {
        if (lower.startsWith('http://') || lower.startsWith('https://')) {
          return getSafeExternalUrl(trimmed, '#');
        }
        return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`;
      }
      case 'website': return getSafeExternalUrl(trimmed, '#');
      case 'instagram': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://instagram.com/${trimmed.replace('@', '')}`;
      case 'facebook': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://facebook.com/${trimmed}`;
      case 'tiktok': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://tiktok.com/@${trimmed.replace('@', '')}`;
      case 'snapchat': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://snapchat.com/add/${trimmed.replace('@', '')}`;
      case 'linkedin': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://linkedin.com/${trimmed.startsWith('in/') || trimmed.startsWith('company/') ? trimmed : `in/${trimmed}`}`;
      case 'twitter':
      case 'x': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://x.com/${trimmed.replace('@', '')}`;
      case 'youtube': return lower.startsWith('http://') || lower.startsWith('https://') ? getSafeExternalUrl(trimmed, '#') : `https://youtube.com/${trimmed.startsWith('@') ? trimmed : `@${trimmed}`}`;
      default: return getSafeExternalUrl(trimmed, '#');
    }
  };

  if (loading) {
    const t = getCardTranslation('en');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-slate-500 font-mono text-sm tracking-wider uppercase">{t.loadingCard}</p>
        </div>
      </div>
    );
  }

  if (!card) {
    const t = getCardTranslation('en');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-slate-200 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 border border-red-100 shadow-xs">
            <SearchX className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">{t.cardNotFoundTitle}</h1>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            {t.cardNotFoundDesc}
          </p>
          {slug && (
            <div className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-slate-600 font-mono text-xs border border-slate-200 break-all max-w-full">
              {t.requestedUrl} <span className="font-bold text-slate-900">/card/{slug}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const primaryHref = getActionHref(card.primary_action, card[card.primary_action] as string || '');
  const primaryLabel = (isOriginalLang && card.primary_action_label)
    ? card.primary_action_label
    : translations.primaryActions[card.primary_action as PrimaryActionType];

  const themeColor = card.themeColor || '#1B2A4A';
  const layout = card.layout || 'design1';

  // Resolve background options for Business Layout
  const isBusinessLayout = layout === 'business';
  const isImageBgMode = card.bg_type === 'image';
  const resolvedBgImage = card.bg_image_url || (isImageBgMode ? getNicheBackgroundImage(card.bg_niche) : '');
  const hasActiveImageBg = isBusinessLayout && (isImageBgMode || Boolean(card.bg_image_url)) && Boolean(resolvedBgImage);
  const cardAccent = card.themeColor || (hasActiveImageBg ? 'rgba(255, 255, 255, 0.9)' : themeColor);
  const isAccentLight = isLightAccent(cardAccent);

  // Business Card button styling: When background is an image, use subtle sheer dark glass with minimal blur (2px)
  // so the photo is not obscured or smeared in a strong milky white cloud.
  // When background is a color gradient, preserve the original clean 12% white glass with 6px blur.
  const businessRowButtonStyle: React.CSSProperties = {
    backgroundColor: hasActiveImageBg ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.12)',
    backdropFilter: hasActiveImageBg ? 'blur(2px)' : 'blur(6px)',
    WebkitBackdropFilter: hasActiveImageBg ? 'blur(2px)' : 'blur(6px)',
    border: hasActiveImageBg ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(255, 255, 255, 0.20)',
    borderRadius: '9999px',
  };
  const businessButtonHoverClass = hasActiveImageBg ? 'hover:bg-white/10' : 'hover:bg-white/20';
  const businessButtonShadowClass = hasActiveImageBg ? 'shadow-md' : 'shadow-lg';

  const MainWrapper = isPreview ? 'div' : 'main';
  const CardWrapper = isPreview ? 'div' : motion.div;

  const mainBgClass = isPreview 
    ? "w-full h-full font-sans text-slate-900 text-left" 
    : (layout === 'business' && hasActiveImageBg)
      ? "min-h-screen bg-[#080c14] sm:bg-slate-50 flex flex-col justify-start items-center p-0 sm:p-6 font-sans relative"
      : "min-h-screen bg-slate-50 flex flex-col justify-start items-center p-0 sm:p-6 font-sans relative";

  return (
    <MainWrapper className={mainBgClass}>
      {/* Fixed Fullscreen Background for Business Layout on Mobile Viewport */}
      {!isPreview && layout === 'business' && hasActiveImageBg && resolvedBgImage && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden sm:hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url("${resolvedBgImage}")`,
              filter: 'brightness(0.75)',
              WebkitFilter: 'brightness(0.75)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/85" />
        </div>
      )}

      <CardWrapper 
        {...(!isPreview ? {
          initial: { opacity: 0, ...(hasActiveImageBg ? {} : { y: 24, scale: 0.98 }) },
          animate: { opacity: 1, ...(hasActiveImageBg ? {} : { y: 0, scale: 1 }) },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
        } : {})}
        dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
        className={isPreview ? `w-full ${layout === 'business' ? '' : 'bg-white'} rounded-[28px] overflow-hidden relative border border-slate-100 shadow-xs pb-6 text-left` : `w-full max-w-[440px] sm:max-w-[460px] ${layout === 'business' ? '' : 'bg-white'} sm:rounded-[36px] min-h-screen sm:min-h-0 sm:shadow-2xl overflow-hidden relative border-x sm:border border-slate-200/60 pb-6`}
        style={layout === 'business' ? {
          background: hasActiveImageBg
            ? 'transparent'
            : `linear-gradient(180deg, ${themeColor} 0%, #080c14 100%)`
        } : undefined}
      >
        
        {/* Dynamic Island Animation for NFC Tap */}
        <AnimatePresence>
          {islandState !== 'hidden' && (
            <motion.div 
              className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-3 sm:pt-6 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="bg-slate-950 rounded-full overflow-hidden flex items-center justify-center shadow-2xl border border-white/10 backdrop-blur-md"
                style={{ willChange: 'transform, width' }}
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: islandState === 'idle' ? 0 : islandState === 'dot' ? 24 : islandState === 'expanded' ? 180 : islandState === 'collapsed' ? 100 : 0,
                  height: islandState === 'idle' ? 0 : islandState === 'dot' ? 24 : 42,
                  opacity: islandState === 'idle' ? 0 : 1
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <AnimatePresence mode="wait">
                  {islandState === 'expanded' && (
                    <motion.div 
                      key="expanded"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ delay: 0.08, duration: 0.18 }}
                      className="flex items-center justify-center gap-2.5 px-3.5 w-full h-full text-white"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Nfc className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider font-mono text-slate-100 whitespace-nowrap">VCards.space</span>
                    </motion.div>
                  )}
                  {islandState === 'collapsed' && (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="flex items-center justify-center gap-2 w-full h-full text-white"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combined Action & Language Menu Button - UNIVERSAL FOR ALL CARD DESIGNS */}
        <div 
          ref={cardMenuRef}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-[70]"
          dir="ltr"
          style={{
            '--card-accent': cardAccent,
          } as React.CSSProperties}
        >
          {/* 1. Trigger button: 40x40 circle with glass style, 44px tap area, accent glow */}
          <motion.button 
            type="button"
            onClick={() => setCardMenuOpen((prev) => !prev)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 14px color-mix(in srgb, var(--card-accent) 55%, transparent)',
            }}
            whileTap={{ scale: 0.92 }}
            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer before:absolute before:-inset-1 before:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.30)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              boxShadow: cardMenuOpen 
                ? '0 0 14px color-mix(in srgb, var(--card-accent) 50%, transparent)' 
                : undefined,
            }}
            title="Menu"
            aria-label="Menu"
            aria-expanded={cardMenuOpen}
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </motion.button>

          {/* 2. Dropdown panel: Dark translucent glass with 10% accent tint, 220px width, 20px radius */}
          <AnimatePresence>
            {cardMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  transformOrigin: 'top right',
                  background: 'color-mix(in srgb, var(--card-accent) 10%, rgba(15, 15, 15, 0.72))',
                  backdropFilter: 'blur(20px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                }}
                className="absolute top-full right-0 mt-2 w-[220px] max-w-[calc(100vw-32px)] p-2.5 z-[80] font-sans"
              >
                {/* Row 1: Share Card (opens Share bottom sheet with QR code) */}
                <button
                  type="button"
                  onClick={() => {
                    setCardMenuOpen(false);
                    setIsShareModalOpen(true);
                  }}
                  className="w-full h-12 px-2.5 rounded-xl flex items-center justify-between text-[15px] font-medium text-white transition-colors cursor-pointer hover:bg-white/[0.08] active:bg-white/[0.12] group select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--card-accent) 20%, transparent)',
                      }}
                    >
                      <Share2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="truncate text-white text-[15px] font-medium leading-none">
                      {translations.shareCard || 'Share Card'}
                    </span>
                  </div>
                </button>

                {/* Thin Divider (1px rgba(255,255,255,0.10)) */}
                <div className="my-1.5 h-[1px] w-full bg-white/10" />

                {/* Small Uppercase LANGUAGE Label (11px, letter-spacing 0.1em, 55% white) */}
                <div className="px-1 pb-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-white/55 select-none">
                  LANGUAGE
                </div>

                {/* Languages: Compact 2-column grid of pill chips (36px high, flag + name, 13px text) */}
                <div className="grid grid-cols-2 gap-1.5">
                  {LANGUAGES.map((l) => {
                    const isActive = currentLang === l.code;
                    const isArabic = l.code === 'ar';
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setCurrentLang(l.code);
                          setCardMenuOpen(false);
                        }}
                        className={`h-9 px-2 rounded-full flex items-center justify-between text-[13px] font-medium transition-all cursor-pointer select-none ${
                          isActive
                            ? (isAccentLight ? 'text-white font-semibold drop-shadow-xs' : 'text-white font-semibold')
                            : 'text-white/80 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        style={isActive ? {
                          backgroundColor: 'color-mix(in srgb, var(--card-accent) 30%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--card-accent) 70%, transparent)',
                        } : {
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        <span 
                          className="flex items-center gap-1.5 min-w-0 truncate"
                          dir={isArabic ? 'rtl' : 'ltr'}
                        >
                          <span className="text-sm leading-none shrink-0">{l.flag}</span>
                          <span className="truncate">{l.label}</span>
                        </span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Background Layer for Business Layout (Desktop Card & Preview) */}
        {layout === 'business' && hasActiveImageBg && resolvedBgImage && (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${!isPreview ? 'hidden sm:block' : ''}`}>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all"
              style={{ 
                backgroundImage: `url("${resolvedBgImage}")`,
                ...(isPreview ? {} : { backgroundAttachment: 'fixed' }),
                filter: 'brightness(0.75)',
                WebkitFilter: 'brightness(0.75)',
              }}
            />
            {/* Subtle scrim overlay so text, logo, and frosted buttons have perfect contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/85" />
          </div>
        )}

        {/* Header Cover Area */}
        {layout === 'business' ? (
          <>
            {/* Profile / Logo Area for Business on Gradient or Image Background */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.82, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="pt-8 sm:pt-10 flex justify-center px-6 relative z-10"
            >
              {(() => {
                const isCircle = (card.avatar_border_radius ?? 50) >= 45;
                const hasImageBg = hasActiveImageBg;
                return (
                  <div 
                    className="flex items-center justify-center transition-all duration-300 overflow-hidden w-48 h-48 sm:w-56 sm:h-56"
                    style={{ 
                      backgroundColor: card.logo ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: hasImageBg ? 'rgba(255, 255, 255, 0.92)' : 'transparent',
                      borderWidth: hasImageBg ? '2.5px' : '0px',
                      borderStyle: hasImageBg ? 'solid' : 'none',
                      borderRadius: isCircle ? '50%' : '22%',
                      filter: hasImageBg 
                        ? 'drop-shadow(0px 8px 24px rgba(0, 0, 0, 0.75)) drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.28))'
                        : 'drop-shadow(0px 0px 14px rgba(255, 255, 255, 0.36))'
                    }}
                  >
                    {card.logo ? (
                      <img 
                        src={card.logo} 
                        alt={card.name} 
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover p-0" 
                      />
                    ) : (
                      <span className="font-serif font-bold tracking-tight text-white select-none text-6xl sm:text-7xl">
                        {card.name ? card.name.charAt(0).toUpperCase() : 'B'}
                      </span>
                    )}
                  </div>
                );
              })()}
            </motion.div>

            {/* Content Area for Business Layout */}
            <div className="pt-4 pb-10 px-4 sm:px-6 text-center flex flex-col min-h-[350px] relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
              >
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight break-words [overflow-wrap:anywhere] drop-shadow-xs">
                  {card.name}
                </h1>
                
                {card.tagline && (
                  <p className="mt-2 text-xs sm:text-sm font-sans font-medium tracking-wide text-white/80 max-w-xs sm:max-w-sm mx-auto leading-normal sm:leading-relaxed break-words [overflow-wrap:anywhere]">
                    {card.tagline}
                  </p>
                )}
              </motion.div>

              {/* Stacked Business Link Rows */}
              <div className="space-y-3.5 w-full my-7">
                {getBusinessRows(card).map((row, idx) => {
                  const itemDelay = 0.3 + idx * 0.08;

                  if (row.isRateUs) {
                    return (
                      <motion.a
                        key={row.id}
                        href={row.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAction('review', translations.reviewUs)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`group relative w-full py-4 sm:py-5 px-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 gap-2 rounded-full ${businessButtonShadowClass}`}
                        style={businessRowButtonStyle}
                      >
                        <span className="text-xs font-bold font-sans tracking-[0.16em] text-white/90 uppercase mb-0.5">
                          {translations.reviewUs}
                        </span>
                        {/* 5 Big Golden Stars */}
                        <div className="flex items-center gap-1.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110 drop-shadow-xs" />
                          ))}
                        </div>
                        {/* Centered Google Logo on next line */}
                        <div className="flex items-center justify-center pt-0.5">
                          <GoogleLogo className="h-5 sm:h-6 w-auto transition-transform group-hover:scale-105" />
                        </div>
                      </motion.a>
                    );
                  }

                  if (row.onClick) {
                    return (
                      <motion.button
                        key={row.id}
                        type="button"
                        onClick={() => {
                          trackAction(row.id, row.label);
                          row.onClick?.();
                        }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`group relative w-full py-4 sm:py-4.5 px-12 sm:px-14 rounded-full flex items-center justify-center text-white transition-all duration-200 ${businessButtonHoverClass} ${businessButtonShadowClass} cursor-pointer min-h-[58px] sm:min-h-[62px]`}
                        style={businessRowButtonStyle}
                      >
                        {/* Un-boxed Pure Vector Icon */}
                        <div className="absolute left-5 sm:left-6 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
                          {row.icon}
                        </div>
                        <span className="font-bold text-base sm:text-lg text-white tracking-wide text-center truncate px-6">
                          {row.label}
                        </span>
                        <ArrowUpRight className="absolute right-5 sm:right-6 w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </motion.button>
                    );
                  }

                  return (
                    <motion.a
                      key={row.id}
                      href={row.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackAction(row.id, row.label)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`group relative w-full py-4 sm:py-4.5 px-12 sm:px-14 rounded-full flex items-center justify-center text-white transition-all duration-200 ${businessButtonHoverClass} ${businessButtonShadowClass} cursor-pointer min-h-[58px] sm:min-h-[62px]`}
                      style={businessRowButtonStyle}
                    >
                      {/* Un-boxed Pure Vector Icon */}
                      <div className="absolute left-5 sm:left-6 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
                        {row.icon}
                      </div>
                      <span className="font-bold text-base sm:text-lg text-white tracking-wide text-center truncate px-6">
                        {row.label}
                      </span>
                      <ArrowUpRight className="absolute right-5 sm:right-6 w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </motion.a>
                  );
                })}
              </div>

              {/* Save Contact Button for Business Layout */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 + getBusinessRows(card).length * 0.08 + 0.05 }}
                className="flex flex-col items-center justify-center w-full max-w-[220px] sm:max-w-[240px] mx-auto gap-3"
              >
                <button 
                  type="button"
                  className={`w-full py-3 px-5 font-bold text-xs text-white border flex items-center justify-center gap-2 transition-all ${businessButtonHoverClass} active:scale-[0.98] cursor-pointer shadow-md`}
                  style={businessRowButtonStyle}
                  onClick={handleSaveClick}
                >
                  <UserPlus className="w-4 h-4 shrink-0 text-white" />
                  <span className="tracking-wide text-xs truncate text-white">{translations.saveContact}</span>
                </button>
              </motion.div>
            </div>
          </>
        ) : layout === 'design3' ? (
          <Design3CardView
            card={card}
            themeColor={themeColor}
            handleSaveClick={handleSaveClick}
            setShowDeliveryModal={setShowDeliveryModal}
            setCopiedWifi={setCopiedWifi}
            copiedWifi={copiedWifi}
            getActionIcon={getActionIcon}
            getActionHref={getActionHref}
            currentLang={currentLang}
            cardDefaultLang={cardDefaultLang}
          />
        ) : (
          <>
            {/* Colored Banner Top */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-32 sm:h-36 w-full relative transition-all duration-300 shadow-md" 
              style={{ 
                background: `linear-gradient(180deg, ${themeColor} 0%, rgba(0,0,0,0.28) 100%), ${themeColor}` 
              }}
            >
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.4),_transparent_70%)]" />
              
              {layout !== 'design2' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-10 bg-white" 
                  style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} 
                />
              )}
            </motion.div>

            {/* Profile / Logo Area */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`sticky top-4 z-40 mx-auto flex items-center justify-center pointer-events-none ${
                layout === 'design2' ? '-mt-24' : '-mt-20'
              }`}
              style={{ height: layout === 'design2' ? 192 : 176 }}
            >
              {/* The Pill Background */}
              <motion.div
                style={{
                  opacity: pillOpacity,
                  width: pillWidth,
                  height: 56,
                  y: pillY,
                }}
                className="absolute bg-white/90 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200/60 rounded-full pointer-events-auto"
              />

              {/* The Avatar */}
              <motion.div 
                className={`relative flex items-center justify-center bg-white shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 overflow-hidden border-0 pointer-events-auto origin-center ${
                  layout === 'design2' ? 'w-48 h-48' : 'w-44 h-44'
                }`}
                style={{ 
                  backgroundColor: card.logo ? '#FFFFFF' : themeColor,
                  borderRadius: (card.avatar_border_radius ?? 50) >= 45 ? '50%' : '22%',
                  scale: avatarScale,
                  x: avatarX,
                  y: avatarY
                }}
              >
                {card.logo ? (
                  <img 
                    src={card.logo} 
                    alt={card.name} 
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover p-0" 
                  />
                ) : (
                  <span className={`font-serif font-bold tracking-tight text-white select-none ${
                    layout === 'design2' ? 'text-8xl' : 'text-7xl'
                  }`}>
                    {card.name ? card.name.charAt(0).toUpperCase() : 'B'}
                  </span>
                )}
              </motion.div>

              {/* The Name in the Pill */}
              <motion.div
                style={{
                  opacity: nameOpacity,
                  x: nameX,
                  y: nameY,
                }}
                className="absolute left-1/2 ml-[-50px] font-serif font-bold text-slate-900 text-[15px] truncate max-w-[140px] pointer-events-none"
              >
                {card.name}
              </motion.div>
            </motion.div>

            {/* Content Area */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-6 pb-10 px-8 text-center flex flex-col min-h-[400px]"
            >
              
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight uppercase break-words [overflow-wrap:anywhere]">
                {card.name}
              </h1>
              
              {card.tagline && (
                <p className="mt-2 text-xs sm:text-sm font-sans font-medium tracking-wide text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-normal sm:leading-relaxed break-words [overflow-wrap:anywhere]">
                  {card.tagline}
                </p>
              )}

              <div className="flex justify-center items-center gap-3 my-5 select-none" aria-hidden="true">
                <div className="h-[1px] w-8 bg-slate-200/80" />
                <span className="text-[10px] font-sans tracking-widest text-slate-300">✦</span>
                <div className="h-[1px] w-8 bg-slate-200/80" />
              </div>

              {card.address && (
                card.address_type === 'text' ? (
                  <div className="mb-7 px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-100 max-w-[320px] mx-auto text-center">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans italic whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      "{card.address}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 mb-7 px-4 leading-relaxed max-w-[300px] mx-auto whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {card.address}
                  </p>
                )
              )}

              <div className="mt-auto flex items-center gap-2.5 sm:gap-3 w-full">
                {hasValueForAction(card, card.primary_action) && (
                  <a 
                    href={primaryHref}
                    target={['whatsapp', 'website', 'instagram', 'facebook', 'tiktok', 'snapchat', 'linkedin', 'twitter', 'youtube', 'address'].includes(card.primary_action) ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 py-3.5 px-3 sm:px-4 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                    style={{ 
                      backgroundColor: themeColor,
                      boxShadow: `0 8px 20px -6px ${themeColor}50`
                    }}
                  >
                    {getActionIcon(card.primary_action, 'w-4 h-4 sm:w-5 sm:h-5 shrink-0')}
                    <span className="tracking-wide text-xs sm:text-sm truncate">{primaryLabel}</span>
                  </a>
                )}

                <button 
                  type="button"
                  className="flex-1 min-w-0 py-3.5 px-3 sm:px-4 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  style={{ 
                    backgroundColor: themeColor,
                    boxShadow: `0 8px 20px -6px ${themeColor}50`
                  }}
                  onClick={handleSaveClick}
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-white" />
                  <span className="tracking-wide text-xs sm:text-sm truncate">{translations.saveContact}</span>
                </button>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-8">
                <p className="text-xs sm:text-sm font-bold font-sans tracking-[0.16em] text-slate-500 uppercase mb-6 select-none text-center">
                  {translations.connectWithUs}
                </p>
                
                <div className="grid grid-cols-3 gap-y-7 gap-x-2 justify-items-center max-w-[320px] mx-auto">
                  {(() => {
                    const secondaryActions = ['phone', 'landline', 'whatsapp', 'email', 'address', 'website', 'instagram', 'facebook', 'tiktok', 'snapchat', 'linkedin', 'twitter', 'youtube', 'delivery_number']
                      .filter(k => {
                        if (k === card.primary_action && hasValueForAction(card, card.primary_action)) {
                          return false;
                        }
                        return hasValueForAction(card, k);
                      });

                    if (secondaryActions.length > 0) {
                      return secondaryActions.map((actionKey) => {
                        if (actionKey === 'delivery_number') {
                          return (
                            <button
                              key={actionKey}
                              type="button"
                              onClick={() => setShowDeliveryModal(true)}
                              className="group flex flex-col items-center w-20 cursor-pointer"
                            >
                              <div 
                                className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all group-hover:-translate-y-1 group-hover:shadow-md"
                                style={{ 
                                  backgroundColor: `${themeColor}08`,
                                  borderColor: `${themeColor}15`,
                                  color: themeColor
                                }}
                              >
                                {getActionIcon(actionKey, 'w-6 h-6')}
                              </div>
                              <span className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide mt-2.5 uppercase transition-colors group-hover:text-slate-900 text-center truncate w-full">
                                {card.delivery_label || 'Delivery'}
                              </span>
                            </button>
                          );
                        }

                        return (
                          <a 
                            key={actionKey}
                            href={getActionHref(actionKey, card[actionKey as keyof typeof card] as string)}
                            target={['whatsapp', 'website', 'instagram', 'facebook', 'tiktok', 'snapchat', 'linkedin', 'twitter', 'youtube', 'address'].includes(actionKey) ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center w-20"
                          >
                            <div 
                              className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all group-hover:-translate-y-1 group-hover:shadow-md"
                              style={{ 
                                backgroundColor: `${themeColor}08`,
                                borderColor: `${themeColor}15`,
                                color: themeColor
                              }}
                            >
                              {getActionIcon(actionKey, 'w-6 h-6')}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide mt-2.5 uppercase transition-colors group-hover:text-slate-900 text-center truncate w-full">
                              {actionKey === 'delivery_number' ? (card.delivery_label || 'Delivery') : (translations.smallLabels[actionKey] || translations.smallLabels.default)}
                            </span>
                          </a>
                        );
                      });
                    }
                    return null;
                  })()}
                </div>

                {/* 5 Golden Stars Rate Us Button for Personal Cards */}
                {card.rate_us_enabled !== false && (
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center"
                  >
                    <a
                      href={getSafeExternalUrl(card.review_url) || getSafeExternalUrl(card.google_maps) || (card.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}` : '') || 'https://maps.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-full max-w-[280px] py-4 px-5 bg-transparent flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-xs font-bold font-sans tracking-[0.16em] text-slate-500 uppercase mb-1">
                        {translations.reviewUs}
                      </span>
                      {/* 5 Big Golden Stars */}
                      <div className="flex items-center gap-1.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110 drop-shadow-xs" />
                        ))}
                      </div>
                      {/* Centered Google Logo on next line */}
                      <div className="flex items-center justify-center pt-0.5">
                        <GoogleLogo className="h-6 sm:h-7 w-auto transition-transform group-hover:scale-105" />
                      </div>
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Footer for Public Card Page */}
        <footer className="mt-8 mb-4 text-center flex items-center justify-center relative z-10 select-none">
          <span className="text-xs font-mono text-slate-400 font-medium tracking-wide flex items-center gap-1">
            <span>powered by</span>
            <span className="inline-flex items-center text-slate-600 font-semibold lowercase">
              <img 
                src="/logo-navy.svg" 
                alt="v" 
                className="w-3.5 h-3.5 inline-block object-contain -mr-0.5" 
              />
              cards.space
            </span>
          </span>
        </footer>
      </CardWrapper>

      {/* Save Options & Shortcut Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSaveModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Sheet Container */}
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[460px] bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  {shortcutMode === 'instructions' && (
                    <button 
                      type="button"
                      onClick={() => setShortcutMode('choice')}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors mr-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                      {shortcutMode === 'choice' 
                        ? translations.saveModal.title 
                        : translations.saveModal.addShortcutTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {shortcutMode === 'choice' 
                        ? translations.saveModal.subtitle 
                        : translations.saveModal.addShortcutSubtitle}
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Step 1: Choice */}
              {shortcutMode === 'choice' ? (
                <div className="space-y-3">
                  {/* Option 1: Save Contact to Device */}
                  <button
                    type="button"
                    onClick={() => {
                      if (card) downloadVCard(card);
                      setIsSaveModalOpen(false);
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
                      >
                        <UserPlus className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-slate-900">
                          {translations.saveContactOption}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {translations.saveContactDesc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>

                  {/* Option 2: Add Shortcut to Home Screen */}
                  <div className="relative w-full rounded-2xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between p-4 group">
                    <button
                      type="button"
                      onClick={() => {
                        if (deviceType === 'ios') {
                          setDeviceType('ios');
                          setShortcutMode('instructions');
                        } else {
                          // Android flow
                          if (deferredPrompt) {
                            deferredPrompt.prompt();
                            deferredPrompt.userChoice.then(() => {
                              setDeferredPrompt(null);
                              setIsSaveModalOpen(false);
                            });
                          } else {
                            setDeviceType('android');
                            setShortcutMode('instructions');
                          }
                        }
                      }}
                      className="flex-1 flex items-center gap-3.5 text-left cursor-pointer pr-2"
                    >
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
                      >
                        <BookmarkPlus className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">
                          {translations.addShortcutOption}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {translations.addShortcutDesc}
                        </p>
                      </div>
                    </button>

                    {/* For Android, add an explicit info icon button to view manual guide */}
                    {deviceType === 'android' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeviceType('android');
                          setShortcutMode('instructions');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer ml-1"
                        title={translations.saveModal.viewManualGuide}
                      >
                        <Info className="w-5 h-5 text-amber-500" />
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Device Instructions */
                <div className="space-y-4">
                  {/* Mobile Device Selector Tabs (iOS & Android) */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setDeviceType('ios')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceType === 'ios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      iPhone (iOS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceType('android')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        deviceType === 'android' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Android
                    </button>
                  </div>

                  {/* Step-by-step Guides */}
                  {deviceType === 'ios' && (
                    <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {translations.saveModal.iosSteps.map((stepText, idx) => (
                        <div key={`ios-step-${idx}`} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                          <p>{stepText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {deviceType === 'android' && (
                    <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {translations.saveModal.androidSteps.map((stepText, idx) => (
                        <div key={`android-step-${idx}`} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                          <p>{stepText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-xs cursor-pointer mt-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    {translations.saveModal.gotIt}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Business Multi-Links Popup Modal */}
      <AnimatePresence>
        {activeMultiLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMultiLinkModal(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
              className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 shadow-2xl border border-white/20 z-10 text-white overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${themeColor} 0%, #080c14 100%)`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 border border-white/20 text-white shrink-0 shadow-inner [&_svg]:w-5 [&_svg]:h-5">
                    {activeMultiLinkModal.icon}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-tight">
                      {activeMultiLinkModal.title}
                    </h3>
                    <p className="text-xs text-white/70 font-sans mt-0.5">
                      {translations.multiLinksModal?.selectOption || 'Choose an option'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMultiLinkModal(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
                  aria-label={translations.multiLinksModal?.close || 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List of multi-link option buttons */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {activeMultiLinkModal.items.map((item, i) => (
                  <motion.a
                    key={`${item.url}-${i}`}
                    href={item.url}
                    target={['whatsapp', 'website', 'instagram', 'facebook', 'tiktok', 'snapchat', 'linkedin', 'twitter', 'youtube', 'address'].includes(activeMultiLinkModal.key) ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackAction(activeMultiLinkModal.key, item.label);
                      if (!item.url.startsWith('tel:') && !item.url.startsWith('mailto:')) {
                        setActiveMultiLinkModal(null);
                      }
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative w-full py-3.5 sm:py-4 px-10 sm:px-12 rounded-full flex items-center justify-center text-white transition-all duration-200 ${businessButtonHoverClass} ${businessButtonShadowClass} cursor-pointer min-h-[54px]`}
                    style={businessRowButtonStyle}
                  >
                    {/* Un-boxed icon on the left */}
                    <div className="absolute left-4 sm:left-5 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 [&_svg]:w-5 [&_svg]:h-5">
                      {activeMultiLinkModal.icon}
                    </div>
                    <span className="font-bold text-sm sm:text-base text-white tracking-wide text-center truncate px-4">
                      {item.label}
                    </span>
                    <ArrowUpRight className="absolute right-4 sm:right-5 w-4 h-4 sm:w-5 sm:h-5 text-white/80 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </motion.a>
                ))}
              </div>

              {/* Close button at bottom */}
              <div className="mt-5 pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setActiveMultiLinkModal(null)}
                  className="w-full py-2.5 px-4 rounded-full font-sans font-bold text-xs tracking-wider uppercase text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
                >
                  {translations.multiLinksModal?.close || 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Contact Download Confirmation Modal */}
      <AnimatePresence>
        {showDeliveryModal && card && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xs"
                style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
              >
                <MotorcycleDeliveryIcon className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {getLocalizedRowLabel(card.delivery_label, 'delivery', currentLang)}
              </h3>

              <p className="text-sm text-slate-600 mb-4 px-1 leading-relaxed">
                {translations.deliveryModal.question(card.name)}
              </p>

              <div className="w-full bg-slate-50 rounded-2xl p-3.5 mb-5 border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-slate-400">
                  {translations.deliveryModal.contactNameLabel}
                </span>
                <span className="font-bold text-sm text-slate-800 break-all">
                  {card.name} / {getLocalizedRowLabel(card.delivery_label, 'delivery', currentLang)}
                </span>
                {card.delivery_number && (
                  <span className="text-xs font-sans font-semibold text-slate-600 mt-0.5 tracking-tight">
                    📞 {card.delivery_number}
                  </span>
                )}
              </div>

              <div className="w-full flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    downloadDeliveryVCard(card);
                    setShowDeliveryModal(false);
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  <Download className="w-4 h-4" />
                  {translations.deliveryModal.confirmDownload}
                </button>

                {card.delivery_number && (
                  <a
                    href={`tel:${card.delivery_number}`}
                    onClick={() => setShowDeliveryModal(false)}
                    className="w-full py-3 px-5 rounded-2xl text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {translations.deliveryModal.callDirectly(card.delivery_number)}
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-full py-2 px-5 rounded-2xl text-slate-500 font-semibold text-xs hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {translations.deliveryModal.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Share Card Bottom Sheet (Modal with QR Code) */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Dimmed backdrop (rgba(0,0,0,0.5)) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={translations.shareCard || "Share Card"}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                '--card-accent': cardAccent,
                background: 'rgba(15, 15, 15, 0.80)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.14)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                boxShadow: '0 -16px 40px rgba(0, 0, 0, 0.50)',
              } as React.CSSProperties}
              className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white font-sans flex flex-col items-center select-none"
            >
              {/* 1. Small drag handle at the top */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2 shrink-0 pointer-events-none" />

              {/* Title & Close (X) button */}
              <div className="w-full flex items-center justify-between mb-3.5 px-0.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {translations.shareCard || 'Share Card'}
                </h3>
                <button
                  ref={closeShareBtnRef}
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3. The QR Code: ONLY QR code, black on white rounded tile, 20px radius, 16px padding */}
              <div className="p-4 bg-white rounded-[20px] shadow-lg flex items-center justify-center shrink-0">
                <QRCodeCanvas
                  value={publicQrUrl}
                  size={168}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  marginSize={0}
                />
              </div>

              {/* 4. Small caption under QR: "Scan to open this card" */}
              <p className="text-xs text-white/60 font-medium tracking-wide mt-2.5 mb-3.5 text-center">
                {translations.scanToOpen || 'Scan to open this card'}
              </p>

              {/* Buttons (pill shape, 48px height, glass style) */}
              <div className="w-full flex flex-col gap-2 shrink-0">
                {/* 5. Copy link button (Secondary: transparent, 1px rgba(255,255,255,0.15) border) */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 hover:bg-white/[0.08]"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{translations.copied || 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>{translations.copyLink || 'Copy link'}</span>
                    </>
                  )}
                </button>

                {/* 6. Share via... button (Primary: accent color at 30% with 1px accent border) */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all cursor-pointer select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 hover:brightness-110"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--card-accent) 30%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--card-accent) 70%, transparent)',
                  }}
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>{translations.shareVia || 'Share via...'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainWrapper>
  );
}
