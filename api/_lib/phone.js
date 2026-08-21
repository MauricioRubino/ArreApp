// Normaliza teléfonos a E.164 con "+" (ej: +59899123456), que es el
// formato que espera la propiedad Teléfono de Notion y el que deja el
// número clickeable desde el celular del dueño.
//
// El frontend ya manda el número con el prefijo del país elegido; las
// heurísticas de abajo quedan como red de seguridad para números
// uruguayos escritos a mano.

export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('598')) return `+${digits}`
  // Los móviles argentinos llevan un "9" después del código de país
  // (+54 9 11 ...), y es el número al que se llama desde el exterior.
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    return `+549${digits.slice(2).replace(/^0/, '')}`
  }
  // "099 123 456" -> +59899123456 (se quita el 0 de discado nacional)
  if (digits.startsWith('0')) return `+598${digits.slice(1)}`
  // "99 123 456" -> celular uruguayo sin prefijo
  if (digits.length === 8 && digits.startsWith('9')) return `+598${digits}`
  return `+${digits}`
}
