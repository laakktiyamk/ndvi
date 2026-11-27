import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Tab, Tabs, TextField, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { saveFieldNote, IFieldNotes, INote } from '../../services/fieldNoteService';

const MAX_LEN = 5000;

type TabKey = 'general' | 'season';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pellon geometryHash. */
  aoiId: string;
  /** Valittu vuosi (kausivälilehti). */
  year: number;
  /** Tallennetut muistiinpanot. */
  notes: IFieldNotes;
  /** Kutsutaan onnistuneen tallennuksen jälkeen; year null = yleinen. */
  onSaved: (year: number | null, note: INote) => void;
}

/**
 * Pellon muistiinpanodialogi: välilehdet yleiselle ja valitun vuoden muistiinpanolle.
 *
 * @remarks
 * Kummallakin välilehdellä on oma luonnos, joten välilehden vaihto ei hukkaa
 * kirjoitettua tekstiä. Tallenna ja Tyhjennä koskevat aktiivista välilehteä.
 * Tyhjä teksti poistaa muistiinpanon backendissä.
 */
export default function FieldNoteDialog({ open, onClose, aoiId, year, notes, onSaved }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const generalNote = notes.general;
  const seasonNote: INote = notes.season ?? { text: '', updatedAt: null };

  const [tab, setTab] = useState<TabKey>('season');
  const [drafts, setDrafts] = useState<Record<TabKey, string>>({ general: '', season: '' });
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alustus aina dialogia avattaessa: kausi oletuksena, ellei se ole tyhjä ja yleinen ei
  useEffect(() => {
    if (!open) return;
    setDrafts({ general: generalNote.text, season: seasonNote.text });
    setTab(!seasonNote.text && generalNote.text ? 'general' : 'season');
    setError(null);
    setConfirmClear(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current: INote = tab === 'general' ? generalNote : seasonNote;
  const draft = drafts[tab];
  const changed = draft.trim() !== current.text;
  const hasNote = current.text.length > 0;

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleTab = (_: unknown, value: TabKey) => {
    setTab(value);
    setConfirmClear(false);
    setError(null);
  };

  const save = async (text: string) => {
    const targetYear = tab === 'general' ? null : year;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveFieldNote(aoiId, targetYear, text);
      onSaved(targetYear, saved);
      setDrafts((d) => ({ ...d, [tab]: saved.text }));
    } catch {
      setError(t('fieldNote.saveError'));
    } finally {
      setSaving(false);
      setConfirmClear(false);
    }
  };

  const tabLabel = (label: string, filled: boolean) => (filled ? `${label} •` : label);

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

      <Box sx={{ px: 3 }}>
        <Tabs value={tab} onChange={handleTab}>
          <Tab value="general" label={tabLabel(t('fieldNote.general'), !!generalNote.text)} />
          <Tab value="season" label={tabLabel(t('fieldNote.season', { year }), !!seasonNote.text)} />
        </Tabs>
      </Box>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          autoFocus
          multiline
          fullWidth
          minRows={6}
          maxRows={16}
          value={draft}
          onChange={(e) => setDrafts((d) => ({ ...d, [tab]: e.target.value }))}
          placeholder={t(tab === 'general' ? 'fieldNote.placeholderGeneral' : 'fieldNote.placeholderSeason')}
          slotProps={{ htmlInput: { maxLength: MAX_LEN } }}
          sx={{ mt: 1 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {current.updatedAt
              ? t('fieldNote.updated', {
                  date: new Date(current.updatedAt).toLocaleString(i18n.language),
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