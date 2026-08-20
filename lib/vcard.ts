import { BusinessCard } from './types';

// Helper to sanitize phone numbers for vCard tel property
function sanitizePhone(raw: string): string {
  if (!raw) return '';
  return raw.trim();
}

export function downloadVCard(card: BusinessCard) {
  const name = card.name || 'Contact';
  const tagline = card.tagline || '';
  const primaryPhone = card.phone ? sanitizePhone(card.phone) : '';
  const primaryLandline = card.landline ? sanitizePhone(card.landline) : '';
  const primaryWhatsapp = card.whatsapp ? sanitizePhone(card.whatsapp) : '';
  const email = card.email ? card.email.trim() : '';
  const address = card.address ? card.address.replace(/\n/g, ', ').trim() : '';
  const website = card.website ? card.website.trim() : '';
  const instagram = card.instagram ? card.instagram.trim() : '';
  const facebook = card.facebook ? card.facebook.trim() : '';
  const tiktok = card.tiktok ? card.tiktok.trim() : '';
  const snapchat = card.snapchat ? card.snapchat.trim() : '';
  const linkedin = card.linkedin ? card.linkedin.trim() : '';
  const twitter = card.twitter ? card.twitter.trim() : '';
  const youtube = card.youtube ? card.youtube.trim() : '';

  const multiLinks = card.multi_links && typeof card.multi_links === 'object' ? card.multi_links : {};

  let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\n`;
  if (name) vcard += `ORG:${name}\n`;
  if (tagline) vcard += `TITLE:${tagline}\n`;

  // Track added phone numbers to prevent identical duplicate entries
  const addedNumbers = new Set<string>();

  // 1. Primary Mobile Phone
  if (primaryPhone) {
    const clean = primaryPhone.replace(/[\s-]/g, '');
    addedNumbers.add(clean);
    const label = card.phone_sub_label || card.mobile_label || 'Mobile';
    vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${primaryPhone}\n`;
  }

  // 2. Extra Mobile Phone Sub-Buttons (multi_links.phone)
  const extraPhones = Array.isArray(multiLinks.phone) ? multiLinks.phone : [];
  extraPhones.forEach((item, idx) => {
    const val = item?.value ? sanitizePhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = item.label?.trim() || `Mobile ${idx + 2}`;
        vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${val}\n`;
      }
    }
  });

  // 3. Primary Landline (Fixe)
  if (primaryLandline) {
    const clean = primaryLandline.replace(/[\s-]/g, '');
    if (!addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = card.landline_sub_label || card.landline_label || 'Work';
      vcard += `TEL;TYPE=WORK,VOICE;X-ABLabel=${label}:${primaryLandline}\n`;
    }
  }

  // 4. Extra Landline Sub-Buttons (multi_links.landline)
  const extraLandlines = Array.isArray(multiLinks.landline) ? multiLinks.landline : [];
  extraLandlines.forEach((item, idx) => {
    const val = item?.value ? sanitizePhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = item.label?.trim() || `Landline ${idx + 2}`;
        vcard += `TEL;TYPE=WORK,VOICE;X-ABLabel=${label}:${val}\n`;
      }
    }
  });

  // 5. Primary WhatsApp
  if (primaryWhatsapp) {
    const clean = primaryWhatsapp.replace(/[\s-]/g, '');
    if (!addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = card.whatsapp_sub_label || card.whatsapp_label || 'WhatsApp';
      vcard += `TEL;TYPE=CELL;X-ABLabel=${label}:${primaryWhatsapp}\n`;
    }
    // Also include specialized WhatsApp vCard field
    vcard += `X-WHATSAPP:${primaryWhatsapp}\n`;
  }

  // 6. Extra WhatsApp Sub-Buttons (multi_links.whatsapp)
  const extraWhatsapps = Array.isArray(multiLinks.whatsapp) ? multiLinks.whatsapp : [];
  extraWhatsapps.forEach((item, idx) => {
    const val = item?.value ? sanitizePhone(item.value) : '';
    if (val) {
      const clean = val.replace(/[\s-]/g, '');
      if (!addedNumbers.has(clean)) {
        addedNumbers.add(clean);
        const label = item.label?.trim() || `WhatsApp ${idx + 2}`;
        vcard += `TEL;TYPE=CELL;X-ABLabel=${label}:${val}\n`;
      }
    }
  });

  // 7. Delivery Number if enabled
  if (card.delivery_enabled && card.delivery_number) {
    const deliveryNum = sanitizePhone(card.delivery_number);
    const clean = deliveryNum.replace(/[\s-]/g, '');
    if (!addedNumbers.has(clean)) {
      addedNumbers.add(clean);
      const label = card.delivery_label?.trim() || 'Delivery';
      vcard += `TEL;TYPE=WORK;X-ABLabel=${label}:${deliveryNum}\n`;
    }
  }

  // 8. Primary Email & Multi Email Links
  if (email) {
    const label = card.email_sub_label || card.email_label || 'Email';
    vcard += `EMAIL;TYPE=INTERNET;X-ABLabel=${label}:${email}\n`;
  }
  const extraEmails = Array.isArray(multiLinks.email) ? multiLinks.email : [];
  extraEmails.forEach((item, idx) => {
    const val = item?.value?.trim();
    if (val) {
      const label = item.label?.trim() || `Email ${idx + 2}`;
      vcard += `EMAIL;TYPE=INTERNET;X-ABLabel=${label}:${val}\n`;
    }
  });

  // 9. Address
  if (address) {
    vcard += `ADR;TYPE=WORK:;;${address};;;;\n`;
  }

  // 10. Primary Website & Multi Website Links
  if (website) {
    const formattedWeb = website.startsWith('http') ? website : `https://${website}`;
    const label = card.website_sub_label || card.website_label || 'Website';
    vcard += `URL;X-ABLabel=${label}:${formattedWeb}\n`;
  }
  const extraWebsites = Array.isArray(multiLinks.website) ? multiLinks.website : [];
  extraWebsites.forEach((item, idx) => {
    const val = item?.value?.trim();
    if (val) {
      const formatted = val.startsWith('http') ? val : `https://${val}`;
      const label = item.label?.trim() || `Website ${idx + 2}`;
      vcard += `URL;X-ABLabel=${label}:${formatted}\n`;
    }
  });

  // 11. Social Profiles
  if (instagram) {
    const cleanInsta = instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`;
    vcard += `X-SOCIALPROFILE;TYPE=instagram:${cleanInsta}\n`;
  }
  if (facebook) {
    const cleanFb = facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`;
    vcard += `X-SOCIALPROFILE;TYPE=facebook:${cleanFb}\n`;
  }
  if (tiktok) {
    const cleanTt = tiktok.startsWith('http') ? tiktok : `https://tiktok.com/@${tiktok.replace('@', '')}`;
    vcard += `X-SOCIALPROFILE;TYPE=tiktok:${cleanTt}\n`;
  }
  if (snapchat) {
    const cleanSc = snapchat.startsWith('http') ? snapchat : `https://snapchat.com/add/${snapchat.replace('@', '')}`;
    vcard += `X-SOCIALPROFILE;TYPE=snapchat:${cleanSc}\n`;
  }
  if (linkedin) {
    const cleanLi = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`;
    vcard += `X-SOCIALPROFILE;TYPE=linkedin:${cleanLi}\n`;
  }
  if (twitter) {
    const cleanTw = twitter.startsWith('http') ? twitter : `https://x.com/${twitter.replace('@', '')}`;
    vcard += `X-SOCIALPROFILE;TYPE=twitter:${cleanTw}\n`;
  }
  if (youtube) {
    const cleanYt = youtube.startsWith('http') ? youtube : `https://youtube.com/${youtube.startsWith('@') ? youtube : `@${youtube}`}`;
    vcard += `X-SOCIALPROFILE;TYPE=youtube:${cleanYt}\n`;
  }

  // 12. WiFi note if available
  if (card.wifi_password) {
    vcard += `NOTE:WiFi Password: ${card.wifi_password}\n`;
  }

  vcard += `END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'contact';
  link.download = `${safeFilename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadDeliveryVCard(card: BusinessCard) {
  const name = card.name || 'Contact';
  const label = card.delivery_label || 'Delivery';
  
  const contactName = `${name} / ${label}`;
  const phone = card.delivery_number ? sanitizePhone(card.delivery_number) : '';

  let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\n`;
  if (name) vcard += `ORG:${name}\n`;
  vcard += `TITLE:${label}\n`;
  if (phone) vcard += `TEL;TYPE=CELL,VOICE;X-ABLabel=${label}:${phone}\n`;
  vcard += `END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = `${name}_${label}`.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'delivery_contact';
  link.download = `${safeFilename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

