// Centro por defecto del mapa de ubicación: La Paloma, Rocha, Uruguay.
export const DEFAULT_LOCATION = { lat: -34.6672, lng: -54.1524 }
export const DEFAULT_ZOOM = 15

// Sólo se entrega dentro de La Paloma: el pin del mapa tiene que caer
// dentro de este radio (en metros) alrededor del centro del balneario.
export const DELIVERY_RADIUS_METERS = 4000
export const DELIVERY_AREA_LABEL = 'La Paloma'

const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Distancia entre dos coordenadas, en metros (fórmula de haversine).
export function distanceInMeters(a, b) {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function isWithinDeliveryArea(location) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return false
  return distanceInMeters(DEFAULT_LOCATION, location) <= DELIVERY_RADIUS_METERS
}
