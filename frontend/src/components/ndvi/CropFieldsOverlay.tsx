// components/ndvi/CropFieldsOverlay.tsx
import { useMemo } from 'react';
import type { ICropParcel } from '../../types';
import { cropParcelKey } from '../../utils/cropParcelChartUtils';

interface ImageBbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Props {
  fields: ICropParcel[];
  bbox: ImageBbox;
  /** Valitun lohkon avain, cropParcelKey() */
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
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

// Jaettu väripaletti — käytetään SVG-overlayssa, kartassa, chip-listassa
// ja chartissa, jotta lohkon väri täsmää kaikkialla.
export const CROP_FIELD_COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4db6ac', '#fff176', '#ff8a65',
];

/** Väri per lohkoavain (cropParcelKey). */
export function getFieldColorMap(fields: ICropParcel[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((f, i) => [cropParcelKey(f), CROP_FIELD_COLORS[i % CROP_FIELD_COLORS.length]])
  );
}

export default function CropFieldsOverlay({
  fields, bbox, selectedKey, onSelect,
  width, height, offsetX, offsetY, imgWidth, imgHeight,
}: Props) {
  // Koordinaattimuunnos: WGS84 → pikselit kuvan sisällä → siirretään offsetilla
  const toPixel = (lon: number, lat: number): [number, number] => {
    const px = offsetX + ((lon - bbox.minX) / (bbox.maxX - bbox.minX)) * imgWidth;
    const py = offsetY + ((bbox.maxY - lat) / (bbox.maxY - bbox.minY)) * imgHeight;
    return [px, py];
  };

  const fieldColors = useMemo(() => getFieldColorMap(fields), [fields]);

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {fields.map((field) => {
        const key = cropParcelKey(field);
        const isSelected = key === selectedKey;
        const color = fieldColors[key];
        const rings = getRings(field.geometry);

        return rings.map((ring, ringIdx) => {
          const points = ring
            .map(([lon, lat]) => toPixel(lon, lat).join(','))
            .join(' ');

          return (
            <g key={`${key}-${ringIdx}`}>
              {/* Leveä näkymätön klikkialue — helpottaa osumista */}
              <polygon
                points={points}
                fill="transparent"
                stroke="transparent"
                strokeWidth={14}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={() => onSelect(isSelected ? null : key)}
              />
              {/* Näkyvä viiva. Tieto valitusta lohkosta näytetään
                  erillisessä infopaneelissa (NdviMapViewer), ei
                  natiivina SVG title-tooltippina, koska se ei toimi
                  kosketuslaitteilla. */}
              <polygon
                points={points}
                fill={isSelected ? `${color}25` : 'transparent'}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? undefined : '5 3'}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        });
      })}
    </svg>
  );
}