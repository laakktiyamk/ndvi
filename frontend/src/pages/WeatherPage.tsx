import { Box, Typography, Paper } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

export default function WeatherPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WbSunnyIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
  Sää
</Typography>

      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Säätiedot ladataan tähän. Valitse ensin lohko.</Typography>
      </Paper>
    </Box>
  );
}
