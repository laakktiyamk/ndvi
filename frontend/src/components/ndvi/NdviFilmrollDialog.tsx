// NdviFilmrollDialog.tsx

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { NdviFilmroll } from './NdviFilmroll';
import type { NdviImageEntry } from './ndviFilmrollUtils';
import type { MergedNdviEntry } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  fieldName?: string;
  entries: MergedNdviEntry[];
  onSelect: (index: number) => void;
  /** Aktiivisen kuvan generationtime — filmroll scrollaa tähän kun dialogi avautuu */
  activeDate?: string;
}

function toFilmrollEntries(entries: MergedNdviEntry[]): NdviImageEntry[] {
  return entries.map(e => ({
    date: e.generationtime,
    imageUrl: e.image?.image.dataUrl ?? '',
    ndviMean: e.stats.average,
    ndviMin:  e.stats.min,
    ndviMax:  e.stats.max,
    ndviStd:  e.stats.std,
  }));
}

export default function NdviFilmrollDialog({
  open, onClose, fieldName, entries, onSelect, activeDate,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: { sx: { bgcolor: 'background.paper', backgroundImage: 'none', borderRadius: 2 } },
      }}
    >
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        pb: 1, borderBottom: 1, borderColor: 'divider',
      }}>
        <PhotoLibraryIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 500, flex: 1 }}>
          {fieldName ?? t('filmroll.title', 'Kuvagalleria')}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label={t('close', 'Sulje')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: 2, pb: 2 }}>
        <NdviFilmroll
          entries={toFilmrollEntries(entries)}
          frameHeight={120}
          initialSelectedDate={activeDate}
          onSelect={(filmEntry) => {
            const idx = entries.findIndex(e => e.generationtime === filmEntry.date);
            if (idx !== -1) onSelect(idx);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}