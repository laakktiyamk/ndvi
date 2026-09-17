import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { useTranslation } from 'react-i18next'
import {
  NdviImageEntry,
  getNdviMeta,
  getNdviClassLabel,
  ndviToPercent,
} from './ndviFilmrollUtils'

const dateLocaleMap: Record<string, string> = {
  fi: 'fi-FI',
  en: 'en-GB',
}
const getLocale = (language: string) => dateLocaleMap[language] ?? language

// Karkea, ei-tieteellinen nyrkkisääntö lohkon sisäisen NDVI-hajonnan tulkintaan.
// Toisin kuin keskiarvo, hajonnassa PIENEMPI on aina parempi (= tasaisempi kasvu).
// Rajat ovat suuntaa-antavia (Sentinel-2, koko kasvukauden kattava lohko) — pieni
// lohko (vähän pikseleitä) tai pilvien/varjojen jäänteet voivat nostaa hajontaa
// keinotekoisesti, joten tätä ei pidä esittää käyttäjälle ehdottomana totuutena.
function getUniformityKey(std: number): { key: string; fallback: string } {
  if (std < 0.05) return { key: 'filmroll.uniformityUniform', fallback: 'Tasainen' }
  if (std < 0.15) return { key: 'filmroll.uniformityVariable', fallback: 'Vaihteleva' }
  return { key: 'filmroll.uniformityUneven', fallback: 'Epätasainen' }
}

const SPROCKET_COUNT = 22

function SprocketRow() {
  return (
    <Box sx={{ display: 'flex', gap: '14px', px: '10px', overflow: 'hidden' }}>
      {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 16, height: 10, flexShrink: 0,
            borderRadius: '2px',
            bgcolor: 'grey.800',
            border: '1px solid',
            borderColor: 'grey.700',
          }}
        />
      ))}
    </Box>
  )
}

interface FrameProps {
  entry: NdviImageEntry
  selected: boolean
  height: number
  locale: string
  onClick: () => void
}

