import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import { fi } from "date-fns/locale";

interface Props {
    value: Date | null;
    selectedYear: number;
    onChange: (date: Date | null) => void;
}

export default function NdviDatePicker({
    value,
    selectedYear,
    onChange,
}: Props) {

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    console.log("NdviDatePicker render", { value, selectedYear });
    return (
        <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={fi}
        >

            <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                <CalendarMonthIcon />
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <DateCalendar
                    value={value}
                    minDate={new Date(selectedYear, 0, 1)}
                    maxDate={new Date(selectedYear, 11, 31)}
                    onChange={(newValue) => {
                        onChange(newValue);
                        setAnchorEl(null);
                    }}
                />
            </Popover>

        </LocalizationProvider>
    );
}