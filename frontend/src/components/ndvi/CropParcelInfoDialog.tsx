// components/ndvi/CropParcelInfoDialog.tsx
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ICropParcel } from '../../types';

interface Props {
  field: ICropParcel | null;
  color?: string;
  onClose: () => void;
}

// Käyttöesimerkki NdviMapViewerissa (ei vielä kytketty):
//
//   const [infoTunnus, setInfoTunnus] = useState<string | null>(null);
//   const infoField = cropParcels.find(p => p.tunnus === infoTunnus) ?? null;
//   ...
//   <CropParcelInfoDialog
//     field={infoField}
//     color={infoField ? fieldColors[infoField.tunnus] : undefined}
//     onClose={() => setInfoTunnus(null)}
//   />
//
// Avaus esim. Chipin info-ikonista tai tuplaklikkauksesta polygonissa,
// erillään pääasiallisesta valinnasta (selectedTunnus).

export default function CropParcelInfoDialog({ field, color, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!field} onClose={onClose} maxWidth="xs" fullWidth>
      {field && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
            <Typography variant="subtitle1" sx={{ flex: 1 }}>
              {t(`crop:${field.kasvikoodi}`)}
            </Typography>
            <IconButton size="small" onClick={onClose} aria-label={t('close') ?? 'Close'}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">{t('fieldNumber') ?? 'Lohko'}</Typography>
              <Typography variant="body2">{field.lohkonumero}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">{t('area') ?? 'Pinta-ala'}</Typography>
              <Typography variant="body2">{field.pinta_ala} ha</Typography>
            </Box>
            {field.luomuviljely === '1' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('cultivation') ?? 'Viljelytapa'}</Typography>
                <Typography variant="body2">🌿 {t('organic') ?? 'Luomu'}</Typography>
              </Box>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