function FilmFrame({ entry, selected, height, locale, onClick }: FrameProps) {
  const mean = entry.ndviMean ?? 0
  const meta = getNdviMeta(mean)
  const date = new Date(entry.date).toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })

  return (
    <Tooltip title={`${entry.date} · NDVI ${mean.toFixed(2)}`} placement="top" arrow>
      <Box
        onClick={onClick}
        sx={{
          flexShrink: 0, width: 140, cursor: 'pointer',
          borderRadius: '3px', border: '2px solid',
          borderColor: selected ? 'success.main' : 'grey.800',
          overflow: 'hidden',
          transition: 'transform 0.18s, border-color 0.18s',
          transform: selected ? 'scale(1.06)' : 'scale(1)',
          '&:hover': {
            transform: selected ? 'scale(1.06)' : 'scale(1.03)',
            borderColor: selected ? 'success.main' : 'grey.600',
          },
        }}
      >
        <Box
          component="img"
          src={entry.imageUrl}
          alt={entry.date}
          loading="lazy"
          sx={{
            width: '100%', height, objectFit: 'cover', display: 'block',
            filter: 'saturate(0.85) contrast(1.05)',
          }}
        />
        <Box sx={{ bgcolor: 'grey.900', px: 0.75, py: 0.5 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'grey.400', display: 'block' }}>
            {date}
          </Typography>
          <Chip
            label={mean.toFixed(2)}
            size="small"
            sx={{
              mt: 0.25, height: 18, fontSize: 10, fontFamily: 'monospace',
              bgcolor: meta.color, color: meta.textColor,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  )
}

function FilmrollDetail({ entry, locale, language }: { entry: NdviImageEntry; locale: string; language: string }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const mean = entry.ndviMean ?? 0
  const min  = entry.ndviMin  ?? 0
  const max  = entry.ndviMax  ?? 0
  const std  = entry.ndviStd  ?? 0
  const meta = getNdviMeta(mean)
  const pct  = ndviToPercent(mean)
  const uniformity = getUniformityKey(std)

  return (
    <Card variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
      <CardHeader
        avatar={
          <Box
            component="img"
            src={entry.imageUrl}
            sx={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 1 }}
          />
        }
        title={
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {new Date(entry.date).toLocaleDateString(locale, {
              weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.25 }}>
            <SatelliteAltIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">Sentinel-2</Typography>
          </Stack>
        }
        action={
          <Chip
            label={`${mean.toFixed(2)} · ${getNdviClassLabel(meta, language)}`}
            size="small"
            sx={{ bgcolor: meta.color, color: meta.textColor, fontFamily: 'monospace', mt: 1, mr: 1 }}
          />
        }
        sx={{ pb: 0 }}
      />

      <Divider />

      <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={0}>
          {[
            { label: t('filmroll.mean', 'Keskiarvo'),     value: mean.toFixed(2),                       sub: t('filmroll.meanSub', 'NDVI mean') },
            { label: t('filmroll.range', 'Vaihteluväli'), value: `${min.toFixed(2)}–${max.toFixed(2)}`, sub: t('filmroll.fieldRange', 'lohkon sisällä') },
            { label: t('filmroll.std', 'Hajonta'),        value: std.toFixed(3),                        sub: `${t('filmroll.stdSub', 'NDVI std')} · ${t(uniformity.key, uniformity.fallback)}` },
          ].map(({ label, value, sub }) => (
            <Box key={label} sx={{ flex: 1, px: 2, py: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                {label}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 500, lineHeight: 1.3 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.disabled">{sub}</Typography>
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {t('filmroll.scale', 'Sijainti NDVI-asteikolla')}
          </Typography>
          <Box sx={{ position: 'relative', mt: 0.75 }}>
            <Box sx={{
              height: 8, borderRadius: 1,
              background: 'linear-gradient(to right, #8B4513, #DAA520, #90EE90, #228B22, #006400)',
              mb: 0.25,
            }} />
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 8, borderRadius: 1, bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': { bgcolor: meta.muiColor, borderRadius: 1 },
              }}
            />
            <Box sx={{
              position: 'absolute', top: -4,
              left: `${pct}%`, transform: 'translateX(-50%)',
              width: 16, height: 16,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.800',
              borderRadius: '50%', border: '2px solid',
              borderColor: 'background.paper',
              transition: 'left 0.3s', pointerEvents: 'none',
            }} />
          </Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
            {[
              { value: '0.0', key: 'filmroll.scaleBare',     fallback: 'paljas' },
              { value: '0.5', key: 'filmroll.scaleModerate', fallback: 'kohtalainen' },
              { value: '1.0', key: 'filmroll.scaleLush',     fallback: 'rehevä' },
            ].map(({ value, key, fallback }) => (
              <Typography
                key={key}
                variant="caption"
                color="text.disabled"
                sx={{ fontFamily: 'monospace', fontSize: 10 }}
              >
                {value} {t(key, fallback)}
              </Typography>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

interface NdviFilmrollProps {
  entries: NdviImageEntry[]
  frameHeight?: number
  onSelect?: (entry: NdviImageEntry) => void
  initialSelectedDate?: string
}

export function NdviFilmroll({ entries, frameHeight = 110, onSelect, initialSelectedDate }: NdviFilmrollProps) {
  const { t, i18n } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const locale = getLocale(i18n.language)

  const [selectedIdx, setSelectedIdx] = useState(() => {
    if (initialSelectedDate) {
      const idx = entries.findIndex(e => e.date === initialSelectedDate)
      if (idx !== -1) return idx
    }
    return Math.max(0, entries.length - 1)
  })

  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.pageX, scrollLeft: trackRef.current?.scrollLeft ?? 0 }
  }, [])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current.active || !trackRef.current) return
    trackRef.current.scrollLeft = drag.current.scrollLeft - (e.pageX - drag.current.startX)
  }, [])
  const onMouseUp = useCallback(() => { drag.current.active = false }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        track.scrollLeft += e.deltaY
      }
    }
    track.addEventListener('wheel', handleWheel, { passive: false })
    return () => track.removeEventListener('wheel', handleWheel)
  }, [])

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setCanScrollLeft(track.scrollLeft > 4)
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    updateScrollButtons()
    track.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)
    return () => {
      track.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [entries.length, updateScrollButtons])

  const scrollByFrames = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * (140 + 6) * 3, behavior: 'smooth' })
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const frame = track.children[selectedIdx] as HTMLElement | undefined
    frame?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedIdx])

  function select(i: number) {
    setSelectedIdx(i)
    onSelect?.(entries[i])
  }

  if (!entries.length) {
    return (
      <Typography color="text.secondary" variant="body2" sx={{ py: 3, textAlign: 'center' }}>
        {t('filmroll.noData', 'Ei kuvia valitulle lohkolle.')}
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ position: 'relative', bgcolor: '#141414', borderRadius: 2, py: '10px', overflow: 'hidden' }}>
        <SprocketRow />
        <Box
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          sx={{
            display: 'flex', gap: '6px', px: '10px', py: '6px',
            overflowX: 'auto', scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            cursor: 'grab', '&:active': { cursor: 'grabbing' },
          }}
        >
          {entries.map((entry, i) => (
            <FilmFrame
              key={entry.date}
              entry={entry}
              selected={i === selectedIdx}
              height={frameHeight}
              locale={locale}
              onClick={() => select(i)}
            />
          ))}
        </Box>
        <SprocketRow />

        {canScrollLeft && (
          <IconButton
            size="small"
            onClick={() => scrollByFrames(-1)}
            aria-label={t('filmroll.scrollLeft', 'Vieritä vasemmalle')}
            sx={{
              position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
        )}
        {canScrollRight && (
          <IconButton
            size="small"
            onClick={() => scrollByFrames(1)}
            aria-label={t('filmroll.scrollRight', 'Vieritä oikealle')}
            sx={{
              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <FilmrollDetail entry={entries[selectedIdx]} locale={locale} language={i18n.language} />
    </Box>
  )
} 