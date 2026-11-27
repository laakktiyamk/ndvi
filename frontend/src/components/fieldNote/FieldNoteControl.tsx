import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, IconButton, Tooltip } from '@mui/material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { useAppStore } from '../../store/appStore';
import { fetchFieldNotes, IFieldNotes, INote } from '../../services/fieldNoteService';
import FieldNoteDialog from './FieldNoteDialog';

const EMPTY_NOTE: INote = { text: '', updatedAt: null };

interface Props {
  /** Pellon geometryHash (= dates-dokumentin id). */
  aoiId: string;
}

/**
 * Pellon muistiinpanon ohjain: painike, badge ja muokkausdialogi.
 *
 * @remarks
 * Hakee yleisen ja valitun vuoden muistiinpanon pellon tai vuoden vaihtuessa.
 * Badge näkyy, jos kummassakaan on tekstiä.
 */
export default function FieldNoteControl({ aoiId }: Props) {
  const { t } = useTranslation();
  const selectedYear = useAppStore((s) => s.selectedYear);
  const year = selectedYear ?? new Date().getFullYear();

  const [notes, setNotes] = useState<IFieldNotes>({
    general: EMPTY_NOTE,
    season: { year, ...EMPTY_NOTE },
  });
  const [open, setOpen] = useState(false);

  // cancelled estää vanhan vastauksen päätymisen uudelle pellolle/vuodelle
  useEffect(() => {
    let cancelled = false;
    setNotes({ general: EMPTY_NOTE, season: { year, ...EMPTY_NOTE } });
    fetchFieldNotes(aoiId, year)
      .then((n: IFieldNotes) => { if (!cancelled) setNotes(n); })
      .catch(() => { /* badge jää pois */ });
    return () => { cancelled = true; };
  }, [aoiId, year]);

  const handleSaved = (savedYear: number | null, note: INote) => {
    setNotes((prev) =>
      savedYear === null
        ? { ...prev, general: note }
        : { ...prev, season: { year: savedYear, ...note } }
    );
  };

  const hasNote = !!notes.general.text || !!notes.season?.text;

  return (
    <>
      <Tooltip title={t('fieldNote.tooltip')}>
        <IconButton
          color="inherit"
          size="small"
          onClick={() => setOpen(true)}
          aria-label={t('fieldNote.tooltip')}
        >
          <Badge color="primary" variant="dot" invisible={!hasNote}>
            <EditNoteOutlinedIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <FieldNoteDialog
        open={open}
        onClose={() => setOpen(false)}
        aoiId={aoiId}
        year={year}
        notes={notes}
        onSaved={handleSaved}
      />
    </>
  );
}