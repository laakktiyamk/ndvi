import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polygon, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CropParcel } from './types';

// ─── MapZoomer ────────────────────────────────────────────────────────────────

function MapZoomer({ center, bounds }: {
  center: [number, number] | null;
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30] });
    else if (center) map.setView(center, 14);
  }, [center, bounds, map]);
  return null;
}

// ─── ZoomWatcher ─────────────────────────────────────────────────────────────

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() { onZoomChange(map.getZoom()); },
  });
  useEffect(() => { onZoomChange(map.getZoom()); }, []);
  return null;
}

// ─── MapRef ──────────────────────────────────────────────────────────────────

function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<any> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

// ─── ClickHandler ────────────────────────────────────────────────────────────

function ClickHandler({ onMapClick, disabled }: {
  onMapClick: (lat: number, lon: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface NewFieldMapProps {
  mapCenter: [number, number] | null;
  mapBounds: [[number, number], [number, number]] | null;
  mapRef: React.MutableRefObject<any>;
  foundField: any | null;
  geojsonPreview: any | null;
  cropParcels: CropParcel[];
  bboxFields: any[];
  geojsonPanelOpen: boolean;
  onMapClick: (lat: number, lon: number) => void;
  onZoomChange: (zoom: number) => void;
  onBboxFieldClick: (field: any) => void;
  getCropColor: (kasvikoodi: string) => string;
}

// ─── Komponentti ─────────────────────────────────────────────────────────────

export default function NewFieldMap({
  mapCenter,
  mapBounds,
  mapRef,
  foundField,
  geojsonPreview,
  cropParcels,
  bboxFields,
  geojsonPanelOpen,
  onMapClick,
  onZoomChange,
  onBboxFieldClick,
  getCropColor,
}: NewFieldMapProps) {
  const polygonPositions = foundField?.geometry?.coordinates?.[0]?.map(
    ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
  ) ?? [];

  return (
    <MapContainer center={[64.5, 26.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Esri World Imagery"
      />
      <MapZoomer center={mapCenter} bounds={mapBounds} />
      <ClickHandler onMapClick={onMapClick} disabled={geojsonPanelOpen} />
      <ZoomWatcher onZoomChange={onZoomChange} />
      <MapRefSetter mapRef={mapRef} />

      {!geojsonPreview && polygonPositions.length > 0 && (
        <Polygon
          positions={polygonPositions}
          pathOptions={{ color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.3, weight: 2 }}
        />
      )}
      {geojsonPreview && (
        <GeoJSON
          key={JSON.stringify(geojsonPreview).slice(0, 40)}
          data={geojsonPreview}
          style={{ color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.25, weight: 2 }}
        />
      )}
      {cropParcels.map((cp) => (
        <GeoJSON
          key={cp.tunnus}
          data={cp.geometry}
          style={{
            color: getCropColor(cp.kasvikoodi),
            fillColor: getCropColor(cp.kasvikoodi),
            fillOpacity: 0.5,
            weight: 1.5,
          }}
        />
      ))}
      {bboxFields.map((field) => (
        <GeoJSON
          key={field.peruslohkotunnus}
          data={field.geometry}
          style={{
            color: field.peruslohkotunnus === foundField?.peruslohkotunnus ? '#ff7800' : '#00bcd4',
            fillColor: field.peruslohkotunnus === foundField?.peruslohkotunnus ? '#ff7800' : '#00bcd4',
            fillOpacity: 0.3,
            weight: 2,
          }}
          eventHandlers={{ click: () => onBboxFieldClick(field) }}
        />
      ))}
    </MapContainer>
  );
}