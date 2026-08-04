import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import {
  DEFAULT_LOCATION,
  DEFAULT_ZOOM,
  DELIVERY_RADIUS_METERS,
  isWithinDeliveryArea,
} from '../../data/locationData'

const markerIconDefault = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function LocationMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return (
    <Marker
      position={position}
      icon={markerIconDefault}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng()
          onChange({ lat, lng })
        },
      }}
    />
  )
}

export default function LocationMap({ value, onChange }) {
  const center = useMemo(() => value ?? DEFAULT_LOCATION, [value])
  const enZona = isWithinDeliveryArea(center)

  return (
    <div className="rounded-lg overflow-hidden border border-linea">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ height: '320px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Zona de entrega: el pin tiene que quedar adentro. */}
        <Circle
          center={DEFAULT_LOCATION}
          radius={DELIVERY_RADIUS_METERS}
          pathOptions={{
            color: enZona ? '#1c8b7f' : '#a63a2c',
            weight: 2,
            fillColor: enZona ? '#1c8b7f' : '#a63a2c',
            fillOpacity: 0.08,
          }}
        />
        <LocationMarker position={center} onChange={onChange} />
      </MapContainer>
    </div>
  )
}
