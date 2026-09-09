import growingSeason from '../settings/growingSeason.json';

export function getGrowingSeasons(
  fromYear: number,
  toYear: number
): { start: Date; end: Date }[] {
  const today = new Date();
  const seasons: { start: Date; end: Date }[] = [];

  for (let year = fromYear; year <= toYear; year++) {
    const start = new Date(`${year}-${String(growingSeason.startMonth).padStart(2,'0')}-${String(growingSeason.startDay).padStart(2,'0')}`);
    const end   = new Date(`${year}-${String(growingSeason.endMonth).padStart(2,'0')}-${String(growingSeason.endDay).padStart(2,'0')}`);

    // Kasvukausi ei ole vielä alkanut — ohitetaan
    if (today < start) continue;

    // Kesken — leikataan tähän päivään (getWeatherData leikkaa vielä archive-rajaan)
    const effectiveEnd = today < end ? today : end;

    seasons.push({ start, end: effectiveEnd });
  }

  return seasons;
}