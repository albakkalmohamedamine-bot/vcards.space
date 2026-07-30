export type BusinessTheme = 'indigo' | 'rust' | 'sage';

export type PrimaryActionType = 'phone' | 'landline' | 'whatsapp' | 'email' | 'address' | 'website' | 'instagram' | 'facebook' | 'tiktok';

export type BusinessLanguage = 'en' | 'fr' | 'ar';

export type CardLayout = 'design1' | 'design2' | 'business';

export interface BusinessCard {
  slug: string;
  name: string;          // Business Name
  tagline: string;       // Business Tagline / Slogan
  themeColor: string;    // Custom Hex color code
  logo?: string;         // Base64 or URL logo data
  theme?: BusinessTheme; // Deprecated, kept for backward compatibility
  language?: BusinessLanguage; // 'en' | 'fr' | 'ar'
  layout?: CardLayout;   // 'design1' (Dynamic Sloped Header), 'design2' (Formal Flat Header), or 'business' (Link List Format)
  phone: string;
  landline?: string;     // Landline / Fixed Phone (Téléphone Fixe)
  whatsapp: string;
  email: string;
  address: string;
  address_type?: 'address' | 'text'; // 'address' for physical address, 'text' for custom normal text
  google_maps?: string; // Google Maps URL or search query when address_type is 'text'
  instagram: string;
  facebook: string;
  tiktok?: string;
  website: string;
  primary_action: PrimaryActionType;
  primary_action_label?: string; // Custom CTA button text. If empty, falls back to default action text.
  avatar_border_radius?: number; // Border radius percentage for avatar (5 to 50)

  // Business Card Type specific link row fields:
  menu_pdf?: string;          // PDF file data URL for Menu
  menu_pdf_name?: string;     // PDF file display name
  menu_label?: string;        // Default: "Our Menu"
  instagram_label?: string;   // Default: "Instagram"
  facebook_label?: string;    // Default: "Facebook"
  tiktok_label?: string;      // Default: "TikTok"
  whatsapp_label?: string;    // Default: "WhatsApp"
  email_label?: string;       // Default: "Email"
  localisation_label?: string;// Default: "Location"
  website_label?: string;     // Default: "Website"
  mobile_label?: string;      // Default: "Call Us"
  landline_label?: string;    // Default: "Office Line"
  // QR Code Settings
  qr_logo_enabled?: boolean;  // Stores whether this business's QR code should have their logo embedded (default: true)
}

