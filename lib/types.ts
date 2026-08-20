export type BusinessTheme = 'indigo' | 'rust' | 'sage';

export type PrimaryActionType = 'phone' | 'landline' | 'whatsapp' | 'email' | 'address' | 'website' | 'instagram' | 'facebook' | 'tiktok' | 'snapchat' | 'linkedin' | 'twitter' | 'youtube';

export type BusinessLanguage = 'en' | 'fr' | 'ar' | 'de' | 'es' | 'nl';

export type CardLayout = 'design1' | 'design2' | 'design3' | 'business';

export interface ExtraLinkItem {
  id?: string;
  value: string;
  label?: string;
}

export type MultiLinksMap = {
  [key: string]: ExtraLinkItem[];
};

export interface BusinessCard {
  slug: string;
  name: string;          // Business Name
  tagline: string;       // Business Tagline / Slogan
  themeColor: string;    // Custom Hex color code
  logo?: string;         // Base64 or URL logo data
  cover_photo_url?: string; // Cover photo URL or Base64 data for Design 3
  theme?: BusinessTheme; // Deprecated, kept for backward compatibility
  language?: BusinessLanguage; // 'en' | 'fr' | 'ar'
  layout?: CardLayout;   // 'design1' (Dynamic Sloped Header), 'design2' (Formal Flat Header), 'design3' (Cover Photo Banner), or 'business' (Link List Format)
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
  snapchat?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website: string;
  primary_action: PrimaryActionType;
  primary_action_label?: string; // Custom CTA button text. If empty, falls back to default action text.
  avatar_border_radius?: number; // Border radius percentage for avatar (5 to 50)

  // Business Card Type specific link row fields:
  menu_pdf?: string;          // PDF file data URL for Menu
  menu_pdf_name?: string;     // PDF file display name
  menu_label?: string;        // Default: "Our Menu"
  wifi_password?: string;     // WiFi Password for Business Card Type
  wifi_password_label?: string;// Default: "WiFi Password"
  instagram_label?: string;   // Default: "Instagram"
  facebook_label?: string;    // Default: "Facebook"
  tiktok_label?: string;      // Default: "TikTok"
  snapchat_label?: string;    // Default: "Snapchat"
  linkedin_label?: string;    // Default: "LinkedIn"
  twitter_label?: string;     // Default: "X (Twitter)"
  youtube_label?: string;     // Default: "YouTube"
  whatsapp_label?: string;    // Default: "WhatsApp"
  email_label?: string;       // Default: "Email"
  localisation_label?: string;// Default: "Location"
  website_label?: string;     // Default: "Website"
  mobile_label?: string;      // Default: "Call Us"
  landline_label?: string;    // Default: "Office Line"

  // Dedicated Sub-Labels for Primary Link (Inside Pop-up Window when multi-links exist)
  instagram_sub_label?: string;
  facebook_sub_label?: string;
  tiktok_sub_label?: string;
  snapchat_sub_label?: string;
  linkedin_sub_label?: string;
  twitter_sub_label?: string;
  youtube_sub_label?: string;
  whatsapp_sub_label?: string;
  email_sub_label?: string;
  address_sub_label?: string;
  website_sub_label?: string;
  phone_sub_label?: string;
  landline_sub_label?: string;
  // QR Code Settings
  qr_logo_enabled?: boolean;  // Stores whether this business's QR code should have their logo embedded (default: true)

  // Rate Us / Google Reviews Settings
  rate_us_enabled?: boolean;  // Enables 5 Golden Stars rating button
  review_url?: string;       // Custom Google Review / Rating URL
  rate_us_label?: string;    // Custom label for Rate Us button (Default: "Rate Us")

  // Delivery Settings
  delivery_enabled?: boolean;
  delivery_number?: string;
  delivery_label?: string; // Default: "Delivery"

  // Priority Button Ordering
  first_priority_field?: string; // Field ID selected to be the 1st button in the card's buttons list

  // Design 3 Header Quick Action Buttons (up to 3 icons in top header)
  quick_action_1?: string;
  quick_action_2?: string;
  quick_action_3?: string;

  // Multi Links & Numbers (for Business Card Layout)
  multi_links?: MultiLinksMap;
}

