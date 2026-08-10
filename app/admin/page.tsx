'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCards, saveCard, updateCard, deleteCard, slugify } from '@/lib/storage';
import { getSession, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PrimaryActionType, BusinessCard, BusinessLanguage, CardLayout } from '@/lib/types';
import CardClient from '@/app/card/[slug]/CardClient';
import { AdminQRCodeGenerator } from '@/components/AdminQRCodeGenerator';
import { GoogleLogo } from '@/components/GoogleLogo';
import { ColorSwatch, ExtractedColors, extractColorsFromImage, getBestContrastSwatch, compressLogoImage } from '@/lib/colorExtractor';
import { COUNTRY_CODES, parsePhoneNumber, formatFullPhoneNumber, DEFAULT_COUNTRY } from '@/lib/countryCodes';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Globe, 
  Instagram, 
  Facebook, 
  Plus, 
  Eye, 
  Check, 
  Copy, 
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Edit,
  User,
  UserPlus,
  Share2,
  Building2,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Upload,
  PhoneCall,
  Star,
  Wifi,
  Truck,
  LogOut
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

const ACTION_OPTIONS: { value: PrimaryActionType; label: string }[] = [
  { value: 'website', label: 'Visit Website' },
  { value: 'whatsapp', label: 'WhatsApp Chat' },
  { value: 'phone', label: 'Direct Mobile Call' },
  { value: 'landline', label: 'Direct Landline Call (Fixe)' },
  { value: 'address', label: 'Google Maps Address' },
  { value: 'email', label: 'Send Email' },
  { value: 'instagram', label: 'Instagram Profile' },
  { value: 'facebook', label: 'Facebook Connection' },
  { value: 'tiktok', label: 'TikTok Profile' },
  { value: 'snapchat', label: 'Snapchat Profile' },
  { value: 'linkedin', label: 'LinkedIn Profile' },
  { value: 'twitter', label: 'X (Twitter) Profile' },
  { value: 'youtube', label: 'YouTube Channel' },
];

const InlineFieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50/90 border border-red-200/90 px-3 py-1.5 rounded-xl font-medium shadow-2xs"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
      <span>{message}</span>
    </motion.div>
  );
};

const getActionIcon = (type: string, className = 'w-5 h-5') => {
  switch (type) {
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
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.33V9.05a8.16 8.16 0 0 0 4.92 1.58V7.18a4.85 4.85 0 0 1-1-.05z"/>
      </svg>
    );
    case 'snapchat': return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
      </svg>
    );
    case 'linkedin': return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z" />
      </svg>
    );
    case 'x':
    case 'twitter': return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
    case 'youtube': return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
    default: return <Plus className={className} />;
  }
};

async function fetchAsDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Failed to fetch image as data URL:', err);
  }
  return url;
}

