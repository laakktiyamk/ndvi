import { useState, useMemo } from "react";

import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";

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

    // Kalenteri avataan aina valitun vuoden tammikuuhun (tai valitun päivän kuukauteen)
    const referenceDate = useMemo(() => {
        if (value && value.getFullYear() === selectedYear) return value;
        return new Date(selectedYear, 0, 1);
    }, [selectedYear, value]);

    const shouldDisableDate = useMemo(() => {
        return (date: Date) =>
            !availableDates.some((d) => isSameDay(d, date));
    }, [availableDates]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fi}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <CalendarMonthIcon />
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >

                <DateCalendar
                    value={value}
                    referenceDate={referenceDate}
                    key={value?.toISOString() ?? selectedYear}
                    minDate={new Date(selectedYear, 0, 1)}
                    maxDate={new Date(selectedYear, 11, 31)}
                    shouldDisableDate={shouldDisableDate}
                    onChange={(newValue) => {
                        onChange(newValue);
                        setAnchorEl(null);
                    }}

                    // slots.day:
                    slots={{
                        day: (props: PickerDayProps) => {
                            const isAvailable = availableDates.some((d) =>
                                isSameDay(d, props.day)
                            );
                            return (
                                <Box sx={{ position: "relative" }}>
                                    <PickerDay {...props} sx={isAvailable ? { fontWeight: "bold" } : undefined} />
                                    {isAvailable && !props.selected && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                bottom: 2,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                width: 4,
                                                height: 4,
                                                borderRadius: "50%",
                                                bgcolor: "primary.main",
                                            }}
                                        />
                                    )}
                                </Box>
                            );
                        },
                    }}
                />
            </Popover>
        </LocalizationProvider>
    );
}