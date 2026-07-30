export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const DEFAULT_COUNTRY: CountryCode = {
  code: 'MA',
  name: 'Morocco',
  dialCode: '+212',
  flag: '🇲🇦',
};

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'United States / Canada', dialCode: '+1', flag: '🇺🇸' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', dialCode: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
];

/**
 * Parses a full phone number string into dialCode and localNumber.
 * Defaults dialCode to +212 if missing or unrecognized.
 */
export function parsePhoneNumber(fullPhone: string): { dialCode: string; localNumber: string } {
  if (!fullPhone) return { dialCode: DEFAULT_COUNTRY.dialCode, localNumber: '' };

  let cleaned = fullPhone.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return { dialCode: DEFAULT_COUNTRY.dialCode, localNumber: '' };

  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    } else if (cleaned.startsWith('212')) {
      cleaned = '+' + cleaned;
    } else {
      // Default to Morocco if it looks like a local Moroccan number
      while (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
      return { dialCode: DEFAULT_COUNTRY.dialCode, localNumber: cleaned };
    }
  }

  // Sort dial codes by descending length to match longer codes first (e.g. +212 before +2)
  const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sortedCountries.find(c => cleaned.startsWith(c.dialCode));

  if (match) {
    let local = cleaned.slice(match.dialCode.length);
    while (local.startsWith('0')) local = local.slice(1);
    return { dialCode: match.dialCode, localNumber: local };
  }

  // Fallback: extract numbers after +
  return { dialCode: DEFAULT_COUNTRY.dialCode, localNumber: cleaned.replace(/^\+/, '') };
}

/**
 * Combines dialCode and local number into international format e.g. "+212612345678"
 */
export function formatFullPhoneNumber(dialCode: string, localNumber: string): string {
  let cleaned = (localNumber || '').trim().replace(/[^\d]/g, '');
  while (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  if (!cleaned) return '';
  const prefix = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return `${prefix}${cleaned}`;
}

/**
 * Pretty-prints phone number for display
 */
export function displayPhoneNumber(fullPhone: string): string {
  const { dialCode, localNumber } = parsePhoneNumber(fullPhone);
  if (!localNumber) return fullPhone || '';
  return `${dialCode} ${localNumber}`;
}
