import { useState, useMemo } from "react";

import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickerDay, PickerDayProps } from "@mui/x-date-pickers";

import { fi } from "date-fns/locale";
import { isSameDay } from "date-fns";

interface Props {
  value: Date | null;
  selectedYear: number;
  availableDates: Date[];
  onChange: (date: Date | null) => void;
}

export default function NdviDatePicker({
  value,
  selectedYear,
  availableDates,
  onChange,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  // Mobiililla (<600px) Popover voi mennä ruudun reunan yli (~320px kalenteri).
  // Dialog keskittää kalenterin ruudulle ja on touch-käyttäjälle ergonomisempi.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const open = Boolean(anchorEl);
  const handleClose = () => setAnchorEl(null);

  // Kalenteri avataan valitun päivän kuukauteen tai valitun vuoden tammikuuhun
  const referenceDate = useMemo(() => {
    if (value && value.getFullYear() === selectedYear) return value;
    return new Date(selectedYear, 0, 1);
  }, [selectedYear, value]);

  const shouldDisableDate = useMemo(() => {
    return (date: Date) => !availableDates.some((d) => isSameDay(d, date));
  }, [availableDates]);

  // Päivä-renderer: aiempi toteutus wrappasi PickerDayn ylimääräiseen Box-elementtiin
  // joka rikkoi MUI:n sisäisen layout-logiikan (päivien välit, koko). Nyt indikaattori
  // tehdään ::after-pseudoelementtinä suoraan PickerDayyn — ei ylimääräisiä DOM-nodeja.
  const renderDay = (props: PickerDayProps) => {
    const isAvailable = availableDates.some((d) => isSameDay(d, props.day));
    return (
      <PickerDay
        {...props}
        sx={{
          ...(isAvailable &&
            !props.outsideCurrentMonth && {
              fontWeight: "bold",
              // Piste valittavissa olevien päivien alla
              "&:not(.Mui-selected)::after": {
                content: '""',
                position: "absolute",
                bottom: 3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "primary.main",
              },
            }),
        }}
      />
    );
  };

  const calendar = (
    <DateCalendar
      value={value}
      referenceDate={referenceDate}
      key={value?.toISOString() ?? selectedYear}
      minDate={new Date(selectedYear, 0, 1)}
      maxDate={new Date(selectedYear, 11, 31)}
      shouldDisableDate={shouldDisableDate}
      onChange={(newValue) => {
        onChange(newValue);
        handleClose();
      }}
      slots={{ day: renderDay }}
    />
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fi}>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Avaa kalenteri">
        <CalendarMonthIcon />
      </IconButton>

      {isMobile ? (
        // Mobiili: Dialog keskittää kalenterin — ei reunan yli menemistä
        <Dialog open={open} onClose={handleClose}>
          <DialogContent sx={{ p: 0 }}>
            {calendar}
          </DialogContent>
        </Dialog>
      ) : (
        // Desktop: Popover ankkuroituu painikkeeseen
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {calendar}
        </Popover>
      )}
    </LocalizationProvider>
  );
}
