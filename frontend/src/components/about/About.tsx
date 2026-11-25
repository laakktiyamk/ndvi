import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FeaturesAccordion, type FeatureGroup } from "./FeaturesAccordion";
import aboutJson from "./about.json";

/** Shape of src/content/about.json. */
interface AboutContent {
  header: { title: string; subtitle: string };
  heading: string;
  description: string;
  featureGroups: FeatureGroup[];
}

/** Typed content; a structural mismatch in the JSON fails tsc. */
const content: AboutContent = aboutJson;

interface AboutProps {
  /** Controls whether the dialog is visible. */
  open: boolean;

  /** Callback fired when the dialog should be closed. */
  onClose: () => void;
}

/**
 * Displays an informational "About" dialog for the application.
 *
 * @remarks
 * All texts are read from `src/content/about.json`, so content can be
 * changed without touching the source code. The dialog performs no actions
 * beyond closing itself.
 *
 * @param open - Whether the dialog is visible.
 * @param onClose - Callback to close the dialog.
 *
 * @returns JSX element representing the About dialog.
 */
export function About({ open, onClose }: AboutProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "action.selected",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1
        }}
      >
        <DialogTitle component="div" sx={{ p: 0 }}>
          <Typography sx={{ fontSize: 18 }}>{content.header.title}</Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            {content.header.subtitle}
          </Typography>
        </DialogTitle>

        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <DialogContent sx={{ mt: 1 }}>
        <Typography variant="h6">{content.heading}</Typography>

        <Typography sx={{ fontSize: 14, mt: 1, mb: 2 }}>
          {content.description}
        </Typography>

        <FeaturesAccordion groups={content.featureGroups} />
      </DialogContent>

      {/* Footer */}
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
