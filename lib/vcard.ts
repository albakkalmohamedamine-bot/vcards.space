import { BusinessCard } from './types';

export function downloadVCard(card: BusinessCard) {
  const name = card.name || 'Contact';
  const tagline = card.tagline || '';
  const phone = card.phone ? card.phone.trim() : '';
  const landline = card.landline ? card.landline.trim() : '';
  const whatsapp = card.whatsapp ? card.whatsapp.trim() : '';
  const email = card.email ? card.email.trim() : '';
  const address = card.address ? card.address.replace(/\n/g, ', ').trim() : '';
  const website = card.website ? card.website.trim() : '';
  const instagram = card.instagram ? card.instagram.trim() : '';
  const facebook = card.facebook ? card.facebook.trim() : '';
  const tiktok = card.tiktok ? card.tiktok.trim() : '';

  let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\n`;
  if (name) vcard += `ORG:${name}\n`;
  if (tagline) vcard += `TITLE:${tagline}\n`;
  if (phone) vcard += `TEL;TYPE=CELL,VOICE:${phone}\n`;
  if (landline) vcard += `TEL;TYPE=WORK,VOICE:${landline}\n`;
  if (whatsapp) vcard += `TEL;TYPE=WHATSAPP:${whatsapp}\n`;
  if (email) vcard += `EMAIL;TYPE=INTERNET:${email}\n`;
  if (address) vcard += `ADR;TYPE=WORK:;;${address};;;;\n`;
  if (website) vcard += `URL:${website}\n`;
  if (instagram) vcard += `X-SOCIALPROFILE;TYPE=instagram:${instagram}\n`;
  if (facebook) vcard += `X-SOCIALPROFILE;TYPE=facebook:${facebook}\n`;
  if (tiktok) vcard += `X-SOCIALPROFILE;TYPE=tiktok:${tiktok}\n`;
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
  const phone = card.delivery_number ? card.delivery_number.trim() : '';

  let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\n`;
  if (name) vcard += `ORG:${name}\n`;
  vcard += `TITLE:${label}\n`;
  if (phone) vcard += `TEL;TYPE=CELL,VOICE:${phone}\n`;
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
