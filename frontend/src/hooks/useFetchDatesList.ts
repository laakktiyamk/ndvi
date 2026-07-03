import { useState, useEffect } from 'react';
import { fetchDatesList, type DatesList } from '../services/ndviService';

interface Result {
  data: DatesList | null;
  loading: boolean;
  error: string | null;
}

const useFetchDatesList = (
  geometry: object | null,
  startDate: string,
  endDate: string,
  name: string = '',   // ← lisätty
): Result => {
  const [data, setData]       = useState<DatesList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!geometry) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDatesList(geometry, startDate, endDate, name);
        if (!cancelled) setData(res.data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Haku epäonnistui');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [geometry, startDate, endDate, name]);

  return { data, loading, error };
};

export default useFetchDatesList;
