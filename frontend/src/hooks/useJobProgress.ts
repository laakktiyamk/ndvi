import { useEffect, useRef, useState } from 'react';
import { getJob } from '../services/jobService';
import type { JobState, JobMessage } from '../services/jobService';
import { WS_URL } from '../config';

const POLL_INTERVAL_MS = 3000;

export function useJobProgress(jobId: string | null, token: string | null) {
    const [job, setJob] = useState<JobState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const jobRef = useRef<JobState | null>(null);

    // Ottaa vastaan uuden tilan vain, jos se on yhtä tuore tai tuoreempi kuin nykyinen
    const apply = (next: JobState) => {
        const cur = jobRef.current;
        if (cur && next.done + next.failed < cur.done + cur.failed) return;
        jobRef.current = next;
        setJob(next);
    };

    useEffect(() => {
        jobRef.current = null;
        setJob(null);
        setError(null);

        if (!jobId || !token || !WS_URL) return;

        let closed = false;
        // ...loppu ennallaan (poista kolme nollausriviä, jotka olivat aiemmin tässä);
        let pollTimer: ReturnType<typeof setInterval> | null = null;

        const fetchOnce = async () => {
            try {
                apply(await getJob(jobId));
            } catch {
                setError('status fetch failed');
            }
        };

        // Varakeino: jos WebSocket ei aukea tai katkeaa kesken, pollataan
        const startPolling = () => {
            if (closed || pollTimer) return;
            pollTimer = setInterval(async () => {
                await fetchOnce();
                if (jobRef.current && jobRef.current.status !== 'running' && pollTimer) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            }, POLL_INTERVAL_MS);
        };

        const ws = new WebSocket(
            `${WS_URL}?jobId=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
        );

        ws.onopen = () => {
            // Putki on voinut edetä ennen yhteyden avautumista, joten haetaan alkutila
            void fetchOnce();
        };

        ws.onmessage = (ev) => {
            try {
                const m = JSON.parse(ev.data) as JobMessage;
                apply({
                    jobId: m.jobId,
                    total: m.total,
                    done: m.done,
                    failed: m.failed,
                    status: m.jobStatus,
                });
            } catch {
                /* ohitetaan tuntematon viesti */
            }
        };

        ws.onerror = () => startPolling();
        ws.onclose = () => {
            if (!closed && jobRef.current?.status !== 'done' && jobRef.current?.status !== 'failed') {
                startPolling();
            }
        };

        return () => {
            closed = true;
            if (pollTimer) clearInterval(pollTimer);
            ws.close();
        };
    }, [jobId, token]);

    return { job, error };
}