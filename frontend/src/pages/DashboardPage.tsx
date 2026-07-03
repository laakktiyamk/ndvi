import { Box, Grid, Typography, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

const STAT_CARDS = [
  { label: 'NDVI keskiarvo', value: '—', unit: '' },
  { label: 'Aktiiviset lohkot', value: '—', unit: 'kpl' },
  { label: 'Viimeisin haku', value: '—', unit: '' },
  { label: 'Sääindeksi', value: '—', unit: '' },
];

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <DashboardIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
      </Box>

      <Grid container spacing={2}>
        {STAT_CARDS.map(({ label, value, unit }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {value}
                {unit && (
                  <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                    {unit}
                  </Typography>
                )}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={1}>Viimeisimmät havainnot</Typography>
        <Typography color="text.secondary">Ei dataa vielä. Lisää lohko aloittaaksesi.</Typography>
      </Paper>
    </Box>
  );
}
