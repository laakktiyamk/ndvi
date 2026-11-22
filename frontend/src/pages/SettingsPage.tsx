import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Link, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  deleteAccount, deleteCdseCredentials, getCdseStatus, updateCdseCredentials,
} from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  // CDSE-tunnukset
  const [connected, setConnected] = useState<boolean | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tilin poisto
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountDeleted, setAccountDeleted] = useState(false);

  // Accordion: vain yksi osio auki kerrallaan
  const [expanded, setExpanded] = useState<string | false>('cdse');

  const handlePanel = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // After a successful deletion: log out and go to the login page
  const finishAccountDeletion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeAccountDialog = () => {
    if (accountDeleting) return;
    if (accountDeleted) {
      finishAccountDeletion();
      return;
    }
    setAccountDialogOpen(false);
    setAccountPassword('');
    setAccountError(null);
  };

  const loadStatus = useCallback(async () => {
    try {
      const res = await getCdseStatus();
      setConnected(res.data.connected);
      setVerifiedAt(res.data.verifiedAt);
    } catch (err) {
      setError(getApiErrorMessage(err, t));
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updateCdseCredentials(clientId.trim(), clientSecret.trim());
      setClientId('');
      setClientSecret('');
      setSuccess(t('settings_cdse_saved'));
      await loadStatus();
    } catch (err) {
      setError(getApiErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    setError(null);
    setSuccess(null);
    setDeleting(true);
    try {
      await deleteCdseCredentials();
      setSuccess(t('settings_cdse_deleted'));
      await loadStatus();
    } catch (err) {
      setError(getApiErrorMessage(err, t));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setAccountError(null);
    setAccountDeleting(true);
    try {
      await deleteAccount(accountPassword);
      // Show the confirmation in the dialog; logout happens when it is closed
      setAccountPassword('');
      setAccountDeleted(true);
    } catch (err) {
      setAccountError(getApiErrorMessage(err, t));
    } finally {
      setAccountDeleting(false);
    }
  };

  const verifiedText = verifiedAt
    ? t('settings_cdse_verified_at', {
      date: new Date(verifiedAt).toLocaleString(i18n.language),
    })
    : null;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('settings_title')}
      </Typography>

      {/* CDSE-tunnukset */}
      <Accordion expanded={expanded === 'cdse'} onChange={handlePanel('cdse')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" component="h2">
            {t('settings_cdse_title')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {connected === null && !error && <CircularProgress size={24} />}

          {connected !== null && (
            <Alert severity={connected ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {connected ? t('settings_cdse_connected') : t('settings_cdse_not_connected')}
              {connected && verifiedText && (
                <Typography variant="body2" component="div">
                  {verifiedText}
                </Typography>
              )}
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2">{t('settings_cdse_update_hint')}</Typography>
              <Alert severity="info">
                {t('cdseInfo')}{' '}
                <Link
                  href="https://shapps.dataspace.copernicus.eu/dashboard/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('cdseInfoLink')}
                </Link>
              </Alert>
              <TextField
                label={t('cdseClientId')}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                fullWidth
                autoComplete="off"
              />
              <TextField
                label={t('cdseClientSecret')}
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                required
                fullWidth
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={saving || !clientId.trim() || !clientSecret.trim()}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {t('settings_cdse_save')}
              </Button>
              {connected && (
                <Button
                  color="error"
                  variant="outlined"
                  disabled={deleting}
                  onClick={() => setConfirmOpen(true)}
                >
                  {t('settings_cdse_delete')}
                </Button>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Käyttäjätili */}
      <Accordion expanded={expanded === 'account'} onChange={handlePanel('account')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" component="h2">
            {t('settings_account_title')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('settings_account_delete_hint')}
          </Typography>
          <Button color="error" variant="contained" onClick={() => setAccountDialogOpen(true)}>
            {t('settings_account_delete')}
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Tilin poiston vahvistus salasanalla */}
      <Dialog open={accountDialogOpen} onClose={closeAccountDialog} fullWidth maxWidth="xs">
        {accountDeleted ? (
          <>
            <DialogTitle>{t('settings_account_deleted_title')}</DialogTitle>
            <DialogContent>
              <Alert severity="success">{t('login_account_deleted')}</Alert>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={finishAccountDeletion} autoFocus>
                {t('settings_account_deleted_ok')}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>{t('settings_account_delete_title')}</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                {t('settings_account_delete_text')}
              </DialogContentText>
              {accountError && <Alert severity="error" sx={{ mb: 2 }}>{accountError}</Alert>}
              <TextField
                label={t('settings_account_password')}
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                fullWidth
                autoFocus
                autoComplete="current-password"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAccountDialog} disabled={accountDeleting}>
                {t('settings_cancel')}
              </Button>
              <Button
                color="error"
                onClick={handleDeleteAccount}
                disabled={!accountPassword || accountDeleting}
                startIcon={accountDeleting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {t('settings_account_delete')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* CDSE-tunnusten poiston vahvistus */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('settings_cdse_delete_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings_cdse_delete_text')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('settings_cancel')}</Button>
          <Button color="error" onClick={handleDelete}>
            {t('settings_cdse_delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}