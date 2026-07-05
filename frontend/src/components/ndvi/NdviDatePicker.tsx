import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import { fi } from "date-fns/locale";

export default function NdviDatePicker() {

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

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
                <DateCalendar />
            </Popover>

        </LocalizationProvider>
    );
}