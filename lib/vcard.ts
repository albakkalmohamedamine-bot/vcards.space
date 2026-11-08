import { BusinessCard } from './types';

// RFC 2426 vCard 3.0 sanitization helpers to prevent vCard CRLF / Header injection

function sanitizeVCardText(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/[\r\n]+/g, ' ') // Strip newlines completely
    .replace(/\\/g, '\\\\')    // Escape backslashes
    .replace(/;/g, '\\;')      // Escape semicolons
    .replace(/,/g, '\\,')      // Escape commas
    .trim();
}

function sanitizeVCardLabel(raw?: string | null): string {
  if (!raw) return '';
  // X-ABLabel parameter must not contain newlines, colons, semicolons, or quotes
  return String(raw)
    .replace(/[\r\n:;="']+/g, ' ')
    .trim();
}

function sanitizeVCardPhone(raw?: string | null): string {
  if (!raw) return '';
  // Strictly allow only valid phone digits, spaces, parentheses, hyphens, and leading plus
  const stripped = String(raw).replace(/[\r\n]+/g, '').trim();
  return stripped.replace(/[^0-9+\s().-]/g, '');
}

function sanitizeVCardEmail(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw).replace(/[\r\n\s]+/g, '').trim();
  // Reject email if it contains vCard delimiters or protocol injection
  if (!cleaned.includes('@') || cleaned.includes(':') || cleaned.includes(';') || cleaned.includes('"')) {
    return '';
  }
  return cleaned;
}

function sanitizeVCardUrl(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = String(raw).replace(/[\r\n\s]+/g, '').trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return '';
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function downloadVCard(card: BusinessCard) {
  const name = sanitizeVCardText(card.name) || 'Contact';
  const tagline = sanitizeVCardText(card.tagline);
  const primaryPhone = sanitizeVCardPhone(card.phone);
  const primaryLandline = sanitizeVCardPhone(card.landline);
  const primaryWhatsapp = sanitizeVCardPhone(card.whatsapp);
  const email = sanitizeVCardEmail(card.email);
  const address = sanitizeVCardText(card.address ? card.address.replace(/\n/g, ', ') : '');
  const website = sanitizeVCardUrl(card.website);
  const instagram = sanitizeVCardUrl(card.instagram ? (card.instagram.startsWith('http') ? card.instagram : `https://instagram.com/${card.instagram.replace('@', '')}`) : '');
  const facebook = sanitizeVCardUrl(card.facebook ? (card.facebook.startsWith('http') ? card.facebook : `https://facebook.com/${card.facebook}`) : '');
  const tiktok = sanitizeVCardUrl(card.tiktok ? (card.tiktok.startsWith('http') ? card.tiktok : `https://tiktok.com/@${card.tiktok.replace('@', '')}`) : '');
  const snapchat = sanitizeVCardUrl(card.snapchat ? (card.snapchat.startsWith('http') ? card.snapchat : `https://snapchat.com/add/${card.snapchat.replace('@', '')}`) : '');
  const linkedin = sanitizeVCardUrl(card.linkedin ? (card.linkedin.startsWith('http') ? card.linkedin : `https://linkedin.com/in/${card.linkedin}`) : '');
  const twitter = sanitizeVCardUrl(card.twitter ? (card.twitter.startsWith('http') ? card.twitter : `https://x.com/${card.twitter.replace('@', '')}`) : '');
  const youtube = sanitizeVCardUrl(card.youtube ? (card.youtube.startsWith('http') ? card.youtube : `https://youtube.com/${card.youtube.startsWith('@') ? card.youtube : `@${card.youtube}`}`) : '');

  const multiLinks = card.multi_links && typeof card.multi_links === 'object' ? card.multi_links : {};

  let vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:;${name};;;\r\nFN:${name}\r\n`;
  if (name) vcard += `ORG:${name}\r\n`;
  if (tagline) vcard += `TITLE:${tagline}\r\n`;

  // Track added phone numbers to prevent duplicate entries
  const addedNumbers = new Set<string>();

  // 1. Primary Mobile Phone
  if (primaryPhone) {
    const clean = primaryPhone.replace(/[\s().-]/g, '');
    addedNumbers.add(clean);
    const label = sanitizeVCardLabel(card.phone_sub_label || card.mobile_label) || 'Mobile';
    vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${primaryPhone}\r\n`;
  }

  // 2. Extra Mobile Phone Sub-Buttons (multi_links.phone)
  const extraPhones = Array.isArray(multiLinks.phone) ? multiLinks.phone : [];
  extraPhones.forEach((item, idx) => {
    const val = item?.value ? sanitizeVCardPhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s().-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = sanitizeVCardLabel(item.label) || `Mobile ${idx + 2}`;
        vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${val}\r\n`;
      }
    }
  });

  // 3. Primary Landline (Fixe)
  if (primaryLandline) {
    const clean = primaryLandline.replace(/[\s().-]/g, '');
    if (!addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = sanitizeVCardLabel(card.landline_sub_label || card.landline_label) || 'Work';
      vcard += `TEL;TYPE=WORK,VOICE;X-ABLabel=${label}:${primaryLandline}\r\n`;
    }
  }

  // 4. Extra Landline Sub-Buttons (multi_links.landline)
  const extraLandlines = Array.isArray(multiLinks.landline) ? multiLinks.landline : [];
  extraLandlines.forEach((item, idx) => {
    const val = item?.value ? sanitizeVCardPhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s().-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = sanitizeVCardLabel(item.label) || `Landline ${idx + 2}`;
        vcard += `TEL;TYPE=WORK,VOICE;X-ABLabel=${label}:${val}\r\n`;
      }
    }
  });

  // 5. Primary WhatsApp
  if (primaryWhatsapp) {
    const clean = primaryWhatsapp.replace(/[\s().-]/g, '');
    if (!addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = sanitizeVCardLabel(card.whatsapp_sub_label || card.whatsapp_label) || 'WhatsApp';
      vcard += `TEL;TYPE=CELL;X-ABLabel=${label}:${primaryWhatsapp}\r\n`;
    }
    vcard += `X-WHATSAPP:${primaryWhatsapp}\r\n`;
  }

  // 6. Extra WhatsApp Sub-Buttons (multi_links.whatsapp)
  const extraWhatsapps = Array.isArray(multiLinks.whatsapp) ? multiLinks.whatsapp : [];
  extraWhatsapps.forEach((item, idx) => {
    const val = item?.value ? sanitizeVCardPhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s().-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = sanitizeVCardLabel(item.label) || `WhatsApp ${idx + 2}`;
        vcard += `TEL;TYPE=CELL;X-ABLabel=${label}:${val}\r\n`;
      }
    }
  });

  // 7. Delivery Number if enabled
  if (card.delivery_enabled && card.delivery_number) {
    const deliveryNum = sanitizeVCardPhone(card.delivery_number);
    const clean = deliveryNum.replace(/[\s().-]/g, '');
    if (clean && !addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = sanitizeVCardLabel(card.delivery_label) || 'Delivery';
      vcard += `TEL;TYPE=WORK;X-ABLabel=${label}:${deliveryNum}\r\n`;
    }
  }

  // 8. Primary Email & Multi Email Links
  if (email) {
    const label = sanitizeVCardLabel(card.email_sub_label || card.email_label) || 'Email';
    vcard += `EMAIL;TYPE=INTERNET;X-ABLabel=${label}:${email}\r\n`;
  }
  const extraEmails = Array.isArray(multiLinks.email) ? multiLinks.email : [];
  extraEmails.forEach((item, idx) => {
    const val = item?.value ? sanitizeVCardEmail(item.value) : '';
    if (val) {
      const label = sanitizeVCardLabel(item.label) || `Email ${idx + 2}`;
      vcard += `EMAIL;TYPE=INTERNET;X-ABLabel=${label}:${val}\r\n`;
    }
  });

  // 9. Address
  if (address) {
    vcard += `ADR;TYPE=WORK:;;${address};;;;\r\n`;
  }

  // 10. Primary Website & Multi Website Links
  if (website) {
    const label = sanitizeVCardLabel(card.website_sub_label || card.website_label) || 'Website';
    vcard += `URL;X-ABLabel=${label}:${website}\r\n`;
  }
  const extraWebsites = Array.isArray(multiLinks.website) ? multiLinks.website : [];
  extraWebsites.forEach((item, idx) => {
    const val = item?.value ? sanitizeVCardUrl(item.value) : '';
    if (val) {
      const label = sanitizeVCardLabel(item.label) || `Website ${idx + 2}`;
      vcard += `URL;X-ABLabel=${label}:${val}\r\n`;
    }
  });

  // 11. Social Profiles
  if (instagram) vcard += `X-SOCIALPROFILE;TYPE=instagram:${instagram}\r\n`;
  if (facebook) vcard += `X-SOCIALPROFILE;TYPE=facebook:${facebook}\r\n`;
  if (tiktok) vcard += `X-SOCIALPROFILE;TYPE=tiktok:${tiktok}\r\n`;
  if (snapchat) vcard += `X-SOCIALPROFILE;TYPE=snapchat:${snapchat}\r\n`;
  if (linkedin) vcard += `X-SOCIALPROFILE;TYPE=linkedin:${linkedin}\r\n`;
  if (twitter) vcard += `X-SOCIALPROFILE;TYPE=twitter:${twitter}\r\n`;
  if (youtube) vcard += `X-SOCIALPROFILE;TYPE=youtube:${youtube}\r\n`;

  // 12. WiFi note if available
  if (card.wifi_password) {
    const safeWifi = sanitizeVCardText(card.wifi_password);
    if (safeWifi) {
      vcard += `NOTE:WiFi Password: ${safeWifi}\r\n`;
    }
  }

  vcard += `END:VCARD\r\n`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = card.name?.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'contact';
  link.download = `${safeFilename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadDeliveryVCard(card: BusinessCard) {
  const name = sanitizeVCardText(card.name) || 'Contact';
  const label = sanitizeVCardLabel(card.delivery_label) || 'Delivery';
  
  const contactName = `${name} / ${label}`;
  const phone = sanitizeVCardPhone(card.delivery_number);

  let vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:;${contactName};;;\r\nFN:${contactName}\r\n`;
  if (name) vcard += `ORG:${name}\r\n`;
  vcard += `TITLE:${label}\r\n`;
  if (phone) vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${phone}\r\n`;
  vcard += `END:VCARD\r\n`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = `${card.name || 'contact'}_${label}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'delivery_contact';
  link.download = `${safeFilename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
