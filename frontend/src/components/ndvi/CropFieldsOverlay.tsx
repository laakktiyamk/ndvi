// components/ndvi/CropFieldsOverlay.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ICropParcel } from '../../types';

interface ImageBbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Props {
  fields: ICropParcel[];
  bbox: ImageBbox;
  selectedTunnus: string | null;
  onSelect: (tunnus: string | null) => void;
  // Koko boxin mitat
  width: number;
  height: number;
  // Kuvan todellinen sijainti boxin sisällä (objectFit: contain)
  offsetX: number;
  offsetY: number;
  imgWidth: number;
  imgHeight: number;
}

const getRings = (geometry: ICropParcel['geometry']): number[][][] => {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates as number[][][];
  }
  return (geometry.coordinates as number[][][][]).flat();
};

const COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4db6ac', '#fff176', '#ff8a65',
];

export default function CropFieldsOverlay({
  fields, bbox, selectedTunnus, onSelect,
  width, height, offsetX, offsetY, imgWidth, imgHeight,
}: Props) {
  const { i18n } = useTranslation();

  // Koordinaattimuunnos: WGS84 → pikselit kuvan sisällä → siirretään offsetilla
  const toPixel = (lon: number, lat: number): [number, number] => {
    const px = offsetX + ((lon - bbox.minX) / (bbox.maxX - bbox.minX)) * imgWidth;
    const py = offsetY + ((bbox.maxY - lat) / (bbox.maxY - bbox.minY)) * imgHeight;
    return [px, py];
  };

  const fieldColors = useMemo(
    () => Object.fromEntries(fields.map((f, i) => [f.tunnus, COLORS[i % COLORS.length]])),
    [fields]
  );

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {fields.map((field) => {
        const isSelected = field.tunnus === selectedTunnus;
        const color = fieldColors[field.tunnus];
        const rings = getRings(field.geometry);
        const cropName = i18n.t(field.kasvikoodi, {
          ns: 'crop',
          defaultValue: field.kasvikoodi,
        });

        return rings.map((ring, ringIdx) => {
          const points = ring
            .map(([lon, lat]) => toPixel(lon, lat).join(','))
            .join(' ');

          return (
            <g key={`${field.tunnus}-${ringIdx}`}>
              {/* Leveä näkymätön klikkialue — helpottaa osumista */}
              <polygon
                points={points}
                fill="transparent"
                stroke="transparent"
                strokeWidth={14}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={() => onSelect(isSelected ? null : field.tunnus)}
              />
              {/* Näkyvä viiva tooltip-tekstillä */}
              <polygon
                points={points}
                fill={isSelected ? `${color}25` : 'transparent'}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? undefined : '5 3'}
                style={{ pointerEvents: 'none' }}
              >
                <title>{`${cropName} · ${field.pinta_ala} ha`}</title>
              </polygon>
            </g>
          );
        });
      })}
    </svg>
  );
}