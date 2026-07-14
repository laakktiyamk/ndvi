// components/ndvi/NdviTimelineChart.tsx
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceDot, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Typography, Paper } from '@mui/material';
import type { MergedNdviEntry } from '../../types';


interface Props {
    entries: MergedNdviEntry[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

const NDVI_COLOR = (v: number) => {
    if (v >= 0.6) return '#2E7D32';
    if (v >= 0.4) return '#689F38';
    if (v >= 0.2) return '#F9A825';
    return '#C62828';
};

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}.${d.getMonth() + 1}.`;
};

export default function NdviTimelineChart({ entries, selectedIndex, onSelect }: Props) {
    if (!entries.length) return null;

    const data = entries.map((e, i) => ({
        i,
        date: e.generationtime,
        mean: parseFloat(e.stats.average.toFixed(3)),
        color: NDVI_COLOR(e.stats.average),
    }));

    const selected = data[selectedIndex];

    return (
        <Paper sx={{ p: 2, mt: 2,bgcolor: 'background.paper'  }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                NDVI-keskiarvo — aikasarja
            </Typography>
            <ResponsiveContainer width="100%" height={160}>
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                    onClick={(e: any) => {
                        const payload = e?.activePayload?.[0]?.payload;
                        if (payload) onSelect(payload.i);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v) => v.toFixed(1)}
                        tick={{ fontSize: 10 }}
                        width={36}
                    />
                    <Tooltip
                        formatter={(v) => {
                            const num = typeof v === 'number' ? v : Number(v);
                            return [num.toFixed(3), 'NDVI avg'];
                        }}
                        labelFormatter={(label) =>
                            new Date(label).toLocaleDateString('fi-FI')
                        }
                    />

                    <Line
                        type="monotone"
                        dataKey="mean"
                        stroke="#689F38"
                        strokeWidth={2}
                        dot={(props) => {
                            const { cx, cy, payload } = props;
                            if (payload.i === selectedIndex) return <circle key={`dot-${payload.i}`} cx={cx} cy={cy} r={7} fill={payload.color} stroke="#fff" strokeWidth={2} />;
                            return <g key={`dot-${payload.i}`} />;
                        }}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                    {/* Valittu piste korostettuna NDVI-luokan värillä */}
                    {selected && (
                        <>
                            <ReferenceLine
                                x={selected.date}
                                stroke={selected.color}
                                strokeDasharray="4 2"
                                strokeWidth={1.5}
                            />
                            <ReferenceDot
                                x={selected.date}
                                y={selected.mean}
                                r={7}
                                fill={selected.color}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                        </>
                    )}
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );
}