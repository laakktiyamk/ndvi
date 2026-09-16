export interface CropParcel {
  tunnus: string;
  lohkonumero: string;
  kasvikoodi: string;
  pinta_ala: number;
  luomuviljely: string;
  geometry: any;
}

export interface CropType {
  kasvikoodi: string;
  color: string;
}

export interface FieldInfo {
  centroid: { lat: number; lon: number };
  address: string;
  fieldName: string | null;
  cropType: string | null;
  name: string;
}

export interface Props {
  open: boolean;
  onClose: () => void;
}