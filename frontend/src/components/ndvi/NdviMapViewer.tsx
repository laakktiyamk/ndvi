import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, IconButton, Chip,
  CircularProgress, Alert, Skeleton,
  Select, MenuItem, FormControl, InputLabel,
  useTheme, useMediaQuery,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageIcon from '@mui/icons-material/Image';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAppStore } from '../../store/appStore';
import NdviDatePicker from './NdviDatePicker';
import NdviTimelineChart from './NdviTimelineChart';
import NdviViewPanel from './NdviViewPanel';
import StatisticsTab from './tabs/StatisticsTab';
import OnMapTab from './tabs/OnMapTab';
import LocationTab from './tabs/LocationTab';
import VegetationDistribution from './VegetationDistribution';

interface Props {
  fieldId: string;
  fieldName?: string;
  geometry?: { type: string; coordinates: unknown[] };
}

// Kielikoodin mukainen locale päivämäärän muotoiluun
const dateLocaleMap: Record<string, string> = {
  fi: 'fi-FI',
  en: 'en-GB',
};

const getFmt = (language: string) => {
  const locale = dateLocaleMap[language] ?? language;
  return (date: string) =>
    new Date(date).toLocaleDateString(locale, {
      day: 'numeric', month: 'numeric', year: 'numeric',
    });
};

const getYear = (date: string) => new Date(date).getFullYear();

interface LeafletAccordionProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  onChange: (id: string) => void;
  children: React.ReactNode;
  contentHeight?: number;
}

function LeafletAccordion({ id, label, icon, expanded, onChange, children, contentHeight = 340 }: LeafletAccordionProps) {
  const [everExpanded, setEverExpanded] = useState(false);

  useEffect(() => {
    if (expanded) setEverExpanded(true);
  }, [expanded]);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => onChange(id)}
      disableGutters
      elevation={0}
      sx={{
        border: 1, borderColor: 'divider',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0, height: contentHeight, display: 'flex', flexDirection: 'column' }}>
        {everExpanded && children}
      </AccordionDetails>
    </Accordion>
  );
}

