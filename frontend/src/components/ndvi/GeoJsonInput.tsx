import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Button, Alert, Typography,
  CircularProgress, Collapse,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { apiClient } from '../../api/client'; 

function fixGeoJSON(text: string): string {
  text = text.replace(/(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  text = text.replace(/,(\s*[}\]])/g, '$1');
  return text;
}

async function validateGeoJSON(geojson: object): Promise<{ valid: boolean; errors: string[]; geometry?: object }> {
  const response = await apiClient.post('/api/validate/geojson', { geometry: geojson });
  return response.data;
}

interface Props {
  initialValue?: string;
  onInputChange?: (text: string) => void;
  onValid: (geojson: object | null) => void;
  onSubmit: (geojson: object) => void;
  loading?: boolean;
}

export default function GeoJsonInput({
  initialValue = '',
  onInputChange,
  onValid,
  onSubmit,
  loading = false,
}: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialValue);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [geojsonErrors, setGeojsonErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [validGeoJson, setValidGeoJson] = useState<object | null>(null);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    setInput(raw);
    onInputChange?.(raw);
    setValidGeoJson(null);
    onValid(null);

    if (!raw.trim()) {
      setJsonError(null);
      setGeojsonErrors([]);
      return;
    }

    const fixed = fixGeoJSON(raw);
    let parsed: object;
    try {
      parsed = JSON.parse(fixed);
    } catch (err: unknown) {
      setJsonError('Invalid JSON: ' + (err instanceof Error ? err.message : String(err)));
      setGeojsonErrors([]);
      return;
    }

    setJsonError(null);
    setValidating(true);
    try {
      const result = await validateGeoJSON(parsed);
      setGeojsonErrors(result.errors ?? []);
      if (result.valid && result.geometry) {
        setValidGeoJson(result.geometry);
        onValid(result.geometry);
      }
    } catch {
      setGeojsonErrors(['Validation request failed']);
    } finally {
      setValidating(false);
    }
  }, [onInputChange, onValid]);

  const isValid = validGeoJson !== null && !jsonError && geojsonErrors.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {t('geoJsonInputLabel')}
      </Typography>

      <TextField
        multiline
        rows={12}
        fullWidth
        value={input}
        onChange={handleChange}
        placeholder={t('geoJsonPlaceholder')}
        error={!!jsonError || geojsonErrors.length > 0}
        slotProps={{
          input: {
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              alignItems: 'flex-start',
            },
          },
        }}
      />

      <Collapse in={validating}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">{t('validating')}</Typography>
        </Box>
      </Collapse>

      <Collapse in={!!jsonError}>
        <Alert severity="error" sx={{ py: 0.5 }}>{jsonError}</Alert>
      </Collapse>

      <Collapse in={geojsonErrors.length > 0}>
        <Alert severity="warning" sx={{ py: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t('geoJsonIssues')}
          </Typography>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {geojsonErrors.map((err, i) => (
              <li key={i}><Typography variant="caption">{err}</Typography></li>
            ))}
          </ul>
        </Alert>
      </Collapse>

      <Collapse in={isValid}>
        <Alert severity="success" icon={<CheckCircleOutlinedIcon fontSize="small" />} sx={{ py: 0.5 }}>
          {t('validGeoJson')}
        </Alert>
      </Collapse>

      <Button
        variant="contained"
        disabled={!isValid || loading}
        onClick={() => validGeoJson && onSubmit(validGeoJson)}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        fullWidth
      >
        {loading ? t('fetchingImages') : t('fetchNdviImages')}
      </Button>
    </Box>
  );
}