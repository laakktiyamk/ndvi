import { Box, Typography, Paper } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function AnalysisPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BarChartIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Analyysi</Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">NDVI-analyysi ja ennusteet tulevat tähän.</Typography>
      </Paper>
    </Box>
  );
}
