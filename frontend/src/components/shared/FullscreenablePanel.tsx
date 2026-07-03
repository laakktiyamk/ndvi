import { useState, type ReactNode } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

interface Props {
  /**
   * Render-prop: saa isFullscreen-tilan, päättää itse mitä näyttää.
   * Esim. piilota kontrollipalkki tai näytä enemmän dataa fullscreenissä.
   */
  children: (isFullscreen: boolean) => ReactNode;
  /** Onko expand-nappi näkyvissä (esim. piilota pienillä datamäärillä) */
  disabled?: boolean;
}

export default function FullscreenablePanel({ children, disabled }: Props) {
  const theme = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Box
      sx={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? theme.zIndex.modal : 'auto',
        width: '100%',
        height: '100%',
        bgcolor: isFullscreen ? '#0a0a0a' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {!disabled && (
        <IconButton
          onClick={() => setIsFullscreen((v) => !v)}
          aria-label={isFullscreen ? 'Sulje koko ruutu' : 'Avaa koko ruutu'}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'background.default' },
          }}
        >
          {isFullscreen ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
        </IconButton>
      )}

      {children(isFullscreen)}
    </Box>
  );
}
