import { Box, Typography, Alert, CircularProgress, Paper, Divider, Chip } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import AirIcon from '@mui/icons-material/Air';
import { useAppStore } from '../store/appStore';

const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fi-FI', {
        day: 'numeric', month: 'numeric', year: 'numeric',
    });

const StatRow = ({
    icon, label, value, unit,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | null;
    unit: string;
}) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
        <Chip
            label={value != null ? `${value.toFixed(1)} ${unit}` : '—'}
            size="small"
            sx={{ fontWeight: 600, minWidth: 80, justifyContent: 'center' }}
        />
    </Box>
);

export default function WeatherView() {
    const { activeGeometryHash, weatherData, weatherLoading, weatherError } = useAppStore();

    if (!activeGeometryHash) {
        return (
            <Alert severity="info">
                Valitse ensin peltoalue (AOI) vasemmasta valikosta nähdäksesi säätiedot.
            </Alert>
        );
    }

    if (weatherLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
    }

    if (weatherError) return <Alert severity="error">{weatherError}</Alert>;
    if (!weatherData.length) return <Alert severity="info">Ei säädataa saatavilla.</Alert>;

    const sorted = [...weatherData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
            <Typography variant="body2" color="text.secondary">
                {sorted.length} päivää · lähde: Open-Meteo
            </Typography>
            {sorted.map((w) => (
                <Paper key={w.sentinelid} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {fmt(w.date)}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <StatRow
                        icon={<ThermostatIcon fontSize="small" />}
                        label="Keskilämpötila"
                        value={w.temperature_2m_mean}
                        unit="°C"
                    />
                    <StatRow
                        icon={<ThermostatIcon fontSize="small" />}
                        label="Lämpötila max"
                        value={w.temperature_2m_max}
                        unit="°C"
                    />
                    <StatRow
                        icon={<ThermostatIcon fontSize="small" />}
                        label="Lämpötila min"
                        value={w.temperature_2m_min}
                        unit="°C"
                    />
                    <StatRow
                        icon={<WaterDropIcon fontSize="small" />}
                        label="Sademäärä"
                        value={w.precipitation_sum}
                        unit="mm"
                    />
                    <StatRow
                        icon={<WbSunnyIcon fontSize="small" />}
                        label="Auringonsäteily"
                        value={w.shortwave_radiation_sum}
                        unit="MJ/m²"
                    />
                    <StatRow
                        icon={<GrassIcon fontSize="small" />}
                        label="Evapotranspiraatio (ET₀)"
                        value={w.et0_fao_evapotranspiration}
                        unit="mm"
                    />
                    <StatRow
                        icon={<WaterDropIcon fontSize="small" />}
                        label="Kosteus"
                        value={w.relative_humidity_2m_mean}
                        unit="%"
                    />
                    <StatRow
                        icon={<AirIcon fontSize="small" />}
                        label="Tuuli max"
                        value={w.windspeed_10m_max}
                        unit="m/s"
                    />
                </Paper>
            ))}
        </Box>
    );
}