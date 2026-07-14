import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { Box, Typography } from '@mui/material';
import WeatherView from './WeatherView';
import { useAppStore } from '../store/appStore';

export default function WeatherPage() {
  const { fields, activeGeometryHash, ndviEntries } = useAppStore();
  const activeField = fields.find(f => f.id === activeGeometryHash);
  const activeFieldName = activeField?.name ?? (ndviEntries[0] as any)?.name ?? null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WbSunnyIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Sää{activeFieldName ? ` — ${activeFieldName}` : ''}
        </Typography>
      </Box>
      <WeatherView />
    </Box>
  );
}