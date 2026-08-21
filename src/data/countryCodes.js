// Países disponibles en el selector de teléfono. Uruguay va primero por
// ser el default; el resto son los orígenes más probables de turistas.

export const COUNTRY_CODES = [
  { id: 'UY', label: 'Uruguay', prefix: '598', flag: '🇺🇾' },
  { id: 'AR', label: 'Argentina', prefix: '54', flag: '🇦🇷' },
  { id: 'BR', label: 'Brasil', prefix: '55', flag: '🇧🇷' },
  { id: 'BO', label: 'Bolivia', prefix: '591', flag: '🇧🇴' },
  { id: 'CL', label: 'Chile', prefix: '56', flag: '🇨🇱' },
  { id: 'CO', label: 'Colombia', prefix: '57', flag: '🇨🇴' },
  { id: 'EC', label: 'Ecuador', prefix: '593', flag: '🇪🇨' },
  { id: 'PY', label: 'Paraguay', prefix: '595', flag: '🇵🇾' },
  { id: 'PE', label: 'Perú', prefix: '51', flag: '🇵🇪' },
  { id: 'VE', label: 'Venezuela', prefix: '58', flag: '🇻🇪' },
  { id: 'MX', label: 'México', prefix: '52', flag: '🇲🇽' },
  { id: 'US', label: 'Estados Unidos / Canadá', prefix: '1', flag: '🇺🇸' },
  { id: 'ES', label: 'España', prefix: '34', flag: '🇪🇸' },
  { id: 'PT', label: 'Portugal', prefix: '351', flag: '🇵🇹' },
  { id: 'IT', label: 'Italia', prefix: '39', flag: '🇮🇹' },
  { id: 'FR', label: 'Francia', prefix: '33', flag: '🇫🇷' },
  { id: 'DE', label: 'Alemania', prefix: '49', flag: '🇩🇪' },
  { id: 'GB', label: 'Reino Unido', prefix: '44', flag: '🇬🇧' },
]

export const DEFAULT_COUNTRY = 'UY'

// Combina país + número local en formato internacional E.164
// (+59899123456). Tolera cómo escribe la gente de verdad: espacios,
// guiones, el 0 de discado nacional ("099...") e incluso el prefijo de
// país repetido ("598 99 123 456" con Uruguay ya seleccionado).
export function buildFullPhone(countryId, localNumber) {
  const country = COUNTRY_CODES.find((c) => c.id === countryId) ?? COUNTRY_CODES[0]
  const digits = String(localNumber ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '')
  if (digits.startsWith(country.prefix) && digits.length - country.prefix.length >= 7) {
    return `+${digits}`
  }
  return `+${country.prefix}${digits}`
}
