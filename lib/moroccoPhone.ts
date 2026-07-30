import { parsePhoneNumber, formatFullPhoneNumber, displayPhoneNumber, DEFAULT_COUNTRY } from './countryCodes';

export function extractLocalMoroccanNumber(rawPhone: string): string {
  const { localNumber } = parsePhoneNumber(rawPhone);
  return localNumber;
}

export function formatFullMoroccanNumber(localPhone: string): string {
  return formatFullPhoneNumber(DEFAULT_COUNTRY.dialCode, localPhone);
}

export function displayMoroccanNumber(rawPhone: string): string {
  return displayPhoneNumber(rawPhone);
}
