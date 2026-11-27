import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, IconButton, Tooltip } from '@mui/material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { fetchFieldNote, IFieldNote } from '../../services/fieldNoteService';
import FieldNoteDialog from './FieldNoteDialog';

const EMPTY: IFieldNote = { text: '', updatedAt: null };

interface Props {
  /** Pellon geometryHash (= dates-dokumentin id). */
  aoiId: string;
}

/**
 * Pellon muistiinpanopainike.
 *
 * @remarks
 * Hakee muistiinpanon pellon vaihtuessa; badge näyttää, onko sellainen olemassa.
 */
export default function FieldNoteControl({ aoiId }: Props) {
  const { t } = useTranslation();
  const [note, setNote] = useState<IFieldNote>(EMPTY);
  const [open, setOpen] = useState(false);

  // cancelled estää vanhan vastauksen päätymisen uudelle pellolle
  useEffect(() => {
    let cancelled = false;
    setNote(EMPTY);
    fetchFieldNote(aoiId)
      .then((n) => { if (!cancelled) setNote(n); })
      .catch(() => { /* badge jää pois */ });
    return () => { cancelled = true; };
  }, [aoiId]);

  return (
    <>
      <Tooltip title={t('fieldNote.tooltip')}>
        <IconButton
          color="inherit"
          size="small"
          onClick={() => setOpen(true)}
          aria-label={t('fieldNote.tooltip')}
        >
          <Badge color="primary" variant="dot" invisible={!note.text}>
            <EditNoteOutlinedIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <FieldNoteDialog
        open={open}
        onClose={() => setOpen(false)}
        aoiId={aoiId}
        note={note}
        onSaved={setNote}
      />
    </>
  );
}