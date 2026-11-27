import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, TextField, Typography, useMediaQuery, useTheme,IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { saveFieldNote, IFieldNote } from '../../services/fieldNoteService';

const MAX_LEN = 5000;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pellon geometryHash. */
  aoiId: string;
  /** Tallennettu muistiinpano (tyhjä teksti = ei muistiinpanoa). */
  note: IFieldNote;
  /** Kutsutaan onnistuneen tallennuksen tai tyhjennyksen jälkeen. */
  onSaved: (note: IFieldNote) => void;
}

/**
 * Pellon muistiinpanon muokkausdialogi.
 *
 * @remarks
 * Tyhjennys vahvistetaan dialogin sisällä. Tyhjä teksti poistaa muistiinpanon backendissä.
 */
export default function FieldNoteDialog({ open, onClose, aoiId, note, onSaved }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alustus aina dialogia avattaessa
  useEffect(() => {
    if (open) {
      setDraft(note.text);
      setError(null);
      setConfirmClear(false);
    }
  }, [open, note.text]);

  const handleClose = () => {
    if (!saving) onClose();
  };

  const save = async (text: string) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveFieldNote(aoiId, text);
      onSaved(saved);
      onClose();
    } catch {
      setError(t('fieldNote.saveError'));
    } finally {
      setSaving(false);
      setConfirmClear(false);
    }
  };

  const hasNote = note.text.length > 0;
  const changed = draft.trim() !== note.text;

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        {t('fieldNote.title')}
        <IconButton
          onClick={handleClose}
          disabled={saving}
          aria-label={t('close')}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          autoFocus
          multiline
          fullWidth
          minRows={6}
          maxRows={16}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('fieldNote.placeholder')}
          slotProps={{ htmlInput: { maxLength: MAX_LEN } }}
          sx={{ mt: 1 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {note.updatedAt
              ? t('fieldNote.updated', {
                date: new Date(note.updatedAt).toLocaleString(i18n.language),
              })
              : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {draft.length}/{MAX_LEN}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        {hasNote && (
          confirmClear ? (
            <>
              <Typography variant="body2" sx={{ mr: 'auto', ml: 1 }}>
                {t('fieldNote.confirmClear')}
              </Typography>
              <Button onClick={() => setConfirmClear(false)} disabled={saving}>
                {t('cancel')}
              </Button>
              <Button color="error" onClick={() => save('')} disabled={saving}>
                {t('fieldNote.clear')}
              </Button>
            </>
          ) : (
            <Button
              color="error"
              onClick={() => setConfirmClear(true)}
              disabled={saving}
              sx={{ mr: 'auto' }}
            >
              {t('fieldNote.clear')}
            </Button>
          )
        )}

        {!confirmClear && (
          <>
            <Button onClick={handleClose} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button variant="contained" onClick={() => save(draft)} disabled={saving || !changed}>
              {t('save')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}