export default function NdviMapViewer({ fieldId, fieldName, geometry }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fmt = getFmt(i18n.language);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expanded, setExpanded] = useState<string>('image');

  const { ndviEntries, imagesLoading, imagesError, activeGeometryHash, weatherData } = useAppStore();

  const loading = imagesLoading && activeGeometryHash !== fieldId;
  const error = imagesError;
  const allEntries = activeGeometryHash === fieldId ? ndviEntries : [];

  const filteredImages = allEntries
    .filter(e => getYear(e.generationtime) === selectedYear)
    .sort((a, b) => new Date(a.generationtime).getTime() - new Date(b.generationtime).getTime());

  /*
    const selectedDate = filteredImages.length > 0
    ? new Date(filteredImages[index].generationtime)
    : null;
*/

  const selectedDate = filteredImages.length > 0
    ? new Date(filteredImages[Math.min(index, filteredImages.length - 1)].generationtime)
    : null;

  useEffect(() => {
    if (allEntries.length === 0) return;
    const years = [...new Set(allEntries.map(e => getYear(e.generationtime)))].sort((a, b) => b - a);
    setAvailableYears(years);
    setSelectedYear(years[0]);
  }, [allEntries.length]);

  useEffect(() => {
    setIndex(filteredImages.length > 0 ? filteredImages.length - 1 : 0);
  }, [selectedYear, allEntries.length]);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(filteredImages.length - 1, i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filteredImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) next();
    if (diff < -50) prev();
  };

  useEffect(() => { setImgLoaded(false); }, [index]);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    const targetIdx = filteredImages.findIndex(
      e => new Date(e.generationtime).toDateString() === date.toDateString()
    );
    if (targetIdx !== -1) setIndex(targetIdx);
  };

  const handleAccordion = (id: string) => {
    setExpanded(prev => prev === id ? '' : id);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!filteredImages.length) return <Alert severity="info">{t('noImages')}</Alert>;

  //const current = filteredImages[index];
  //const imageDate = current.generationtime;


  const safeIndex = Math.min(index, Math.max(0, filteredImages.length - 1));
  const current = filteredImages[safeIndex];
  if (!current) return null;
  const imageDate = current.generationtime;

  const isFirst = index === 0;
  const isLast = index === filteredImages.length - 1;
  const dataUrl = current.image?.image.dataUrl;
  const currentWeather = weatherData.find(w => w.sentinelid === current.sentinelid);

  // ── NDVI-kuvaviewer ───────────────────────────────────────────────────────
  const imageViewer = (
    <>
      {/* Toolbar */}
      <Box sx={{
        px: 2, py: 1,
        borderBottom: 1, borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1.5,
        flexWrap: 'wrap', flexShrink: 0,
      }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>{t('year')}</InputLabel>
          <Select value={selectedYear} label={t('year')} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <NdviDatePicker
          value={selectedDate}
          selectedYear={selectedYear}
          onChange={handleDateChange}
          availableDates={filteredImages.map(e => new Date(e.generationtime))}
        />
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {t('imageCount', { count: filteredImages.length })}
        </Typography>
        {!isMobile && (
          <IconButton
            onClick={() => setIsFullscreen(v => !v)}
            size="small"
            sx={{ ml: 'auto' }}
            aria-label={isFullscreen ? t('fullscreenClose') : t('fullscreenOpen')}
          >
            {isFullscreen ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Kuva-alue */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          flex: 1, position: 'relative',
          bgcolor: 'background.default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          minHeight: { xs: 260, md: 0 },
          userSelect: 'none',
        }}
      >
        {!imgLoaded && (
          <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        )}
        {dataUrl && (
          <Box
            component="img"
            src={dataUrl}
            alt={`NDVI ${fmt(imageDate)}`}
            onLoad={() => setImgLoaded(true)}
            sx={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
              filter: 'blur(1px)',
            }}
          />
        )}
        <Chip
          label={fmt(imageDate)}
          size="small"
          sx={{
            position: 'absolute', bottom: 12, left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0,0,0,0.65)', color: '#fff',
            fontWeight: 600, backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Navigointipalkki */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0,
      }}>
        <IconButton onClick={prev} disabled={isFirst} size="small" aria-label={t('prevImage')}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {filteredImages.slice(Math.max(0, index - 10), index + 10).map((entry, i) => {
            const realIdx = Math.max(0, index - 10) + i;
            const isActive = realIdx === index;
            return (
              <Box
                key={entry.sentinelid}
                onClick={() => setIndex(realIdx)}
                role="button"
                aria-label={t('image', { n: realIdx + 1 })}
                sx={{
                  p: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Box sx={{
                  width: isActive ? 10 : 6, height: isActive ? 10 : 6,
                  borderRadius: '50%',
                  bgcolor: isActive ? 'primary.main' : 'action.disabled',
                  transition: 'all 0.2s', flexShrink: 0,
                }} />
              </Box>
            );
          })}
        </Box>
        <IconButton onClick={next} disabled={isLast} size="small" aria-label={t('nextImage')}>
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Kasvillisuusjakauma */}
      <VegetationDistribution scale={current.image?.scale} />
    </>
  );

  // ── MOBIILI: accordion-layout ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

        {/* Kuva-accordion */}
        <Accordion
          expanded={expanded === 'image'}
          onChange={() => handleAccordion('image')}
          disableGutters elevation={0}
          sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' }, overflow: 'hidden' }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('ndviImageLabel', { date: fmt(imageDate) })}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 420 }}>
              {imageViewer}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Kaavio-accordion */}
        <Accordion
          expanded={expanded === 'chart'}
          onChange={() => handleAccordion('chart')}
          disableGutters elevation={0}
          sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShowChartIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('chart')}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <NdviTimelineChart
              entries={filteredImages}
              selectedIndex={index}
              onSelect={setIndex}
              chartHeight={200}
            />
          </AccordionDetails>
        </Accordion>

        {/* Tilastot-accordion */}
        <Accordion
          expanded={expanded === 'statistics'}
          onChange={() => handleAccordion('statistics')}
          disableGutters elevation={0}
          sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{t('statistics')}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <StatisticsTab entry={current} weather={currentWeather} />
          </AccordionDetails>
        </Accordion>

        {/* Kartalla-accordion */}
        <LeafletAccordion
          id="onmap"
          label={t('onMap')}
          icon={<MapIcon fontSize="small" color="primary" />}
          expanded={expanded === 'onmap'}
          onChange={handleAccordion}
          contentHeight={580}
        >
          <OnMapTab
            entry={current}
            entries={filteredImages}
            selectedIndex={index}
            onSelect={setIndex}
          />
        </LeafletAccordion>

        {/* Sijainti-accordion */}
        <LeafletAccordion
          id="location"
          label={t('location')}
          icon={<LocationOnIcon fontSize="small" color="primary" />}
          expanded={expanded === 'location'}
          onChange={handleAccordion}
          contentHeight={580}
        >
          {geometry
            ? <LocationTab geometry={geometry} fieldName={fieldName} />
            : <Alert severity="info" sx={{ m: 2 }}>{t('noGeometry')}</Alert>
          }
        </LeafletAccordion>

      </Box>
    );
  }

  // ── DESKTOP: rinnakkainen layout ──────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, height: '100%' }}>
      <Paper
        sx={{
          ...(isFullscreen ? {
            position: 'fixed', inset: 0,
            zIndex: theme.zIndex.modal, borderRadius: 0,
          } : {
            flex: '1 1 65%',
            height: '100%', minHeight: 0,
          }),
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {imageViewer}
      </Paper>

      {!isFullscreen && (
        <Box sx={{ flex: '0 0 35%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <NdviViewPanel
            fieldId={fieldId}
            fieldName={fieldName}
            geometry={geometry}
            entry={current}
            entries={filteredImages}
            selectedIndex={index}
            onSelect={setIndex}
          />
        </Box>
      )}
    </Box>
  );
}