// NdviFilmroll.tsx
// Horizontal scrollable filmroll of NDVI satellite images.
// Drop into NdviViewPanel as a new tab alongside Chart / Statistics / On Map.
//
// Props:
//   entries  — NdviImageEntry[] from your existing appStore / API response
//   height   — optional frame height in px (default 110)
//   onSelect — optional callback when user clicks a frame (e.g. sync NdviDatePicker)

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import CloudIcon from '@mui/icons-material/Cloud'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import { useTranslation } from 'react-i18next'
import {
  NdviImageEntry,
  getNdviMeta,
  ndviToPercent,
} from './ndviFilmrollUtils'

// ── tiny helpers ─────────────────────────────────────────────────────────────

const SPROCKET_COUNT = 22

function SprocketRow() {
  return (
    <Box sx={{ display: 'flex', gap: '14px', px: '10px', overflow: 'hidden' }}>
      {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 16,
            height: 10,
            flexShrink: 0,
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

// ── frame card ───────────────────────────────────────────────────────────────

interface FrameProps {
  entry: NdviImageEntry
  selected: boolean
  height: number
  onClick: () => void
}

function FilmFrame({ entry, selected, height, onClick }: FrameProps) {
  const mean = entry.ndviMean ?? 0
  const meta = getNdviMeta(mean)
  const date = new Date(entry.date).toLocaleDateString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  return (
    <Tooltip title={`${entry.date} · NDVI ${mean.toFixed(2)}`} placement="top" arrow>
      <Box
        onClick={onClick}
        sx={{
          flexShrink: 0,
          width: 140,
          cursor: 'pointer',
          borderRadius: '3px',
          border: '2px solid',
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
        {/* satellite image */}
        <Box
          component="img"
          src={entry.imageUrl}
          alt={entry.date}
          loading="lazy"
          sx={{
            width: '100%',
            height,
            objectFit: 'cover',
            display: 'block',
            filter: 'saturate(0.85) contrast(1.05)',
          }}
        />

        {/* metadata strip */}
        <Box sx={{ bgcolor: 'grey.900', px: 0.75, py: 0.5 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'grey.400', display: 'block' }}>
            {date}
          </Typography>
          <Chip
            label={`${mean.toFixed(2)}`}
            size="small"
            sx={{
              mt: 0.25,
              height: 18,
              fontSize: 10,
              fontFamily: 'monospace',
              bgcolor: meta.color,
              color: meta.textColor,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  )
}

// ── detail card ──────────────────────────────────────────────────────────────

function FilmrollDetail({ entry }: { entry: NdviImageEntry }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const mean = entry.ndviMean ?? 0
  const min  = entry.ndviMin  ?? 0
  const max  = entry.ndviMax  ?? 0
  const meta = getNdviMeta(mean)
  const pct  = ndviToPercent(mean)

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
          <Typography variant="body2" fontWeight={500}>
            {new Date(entry.date).toLocaleDateString('fi-FI', {
              weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={0.75} alignItems="center" mt={0.25}>
            <SatelliteAltIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">Sentinel-2</Typography>
            <CloudIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {entry.cloudCoverPct}% {t('filmroll.cloudCover', 'pilvisyys')}
            </Typography>
          </Stack>
        }
        action={
          <Chip
            label={`${mean.toFixed(2)} · ${meta.labelFi}`}
            size="small"
            sx={{ bgcolor: meta.color, color: meta.textColor, fontFamily: 'monospace', mt: 1, mr: 1 }}
          />
        }
        sx={{ pb: 0 }}
      />

      <Divider />

      <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
        {/* stat row */}
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={0}>
          {[
            { label: t('filmroll.mean', 'Keskiarvo'), value: mean.toFixed(2), sub: 'NDVI mean' },
            { label: t('filmroll.range', 'Vaihteluväli'), value: `${min.toFixed(2)}–${max.toFixed(2)}`, sub: t('filmroll.fieldRange', 'lohkon sisällä') },
            { label: t('filmroll.cloud', 'Pilvisyys'), value: `${entry.cloudCoverPct}%`, sub: 'SCL mask' },
          ].map(({ label, value, sub }) => (
            <Box key={label} sx={{ flex: 1, px: 2, py: 0.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" textTransform="uppercase" letterSpacing="0.06em">
                {label}
              </Typography>
              <Typography variant="h6" fontFamily="monospace" fontWeight={500} lineHeight={1.3}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.disabled">{sub}</Typography>
            </Box>
          ))}
        </Stack>

        {/* NDVI position bar */}
        <Box mt={1.5}>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">
            {t('filmroll.scale', 'Sijainti NDVI-asteikolla')}
          </Typography>
          <Box sx={{ position: 'relative', mt: 0.75 }}>
            {/* gradient track (decorative) */}
            <Box sx={{
              height: 8,
              borderRadius: 1,
              background: 'linear-gradient(to right, #8B4513, #DAA520, #90EE90, #228B22, #006400)',
              mb: 0.25,
            }} />
            {/* MUI bar clipped to value — shows exact class colour */}
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 8,
                borderRadius: 1,
                bgcolor: 'transparent',
                '& .MuiLinearProgress-bar': { bgcolor: meta.muiColor, borderRadius: 1 },
              }}
            />
            {/* cursor dot */}
            <Box sx={{
              position: 'absolute',
              top: -4,
              left: `${pct}%`,
              transform: 'translateX(-50%)',
              width: 16, height: 16,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.800',
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'background.paper',
              transition: 'left 0.3s',
              pointerEvents: 'none',
            }} />
          </Box>
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            {['-1.0 paljas', '0.0 neutraali', '+1.0 rehevä'].map(s => (
              <Typography key={s} variant="caption" color="text.disabled" fontFamily="monospace" fontSize={10}>
                {s}
              </Typography>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface NdviFilmrollProps {
  entries: NdviImageEntry[]
  frameHeight?: number
  onSelect?: (entry: NdviImageEntry) => void
}

export function NdviFilmroll({ entries, frameHeight = 110, onSelect }: NdviFilmrollProps) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  // drag-to-scroll
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.pageX, scrollLeft: trackRef.current?.scrollLeft ?? 0 }
  }, [])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current.active || !trackRef.current) return
    trackRef.current.scrollLeft = drag.current.scrollLeft - (e.pageX - drag.current.startX)
  }, [])
  const onMouseUp = useCallback(() => { drag.current.active = false }, [])

  // scroll selected frame into view
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const frame = track.children[selectedIdx] as HTMLElement | undefined
    frame?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
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
      {/* ── film strip ── */}
      <Box sx={{ bgcolor: '#141414', borderRadius: 2, py: '10px', overflow: 'hidden' }}>
        <SprocketRow />

        <Box
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          sx={{
            display: 'flex',
            gap: '6px',
            px: '10px',
            py: '6px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          {entries.map((entry, i) => (
            <FilmFrame
              key={entry.date}
              entry={entry}
              selected={i === selectedIdx}
              height={frameHeight}
              onClick={() => select(i)}
            />
          ))}
        </Box>

        <SprocketRow />
      </Box>

      {/* ── detail card ── */}
      <FilmrollDetail entry={entries[selectedIdx]} />
    </Box>
  )
}
