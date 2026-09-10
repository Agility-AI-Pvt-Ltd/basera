/** Indian mobile: 10 digits starting with 6–9 */
export function isValidIndianMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

/** E.164 for Supabase phone auth (+91…) */
export function toE164Indian(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  return `+91${digits}`;
}

/** Strip country code for 10-digit Indian display */
export function fromE164Indian(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits;
}

export function maskIndianMobile(phone: string): string {
  if (phone.length < 4) return phone;
  const visible = phone.slice(-2);
  return `xxxxx-xxx${visible}`;
}
