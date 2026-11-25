import { useState, type SyntheticEvent } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

/** A titled group of features shown as one accordion panel. */
export interface FeatureGroup {
  /** Title of the feature group shown in the accordion header. */
  title: string;

  /** Feature descriptions displayed inside the accordion. */
  items: string[];
}

interface FeaturesAccordionProps {
  /** Feature groups to display, one accordion panel per group. */
  groups: FeatureGroup[];
}

/**
 * Displays an accordion list of grouped application features.
 *
 * @remarks
 * Used inside the **About** dialog. Only one panel is open at a time.
 * Content comes from props, so the component contains no hardcoded text.
 *
 * @param groups - Feature groups to display.
 *
 * @returns JSX element containing the grouped feature accordions.
 */
export function FeaturesAccordion({ groups }: FeaturesAccordionProps) {
  /** ID of the currently expanded panel, or false if none. */
  const [expanded, setExpanded] = useState<string | false>(false);

  /**
   * Handles accordion expand/collapse behavior.
   *
   * @param panel - ID of the accordion panel being toggled.
   */
  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <>
      {groups.map((group, index) => {
        const panelId = `panel-${index}`;

        return (
          <Accordion
            key={panelId}
            expanded={expanded === panelId}
            onChange={handleChange(panelId)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                {group.title}
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <List dense disablePadding>
                {group.items.map((item) => (
                  <ListItem key={item} disableGutters>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
}
