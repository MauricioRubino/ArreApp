// Normaliza teléfonos al formato que espera la API de WhatsApp:
// sólo dígitos, con código de país y sin el 0 inicial (ej: 59899123456).
// El frontend ya manda el número con prefijo de país elegido por el
// cliente; las heurísticas locales quedan como red de seguridad para
// números uruguayos escritos a mano.

export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('598')) return digits
  // WhatsApp exige el "9" de móvil después del código de Argentina (54).
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    return `549${digits.slice(2).replace(/^0/, '')}`
  }
  // "099 123 456" -> 59899123456 (se quita el 0 de discado nacional)
  if (digits.startsWith('0')) return `598${digits.slice(1)}`
  // "99 123 456" -> celular uruguayo sin prefijo
  if (digits.length === 8 && digits.startsWith('9')) return `598${digits}`
  return digits
}
