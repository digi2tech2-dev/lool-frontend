export const SUPPORT_WHATSAPP_NUMBER = '201067836859';
export const SUPPORT_WHATSAPP_DISPLAY = '+20 106 783 6859';

export const normalizeWhatsAppNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  // Support local numbers like 010xxxxxxxx by defaulting to Egypt country code.
  if (digits.startsWith('0') && digits.length >= 10) {
    return `20${digits.replace(/^0+/, '')}`;
  }

  return digits;
};

export const buildWhatsAppLink = ({ number, message = '' }) => {
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!normalizedNumber) return null;
  const text = String(message || '').trim();
  const suffix = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalizedNumber}${suffix}`;
};

export const getDefaultWhatsAppNumber = () => SUPPORT_WHATSAPP_NUMBER;
export const getAdminWhatsAppNumber = () => SUPPORT_WHATSAPP_NUMBER;
