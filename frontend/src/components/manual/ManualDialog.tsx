import {
  Dialog,
  DialogTitle,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useManualStore } from "../../store/manualStore";

export default function ManualDialog() {
  const { open, anchor, closeManual } = useManualStore();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { i18n } = useTranslation();

  const lang = i18n.language?.startsWith("fi") ? "fi" : "en";
  const src = `${import.meta.env.BASE_URL}manual/${lang}/index.html${anchor ? `#${anchor}` : ""
    }`;

  return (
    <Dialog
      open={open}
      onClose={closeManual}
      fullScreen={fullScreen}
      fullWidth 
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: fullScreen ? "100%" : "80vh",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {lang === "fi" ? "Käyttöohje" : "User guide"}
        <IconButton onClick={closeManual} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <iframe
          key={`${lang}-${anchor}`}
          src={src}
          title="Manual"
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </Box>
    </Dialog>
  );
}