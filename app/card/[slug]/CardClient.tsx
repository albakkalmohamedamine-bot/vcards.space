'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCardBySlug } from '@/lib/storage';
import { BusinessCard, PrimaryActionType, BusinessLanguage } from '@/lib/types';
import { getCardTranslation } from '@/lib/translations';
import { downloadVCard, downloadDeliveryVCard } from '@/lib/vcard';
import { GoogleLogo } from '@/components/GoogleLogo';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Phone, 
  PhoneCall,
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
  Download,
  Smartphone,
  X,
  ChevronRight,
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
];

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

  const handleSaveClick = () => {
    setShortcutMode('choice');
    setIsSaveModalOpen(true);
  };

  const handleShare = async () => {
    if (!card) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: card.name || 'Digital Business Card',
      text: card.tagline ? `${card.name} - ${card.tagline}` : card.name,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing card:', err);
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
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
      case 'wifi_password': return <Wifi className={className} />;
      default: return <ExternalLink className={className} />;
    }
  };

  const getLocalizedRowLabel = (customLabel: string | undefined, key: keyof ReturnType<typeof getCardTranslation>['defaultRowLabels'], lang: BusinessLanguage = 'en') => {
    const t = getCardTranslation(lang);
    const defaultVal = t.defaultRowLabels[key];
    if (!customLabel || customLabel.trim() === '') return defaultVal;
    
    // Standard default strings across languages that should auto-translate when language is changed
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
    const cardLang = c.language || 'en';
    const t = getCardTranslation(cardLang);

    const rows: {
      id: string;
      label: string;
      icon: React.ReactNode;
      url?: string;
      onClick?: () => void;
      isRateUs?: boolean;
    }[] = [];

    if (c.menu_pdf) {
      const pdfUrl = c.menu_pdf;
      const menuLabel = getLocalizedRowLabel(c.menu_label, 'menu', cardLang);
      if (pdfUrl.startsWith('data:')) {
        rows.push({
          id: 'menu_pdf',
          label: menuLabel,
          icon: <FileText className="w-5 h-5" />,
          onClick: () => {
            try {
              const arr = pdfUrl.split(',');
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
            } catch {
              window.open(pdfUrl, '_blank');
            }
          }
        });
      } else {
        rows.push({
          id: 'menu_pdf',
          label: menuLabel,
          icon: <FileText className="w-5 h-5" />,
          url: pdfUrl,
        });
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

    if (c.instagram) {
      rows.push({
        id: 'instagram',
        label: getLocalizedRowLabel(c.instagram_label, 'instagram', cardLang),
        icon: <Instagram className="w-5 h-5" />,
        url: c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace('@', '')}`,
      });
    }

    if (c.facebook) {
      rows.push({
        id: 'facebook',
        label: getLocalizedRowLabel(c.facebook_label, 'facebook', cardLang),
        icon: <Facebook className="w-5 h-5" />,
        url: c.facebook.startsWith('http') ? c.facebook : `https://facebook.com/${c.facebook}`,
      });
    }

    if (c.tiktok) {
      rows.push({
        id: 'tiktok',
        label: getLocalizedRowLabel(c.tiktok_label, 'tiktok', cardLang),
        icon: (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.33V9.05a8.16 8.16 0 0 0 4.92 1.58V7.18a4.85 4.85 0 0 1-1-.49z"/>
          </svg>
        ),
        url: c.tiktok.startsWith('http') ? c.tiktok : `https://tiktok.com/@${c.tiktok.replace('@', '')}`,
      });
    }

    if (c.whatsapp) {
      rows.push({
        id: 'whatsapp',
        label: getLocalizedRowLabel(c.whatsapp_label, 'whatsapp', cardLang),
        icon: getActionIcon('whatsapp', 'w-5 h-5'),
        url: `https://wa.me/${c.whatsapp.replace(/\D/g, '')}`,
      });
    }

    if (c.email) {
      rows.push({
        id: 'email',
        label: getLocalizedRowLabel(c.email_label, 'email', cardLang),
        icon: <Mail className="w-5 h-5" />,
        url: `mailto:${c.email}`,
      });
    }

    if (c.address) {
      const mapsUrl = c.google_maps || `https://maps.google.com/?q=${encodeURIComponent(c.address)}`;
      rows.push({
        id: 'address',
        label: getLocalizedRowLabel(c.localisation_label, 'address', cardLang),
        icon: <MapPin className="w-5 h-5" />,
        url: mapsUrl,
      });
    }

    if (c.website) {
      rows.push({
        id: 'website',
        label: getLocalizedRowLabel(c.website_label, 'website', cardLang),
        icon: <Globe className="w-5 h-5" />,
        url: c.website.startsWith('http') ? c.website : `https://${c.website}`,
      });
    }

    if (c.phone) {
      rows.push({
        id: 'phone',
        label: getLocalizedRowLabel(c.mobile_label, 'phone', cardLang),
        icon: <Phone className="w-5 h-5" />,
        url: `tel:${c.phone}`,
      });
    }

    if (c.landline) {
      rows.push({
        id: 'landline',
        label: getLocalizedRowLabel(c.landline_label, 'landline', cardLang),
        icon: <PhoneCall className="w-5 h-5" />,
        url: `tel:${c.landline}`,
      });
    }

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
      const reviewUrl = c.review_url?.trim() || c.google_maps?.trim() || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '') || 'https://maps.google.com';
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
      return trimmed;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`;
  };

  const getActionHref = (actionType: string, value: string) => {
    if (actionType === 'address' && card) {
      return getGoogleMapsHref(card);
    }
    if (!value) return '#';
    const trimmed = value.trim();
    if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
      return '#';
    }
    switch (actionType) {
      case 'delivery_number':
      case 'phone': 
      case 'landline': return `tel:${trimmed.replace(/[^0-9+]/g, '')}`;
      case 'whatsapp': {
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        let cleanNumber = trimmed.replace(/[^0-9]/g, '');
        if (cleanNumber.startsWith('00')) {
          cleanNumber = cleanNumber.slice(2);
        }
        return cleanNumber ? `https://wa.me/${cleanNumber}` : '#';
      }
      case 'email': return `mailto:${encodeURIComponent(trimmed)}`;
      case 'address': return getGoogleMapsHref(card!);
      case 'website': return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
      case 'instagram': return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://instagram.com/${trimmed.replace('@', '')}`;
      case 'facebook': return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://facebook.com/${trimmed}`;
      case 'tiktok': return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://tiktok.com/@${trimmed.replace('@', '')}`;
      default: return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
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
  const primaryLabel = card.primary_action_label || getCardTranslation(card.language || 'en').primaryActions[card.primary_action as PrimaryActionType];

  const themeColor = card.themeColor || '#1B2A4A';
  const layout = card.layout || 'design1';

  const MainWrapper = isPreview ? 'div' : 'main';
  const CardWrapper = isPreview ? 'div' : motion.div;

  return (
    <MainWrapper className={isPreview ? "w-full h-full font-sans text-slate-900 text-left" : "min-h-screen bg-slate-50 flex flex-col justify-start items-center p-0 sm:p-6 font-sans"}>
      <CardWrapper 
        {...(!isPreview ? {
          initial: { opacity: 0, y: 24, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
        } : {})}
        className={isPreview ? "w-full bg-white rounded-[28px] overflow-hidden relative border border-slate-100 shadow-xs pb-6 text-left" : "w-full max-w-[440px] sm:max-w-[460px] bg-white sm:rounded-[36px] min-h-screen sm:min-h-0 sm:shadow-2xl overflow-hidden relative border-x sm:border border-slate-200/60 pb-6"}
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
                className="bg-black rounded-full overflow-hidden flex items-center justify-center shadow-2xl"
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: islandState === 'idle' ? 0 : islandState === 'dot' ? 24 : islandState === 'expanded' ? 220 : islandState === 'collapsed' ? 120 : 0,
                  height: islandState === 'idle' ? 0 : islandState === 'dot' ? 24 : 44,
                  opacity: islandState === 'idle' ? 0 : 1
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <AnimatePresence mode="wait">
                  {islandState === 'expanded' && (
                    <motion.div 
                      key="expanded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className="flex items-center gap-3 px-4 w-full h-full text-white"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Nfc className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium tracking-wide whitespace-nowrap">NFC Tag Read</span>
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

        {/* Top Floating Share Button */}
        <motion.button 
          type="button"
          onClick={handleShare}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer ${
            layout === 'business'
              ? 'bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border border-slate-200/80'
              : 'bg-black/20 hover:bg-black/30 backdrop-blur-md text-white border border-white/20'
          }`}
          title={getCardTranslation(card.language || 'en').shareCard || 'Share Card'}
        >
          {copied ? (
            <>
              <Check className={`w-3.5 h-3.5 shrink-0 ${layout === 'business' ? 'text-emerald-600' : 'text-emerald-300'}`} />
              <span className={layout === 'business' ? 'text-emerald-700 font-bold' : 'text-emerald-200 font-bold'}>
                {getCardTranslation(card.language || 'en').linkCopied || 'Copied!'}
              </span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>{getCardTranslation(card.language || 'en').shareCard || 'Share'}</span>
            </>
          )}
        </motion.button>

        {/* Header Cover Area */}
        {layout === 'business' ? (
          <>
            {/* Profile / Logo Area for Business on White Background */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.82, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="pt-8 sm:pt-10 flex justify-center px-6"
            >
              {(() => {
                const isCircle = (card.avatar_border_radius ?? 50) >= 45;
                return (
                  <div 
                    className="flex items-center justify-center bg-white shadow-md transition-all duration-300 overflow-hidden border-0 w-48 h-48 sm:w-56 sm:h-56"
                    style={{ 
                      backgroundColor: card.logo ? '#FFFFFF' : themeColor,
                      borderColor: 'transparent',
                      borderRadius: isCircle ? '50%' : '22%'
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
            <div className="pt-4 pb-10 px-4 sm:px-6 text-center flex flex-col min-h-[350px]">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
              >
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight break-words [overflow-wrap:anywhere]">
                  {card.name}
                </h1>
                
                {card.tagline && (
                  <p className="mt-2 text-xs sm:text-sm font-mono font-bold tracking-[0.18em] text-slate-400 uppercase break-words [overflow-wrap:anywhere]">
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
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="group relative w-full py-4 sm:py-5 px-6 flex flex-col items-center justify-center bg-transparent cursor-pointer transition-all duration-200 gap-2"
                      >
                        <span className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase mb-1">
                          {getCardTranslation(card.language || 'en').reviewUs}
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
                      </motion.a>
                    );
                  }

                  if (row.onClick) {
                    return (
                      <motion.button
                        key={row.id}
                        type="button"
                        onClick={row.onClick}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="group relative w-full py-4 sm:py-4.5 px-14 sm:px-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-md hover:shadow-slate-300/40 cursor-pointer border border-white/10 min-h-[58px] sm:min-h-[62px]"
                        style={{ backgroundColor: themeColor }}
                      >
                        <div className="absolute left-3.5 sm:left-4 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-xs text-white shrink-0 transition-transform duration-200 group-hover:scale-105 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-5.5 sm:[&_svg]:h-5.5">
                          {row.icon}
                        </div>
                        <span className="font-bold text-base sm:text-lg text-white tracking-wide text-center truncate">
                          {row.label}
                        </span>
                        <ArrowUpRight className="absolute right-4 sm:right-5 w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </motion.button>
                    );
                  }

                  return (
                    <motion.a
                      key={row.id}
                      href={row.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="group relative w-full py-4 sm:py-4.5 px-14 sm:px-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-md hover:shadow-slate-300/40 cursor-pointer border border-white/10 min-h-[58px] sm:min-h-[62px]"
                      style={{ backgroundColor: themeColor }}
                    >
                      <div className="absolute left-3.5 sm:left-4 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-xs text-white shrink-0 transition-transform duration-200 group-hover:scale-105 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-5.5 sm:[&_svg]:h-5.5">
                        {row.icon}
                      </div>
                      <span className="font-bold text-base sm:text-lg text-white tracking-wide text-center truncate">
                        {row.label}
                      </span>
                      <ArrowUpRight className="absolute right-4 sm:right-5 w-5 h-5 text-white/80 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-2xs"
                  style={{ 
                    borderColor: themeColor,
                    color: themeColor,
                    backgroundColor: `${themeColor}08`
                  }}
                  onClick={handleSaveClick}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="tracking-wide text-xs truncate">{getCardTranslation(card.language || 'en').saveContact}</span>
                </button>
              </motion.div>
            </div>
          </>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-32 sm:h-36 w-full relative transition-all duration-300" 
              style={{ backgroundColor: themeColor }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.4),_transparent_60%)]" />
              
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
              
              <h1 className="font-serif text-3xl font-extrabold text-slate-900 tracking-tight leading-tight break-words [overflow-wrap:anywhere]">
                {card.name}
              </h1>
              
              {card.tagline && (
                <p className="mt-2 text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase break-words [overflow-wrap:anywhere]">
                  {card.tagline}
                </p>
              )}

              <div className="flex justify-center items-center gap-3 my-6 select-none" aria-hidden="true">
                <div className="h-[1px] w-8 bg-slate-100" />
                <span className="text-[10px] font-mono tracking-widest text-slate-300">✦</span>
                <div className="h-[1px] w-8 bg-slate-100" />
              </div>

              {card.address && (
                <p className="text-sm text-slate-500 mb-8 px-4 leading-relaxed max-w-[280px] mx-auto whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {card.address}
                </p>
              )}

              <div className="mt-auto space-y-3">
                {card[card.primary_action] && (
                  <a 
                    href={primaryHref}
                    target={['whatsapp', 'website', 'instagram', 'facebook', 'tiktok', 'address'].includes(card.primary_action) ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                    style={{ 
                      backgroundColor: themeColor,
                      boxShadow: `0 8px 24px -6px ${themeColor}50`
                    }}
                  >
                    {getActionIcon(card.primary_action, 'w-5 h-5')}
                    <span className="tracking-wide text-sm">{primaryLabel}</span>
                  </a>
                )}

                <button 
                  type="button"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold border-2 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                  style={{ 
                    borderColor: themeColor,
                    color: themeColor,
                    backgroundColor: `${themeColor}05`
                  }}
                  onClick={handleSaveClick}
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="tracking-wide text-xs sm:text-sm truncate">{getCardTranslation(card.language || 'en').saveContact}</span>
                </button>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-8">
                <p className="text-sm sm:text-[15px] font-extrabold font-mono tracking-[0.2em] text-slate-600 uppercase mb-8 select-none text-center">
                  {getCardTranslation(card.language || 'en').connectWithUs}
                </p>
                
                <div className="grid grid-cols-3 gap-y-7 gap-x-2 justify-items-center max-w-[320px] mx-auto">
                  {(() => {
                    const secondaryActions = ['phone', 'landline', 'whatsapp', 'email', 'address', 'website', 'instagram', 'facebook', 'tiktok', 'wifi_password', 'delivery_number']
                      .filter(k => {
                        if (k === 'delivery_number') {
                          return card.delivery_enabled && Boolean(card.delivery_number);
                        }
                        return k !== card.primary_action && Boolean(card[k as keyof typeof card]);
                      });

                    if (secondaryActions.length > 0) {
                      const translations = getCardTranslation(card.language || 'en');
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

                        if (actionKey === 'wifi_password') {
                          return (
                            <button
                              key={actionKey}
                              type="button"
                              onClick={async () => {
                                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                  try {
                                    await navigator.clipboard.writeText(card.wifi_password || '');
                                  } catch (err) {
                                    console.error('Failed to copy WiFi password:', err);
                                  }
                                }
                                setCopiedWifi(true);
                                setTimeout(() => setCopiedWifi(false), 2000);
                              }}
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
                                {copiedWifi ? <Check className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                              </div>
                              <span className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide mt-2.5 uppercase transition-colors group-hover:text-slate-900 text-center truncate w-full">
                                {copiedWifi ? 'Copied!' : (card.wifi_password_label || 'WiFi')}
                              </span>
                            </button>
                          );
                        }

                        return (
                          <a 
                            key={actionKey}
                            href={getActionHref(actionKey, card[actionKey as keyof typeof card] as string)}
                            target={['whatsapp', 'website', 'instagram', 'facebook', 'tiktok', 'address'].includes(actionKey) ? "_blank" : undefined}
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
                      href={card.review_url?.trim() || card.google_maps?.trim() || (card.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}` : '') || 'https://maps.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-full max-w-[280px] py-4 px-5 bg-transparent flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                    >
                      <span className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase mb-1">
                        {getCardTranslation(card.language || 'en').reviewUs}
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
                        ? getCardTranslation(card?.language || 'en').saveModal.title 
                        : getCardTranslation(card?.language || 'en').saveModal.addShortcutTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {shortcutMode === 'choice' 
                        ? getCardTranslation(card?.language || 'en').saveModal.subtitle 
                        : getCardTranslation(card?.language || 'en').saveModal.addShortcutSubtitle}
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
                          {getCardTranslation(card?.language || 'en').saveContactOption}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {getCardTranslation(card?.language || 'en').saveContactDesc}
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
                          {getCardTranslation(card?.language || 'en').addShortcutOption}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {getCardTranslation(card?.language || 'en').addShortcutDesc}
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
                        title={getCardTranslation(card?.language || 'en').saveModal.viewManualGuide}
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
                      {getCardTranslation(card?.language || 'en').saveModal.iosSteps.map((stepText, idx) => (
                        <div key={`ios-step-${idx}`} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                          <p>{stepText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {deviceType === 'android' && (
                    <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {getCardTranslation(card?.language || 'en').saveModal.androidSteps.map((stepText, idx) => (
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
                    {getCardTranslation(card?.language || 'en').saveModal.gotIt}
                  </button>
                </div>
              )}
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
                {getLocalizedRowLabel(card.delivery_label, 'delivery', card.language || 'en')}
              </h3>

              <p className="text-sm text-slate-600 mb-4 px-1 leading-relaxed">
                {getCardTranslation(card.language || 'en').deliveryModal.question(card.name)}
              </p>

              <div className="w-full bg-slate-50 rounded-2xl p-3.5 mb-5 border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                  {getCardTranslation(card.language || 'en').deliveryModal.contactNameLabel}
                </span>
                <span className="font-bold text-sm text-slate-800 break-all">
                  {card.name} / {getLocalizedRowLabel(card.delivery_label, 'delivery', card.language || 'en')}
                </span>
                {card.delivery_number && (
                  <span className="text-xs font-mono font-semibold text-slate-500 mt-0.5">
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
                  {getCardTranslation(card.language || 'en').deliveryModal.confirmDownload}
                </button>

                {card.delivery_number && (
                  <a
                    href={`tel:${card.delivery_number}`}
                    onClick={() => setShowDeliveryModal(false)}
                    className="w-full py-3 px-5 rounded-2xl text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {getCardTranslation(card.language || 'en').deliveryModal.callDirectly(card.delivery_number)}
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-full py-2 px-5 rounded-2xl text-slate-500 font-semibold text-xs hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {getCardTranslation(card.language || 'en').deliveryModal.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainWrapper>
  );
}
