import { Box } from '@mui/material';
import NdviTimelineChart from '../NdviTimelineChart';
import type { MergedNdviEntry } from '../../../types';

interface Props {
  entries: MergedNdviEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function ChartTab({ entries, selectedIndex, onSelect }: Props) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <NdviTimelineChart
        entries={entries}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />
    </Box>
  );
}