export default function AdminPage() {
  const router = useRouter();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [allCards, setAllCards] = useState<BusinessCard[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cardToConfirm, setCardToConfirm] = useState<BusinessCard | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTypePickerModal, setShowTypePickerModal] = useState(false);
  const [pickerStep, setPickerStep] = useState<'top' | 'professional_sub'>('top');
  
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    themeColor: '#1B2A4A',
    logo: '',
    cover_photo_url: '',
    language: 'en' as BusinessLanguage,
    layout: 'design1' as CardLayout,
    phone: '',
    landline: '',
    whatsapp: '',
    email: '',
    address: '',
    address_type: 'address' as 'address' | 'text',
    google_maps: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    snapchat: '',
    linkedin: '',
    twitter: '',
    youtube: '',
    website: '',
    primary_action: 'website' as PrimaryActionType,
    primary_action_label: '',
    avatar_border_radius: 50,
    
    // Business layout specific fields
    menu_pdf: '',
    menu_pdf_name: '',
    menu_label: 'Our Menu',
    wifi_password: '',
    wifi_password_label: 'WiFi Password',
    instagram_label: 'Instagram',
    facebook_label: 'Facebook',
    tiktok_label: 'TikTok',
    snapchat_label: 'Snapchat',
    linkedin_label: 'LinkedIn',
    twitter_label: 'X (Twitter)',
    youtube_label: 'YouTube',
    whatsapp_label: 'WhatsApp',
    email_label: 'Email',
    localisation_label: 'Location',
    website_label: 'Website',
    mobile_label: 'Call Us',
    landline_label: 'Office Line',
    qr_logo_enabled: true,
    rate_us_enabled: true,
    review_url: '',
    rate_us_label: 'Rate Us / Leave 5 Stars',
    delivery_enabled: false,
    delivery_number: '',
    delivery_label: 'Delivery',
    first_priority_field: '',
    quick_action_1: '',
    quick_action_2: '',
    quick_action_3: '',
  });

  const [phoneCode, setPhoneCode] = useState<string>(DEFAULT_COUNTRY.dialCode);
  const [landlineCode, setLandlineCode] = useState<string>(DEFAULT_COUNTRY.dialCode);
  const [whatsappCode, setWhatsappCode] = useState<string>(DEFAULT_COUNTRY.dialCode);

  const selectedPhoneCountry = COUNTRY_CODES.find(c => c.dialCode === phoneCode) || DEFAULT_COUNTRY;
  const selectedLandlineCountry = COUNTRY_CODES.find(c => c.dialCode === landlineCode) || DEFAULT_COUNTRY;
  const selectedWhatsappCountry = COUNTRY_CODES.find(c => c.dialCode === whatsappCode) || DEFAULT_COUNTRY;

  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successCard, setSuccessCard] = useState<BusinessCard | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  const [extractedColors, setExtractedColors] = useState<ExtractedColors | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [logoFileInfo, setLogoFileInfo] = useState<{
    name: string;
    sizeFormatted: string;
    width: number;
    height: number;
    format: string;
    isSvg: boolean;
    isLowRes: boolean;
  } | null>(null);

  // Cropping states
  const MAX_ZOOM = 2.2;
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'logo' | 'photo'>('logo');
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // PDF Upload state
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [pdfFileInfo, setPdfFileInfo] = useState<{ name: string; sizeFormatted: string } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError(null);

    // Accept only .pdf files
    const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfType) {
      setPdfError('Please select a valid PDF document (.pdf file).');
      e.target.value = '';
      return;
    }

    // Max size limit of 10MB
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setPdfError(`Selected file is ${sizeMb}MB, exceeding the 10MB limit. Please re-scan or compress your PDF before uploading.`);
      e.target.value = '';
      return;
    }

    const sizeFormatted = file.size < 1024 * 1024 
      ? `${Math.round(file.size / 1024)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setIsUploadingPdf(true);
    setPdfUploadProgress(25);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.max(25, Math.round((event.loaded / event.total) * 100)));
        setPdfUploadProgress(percent);
      }
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPdfUploadProgress(100);
      setForm(prev => ({
        ...prev,
        menu_pdf: dataUrl,
        menu_pdf_name: file.name
      }));
      setPdfFileInfo({
        name: file.name,
        sizeFormatted
      });
      setIsUploadingPdf(false);
    };

    reader.onerror = () => {
      setPdfError('Failed to read PDF file. Please try selecting the file again.');
      setIsUploadingPdf(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    if (form.menu_pdf && form.menu_pdf.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(form.menu_pdf);
      } catch (err) {
        console.warn('Revoke object URL error:', err);
      }
    }
    setForm(prev => ({ ...prev, menu_pdf: '', menu_pdf_name: '' }));
    setPdfFileInfo(null);
    setPdfError(null);
  };

  const [copiedNfcUrl, setCopiedNfcUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);

  const hasEnteredFields = () => {
    if (editingSlug) return false;

    const textFields: (keyof typeof form)[] = [
      'name', 'tagline', 'phone', 'landline', 'whatsapp', 'email', 
      'address', 'instagram', 'facebook', 'tiktok', 'website', 'logo'
    ];
    
    const hasFormValue = textFields.some(key => {
      const val = form[key];
      return typeof val === 'string' && val.trim() !== '';
    });

    const hasSlugValue = slug && slug.trim() !== '';

    return hasFormValue || hasSlugValue;
  };

  const handleHomeNavigation = () => {
    if (hasEnteredFields()) {
      setShowLeaveConfirmModal(true);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeAdminPage() {
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        if (!isMounted) return;
        setIsAuthenticated(true);

        const cards = await getCards();
        if (!isMounted) return;
        setAllCards(cards);
        setExistingSlugs(cards.map((c) => c.slug));

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const editParam = params.get('edit');

          const savedDraftStr = localStorage.getItem('vcard_admin_draft');
          let restored = false;

          if (savedDraftStr) {
            try {
              const draft = JSON.parse(savedDraftStr);
              if (
                (editParam && draft.editingSlug === editParam) ||
                (!editParam && !draft.editingSlug)
              ) {
                setForm(draft.form);
                setSlug(draft.slug || '');
                setEditingSlug(draft.editingSlug || null);
                if (draft.phoneCode) setPhoneCode(draft.phoneCode);
                if (draft.landlineCode) setLandlineCode(draft.landlineCode);
                if (draft.whatsappCode) setWhatsappCode(draft.whatsappCode);
                if (draft.extractedColors) {
                  setExtractedColors(draft.extractedColors);
                }
                setIsDraftRestored(true);
                restored = true;
              }
            } catch (e) {
              console.error('Failed to parse draft from localStorage', e);
            }
          }

          if (!restored && editParam) {
            const cardToEdit = cards.find((c) => c.slug === editParam);
            if (cardToEdit) {
              const parsedPhone = parsePhoneNumber(cardToEdit.phone || '');
              const parsedLandline = parsePhoneNumber(cardToEdit.landline || '');
              const parsedWhatsapp = parsePhoneNumber(cardToEdit.whatsapp || '');
              setEditingSlug(editParam);
              setPhoneCode(parsedPhone.dialCode);
              setLandlineCode(parsedLandline.dialCode);
              setWhatsappCode(parsedWhatsapp.dialCode);
              setForm({
                name: cardToEdit.name,
                tagline: cardToEdit.tagline || '',
                themeColor: cardToEdit.themeColor,
                logo: cardToEdit.logo || '',
                cover_photo_url: cardToEdit.cover_photo_url || '',
                language: cardToEdit.language || 'en',
                layout: cardToEdit.layout || 'design1',
                phone: parsedPhone.localNumber,
                landline: parsedLandline.localNumber,
                whatsapp: parsedWhatsapp.localNumber,
                email: cardToEdit.email || '',
                address: cardToEdit.address || '',
                address_type: cardToEdit.address_type || 'address',
                google_maps: cardToEdit.google_maps || '',
                instagram: cardToEdit.instagram || '',
                facebook: cardToEdit.facebook || '',
                tiktok: cardToEdit.tiktok || '',
                snapchat: cardToEdit.snapchat || '',
                linkedin: cardToEdit.linkedin || '',
                twitter: cardToEdit.twitter || '',
                youtube: cardToEdit.youtube || '',
                website: cardToEdit.website || '',
                primary_action: cardToEdit.primary_action || 'website',
                primary_action_label: cardToEdit.primary_action_label || '',
                avatar_border_radius: cardToEdit.avatar_border_radius ?? 50,
                menu_pdf: cardToEdit.menu_pdf || '',
                menu_pdf_name: cardToEdit.menu_pdf_name || '',
                menu_label: cardToEdit.menu_label || 'Our Menu',
                wifi_password: cardToEdit.wifi_password || '',
                wifi_password_label: cardToEdit.wifi_password_label || 'WiFi Password',
                instagram_label: cardToEdit.instagram_label || 'Instagram',
                facebook_label: cardToEdit.facebook_label || 'Facebook',
                tiktok_label: cardToEdit.tiktok_label || 'TikTok',
                snapchat_label: cardToEdit.snapchat_label || 'Snapchat',
                linkedin_label: cardToEdit.linkedin_label || 'LinkedIn',
                twitter_label: cardToEdit.twitter_label || 'X (Twitter)',
                youtube_label: cardToEdit.youtube_label || 'YouTube',
                whatsapp_label: cardToEdit.whatsapp_label || 'WhatsApp',
                email_label: cardToEdit.email_label || 'Email',
                localisation_label: cardToEdit.localisation_label || 'Location',
                website_label: cardToEdit.website_label || 'Website',
                mobile_label: cardToEdit.mobile_label || 'Call Us',
                landline_label: cardToEdit.landline_label || 'Office Line',
                qr_logo_enabled: cardToEdit.qr_logo_enabled ?? true,
                rate_us_enabled: cardToEdit.rate_us_enabled ?? true,
                review_url: cardToEdit.review_url || '',
                rate_us_label: cardToEdit.rate_us_label || 'Rate Us / Leave 5 Stars',
                delivery_enabled: cardToEdit.delivery_enabled ?? false,
                delivery_number: cardToEdit.delivery_number || '',
                delivery_label: cardToEdit.delivery_label || 'Delivery',
                first_priority_field: cardToEdit.first_priority_field || '',
                quick_action_1: cardToEdit.quick_action_1 || '',
                quick_action_2: cardToEdit.quick_action_2 || '',
                quick_action_3: cardToEdit.quick_action_3 || '',
              });
              setSlug(cardToEdit.slug);
            }
          } else if (!restored) {
            setEditingSlug(null);
            setSlug('');
            setPhoneCode(DEFAULT_COUNTRY.dialCode);
            setLandlineCode(DEFAULT_COUNTRY.dialCode);
            setWhatsappCode(DEFAULT_COUNTRY.dialCode);
            setShowTypePickerModal(true);
            setPickerStep('top');
          }
          if (params.get('new') === 'true') {
            setShowTypePickerModal(true);
            setPickerStep('top');
          }
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("Error initializing admin page:", err);
      }
    }

    initializeAdminPage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      const isDefaultForm =
        form.name === '' &&
        form.tagline === '' &&
        form.themeColor === '#1B2A4A' &&
        form.logo === '' &&
        form.language === 'en' &&
        form.layout === 'design1' &&
        form.phone === '' &&
        form.landline === '' &&
        form.whatsapp === '' &&
        form.email === '' &&
        form.address === '' &&
        form.instagram === '' &&
        form.facebook === '' &&
        form.tiktok === '' &&
        (form.snapchat || '') === '' &&
        (form.linkedin || '') === '' &&
        (form.twitter || '') === '' &&
        (form.youtube || '') === '' &&
        form.website === '' &&
        form.primary_action === 'website' &&
        form.primary_action_label === '' &&
        (form.first_priority_field || '') === '' &&
        slug === '' &&
        phoneCode === DEFAULT_COUNTRY.dialCode &&
        landlineCode === DEFAULT_COUNTRY.dialCode &&
        whatsappCode === DEFAULT_COUNTRY.dialCode;

      if (isDefaultForm) {
        try {
          localStorage.removeItem('vcard_admin_draft');
        } catch {
          // ignore
        }
      } else {
        const draft = {
          form,
          slug,
          editingSlug,
          extractedColors,
          phoneCode,
          landlineCode,
          whatsappCode,
        };
        try {
          localStorage.setItem('vcard_admin_draft', JSON.stringify(draft));
        } catch {
          try {
            const lightDraft = {
              ...draft,
              form: {
                ...draft.form,
                menu_pdf: draft.form.menu_pdf && draft.form.menu_pdf.length > 50000 ? '' : draft.form.menu_pdf,
                logo: draft.form.logo && draft.form.logo.length > 50000 ? '' : draft.form.logo,
              },
            };
            localStorage.setItem('vcard_admin_draft', JSON.stringify(lightDraft));
          } catch (err) {
            console.warn('Could not save draft to localStorage due to quota limit:', err);
          }
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form, slug, editingSlug, extractedColors, phoneCode, landlineCode, whatsappCode, isInitialized]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem('vcard_admin_draft');
    } catch {
      // ignore
    }
    setIsDraftRestored(false);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editParam = params.get('edit');
      if (editParam) {
        getCards().then(cards => {
          setAllCards(cards);
          const cardToEdit = cards.find(c => c.slug === editParam);
          if (cardToEdit) {
            const parsedPhone = parsePhoneNumber(cardToEdit.phone || '');
            const parsedLandline = parsePhoneNumber(cardToEdit.landline || '');
            const parsedWhatsapp = parsePhoneNumber(cardToEdit.whatsapp || '');
            setPhoneCode(parsedPhone.dialCode);
            setLandlineCode(parsedLandline.dialCode);
            setWhatsappCode(parsedWhatsapp.dialCode);
            setForm({
              name: cardToEdit.name,
              tagline: cardToEdit.tagline || '',
              themeColor: cardToEdit.themeColor,
              logo: cardToEdit.logo || '',
              cover_photo_url: cardToEdit.cover_photo_url || '',
              language: cardToEdit.language || 'en',
              layout: cardToEdit.layout || 'design1',
              phone: parsedPhone.localNumber,
              landline: parsedLandline.localNumber,
              whatsapp: parsedWhatsapp.localNumber,
              email: cardToEdit.email || '',
              address: cardToEdit.address || '',
              address_type: cardToEdit.address_type || 'address',
              google_maps: cardToEdit.google_maps || '',
              instagram: cardToEdit.instagram || '',
              facebook: cardToEdit.facebook || '',
              tiktok: cardToEdit.tiktok || '',
              snapchat: cardToEdit.snapchat || '',
              linkedin: cardToEdit.linkedin || '',
              twitter: cardToEdit.twitter || '',
              youtube: cardToEdit.youtube || '',
              website: cardToEdit.website || '',
              primary_action: cardToEdit.primary_action || 'website',
              primary_action_label: cardToEdit.primary_action_label || '',
              avatar_border_radius: cardToEdit.avatar_border_radius ?? 50,
              menu_pdf: cardToEdit.menu_pdf || '',
              menu_pdf_name: cardToEdit.menu_pdf_name || '',
              menu_label: cardToEdit.menu_label || '',
              wifi_password: cardToEdit.wifi_password || '',
              wifi_password_label: cardToEdit.wifi_password_label || '',
              instagram_label: cardToEdit.instagram_label || '',
              facebook_label: cardToEdit.facebook_label || '',
              tiktok_label: cardToEdit.tiktok_label || '',
              snapchat_label: cardToEdit.snapchat_label || '',
              linkedin_label: cardToEdit.linkedin_label || '',
              twitter_label: cardToEdit.twitter_label || '',
              youtube_label: cardToEdit.youtube_label || '',
              whatsapp_label: cardToEdit.whatsapp_label || '',
              email_label: cardToEdit.email_label || '',
              localisation_label: cardToEdit.localisation_label || '',
              website_label: cardToEdit.website_label || '',
              mobile_label: cardToEdit.mobile_label || '',
              landline_label: cardToEdit.landline_label || '',
              qr_logo_enabled: cardToEdit.qr_logo_enabled ?? true,
              rate_us_enabled: cardToEdit.rate_us_enabled ?? true,
              review_url: cardToEdit.review_url || '',
              rate_us_label: cardToEdit.rate_us_label || 'Rate Us / Leave 5 Stars',
              delivery_enabled: cardToEdit.delivery_enabled ?? false,
              delivery_number: cardToEdit.delivery_number || '',
              delivery_label: cardToEdit.delivery_label || 'Delivery',
              first_priority_field: cardToEdit.first_priority_field || '',
              quick_action_1: cardToEdit.quick_action_1 || '',
              quick_action_2: cardToEdit.quick_action_2 || '',
              quick_action_3: cardToEdit.quick_action_3 || '',
            });
            setSlug(cardToEdit.slug);
          }
        });
      } else {
        setForm({
          name: '',
          tagline: '',
          themeColor: '#1B2A4A',
          logo: '',
          cover_photo_url: '',
          language: 'en',
          layout: 'design1',
          phone: '',
          landline: '',
          whatsapp: '',
          email: '',
          address: '',
          address_type: 'address',
          google_maps: '',
          instagram: '',
          facebook: '',
          tiktok: '',
          snapchat: '',
          linkedin: '',
          twitter: '',
          youtube: '',
          website: '',
          primary_action: 'website',
          primary_action_label: '',
          avatar_border_radius: 50,
          menu_pdf: '',
          menu_pdf_name: '',
          menu_label: '',
          wifi_password: '',
          wifi_password_label: '',
          instagram_label: '',
          facebook_label: '',
          tiktok_label: '',
          snapchat_label: '',
          linkedin_label: '',
          twitter_label: '',
          youtube_label: '',
          whatsapp_label: '',
          email_label: '',
          localisation_label: '',
          website_label: '',
          mobile_label: '',
          landline_label: '',
          qr_logo_enabled: true,
          rate_us_enabled: true,
          review_url: '',
          rate_us_label: 'Rate Us / Leave 5 Stars',
          delivery_enabled: false,
          delivery_number: '',
          delivery_label: 'Delivery',
          first_priority_field: '',
          quick_action_1: '',
          quick_action_2: '',
          quick_action_3: '',
        });
        setEditingSlug(null);
        setSlug('');

        setExtractedColors(null);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clear error for this field as user types
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });

    if (name === 'phone' || name === 'whatsapp') {
      if (value.startsWith('+')) {
        const parsed = parsePhoneNumber(value);
        if (name === 'phone') setPhoneCode(parsed.dialCode);
        if (name === 'whatsapp') setWhatsappCode(parsed.dialCode);
        setForm(prev => ({ ...prev, [name]: parsed.localNumber }));
      } else {
        let local = value.replace(/[^\d]/g, '');
        if (local.length > 1 && local.startsWith('0')) {
          local = local.replace(/^0+/, '');
        }
        setForm(prev => ({ ...prev, [name]: local }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    // Real-time inline field validation checks
    if (name === 'name' && value.trim().length > 100) {
      setFieldErrors(prev => ({ ...prev, name: 'Business Name must be 100 characters or less.' }));
    } else if (name === 'tagline' && value.trim().length > 200) {
      setFieldErrors(prev => ({ ...prev, tagline: 'Tagline must be 200 characters or less.' }));
    } else if (name === 'email' && value.trim() && !isValidEmail(value.trim())) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g. name@domain.com).' }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlug(val);

    const formattedSlug = slugify(val);
    const isTaken = editingSlug
      ? (formattedSlug !== editingSlug && existingSlugs.includes(formattedSlug))
      : existingSlugs.includes(formattedSlug);

    setFieldErrors(prev => {
      const copy = { ...prev };
      if (!val.trim()) {
        copy.slug = 'URL Slug is required.';
      } else if (isTaken) {
        copy.slug = 'This URL slug is already taken by another card.';
      } else if (formattedSlug.length > 60) {
        copy.slug = 'URL slug must be 60 characters or less.';
      } else {
        delete copy.slug;
      }
      return copy;
    });
  };

  const validateAndReadImage = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const msg = 'Unsupported file format. Please upload a PNG, WEBP, SVG, or JPG image.';
      setFieldErrors(prev => ({ ...prev, logo: msg }));
      setError(msg);
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      const msg = `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of 5.0 MB.`;
      setFieldErrors(prev => ({ ...prev, logo: msg }));
      setError(msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const isSvg = file.type.includes('svg');
        const isLowRes = !isSvg && (width < 200 || height < 200);

        const formatExt = file.name.split('.').pop()?.toUpperCase() || (isSvg ? 'SVG' : 'PNG');
        const sizeFormatted = file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        setLogoFileInfo({
          name: file.name,
          sizeFormatted,
          width,
          height,
          format: formatExt,
          isSvg,
          isLowRes,
        });

        if (isLowRes) {
          setFieldErrors(prev => ({
            ...prev,
            logo: `Image resolution (${width}×${height}px) is below minimum recommendation (200×200px). Upload a higher resolution image for crisp Retina display quality.`,
          }));
        } else {
          setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy.logo;
            return copy;
          });
          setError(null);
        }

        setCropTarget('logo');
        setCropImageSrc(dataUrl);
      };

      img.onerror = () => {
        const msg = 'Corrupted or unreadable image file. Please choose a valid image.';
        setFieldErrors(prev => ({ ...prev, logo: msg }));
        setError(msg);
      };

      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndReadImage(file);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        const compressed = await compressLogoImage(rawDataUrl, 1200, 800);
        setForm(prev => ({ ...prev, cover_photo_url: compressed }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setForm(prev => ({ ...prev, cover_photo_url: '' }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDropLogo = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      validateAndReadImage(file);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    
    let w = 256;
    let h = 256;
    if (ratio > 1) {
      w = 256 * ratio;
    } else {
      h = 256 / ratio;
    }
    setImgDimensions({ width: w, height: h });
    setOffset({ x: (256 - w) / 2, y: (256 - h) / 2 });
    setZoom(1);
  };

  const handleResetCrop = () => {
    const w = imgDimensions.width;
    const h = imgDimensions.height;
    if (w && h) {
      setOffset({ x: (256 - w) / 2, y: (256 - h) / 2 });
    } else {
      setOffset({ x: 0, y: 0 });
    }
    setZoom(1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    setZoom(prev => {
      const nextZoom = prev + direction * zoomFactor;
      return Math.min(MAX_ZOOM, Math.max(0.5, Number(nextZoom.toFixed(2))));
    });
  };

  const handleApplyCrop = () => {
    if (!cropImageSrc) return;

    if (cropImageSrc.startsWith('data:image/svg+xml')) {
      setIsExtracting(true);
      (async () => {
        try {
          setForm(prev => ({ ...prev, logo: cropImageSrc }));
          const colors = await extractColorsFromImage(cropImageSrc);
          setExtractedColors(colors);
          const bestSwatch = getBestContrastSwatch(colors);
          if (bestSwatch) {
            setForm(prev => ({ ...prev, themeColor: bestSwatch.hex }));
          }
        } catch (err) {
          console.error('Error processing SVG logo:', err);
        } finally {
          setIsExtracting(false);
          setCropImageSrc(null);
        }
      })();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const EXPORT_SIZE = 800; // 800x800 HD resolution for 4K / Retina displays
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas so PNG/WEBP transparency is retained without solid white background fill
      ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

      // Smooth bicubic resampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 200px is the crop inner circle size in preview, scale factor = 800 / 200 = 4.0
      const scaleFactor = EXPORT_SIZE / 200;
      const dx = (offset.x - 28) * scaleFactor;
      const dy = (offset.y - 28) * scaleFactor;
      const dWidth = imgDimensions.width * zoom * scaleFactor;
      const dHeight = imgDimensions.height * zoom * scaleFactor;

      ctx.drawImage(img, dx, dy, dWidth, dHeight);

      // Export as PNG or WebP with alpha channel preserved, safely handling tainted canvas
      let croppedDataUrl = cropImageSrc;
      try {
        let exportResult = canvas.toDataURL('image/png');
        try {
          const webpData = canvas.toDataURL('image/webp', 0.95);
          if (webpData.startsWith('data:image/webp')) {
            exportResult = webpData;
          }
        } catch {
          // Fallback to PNG
        }
        croppedDataUrl = exportResult;
      } catch (err) {
        console.warn('Canvas export failed (possibly tainted canvas), using original source:', err);
      }

      setIsExtracting(true);
      try {
        const compressedLogo = await compressLogoImage(croppedDataUrl, 800, 800);
        setForm(prev => ({ ...prev, logo: compressedLogo }));

        const colors = await extractColorsFromImage(compressedLogo);
        setExtractedColors(colors);

        const bestSwatch = getBestContrastSwatch(colors);
        if (bestSwatch) {
          setForm(prev => ({ ...prev, themeColor: bestSwatch.hex }));
        }
      } catch (err) {
        console.error('Error compressing/extracting colors:', err);
      } finally {
        setIsExtracting(false);
        setCropImageSrc(null);
      }
    };
    img.onerror = () => {
      console.warn('Could not load image into canvas for cropping.');
      setCropImageSrc(null);
    };
    img.src = cropImageSrc;
  };

  const handleCancelCrop = () => {
    setCropImageSrc(null);
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logo: '' }));
    setLogoFileInfo(null);
    setExtractedColors(null);
    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy.logo;
      return copy;
    });
  };

  const sanitizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      return '';
    }
    return trimmed;
  };

  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const scrollToField = (fieldKey: string) => {
    const possibleIds = [
      `${fieldKey}-input`,
      `${fieldKey}-select`,
      `${fieldKey}-upload`,
      `${fieldKey}-field`,
      `${fieldKey}-section`,
      `${fieldKey.replace(/_/g, '-')}-input`,
      `${fieldKey.replace(/_/g, '-')}-select`,
      `${fieldKey.replace(/_/g, '-')}-upload`,
      `${fieldKey.replace(/_/g, '-')}-field`,
      fieldKey,
    ];

    for (const id of possibleIds) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
          if ('focus' in el && typeof el.focus === 'function') {
            el.focus();
          }
        } catch {
          // ignore focus error
        }
        el.classList.add('ring-4', 'ring-red-500/60', 'border-red-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-red-500/60');
        }, 2500);
        return true;
      }
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newFieldErrors: Record<string, string> = {};

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      newFieldErrors.name = 'Business / Card Name is required.';
    } else if (trimmedName.length > 100) {
      newFieldErrors.name = 'Business Name must be 100 characters or less.';
    }

    if (!form.logo || !form.logo.trim()) {
      newFieldErrors.logo = 'Logo is required.';
    }

    if (!form.cover_photo_url || !form.cover_photo_url.trim()) {
      newFieldErrors.cover_photo_url = 'Cover photo is required.';
    }

    if (form.tagline && form.tagline.trim().length > 200) {
      newFieldErrors.tagline = 'Tagline must be 200 characters or less.';
    }

    const trimmedEmail = form.email.trim();
    if (trimmedEmail) {
      if (!isValidEmail(trimmedEmail)) {
        newFieldErrors.email = 'Please enter a valid email address (e.g. contact@domain.com).';
      } else if (trimmedEmail.length > 100) {
        newFieldErrors.email = 'Email address must be 100 characters or less.';
      }
    }

    const cleanWebsite = sanitizeUrl(form.website);
    if (form.website.trim() && !cleanWebsite) {
      newFieldErrors.website = 'Invalid or unsafe website URL.';
    }

    const cleanInstagram = sanitizeUrl(form.instagram);
    if (form.instagram.trim() && !cleanInstagram) {
      newFieldErrors.instagram = 'Invalid or unsafe Instagram link.';
    }

    const cleanFacebook = sanitizeUrl(form.facebook);
    if (form.facebook.trim() && !cleanFacebook) {
      newFieldErrors.facebook = 'Invalid or unsafe Facebook link.';
    }

    const cleanTiktok = sanitizeUrl(form.tiktok);
    if (form.tiktok.trim() && !cleanTiktok) {
      newFieldErrors.tiktok = 'Invalid or unsafe TikTok link.';
    }

    const cleanSnapchat = sanitizeUrl(form.snapchat || '');
    if (form.snapchat && form.snapchat.trim() && !cleanSnapchat) {
      newFieldErrors.snapchat = 'Invalid or unsafe Snapchat link.';
    }

    const cleanLinkedin = sanitizeUrl(form.linkedin || '');
    if (form.linkedin && form.linkedin.trim() && !cleanLinkedin) {
      newFieldErrors.linkedin = 'Invalid or unsafe LinkedIn link.';
    }

    const cleanTwitter = sanitizeUrl(form.twitter || '');
    if (form.twitter && form.twitter.trim() && !cleanTwitter) {
      newFieldErrors.twitter = 'Invalid or unsafe X (Twitter) link.';
    }

    const cleanYoutube = sanitizeUrl(form.youtube || '');
    if (form.youtube && form.youtube.trim() && !cleanYoutube) {
      newFieldErrors.youtube = 'Invalid or unsafe YouTube link.';
    }

    const cleanGoogleMaps = sanitizeUrl(form.google_maps);
    if (form.google_maps.trim() && !cleanGoogleMaps) {
      newFieldErrors.google_maps = 'Invalid or unsafe Google Maps link.';
    }

    if (form.rate_us_enabled && form.review_url.trim()) {
      const cleanReviewUrl = sanitizeUrl(form.review_url);
      if (!cleanReviewUrl) {
        newFieldErrors.review_url = 'Invalid or unsafe Google Review URL.';
      }
    }

    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      newFieldErrors.slug = 'URL Slug is required.';
    } else {
      const finalSlug = slugify(trimmedSlug);
      if (!finalSlug || finalSlug.length > 60) {
        newFieldErrors.slug = 'Please enter a valid URL slug (max 60 characters).';
      } else {
        const isTaken = editingSlug
          ? (finalSlug !== editingSlug && existingSlugs.includes(finalSlug))
          : existingSlugs.includes(finalSlug);
        if (isTaken) {
          newFieldErrors.slug = 'This URL slug is already taken by another card. Please choose a unique slug.';
        }
      }
    }

    const formattedPhone = formatFullPhoneNumber(phoneCode, form.phone);
    const formattedLandline = formatFullPhoneNumber(landlineCode, form.landline);
    const formattedWhatsapp = formatFullPhoneNumber(whatsappCode, form.whatsapp);

    if (form.phone.trim()) {
      const digitsOnly = form.phone.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        newFieldErrors.phone = 'Please enter a valid phone number (at least 5 digits).';
      }
    }

    if (form.landline.trim()) {
      const digitsOnly = form.landline.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        newFieldErrors.landline = 'Please enter a valid landline number (at least 5 digits).';
      }
    }

    if (form.whatsapp.trim()) {
      const digitsOnly = form.whatsapp.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        newFieldErrors.whatsapp = 'Please enter a valid WhatsApp number (at least 5 digits).';
      }
    }

    if (form.delivery_enabled) {
      if (!form.delivery_number.trim()) {
        newFieldErrors.delivery_number = 'Delivery Contact Number is required when Delivery Contact is enabled.';
      } else {
        const digitsOnly = form.delivery_number.replace(/\D/g, '');
        if (digitsOnly.length < 5) {
          newFieldErrors.delivery_number = 'Please enter a valid delivery contact number (at least 5 digits).';
        }
      }
    }

    // Validate Primary Action Target Field
    if (form.primary_action) {
      const actionKey = form.primary_action;
      const targetVal = actionKey === 'phone'
        ? formattedPhone
        : actionKey === 'landline'
        ? formattedLandline
        : actionKey === 'whatsapp'
        ? formattedWhatsapp
        : form[actionKey as keyof typeof form];

      if (!targetVal || (typeof targetVal === 'string' && !targetVal.trim())) {
        const actionLabelMap: Record<string, string> = {
          phone: 'Phone Number',
          landline: 'Landline Number',
          whatsapp: 'WhatsApp Number',
          email: 'Email Address',
          website: 'Website URL',
          address: 'Address / Location',
          google_maps: 'Google Maps Link',
          instagram: 'Instagram Link',
          facebook: 'Facebook Link',
          tiktok: 'TikTok Link',
          snapchat: 'Snapchat Link',
          linkedin: 'LinkedIn Link',
          twitter: 'X (Twitter) Link',
          youtube: 'YouTube Link',
          review_url: 'Google Review URL',
          wifi: 'WiFi Password',
          menu: 'Menu PDF File'
        };
        const readableTarget = actionLabelMap[actionKey] || actionKey;
        newFieldErrors.primary_action = `Primary Action is set to "${readableTarget}", but no ${readableTarget} was provided.`;
        if (actionKey in form) {
          newFieldErrors[actionKey] = `${readableTarget} is required because it is selected as your Primary Action button.`;
        }
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please fix the errors highlighted below in the form.');

      const firstFieldKey = Object.keys(newFieldErrors)[0];
      setTimeout(() => {
        scrollToField(firstFieldKey);
      }, 50);
      return;
    }

    setFieldErrors({});

    const finalSlug = slugify(slug);
    const newCard: BusinessCard = {
      slug: finalSlug,
      name: trimmedName,
      tagline: form.tagline.trim(),
      themeColor: form.themeColor,
      logo: form.logo || undefined,
      cover_photo_url: form.cover_photo_url || undefined,
      language: form.language || 'en',
      layout: form.layout || 'design1',
      phone: formattedPhone,
      landline: formattedLandline,
      whatsapp: formattedWhatsapp,
      email: trimmedEmail,
      address: form.address.trim(),
      address_type: form.address_type || 'address',
      google_maps: cleanGoogleMaps,
      instagram: cleanInstagram,
      facebook: cleanFacebook,
      tiktok: cleanTiktok,
      snapchat: cleanSnapchat,
      linkedin: cleanLinkedin,
      twitter: cleanTwitter,
      youtube: cleanYoutube,
      website: cleanWebsite,
      primary_action: form.primary_action,
      primary_action_label: form.primary_action_label.trim() || undefined,
      avatar_border_radius: form.avatar_border_radius ?? 50,
      menu_pdf: form.menu_pdf || undefined,
      menu_pdf_name: form.menu_pdf_name || undefined,
      menu_label: form.menu_label.trim() || undefined,
      wifi_password: form.wifi_password.trim() || undefined,
      wifi_password_label: form.wifi_password_label.trim() || undefined,
      instagram_label: form.instagram_label.trim() || undefined,
      facebook_label: form.facebook_label.trim() || undefined,
      tiktok_label: form.tiktok_label.trim() || undefined,
      snapchat_label: form.snapchat_label.trim() || undefined,
      linkedin_label: form.linkedin_label.trim() || undefined,
      twitter_label: form.twitter_label.trim() || undefined,
      youtube_label: form.youtube_label.trim() || undefined,
      whatsapp_label: form.whatsapp_label.trim() || undefined,
      email_label: form.email_label.trim() || undefined,
      localisation_label: form.localisation_label.trim() || undefined,
      website_label: form.website_label.trim() || undefined,
      mobile_label: form.mobile_label.trim() || undefined,
      landline_label: form.landline_label.trim() || undefined,
      qr_logo_enabled: form.qr_logo_enabled ?? true,
      rate_us_enabled: form.rate_us_enabled ?? true,
      review_url: sanitizeUrl(form.review_url),
      rate_us_label: form.rate_us_label.trim() || undefined,
      delivery_enabled: form.delivery_enabled ?? false,
      delivery_number: form.delivery_number.trim() || undefined,
      delivery_label: form.delivery_label.trim() || undefined,
      first_priority_field: form.first_priority_field || undefined,
      quick_action_1: form.quick_action_1 || undefined,
      quick_action_2: form.quick_action_2 || undefined,
      quick_action_3: form.quick_action_3 || undefined,
    };

    setCardToConfirm(newCard);
    setModalError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!cardToConfirm) return;
    setIsSaving(true);
    setModalError(null);

    const result = await (editingSlug ? updateCard(editingSlug, cardToConfirm) : saveCard(cardToConfirm));
    setIsSaving(false);

    if (result.success) {
      const savedSlug = result.finalSlug || cardToConfirm.slug;
      const finalSavedCard = { ...cardToConfirm, slug: savedSlug };
      setSuccessCard(finalSavedCard);

      if (!editingSlug) {
        setExistingSlugs(prev => [...prev, savedSlug]);
      }
      getCards().then(updated => setAllCards(updated)).catch(() => {});
      setForm({
        name: '',
        tagline: '',
        themeColor: '#1B2A4A',
        logo: '',
        cover_photo_url: '',
        language: 'en',
        layout: 'design1',
        phone: '',
        landline: '',
        whatsapp: '',
        email: '',
        address: '',
        address_type: 'address',
        google_maps: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        snapchat: '',
        linkedin: '',
        twitter: '',
        youtube: '',
        website: '',
        primary_action: 'website',
        primary_action_label: '',
        avatar_border_radius: 50,
        menu_pdf: '',
        menu_pdf_name: '',
        menu_label: 'Our Menu',
        wifi_password: '',
        wifi_password_label: 'WiFi Password',
        instagram_label: 'Instagram',
        facebook_label: 'Facebook',
        tiktok_label: 'TikTok',
        snapchat_label: 'Snapchat',
        linkedin_label: 'LinkedIn',
        twitter_label: 'X (Twitter)',
        youtube_label: 'YouTube',
        whatsapp_label: 'WhatsApp',
        email_label: 'Email',
        localisation_label: 'Location',
        website_label: 'Website',
        mobile_label: 'Call Us',
        landline_label: 'Office Line',
        qr_logo_enabled: true,
        rate_us_enabled: true,
        review_url: '',
        rate_us_label: 'Rate Us / Leave 5 Stars',
        delivery_enabled: false,
        delivery_number: '',
        delivery_label: 'Delivery',
        first_priority_field: '',
        quick_action_1: '',
        quick_action_2: '',
        quick_action_3: '',
      });
      setSlug('');
      setExtractedColors(null);
      try {
        localStorage.removeItem('vcard_admin_draft');
      } catch {
        // ignore
      }
      setIsDraftRestored(false);
      setShowConfirmModal(false);
    } else {
      setModalError(result.error || 'Failed to save card. Please check your network connection and try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingSlug) return;
    setIsDeleting(true);
    const result = await deleteCard(editingSlug);
    setIsDeleting(false);
    if (result.success) {
      setShowDeleteModal(false);
      try {
        localStorage.removeItem('vcard_admin_draft');
      } catch {
        // ignore
      }
      router.push('/');
    } else {
      setError(result.error || 'Failed to delete card.');
      setShowDeleteModal(false);
    }
  };

  const copyToClipboard = () => {
    if (!successCard) return;
    const url = `${window.location.origin}/card/${successCard.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultSwatches: ColorSwatch[] = [
    { hex: '#1B2A4A', name: 'Navy', hsl: [222, 0.46, 0.20], isDark: true },
    { hex: '#8B263E', name: 'Burgundy', hsl: [346, 0.57, 0.35], isDark: true },
    { hex: '#2D5A27', name: 'Forest', hsl: [112, 0.39, 0.25], isDark: true },
    { hex: '#4A3B32', name: 'Espresso', hsl: [23, 0.20, 0.24], isDark: true },
    { hex: '#1A1A24', name: 'Midnight', hsl: [240, 0.16, 0.12], isDark: true },
    { hex: '#0F4C81', name: 'Classic Blue', hsl: [208, 0.79, 0.28], isDark: true },
  ];

  const swatchesToDisplay: ColorSwatch[] = extractedColors
    ? ([
        extractedColors.vibrant,
        extractedColors.darkVibrant,
        extractedColors.lightVibrant,
        extractedColors.muted,
        extractedColors.darkMuted,
        extractedColors.lightMuted,
      ].filter(Boolean) as ColorSwatch[])
    : defaultSwatches;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 md:p-8 font-sans antialiased text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleHomeNavigation}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
                {editingSlug ? 'Edit Client Card' : 'Configure NFC Digital Card'}
              </h1>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                VCARDS SPACE Management Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {editingSlug ? 'Edit Mode' : 'Live Provisioning'}
            </span>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-2xl transition-all text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Form Left (7 cols) + Live Preview Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Card Configuration Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            
            {/* Draft Restore Alert */}
            {isDraftRestored && (
              <div className="mb-6 p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-950 font-sans">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Restored your auto-saved card draft.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="shrink-0 px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                >
                  Discard Draft
                </button>
              </div>
            )}

            {/* Interactive Error Summary Box */}
            {Object.keys(fieldErrors).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                id="error-summary-banner"
                className="mb-8 p-5 bg-red-50/90 border-2 border-red-300 rounded-2xl shadow-sm text-red-900 relative overflow-hidden"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-red-100/90 rounded-xl text-red-600 shrink-0 mt-0.5 border border-red-200 shadow-2xs">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-sm text-red-950 flex items-center gap-2">
                        <span>Please fix the following {Object.keys(fieldErrors).length} field error{Object.keys(fieldErrors).length > 1 ? 's' : ''}:</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-red-200/80 text-red-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Click error to jump to field
                      </span>
                    </div>
                    <p className="text-xs text-red-700/90 mb-3 font-sans leading-relaxed">
                      We highlighted the exact field(s) causing the issue. Click any button below to immediately scroll and focus on that field:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(fieldErrors).map(([fieldKey, msg]) => (
                        <li key={fieldKey}>
                          <button
                            type="button"
                            onClick={() => scrollToField(fieldKey)}
                            className="w-full text-left p-2.5 rounded-xl bg-white/95 hover:bg-white border border-red-200 hover:border-red-400 text-xs text-red-900 font-medium transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer group"
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform shrink-0" />
                            <div className="truncate min-w-0">
                              <span className="font-bold capitalize text-red-950 mr-1.5">
                                {fieldKey.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-red-700">{msg}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {error && Object.keys(fieldErrors).length === 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-800 text-sm flex items-start gap-2 shadow-2xs">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Card Type & Layout Header */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="block text-xs font-mono font-bold uppercase text-slate-800 tracking-wider">
                      Card Type:
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      form.layout === 'business' 
                        ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' 
                        : 'text-indigo-800 bg-indigo-50 border border-indigo-200'
                    }`}>
                      {form.layout === 'business' ? 'Business (Link List Layout)' : 'Professional Profile'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerStep('top');
                      setShowTypePickerModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Change Card Type
                  </button>
                </div>

                {form.layout !== 'business' && (
                  <div className="pt-2">
                    <span className="block text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider mb-2">
                      Header Style Sub-Choice
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, layout: 'design1' }))}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          form.layout === 'design1'
                            ? 'border-indigo-600 bg-white text-slate-900 shadow-sm ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-slate-100/60 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs">Design 1</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            form.layout === 'design1' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {form.layout === 'design1' ? 'Selected' : 'Sloped'}
                          </span>
                        </div>
                        <div className="h-8 w-full rounded-md overflow-hidden relative border border-slate-200" style={{ backgroundColor: form.themeColor || '#1B2A4A' }}>
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-3 bg-white" 
                            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} 
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-sans leading-tight">
                          Dynamic sloped header background.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, layout: 'design2' }))}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          form.layout === 'design2'
                            ? 'border-indigo-600 bg-white text-slate-900 shadow-sm ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-slate-100/60 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs">Design 2</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            form.layout === 'design2' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {form.layout === 'design2' ? 'Selected' : 'Formal Flat'}
                          </span>
                        </div>
                        <div className="h-8 w-full rounded-md overflow-hidden relative border border-slate-200" style={{ backgroundColor: form.themeColor || '#1B2A4A' }} />
                        <p className="text-[10px] text-slate-500 mt-2 font-sans leading-tight">
                          Formal straight horizontal flat header.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, layout: 'design3', address_type: 'address' }))}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          form.layout === 'design3'
                            ? 'border-indigo-600 bg-white text-slate-900 shadow-sm ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-slate-100/60 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs">Design 3</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            form.layout === 'design3' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {form.layout === 'design3' ? 'Selected' : 'Cover Banner'}
                          </span>
                        </div>
                        <div className="h-8 w-full rounded-md overflow-hidden relative border border-slate-200 bg-slate-200">
                          {form.cover_photo_url ? (
                            <img src={form.cover_photo_url} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[9px] text-white font-mono">
                              Cover Banner
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-sans leading-tight">
                          Full cover photo header banner with card layout.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 1: Name and Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                    {form.layout === 'business' ? 'Business / Establishment Name *' : 'Full Name / Business Name *'}
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={form.layout === 'business' ? "e.g. Hearth & Home Pottery" : "e.g. John Doe / Attorney at Law"}
                    className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                      fieldErrors.name ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    required
                  />
                  <InlineFieldError message={fieldErrors.name} />

                  {/* Duplicate Name Alert Notice */}
                  {(() => {
                    const trimmedName = form.name.trim().toLowerCase();
                    const matchingNameCards = trimmedName
                      ? allCards.filter(c => c.name.trim().toLowerCase() === trimmedName && c.slug !== editingSlug)
                      : [];

                    if (matchingNameCards.length === 0) return null;

                    return (
                      <div className="mt-2.5 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-3 text-amber-900 text-xs shadow-2xs">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-amber-900">
                              Notice: Name already exists in database
                            </p>
                            <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-md shrink-0">
                              {matchingNameCards.length} {matchingNameCards.length === 1 ? 'match' : 'matches'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800/90 leading-relaxed font-sans">
                            A card with the name <strong>"{form.name.trim()}"</strong> already exists in your database ({matchingNameCards.map(c => c.name + (c.slug ? ` [slug: ${c.slug}]` : '')).join(', ')}).
                          </p>
                          <p className="text-[10.5px] font-medium text-amber-700 leading-snug pt-1 border-t border-amber-200/60">
                            💡 You can still create and save this card! Identical names are fully supported (e.g. multiple clients, lawyers, or businesses sharing the same name).
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label htmlFor="slug-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                    URL Slug *
                  </label>
                  <input
                    id="slug-input"
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="hearth-and-home"
                    className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                      fieldErrors.slug ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-mono text-slate-700 touch-manipulation shadow-2xs focus:shadow-sm`}
                    required
                  />
                  <InlineFieldError message={fieldErrors.slug} />
                  {form.name && (
                    <p className="text-[11px] text-slate-600 mt-1.5 font-sans">
                      Suggest from name:{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = slugify(form.name);
                          setSlug(suggested);
                          const isTaken = editingSlug
                            ? (suggested !== editingSlug && existingSlugs.includes(suggested))
                            : existingSlugs.includes(suggested);
                          setFieldErrors(prev => {
                            const copy = { ...prev };
                            if (!suggested) {
                              copy.slug = 'URL Slug is required.';
                            } else if (isTaken) {
                              copy.slug = 'This URL slug is already taken by another card.';
                            } else {
                              delete copy.slug;
                            }
                            return copy;
                          });
                        }}
                        className="text-indigo-600 hover:underline font-bold font-mono px-1 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                      >
                        {slugify(form.name)}
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label htmlFor="tagline-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                  Business Tagline / Slogan *
                </label>
                <input
                  id="tagline-input"
                  type="text"
                  name="tagline"
                  value={form.tagline}
                  onChange={handleChange}
                  placeholder="e.g. HANDCRAFTED STONEWARE FROM LOCAL CLAY"
                  className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                    fieldErrors.tagline ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                  } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                />
                <InlineFieldError message={fieldErrors.tagline} />
              </div>

              {/* Card Display Language */}
              <div>
                <label htmlFor="card-language-select" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                  Card Display Language *
                </label>
                <div className="relative">
                  <select
                    id="card-language-select"
                    value={form.language}
                    onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value as BusinessLanguage }))}
                    className="w-full h-12 pl-4 pr-10 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans text-slate-800 appearance-none shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="en">🇬🇧 English (English)</option>
                    <option value="fr">🇫🇷 French (Français)</option>
                    <option value="ar">🇲🇦 Arabic (العربية)</option>
                    <option value="de">🇩🇪 German (Deutsch)</option>
                    <option value="es">🇪🇸 Spanish (Español)</option>
                    <option value="nl">🇳🇱 Dutch (Nederlands)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-1.5 leading-relaxed">
                  Default card language. Public visitors can also switch language using flag icons on the card.
                </p>
              </div>

              {/* Logo Upload & Optimization Pipeline */}
              <div id="logo-field" className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                    Business Logo *
                  </label>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md font-bold">
                    HD Retina Ready (800×800)
                  </span>
                </div>

                {/* Requirements & Guidelines Banner */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono text-[11px] uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Upload Specifications & Guidelines</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Dimensions</span>
                      <span className="font-semibold text-slate-800">512×512 px+</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Aspect Ratio</span>
                      <span className="font-semibold text-slate-800">1:1 Square</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Supported Formats</span>
                      <span className="font-semibold text-slate-800">PNG, SVG, WEBP, JPG</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Max Size / Min Res</span>
                      <span className="font-semibold text-slate-800">Max 5MB • Min 200px</span>
                    </div>
                  </div>
                </div>

                {/* Dropzone & Interactive Image Area */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropLogo}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                    fieldErrors.logo 
                      ? 'border-red-400 bg-red-50/20 ring-2 ring-red-400/20' 
                      : isDraggingFile 
                      ? 'border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-500/10 border-dashed' 
                      : form.logo
                      ? 'border-slate-200 bg-white'
                      : 'border-dashed border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                    id="logo-upload" 
                    onChange={handleLogoUpload}
                    className="hidden" 
                  />

                  {form.logo ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Checkerboard background preview for transparency */}
                      <div className="relative w-20 h-20 rounded-2xl border border-slate-200 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center overflow-hidden shrink-0 shadow-xs p-1.5 bg-white">
                        <img 
                          src={form.logo} 
                          alt="Logo preview" 
                          className="w-full h-full object-contain rounded-xl" 
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100/80 text-emerald-800">
                            <Check className="w-3 h-3" /> Active Logo Loaded
                          </span>
                          {logoFileInfo && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold truncate max-w-[200px]">
                              {logoFileInfo.width}×{logoFileInfo.height}px • {logoFileInfo.format} • {logoFileInfo.sizeFormatted}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-snug">
                          {logoFileInfo ? logoFileInfo.name : 'Business logo active and color-extracted.'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              setCropTarget('logo');
                              const safeSrc = await fetchAsDataUrl(form.logo);
                              setCropImageSrc(safeSrc);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all active:scale-98 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Crop / Re-Center
                          </button>
                          <label 
                            htmlFor="logo-upload"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition-all active:scale-98"
                          >
                            <Upload className="w-3.5 h-3.5" /> Replace
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all active:scale-98 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label 
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center py-4 cursor-pointer text-center group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5 transition-colors shadow-2xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        Drag & drop logo image, or <span className="text-indigo-600 underline">browse file</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload PNG (transparent), SVG, WEBP, or JPG up to 5MB
                      </p>
                    </label>
                  )}
                </div>

                <InlineFieldError message={fieldErrors.logo} />

                {/* Profile Image Shape Selector */}
                <div className="mt-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                      <span>Profile Image Shape</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                      {(form.avatar_border_radius ?? 50) >= 45 ? 'Circle' : 'Soft Curved'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Circle Option */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, avatar_border_radius: 50 }))}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        (form.avatar_border_radius ?? 50) >= 45
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        (form.avatar_border_radius ?? 50) >= 45
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold'
                          : 'border-slate-300 bg-slate-100 text-slate-400'
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-current opacity-80" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-bold ${
                          (form.avatar_border_radius ?? 50) >= 45 ? 'text-indigo-950' : 'text-slate-700'
                        }`}>
                          Circle
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">100% Round</p>
                      </div>
                      {(form.avatar_border_radius ?? 50) >= 45 && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </button>

                    {/* Soft Curved Option */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, avatar_border_radius: 22 }))}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        (form.avatar_border_radius ?? 50) < 45
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-[10px] border-2 flex items-center justify-center shrink-0 transition-all ${
                        (form.avatar_border_radius ?? 50) < 45
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold'
                          : 'border-slate-300 bg-slate-100 text-slate-400'
                      }`}>
                        <div className="w-4 h-4 rounded-[4px] bg-current opacity-80" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-bold ${
                          (form.avatar_border_radius ?? 50) < 45 ? 'text-indigo-950' : 'text-slate-700'
                        }`}>
                          Soft Curved
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">Rounded Box</p>
                      </div>
                      {(form.avatar_border_radius ?? 50) < 45 && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cover Photo Upload Pipeline - ONLY FOR DESIGN 3 */}
                {form.layout === 'design3' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Header Cover Photo <span className="text-indigo-600">(For Design 3)</span>
                      </label>
                    </div>
                    {form.cover_photo_url ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                        <img src={form.cover_photo_url} referrerPolicy="no-referrer" alt="Cover Preview" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label htmlFor="cover-upload-input" className="px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-all shadow-xs">
                            Change Cover
                          </label>
                          <button type="button" onClick={handleRemoveCover} className="px-3 py-1.5 bg-red-600 rounded-xl text-xs font-bold text-white cursor-pointer hover:bg-red-700 transition-all shadow-xs">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="cover-upload-input" className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/80 rounded-2xl cursor-pointer transition-all p-4 text-center">
                        <span className="text-xs font-bold text-indigo-600">Upload Header Cover Photo</span>
                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP up to 10MB (Auto-compressed client-side)</span>
                      </label>
                    )}
                    <input id="cover-upload-input" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </div>
                )}
              </div>

              {/* Brand Color System */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                    Theme Color Accent
                  </label>
                  {isExtracting ? (
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase animate-pulse">
                      Extracting Colors...
                    </span>
                  ) : form.logo ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                      Extracted from Logo
                    </span>
                  ) : null}
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                  <div>
                    <span className="block text-[10px] font-mono text-slate-600 uppercase tracking-wide mb-2.5 font-bold">
                      {form.logo ? 'Extracted Swatches' : 'Suggested Swatches'}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {swatchesToDisplay.map((swatch) => (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, themeColor: swatch.hex }))}
                          className={`group flex flex-col items-center justify-center p-2.5 min-h-[72px] rounded-xl border transition-all text-center select-none touch-manipulation cursor-pointer ${
                            form.themeColor.toLowerCase() === swatch.hex.toLowerCase()
                              ? 'border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-500/10 scale-[1.02]'
                              : 'border-slate-200 bg-white hover:border-slate-300 active:scale-98'
                          }`}
                          title={`${swatch.name}: ${swatch.hex}`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full shadow-inner mb-1.5 transition-transform group-hover:scale-105 shrink-0" 
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="text-[10px] font-bold text-slate-800 truncate w-full leading-tight">
                            {swatch.name}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-500 tracking-tight leading-none mt-0.5">
                            {swatch.hex}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canva Custom Color Picker Accent */}
                  <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          id="custom-color-picker"
                          value={form.themeColor}
                          onChange={(e) => setForm(prev => ({ ...prev, themeColor: e.target.value.toUpperCase() }))}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div 
                          className="w-11 h-11 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${form.themeColor} 0%, ${form.themeColor} 100%)`
                          }}
                        >
                          <Plus className="w-5 h-5 mix-blend-difference text-white" />
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Custom Color Picker</span>
                        <p className="text-[10px] text-slate-500 font-mono">Click palette to pick any color</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/85 shrink-0 self-start sm:self-auto shadow-2xs">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Selected:</span>
                      <input 
                        type="text" 
                        value={form.themeColor}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-F]{6}$/i.test(hex) || hex === '') {
                            setForm(prev => ({ ...prev, themeColor: hex.toUpperCase() }));
                          } else if (/^[0-9A-F]{6}$/i.test(hex)) {
                            setForm(prev => ({ ...prev, themeColor: `#${hex}`.toUpperCase() }));
                          }
                        }}
                        className="font-mono text-xs text-slate-800 font-bold uppercase w-20 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Contacts Grid */}
              {form.layout === 'business' ? (
                <div className="border-t border-slate-200 pt-6 mt-6 space-y-6">
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900">
                      Business Actions & Links (10 Optional Rows)
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-1">
                      Configure the link rows for your card. Each row has a value and an editable button label. Leave blank to hide a row.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Featured 1st Priority Button Selector */}
                    <div className="p-4.5 rounded-2xl border border-indigo-200/90 bg-indigo-50/50 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">Featured 1st Priority Button</span>
                            <span className="text-[10px] text-slate-500 block">Choose which field appears as the 1st button in the card's buttons list</span>
                          </div>
                        </div>
                        {form.first_priority_field && (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, first_priority_field: '' }))}
                            className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                          >
                            Reset to Default Order
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            1st Button Selection
                          </label>
                          <select
                            name="first_priority_field"
                            value={form.first_priority_field || ''}
                            onChange={handleChange}
                            className="w-full h-10 px-3 bg-white rounded-xl border border-indigo-200 text-xs font-sans font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                          >
                            <option value="">Default Order (Standard Sequence)</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="tiktok">TikTok</option>
                            <option value="snapchat">Snapchat</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="twitter">X (Twitter)</option>
                            <option value="youtube">YouTube</option>
                            <option value="menu_pdf">Menu / Price List PDF</option>
                            <option value="wifi_password">WiFi Password</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="address">Location / Address</option>
                            <option value="website">Website</option>
                            <option value="phone">Mobile Phone</option>
                            <option value="landline">Office Line</option>
                            <option value="rate_us">5 Golden Stars & Google Review</option>
                            <option value="delivery">Delivery Contact</option>
                          </select>
                        </div>

                        <div className="flex flex-col justify-center">
                          <span className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1.5">
                            Quick Select 1st Button:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: '', label: 'Default' },
                              { id: 'instagram', label: 'Instagram' },
                              { id: 'snapchat', label: 'Snapchat' },
                              { id: 'linkedin', label: 'LinkedIn' },
                              { id: 'twitter', label: 'X' },
                              { id: 'youtube', label: 'YouTube' },
                              { id: 'menu_pdf', label: 'Menu PDF' },
                              { id: 'wifi_password', label: 'WiFi' },
                              { id: 'whatsapp', label: 'WhatsApp' },
                              { id: 'rate_us', label: 'Rate Us' },
                              { id: 'delivery', label: 'Delivery' },
                            ].map(chip => (
                              <button
                                key={chip.id}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, first_priority_field: chip.id }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-sans transition-all cursor-pointer ${
                                  (form.first_priority_field || '') === chip.id
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 1. Menu PDF */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">1. Menu / Price List PDF</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                          Max 10MB • .PDF
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Upload PDF File
                          </label>
                          {isUploadingPdf ? (
                            <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                  Uploading & Processing PDF...
                                </span>
                                <span className="font-mono text-[10px] font-bold text-indigo-600">{pdfUploadProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                                  style={{ width: `${pdfUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : form.menu_pdf ? (
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 font-mono text-[10px] font-bold">
                                  PDF
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-800 text-xs">
                                    {form.menu_pdf_name || 'Uploaded_Menu.pdf'}
                                  </p>
                                  {pdfFileInfo && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {pdfFileInfo.sizeFormatted}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={form.menu_pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={handleRemovePdf}
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 p-2.5 bg-white hover:bg-slate-100/80 active:bg-slate-100 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 text-xs text-slate-700 font-bold cursor-pointer transition-all shadow-2xs group">
                              <Upload className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                              <span>Upload Menu PDF (Max 10MB)</span>
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={handlePdfUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                          {pdfError && (
                            <InlineFieldError message={pdfError} />
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="menu_label"
                            value={form.menu_label}
                            onChange={handleChange}
                            placeholder="Our Menu"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. WiFi Password */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                          <Wifi className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">2. WiFi Password</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            WiFi Password Text
                          </label>
                          <input
                            type="text"
                            name="wifi_password"
                            value={form.wifi_password}
                            onChange={handleChange}
                            placeholder="e.g. GuestPass123"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="wifi_password_label"
                            value={form.wifi_password_label}
                            onChange={handleChange}
                            placeholder="WiFi Password"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Instagram */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">3. Instagram</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Instagram Handle / URL
                          </label>
                          <input
                            type="text"
                            name="instagram"
                            value={form.instagram}
                            onChange={handleChange}
                            placeholder="e.g. mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="instagram_label"
                            value={form.instagram_label}
                            onChange={handleChange}
                            placeholder="Instagram"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Facebook */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Facebook className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">4. Facebook</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Facebook Page / URL
                          </label>
                          <input
                            type="text"
                            name="facebook"
                            value={form.facebook}
                            onChange={handleChange}
                            placeholder="e.g. mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="facebook_label"
                            value={form.facebook_label}
                            onChange={handleChange}
                            placeholder="Facebook"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. TikTok */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.33V9.05a8.16 8.16 0 0 0 4.92 1.58V7.18a4.85 4.85 0 0 1-1-.49z"/>
                          </svg>
                        </div>
                        <span className="font-bold text-xs text-slate-900">5. TikTok</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            TikTok Username / URL
                          </label>
                          <input
                            type="text"
                            name="tiktok"
                            value={form.tiktok}
                            onChange={handleChange}
                            placeholder="e.g. @mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="tiktok_label"
                            value={form.tiktok_label}
                            onChange={handleChange}
                            placeholder="TikTok"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 6. Snapchat */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400 text-slate-900 flex items-center justify-center shrink-0 font-bold">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.001 2c-3.132 0-5.32 2.215-5.32 4.961 0 .864.225 1.637.587 2.292-.533.153-1.258.411-1.802.946-.431.424-.51.983-.238 1.488.225.418.729.68 1.253.868-.041.341-.12.879-.12 1.272 0 1.95 1.547 3.518 4.298 3.518.358 0 .749-.03 1.15-.09.313.364.787.607 1.192.607.404 0 .878-.243 1.191-.607.402.06.793.09 1.152.09 2.75 0 4.297-1.568 4.297-3.518 0-.393-.079-.931-.12-1.272.524-.188 1.028-.45 1.253-.868.272-.505.193-1.064-.238-1.488-.544-.535-1.269-.793-1.802-.946.362-.655.587-1.428.587-2.292C17.321 4.215 15.133 2 12.001 2z"/>
                          </svg>
                        </div>
                        <span className="font-bold text-xs text-slate-900">6. Snapchat</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Snapchat Username / URL
                          </label>
                          <input
                            type="text"
                            name="snapchat"
                            value={form.snapchat || ''}
                            onChange={handleChange}
                            placeholder="e.g. mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="snapchat_label"
                            value={form.snapchat_label || ''}
                            onChange={handleChange}
                            placeholder="Snapchat"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 7. LinkedIn */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z"/>
                          </svg>
                        </div>
                        <span className="font-bold text-xs text-slate-900">7. LinkedIn</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            LinkedIn Page / Profile URL
                          </label>
                          <input
                            type="text"
                            name="linkedin"
                            value={form.linkedin || ''}
                            onChange={handleChange}
                            placeholder="e.g. company/mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="linkedin_label"
                            value={form.linkedin_label || ''}
                            onChange={handleChange}
                            placeholder="LinkedIn"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 8. X (Twitter) */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0 font-bold">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <span className="font-bold text-xs text-slate-900">8. X (Twitter)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            X Handle / Profile URL
                          </label>
                          <input
                            type="text"
                            name="twitter"
                            value={form.twitter || ''}
                            onChange={handleChange}
                            placeholder="e.g. @mybusiness"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="twitter_label"
                            value={form.twitter_label || ''}
                            onChange={handleChange}
                            placeholder="X (Twitter)"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 9. YouTube */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 font-bold">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <span className="font-bold text-xs text-slate-900">9. YouTube</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            YouTube Channel / URL
                          </label>
                          <input
                            type="text"
                            name="youtube"
                            value={form.youtube || ''}
                            onChange={handleChange}
                            placeholder="e.g. @mychannel"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="youtube_label"
                            value={form.youtube_label || ''}
                            onChange={handleChange}
                            placeholder="YouTube"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 6. WhatsApp */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">6. WhatsApp</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            WhatsApp Number
                          </label>
                          <div className="flex">
                            <select
                              value={whatsappCode}
                              onChange={(e) => setWhatsappCode(e.target.value)}
                              className="h-10 px-2 bg-white border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={`wa-${c.code}`} value={c.dialCode}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              name="whatsapp"
                              value={form.whatsapp}
                              onChange={handleChange}
                              placeholder="6 12 34 56 78"
                              className="w-full h-10 px-3 bg-white rounded-r-xl border border-slate-200 text-xs font-sans"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="whatsapp_label"
                            value={form.whatsapp_label}
                            onChange={handleChange}
                            placeholder="WhatsApp"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 7. Email */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">7. Email</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="contact@business.com"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="email_label"
                            value={form.email_label}
                            onChange={handleChange}
                            placeholder="Email"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 8. Localisation */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">8. Localisation / Address</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Address / Location Text
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="123 Main St, Suite 400"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="localisation_label"
                            value={form.localisation_label}
                            onChange={handleChange}
                            placeholder="Location"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 9. Website */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">9. Website</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Website URL
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://mybusiness.com"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="website_label"
                            value={form.website_label}
                            onChange={handleChange}
                            placeholder="Website"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 10. Mobile Phone */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">10. Mobile Phone</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Mobile Number
                          </label>
                          <div className="flex">
                            <select
                              value={phoneCode}
                              onChange={(e) => setPhoneCode(e.target.value)}
                              className="h-10 px-2 bg-white border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={`mb-${c.code}`} value={c.dialCode}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              name="phone"
                              value={form.phone}
                              onChange={handleChange}
                              placeholder="6 12 34 56 78"
                              className="w-full h-10 px-3 bg-white rounded-r-xl border border-slate-200 text-xs font-sans"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="mobile_label"
                            value={form.mobile_label}
                            onChange={handleChange}
                            placeholder="Call Us"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 11. Landline */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">11. Landline (Fixe)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Landline Number
                          </label>
                          <div className="flex">
                            <select
                              value={landlineCode}
                              onChange={(e) => setLandlineCode(e.target.value)}
                              className="h-10 px-2 bg-white border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={`ll-${c.code}`} value={c.dialCode}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              name="landline"
                              value={form.landline}
                              onChange={handleChange}
                              placeholder="5 22 12 34 56"
                              className="w-full h-10 px-3 bg-white rounded-r-xl border border-slate-200 text-xs font-sans"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                            Button Label
                          </label>
                          <input
                            type="text"
                            name="landline_label"
                            value={form.landline_label}
                            onChange={handleChange}
                            placeholder="Office Line"
                            className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 12. 5 Golden Stars & Google Review Button */}
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Star className="w-4 h-4 fill-white text-white" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">12. 5 Golden Stars & Google Review Button</span>
                            <span className="text-[10px] text-slate-500 block">Displays 5 golden stars + Google logo on card</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.rate_us_enabled}
                          onClick={() => setForm(prev => ({ ...prev, rate_us_enabled: !prev.rate_us_enabled }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            form.rate_us_enabled ? 'bg-amber-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              form.rate_us_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {form.rate_us_enabled && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                              Direct Google Review URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                              type="url"
                              name="review_url"
                              value={form.review_url}
                              onChange={handleChange}
                              placeholder="https://g.page/r/your-google-place-id/review"
                              className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                              Direct link to Google Reviews. If blank, it automatically directs to your location address or Google Maps URL.
                            </p>
                          </div>

                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-center">
                            <div className="w-full max-w-[260px] py-3.5 px-4 rounded-xl flex flex-col items-center justify-center bg-amber-500/10 border-0 text-amber-950 gap-1.5">
                              <div className="flex items-center gap-1.5 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <GoogleLogo className="h-5 w-auto" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 13. Delivery Contact */}
                    <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <MotorcycleDeliveryIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">13. Delivery Contact</span>
                            <span className="text-[10px] text-slate-500 block">Add a direct delivery phone number row</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.delivery_enabled}
                          onClick={() => setForm(prev => ({ ...prev, delivery_enabled: !prev.delivery_enabled }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            form.delivery_enabled ? 'bg-red-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              form.delivery_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {form.delivery_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                              Delivery Number *
                            </label>
                            <input
                              type="tel"
                              name="delivery_number"
                              value={form.delivery_number}
                              onChange={handleChange}
                              placeholder="e.g. 05 22 00 00 00"
                              className={`w-full h-10 px-3 bg-white rounded-xl border ${
                                fieldErrors.delivery_number ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                              } text-xs font-sans transition-all`}
                            />
                            {fieldErrors.delivery_number && (
                              <InlineFieldError message={fieldErrors.delivery_number} />
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                              Button Label
                            </label>
                            <input
                              type="text"
                              name="delivery_label"
                              value={form.delivery_label}
                              onChange={handleChange}
                              placeholder="Delivery"
                              className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-xs font-sans"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <>
                  <div className="border-t border-slate-150 pt-6">
                    <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">Contact Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile Phone Field */}
                  <div id="phone-field">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="phone-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Mobile Phone Number
                      </label>
                      {form.layout !== 'design3' && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, primary_action: 'phone' }))}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            form.primary_action === 'phone'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {form.primary_action === 'phone' ? '✓ Selected as CTA' : '+ Use as CTA'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center w-full rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-600 transition-all shadow-2xs">
                      <div className="relative shrink-0 w-[110px] sm:w-[120px]">
                        <div className="h-12 px-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 border-r-0 rounded-l-xl flex items-center justify-between text-xs font-mono font-bold text-slate-800 transition-colors">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-base leading-none">{selectedPhoneCountry.flag}</span>
                            <span>{selectedPhoneCountry.dialCode}</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                        </div>
                        <select
                          aria-label="Phone Country Code"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`phone-${c.code}-${c.dialCode}`} value={c.dialCode}>
                              {c.flag} {c.name} ({c.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        id="phone-input"
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="6 12 34 56 78"
                        className={`flex-1 min-w-0 h-12 px-3.5 bg-slate-50 rounded-r-xl border ${
                          fieldErrors.phone ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                        } focus:bg-white focus:outline-none transition-all text-sm font-sans touch-manipulation shadow-2xs`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Prefix <span className="font-bold text-slate-600">{phoneCode}</span> ({selectedPhoneCountry.name}). Type remaining digits.
                    </p>
                    <InlineFieldError message={fieldErrors.phone} />
                  </div>

                  {/* Landline Field */}
                  <div id="landline-field">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="landline-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Landline / Fixed Phone (Fixe)
                      </label>
                      {form.layout !== 'design3' && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, primary_action: 'landline' }))}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            form.primary_action === 'landline'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {form.primary_action === 'landline' ? '✓ Selected as CTA' : '+ Use as CTA'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center w-full rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-600 transition-all shadow-2xs">
                      <div className="relative shrink-0 w-[110px] sm:w-[120px]">
                        <div className="h-12 px-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 border-r-0 rounded-l-xl flex items-center justify-between text-xs font-mono font-bold text-slate-800 transition-colors">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-base leading-none">{selectedLandlineCountry.flag}</span>
                            <span>{selectedLandlineCountry.dialCode}</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                        </div>
                        <select
                          aria-label="Landline Country Code"
                          value={landlineCode}
                          onChange={(e) => setLandlineCode(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`landline-${c.code}-${c.dialCode}`} value={c.dialCode}>
                              {c.flag} {c.name} ({c.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        id="landline-input"
                        type="tel"
                        name="landline"
                        value={form.landline}
                        onChange={handleChange}
                        placeholder="5 22 12 34 56"
                        className={`flex-1 min-w-0 h-12 px-3.5 bg-slate-50 rounded-r-xl border ${
                          fieldErrors.landline ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                        } focus:bg-white focus:outline-none transition-all text-sm font-sans touch-manipulation shadow-2xs`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Prefix <span className="font-bold text-slate-600">{landlineCode}</span> ({selectedLandlineCountry.name}). Fixed line (starts with 05 in Morocco).
                    </p>
                    <InlineFieldError message={fieldErrors.landline} />
                  </div>

                  {/* WhatsApp Field */}
                  <div id="whatsapp-field">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="whatsapp-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        WhatsApp Number
                      </label>
                      {form.layout !== 'design3' && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, primary_action: 'whatsapp' }))}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            form.primary_action === 'whatsapp'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {form.primary_action === 'whatsapp' ? '✓ Selected as CTA' : '+ Use as CTA'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center w-full rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-600 transition-all shadow-2xs">
                      <div className="relative shrink-0 w-[110px] sm:w-[120px]">
                        <div className="h-12 px-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 border-r-0 rounded-l-xl flex items-center justify-between text-xs font-mono font-bold text-slate-800 transition-colors">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-base leading-none">{selectedWhatsappCountry.flag}</span>
                            <span>{selectedWhatsappCountry.dialCode}</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                        </div>
                        <select
                          aria-label="WhatsApp Country Code"
                          value={whatsappCode}
                          onChange={(e) => setWhatsappCode(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`wa-${c.code}-${c.dialCode}`} value={c.dialCode}>
                              {c.flag} {c.name} ({c.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        id="whatsapp-input"
                        type="tel"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={handleChange}
                        placeholder="6 12 34 56 78"
                        className={`flex-1 min-w-0 h-12 px-3.5 bg-slate-50 rounded-r-xl border ${
                          fieldErrors.whatsapp ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                        } focus:bg-white focus:outline-none transition-all text-sm font-sans touch-manipulation shadow-2xs`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Prefix <span className="font-bold text-slate-600">{whatsappCode}</span> ({selectedWhatsappCountry.name}). Type remaining digits.
                    </p>
                    <InlineFieldError message={fieldErrors.whatsapp} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="email-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Email Address
                      </label>
                      {form.layout !== 'design3' && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, primary_action: 'email' }))}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            form.primary_action === 'email'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {form.primary_action === 'email' ? '✓ Selected as CTA' : '+ Use as CTA'}
                        </button>
                      )}
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="hello@earthen.com"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.email ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.email} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="website-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Website URL
                      </label>
                      {form.layout !== 'design3' && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, primary_action: 'website' }))}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            form.primary_action === 'website'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                          }`}
                        >
                          {form.primary_action === 'website' ? '✓ Selected as CTA' : '+ Use as CTA'}
                        </button>
                      )}
                    </div>
                    <input
                      id="website-input"
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://earthenpottery.com"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.website ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.website} />
                  </div>

                  <div className="md:col-span-2 space-y-3" id="address-field">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <label htmlFor="address-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        {form.layout === 'design3' || form.address_type !== 'text' ? 'Physical Address' : 'Custom Text / Note'}
                      </label>

                      {/* Mode selection toggle */}
                      {form.layout !== 'design3' && (
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, address_type: 'address' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
                              form.address_type === 'address' || !form.address_type
                                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Physical Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, address_type: 'text' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
                              form.address_type === 'text'
                                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Normal Text
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      id="address-input"
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder={
                        form.layout !== 'design3' && form.address_type === 'text'
                          ? 'Available by appointment only / Building 3, Floor 2'
                          : '404 Brick Kiln Lane, Portland, OR 97201'
                      }
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.address ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.address} />

                    {/* Google Maps link field appearing directly under normal text field when selected */}
                    <AnimatePresence>
                      {form.layout !== 'design3' && form.address_type === 'text' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -6 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="pt-2 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <label htmlFor="google-maps-input" className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              Google Maps Location / URL
                            </label>
                            <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                          </div>
                          <input
                            id="google-maps-input"
                            type="text"
                            name="google_maps"
                            value={form.google_maps}
                            onChange={handleChange}
                            placeholder="https://maps.google.com/?q=Earthen+Pottery+Studio or address search query"
                            className="w-full h-11 px-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs"
                          />
                          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                            Replaces the location destination for the Google Maps button/icon on your card when using custom normal text above.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

          {/* Rate Us / Google Reviews Toggle & Custom URL (Applies to ALL card layouts - Personal & Business) */}
          <div className="border-t border-slate-150 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-400/20">
                  <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-slate-800 tracking-wider block">
                    5 Golden Stars & Google Review Button
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Display 5 golden stars + Google logo button on public card (Personal & Business)
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.rate_us_enabled}
                onClick={() => setForm(prev => ({ ...prev, rate_us_enabled: !prev.rate_us_enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.rate_us_enabled ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    form.rate_us_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <AnimatePresence>
              {form.rate_us_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="pt-3 space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="review-url-input" className="text-xs font-mono font-bold uppercase text-slate-700 tracking-wider">
                        Direct Google Review URL
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                    </div>
                    <input
                      id="review-url-input"
                      type="url"
                      name="review_url"
                      value={form.review_url}
                      onChange={handleChange}
                      placeholder="https://g.page/r/your-google-place-id/review or https://search.google.com/local/writereview?placeid=..."
                      className="w-full h-11 px-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all text-sm font-sans touch-manipulation shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-1">
                      Direct link to your Google Business reviews page. If left blank, it uses your card location address or Google Maps URL.
                    </p>
                  </div>

                  {/* Live Visual 5-Star Button Preview */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Button Preview
                      </span>
                      <span className="text-[10px] text-amber-600 font-medium">Borderless • As shown on public card</span>
                    </div>

                    <div className="p-4 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-inner flex justify-center">
                      <div className="w-full max-w-[280px] py-4 px-5 flex flex-col items-center justify-center bg-transparent text-amber-950 transition-transform duration-200 hover:scale-[1.02] cursor-pointer gap-2">
                        {/* 5 Big Golden Stars */}
                        <div className="flex items-center gap-1.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-xs" />
                          ))}
                        </div>
                        {/* Centered Google Logo on Next Line */}
                        <div className="flex items-center justify-center pt-0.5">
                          <GoogleLogo className="h-5.5 w-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

              {/* Social Channels */}
              <div className="border-t border-slate-150 pt-6">
                <h3 className="font-serif text-lg font-semibold text-slate-800 mb-4">Social Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="instagram-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      Instagram Page URL
                    </label>
                    <input
                      id="instagram-input"
                      type="url"
                      name="instagram"
                      value={form.instagram}
                      onChange={handleChange}
                      placeholder="https://instagram.com/hearth.earthen"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.instagram ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.instagram} />
                  </div>

                  <div>
                    <label htmlFor="facebook-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      Facebook Page URL
                    </label>
                    <input
                      id="facebook-input"
                      type="url"
                      name="facebook"
                      value={form.facebook}
                      onChange={handleChange}
                      placeholder="https://facebook.com/hearthandhomepottery"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.facebook ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.facebook} />
                  </div>

                  <div>
                    <label htmlFor="tiktok-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      TikTok Page URL / @Username
                    </label>
                    <input
                      id="tiktok-input"
                      type="url"
                      name="tiktok"
                      value={form.tiktok}
                      onChange={handleChange}
                      placeholder="https://tiktok.com/@hearthandhome"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.tiktok ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.tiktok} />
                  </div>

                  <div>
                    <label htmlFor="snapchat-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      Snapchat Username / URL
                    </label>
                    <input
                      id="snapchat-input"
                      type="text"
                      name="snapchat"
                      value={form.snapchat || ''}
                      onChange={handleChange}
                      placeholder="https://snapchat.com/add/username"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.snapchat ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.snapchat} />
                  </div>

                  <div>
                    <label htmlFor="linkedin-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      LinkedIn Profile / Page URL
                    </label>
                    <input
                      id="linkedin-input"
                      type="url"
                      name="linkedin"
                      value={form.linkedin || ''}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.linkedin ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.linkedin} />
                  </div>

                  <div>
                    <label htmlFor="twitter-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      X (Twitter) Profile / @Username
                    </label>
                    <input
                      id="twitter-input"
                      type="text"
                      name="twitter"
                      value={form.twitter || ''}
                      onChange={handleChange}
                      placeholder="https://x.com/username"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.twitter ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.twitter} />
                  </div>

                  <div>
                    <label htmlFor="youtube-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      YouTube Channel URL
                    </label>
                    <input
                      id="youtube-input"
                      type="url"
                      name="youtube"
                      value={form.youtube || ''}
                      onChange={handleChange}
                      placeholder="https://youtube.com/@channel"
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl border ${
                        fieldErrors.youtube ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm`}
                    />
                    <InlineFieldError message={fieldErrors.youtube} />
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Selection */}
              {form.layout === 'design3' ? (
                <div id="primary_action-field" className="border-t border-slate-150 pt-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-slate-800 tracking-wider">
                        Call to Action Buttons (Select up to 3) *
                      </label>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed font-sans">
                        Design 3 features up to 3 circular Call to Action buttons in the header banner. Choose which fields appear as your action buttons below.
                      </p>
                    </div>
                    {(form.quick_action_1 || form.quick_action_2 || form.quick_action_3) && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, quick_action_1: '', quick_action_2: '', quick_action_3: '' }))}
                        className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        Reset to Default (Phone, WhatsApp, Location)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                        Action Button 1 (Left)
                      </label>
                      <select
                        name="quick_action_1"
                        value={form.quick_action_1 || ''}
                        onChange={handleChange}
                        className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">Default (Phone)</option>
                        <option value="none">-- None / Disabled --</option>
                        <option value="phone">Mobile Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="address">Location / Address</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="snapchat">Snapchat</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="youtube">YouTube</option>
                        <option value="email">Email</option>
                        <option value="landline">Office Line</option>
                        <option value="website">Website</option>
                        <option value="delivery">Delivery</option>
                        <option value="wifi_password">WiFi Password</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                        Action Button 2 (Center)
                      </label>
                      <select
                        name="quick_action_2"
                        value={form.quick_action_2 || ''}
                        onChange={handleChange}
                        className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">Default (WhatsApp)</option>
                        <option value="none">-- None / Disabled --</option>
                        <option value="phone">Mobile Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="address">Location / Address</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="snapchat">Snapchat</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="youtube">YouTube</option>
                        <option value="email">Email</option>
                        <option value="landline">Office Line</option>
                        <option value="website">Website</option>
                        <option value="delivery">Delivery</option>
                        <option value="wifi_password">WiFi Password</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                        Action Button 3 (Right)
                      </label>
                      <select
                        name="quick_action_3"
                        value={form.quick_action_3 || ''}
                        onChange={handleChange}
                        className="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">Default (Location)</option>
                        <option value="none">-- None / Disabled --</option>
                        <option value="phone">Mobile Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="address">Location / Address</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="snapchat">Snapchat</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="youtube">YouTube</option>
                        <option value="email">Email</option>
                        <option value="landline">Office Line</option>
                        <option value="website">Website</option>
                        <option value="delivery">Delivery</option>
                        <option value="wifi_password">WiFi Password</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Select Chips for Design 3 CTA Buttons */}
                  <div className="pt-3 border-t border-slate-200/80">
                    <span className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-2">
                      Quick Chips (Click to select up to 3 action buttons):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'phone', label: 'Phone' },
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'address', label: 'Location' },
                        { id: 'instagram', label: 'Instagram' },
                        { id: 'facebook', label: 'Facebook' },
                        { id: 'tiktok', label: 'TikTok' },
                        { id: 'snapchat', label: 'Snapchat' },
                        { id: 'linkedin', label: 'LinkedIn' },
                        { id: 'twitter', label: 'X (Twitter)' },
                        { id: 'youtube', label: 'YouTube' },
                        { id: 'email', label: 'Email' },
                        { id: 'website', label: 'Website' },
                        { id: 'delivery', label: 'Delivery' },
                        { id: 'wifi_password', label: 'WiFi' },
                      ].map(chip => {
                        const slot1 = form.quick_action_1 === '' ? 'phone' : form.quick_action_1;
                        const slot2 = form.quick_action_2 === '' ? 'whatsapp' : form.quick_action_2;
                        const slot3 = form.quick_action_3 === '' ? 'address' : form.quick_action_3;

                        const isSlot1 = slot1 === chip.id;
                        const isSlot2 = slot2 === chip.id;
                        const isSlot3 = slot3 === chip.id;
                        const isSelected = isSlot1 || isSlot2 || isSlot3;

                        const toggleChip = () => {
                          if (isSelected) {
                            setForm(prev => ({
                              ...prev,
                              quick_action_1: (prev.quick_action_1 || 'phone') === chip.id ? 'none' : prev.quick_action_1,
                              quick_action_2: (prev.quick_action_2 || 'whatsapp') === chip.id ? 'none' : prev.quick_action_2,
                              quick_action_3: (prev.quick_action_3 || 'address') === chip.id ? 'none' : prev.quick_action_3,
                            }));
                          } else {
                            setForm(prev => {
                              const s1 = prev.quick_action_1 || 'phone';
                              const s2 = prev.quick_action_2 || 'whatsapp';

                              if (!prev.quick_action_1 || prev.quick_action_1 === 'none') {
                                return { ...prev, quick_action_1: chip.id };
                              } else if (!prev.quick_action_2 || prev.quick_action_2 === 'none') {
                                return { ...prev, quick_action_2: chip.id };
                              } else {
                                return { ...prev, quick_action_3: chip.id };
                              }
                            });
                          }
                        };

                        return (
                          <button
                            key={`quick-chip-${chip.id}`}
                            type="button"
                            onClick={toggleChip}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-sans transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isSelected && <span className="mr-1 text-[10px]">✓</span>}
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div id="primary_action-field" className="border-t border-slate-150 pt-6">
                  <label htmlFor="primary-action-select" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                    Primary Action Button *
                  </label>
                  <div className="relative">
                    <select
                      id="primary-action-select"
                      name="primary_action"
                      value={form.primary_action}
                      onChange={handleChange}
                      className={`w-full h-12 pl-4 pr-10 bg-slate-50 rounded-xl border ${
                        fieldErrors.primary_action ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 hover:border-slate-300'
                      } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation appearance-none cursor-pointer shadow-2xs`}
                    >
                      {ACTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <InlineFieldError message={fieldErrors.primary_action} />
                  <p className="text-slate-600 text-[11px] mt-2 leading-relaxed font-sans">
                    The primary action will appear as a prominent CTA button on the card.
                  </p>

                  {/* Custom CTA Button Text */}
                  <div className="mt-4">
                    <label htmlFor="primary-action-label-input" className="block text-xs font-mono font-bold uppercase text-slate-700 tracking-wider mb-2">
                      Custom CTA Button Text <span className="text-slate-400 font-normal text-[10px] lowercase">(Optional)</span>
                    </label>
                    <input
                      id="primary-action-label-input"
                      type="text"
                      name="primary_action_label"
                      value={form.primary_action_label}
                      onChange={handleChange}
                      placeholder="e.g. Reserve a Table / Order on WhatsApp"
                      className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 transition-all text-sm font-sans touch-manipulation shadow-2xs focus:shadow-sm"
                    />
                    <p className="text-[10px] text-slate-500 font-sans mt-1.5 leading-relaxed">
                      If typed, this message will be used on the CTA button. If left empty, it will show the default message (e.g. &quot;Call Us Now&quot;, &quot;Chat on WhatsApp&quot;, etc.) based on the card language.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

              {/* Bottom Error Notification Banner */}
              {Object.keys(fieldErrors).length > 0 && (
                <div className="p-3.5 bg-red-50/90 border border-red-300 rounded-2xl text-xs text-red-900 flex items-center justify-between flex-wrap gap-2.5 my-3 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-medium text-red-950">
                      Form cannot be saved due to <strong>{Object.keys(fieldErrors).length} error(s)</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToField(Object.keys(fieldErrors)[0])}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-mono text-[11px] font-bold shrink-0 cursor-pointer transition-all shadow-2xs"
                  >
                    Jump to 1st Error ↑
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!editingSlug && existingSlugs.includes(slug)}
                className="w-full h-13 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all text-sm tracking-wide mt-2 flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer active:scale-98"
              >
                {editingSlug ? (
                  <>
                    <Check className="w-5 h-5" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> Provision Digital Card
                  </>
                )}
              </button>

              {/* NFC Programming URL Field */}
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <label htmlFor="nfc-card-link-input" className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    NFC Card Programming Link
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    NFC Target
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="nfc-card-link-input"
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/card/${slug || ''}` : `/card/${slug || ''}`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 h-11 px-3.5 bg-slate-800 text-slate-100 rounded-xl border border-slate-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 select-all cursor-pointer truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const urlToCopy = typeof window !== 'undefined' ? `${window.location.origin}/card/${slug || ''}` : `/card/${slug || ''}`;
                      navigator.clipboard.writeText(urlToCopy);
                      setCopiedNfcUrl(true);
                      setTimeout(() => setCopiedNfcUrl(false), 2000);
                    }}
                    className={`h-11 px-4 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      copiedNfcUrl
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 shadow-xs'
                    }`}
                  >
                    {copiedNfcUrl ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Link
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  Copy this link and write it onto your physical NFC card using any NFC programming tool (e.g., NFC Tools app).
                </p>
              </div>

              {/* Generate QR Code Section (Admin Panel Only) */}
              <div className="mt-4">
                <AdminQRCodeGenerator
                  slug={slug}
                  logoUrl={form.logo}
                  qrLogoEnabled={form.qr_logo_enabled ?? true}
                  onToggleQrLogo={(enabled) =>
                    setForm((prev) => ({ ...prev, qr_logo_enabled: enabled }))
                  }
                  themeColor={form.themeColor}
                  businessName={form.name}
                />
              </div>

              {editingSlug && (
                <div id="danger-zone" className="border-t border-slate-150 pt-6 mt-6">
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-950 font-serif">Danger Zone</h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed font-sans">
                        Permanently delete this card. This action is irreversible.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="delete-card-button"
                      onClick={() => setShowDeleteModal(true)}
                      className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Card
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Right Column: Live Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="text-center mb-4 flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              <Eye className="w-4 h-4 text-indigo-600" /> Live Render Preview
            </div>

            {/* Mobile Device Mockup Frame */}
            <div className="max-w-sm mx-auto bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
              <div className="bg-slate-50 rounded-[36px] overflow-hidden min-h-[580px] max-h-[640px] flex flex-col justify-between p-2 relative select-none">
                
                {/* Simulated Notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 pointer-events-none" />

                {/* Real-time 1:1 Card Render View */}
                <div className="w-full h-full overflow-y-auto rounded-[28px] scrollbar-thin">
                  <CardClient previewCard={form} isPreview={true} />
                </div>

                {/* Footer Brand */}
                <div className="text-center text-[8px] font-mono tracking-wider text-slate-400 uppercase mt-2 pb-1">
                  ⚡ NFC Card Live Render Engine
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Modal Overlay Components */}
        <AnimatePresence>
          {showLeaveConfirmModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                  Unsaved Progress
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  You have started configuring this digital card. If you go back to the Home Dashboard now, you will lose your unsaved changes. Are you sure you want to leave?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowLeaveConfirmModal(false);
                      router.push('/');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 h-12 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                  >
                    Yes, Discard and Leave
                  </button>
                  <button
                    onClick={() => {
                      setShowLeaveConfirmModal(false);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 h-12 rounded-xl font-medium transition-all text-sm cursor-pointer"
                  >
                    No, Keep Editing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {successCard && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center"
              >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                  {editingSlug ? 'Card Updated Successfully!' : 'Card Provisioned Successfully!'}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Digital landing page for <strong className="text-slate-800">{successCard.name}</strong> has been {editingSlug ? 'updated' : 'configured'} and is fully active.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 text-left mb-6">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5 font-bold">NFC Chip Target Link</span>
                  <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/60">
                    <span className="font-mono text-xs text-slate-700 truncate select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/card/${successCard.slug}` : `/card/${successCard.slug}`}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="shrink-0 p-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-md transition-colors"
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push(`/card/${successCard.slug}`)}
                    className="w-full bg-[#1B2A4A] text-white py-3 px-6 rounded-xl font-medium shadow-sm hover:bg-[#1B2A4A]/90 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> View Live Digital Card
                  </button>
                  <button
                    onClick={() => {
                      setSuccessCard(null);
                      setEditingSlug(null);
                    }}
                    className="w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm cursor-pointer"
                  >
                    {editingSlug ? 'Back to Portal' : 'Provision Another Client'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showConfirmModal && cardToConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200"
              >
                <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2 text-center">
                  {editingSlug ? 'Confirm Card Update' : 'Confirm New Card'}
                </h3>
                <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed">
                  Are you sure you want to {editingSlug ? 'save changes to' : 'completely add'} this digital card? Please review the details below.
                </p>

                {modalError && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-800 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 text-left mb-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Card Title / Name</span>
                    <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                      {cardToConfirm.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Custom URL Slug</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 truncate max-w-[200px]">
                      /card/{cardToConfirm.slug}
                    </span>
                  </div>

                  {cardToConfirm.tagline && (
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                        Tagline
                      </span>
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">
                        {cardToConfirm.tagline}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Theme Color</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 uppercase">{cardToConfirm.themeColor}</span>
                      <div 
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: cardToConfirm.themeColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmSave}
                    disabled={isSaving}
                    className="w-full bg-[#1B2A4A] hover:bg-[#1B2A4A]/95 disabled:opacity-60 text-white py-3.5 px-6 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving & Provisioning...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Yes, Save and Provision
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!isSaving) {
                        setShowConfirmModal(false);
                        setCardToConfirm(null);
                      }
                    }}
                    disabled={isSaving}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-medium transition-all text-sm cursor-pointer disabled:opacity-50"
                  >
                    Cancel, Make Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showDeleteModal && editingSlug && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center"
              >
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                  Delete Client Card
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{form.name || 'this card'}</strong>? This action is irreversible.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 text-left mb-6">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1">Target Endpoint</span>
                  <span className="font-mono text-xs font-bold text-red-600">/card/{editingSlug}</span>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3.5 px-6 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting Card...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Yes, Permanently Delete
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!isDeleting) {
                        setShowDeleteModal(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-medium transition-all text-sm cursor-pointer disabled:opacity-50"
                  >
                    No, Keep Card
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {cropImageSrc && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">
                      Format {cropTarget === 'photo' ? 'Headshot Photo' : 'Logo'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Drag to center, scale to crop
                    </p>
                  </div>
                  <button 
                    onClick={handleCancelCrop}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div 
                    className="relative w-[256px] h-[256px] overflow-hidden rounded-2xl bg-slate-900 border border-slate-300 shadow-inner select-none cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    onDoubleClick={handleResetCrop}
                    title="Drag to reposition, mouse wheel to zoom, double-click to reset"
                  >
                    <img
                      src={cropImageSrc}
                      alt="Crop preview"
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: imgDimensions.width,
                        height: imgDimensions.height,
                        left: 0,
                        top: 0,
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0'
                      }}
                      onLoad={handleImageLoad}
                    />

                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="absolute w-[200px] h-[200px] rounded-full border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] pointer-events-none" />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <span>💡 Drag image to pan • Scroll wheel to zoom</span>
                  </p>

                  <div className="w-full mt-4 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Resulting Preview</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        This is how your cropped image will be rendered on the card.
                      </p>
                    </div>
                    <div className="relative w-14 h-14 rounded-full border border-slate-200 bg-white flex-shrink-0 overflow-hidden shadow-xs">
                      <img
                        src={cropImageSrc}
                        alt="Live crop preview"
                        className="absolute max-w-none pointer-events-none"
                        style={{
                          width: imgDimensions.width * 0.28 * zoom,
                          height: imgDimensions.height * 0.28 * zoom,
                          left: (offset.x - 28) * 0.28,
                          top: (offset.y - 28) * 0.28,
                          transformOrigin: '0 0'
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-full mt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                      <span>ZOOM LEVEL</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                        className="p-1.5 hover:bg-white text-slate-600 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="0.5"
                        max={MAX_ZOOM}
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(Number(parseFloat(e.target.value).toFixed(2)))}
                        className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom(prev => Math.min(MAX_ZOOM, Number((prev + 0.1).toFixed(2))))}
                        className="p-1.5 hover:bg-white text-slate-600 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center pt-1">
                      <button
                        type="button"
                        onClick={handleResetCrop}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                        title="Reset crop position and zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset position & zoom
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleApplyCrop}
                    className="w-full bg-[#1B2A4A] hover:bg-[#1B2A4A]/95 text-white py-3 px-6 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Apply Crop
                  </button>
                  <button
                    onClick={handleCancelCrop}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-medium transition-all text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Top-Level Card Type Picker Popup */}
          {showTypePickerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {pickerStep === 'professional_sub' && (
                      <button
                        type="button"
                        onClick={() => setPickerStep('top')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                        title="Back to card types"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <h3 className="font-serif text-xl font-extrabold text-slate-900">
                        {pickerStep === 'top' ? 'Select Digital Card Type' : 'Select Professional Design Style'}
                      </h3>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        {pickerStep === 'top' 
                          ? 'Choose the structural card template for your profile or business'
                          : 'Choose between Design 1 (Sloped Header) and Design 2 (Flat Header)'
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTypePickerModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {pickerStep === 'top' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Professional Type Option */}
                    <button
                      type="button"
                      onClick={() => setPickerStep('professional_sub')}
                      className="group text-left p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Personal / Executive
                          </span>
                          <User className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-900">
                          Professional
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Classic digital business card layout with customizable header graphic, personal title, action button, and direct contact options.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Choose Layout Style</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* Business Type Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, layout: 'business' }));
                        setShowTypePickerModal(false);
                      }}
                      className="group text-left p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Store / Commerce
                          </span>
                          <Building2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-emerald-900">
                          Business
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Link-in-bio style card featuring clean stacked rows for PDF menu download, TikTok, Instagram, WhatsApp, location, and contacts.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span>Use Business Layout</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Design 1 Sub-Choice */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, layout: 'design1' }));
                        setShowTypePickerModal(false);
                      }}
                      className="group text-left p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Design 1
                          </span>
                          <Sparkles className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-900">
                          Sloped Header
                        </h4>
                        <div className="h-12 w-full rounded-xl overflow-hidden relative border border-slate-200 shadow-inner" style={{ backgroundColor: form.themeColor || '#1B2A4A' }}>
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-4 bg-white" 
                            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} 
                          />
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Dynamic angled sloped transition under header avatar.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Select Design 1</span>
                        <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>

                    {/* Design 2 Sub-Choice */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, layout: 'design2' }));
                        setShowTypePickerModal(false);
                      }}
                      className="group text-left p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Design 2
                          </span>
                          <Sparkles className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-900">
                          Formal Flat Header
                        </h4>
                        <div className="h-12 w-full rounded-xl overflow-hidden relative border border-slate-200 shadow-inner" style={{ backgroundColor: form.themeColor || '#1B2A4A' }} />
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Clean horizontal flat header graphic with centered overlay avatar.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Select Design 2</span>
                        <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>

                    {/* Design 3 Sub-Choice */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, layout: 'design3' }));
                        setShowTypePickerModal(false);
                      }}
                      className="group text-left p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Design 3
                          </span>
                          <Sparkles className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-900">
                          Cover Banner
                        </h4>
                        <div className="h-12 w-full rounded-xl overflow-hidden relative border border-slate-200 bg-slate-200 shadow-inner">
                          {form.cover_photo_url ? (
                            <img src={form.cover_photo_url} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-white font-mono">
                              Cover Photo
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          Cover photo banner header with card-based structured sections.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Select Design 3</span>
                        <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
