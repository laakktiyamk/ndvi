import axios from "axios";
import centroid from "@turf/centroid";
import { Geometry } from "geojson";

const formatDate = (date: Date): string =>
  date.toISOString().split("T")[0];

// Open-Meteo Archive API vaatii että endDate on vähintään 2 päivää menneisyydessä
export const getArchiveCutoff = (): Date => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
};

export const getCentroid = (geometry: Geometry): { lat: number; lon: number } => {
  const c = centroid({ type: "Feature", geometry, properties: {} });
  const [lon, lat] = c.geometry.coordinates;
  return { lat, lon };
};

export const getWeatherData = async (
  geometry: Geometry,
  startDate: Date,
  endDate: Date
) => {
  const cutoff = getArchiveCutoff();

  // Rajoitetaan endDate archive-rajaan
  const safeEndDate = endDate > cutoff ? cutoff : endDate;

  // Jos aikaväli on tyhjä tai negatiivinen, ei haeta
  if (startDate >= safeEndDate) {
    console.log(`Weather: skipping fetch, range too recent (${formatDate(startDate)} → ${formatDate(safeEndDate)})`);
    return null;
  }

  const { lat, lon } = getCentroid(geometry);

  console.log(`Weather: fetching ${formatDate(startDate)} → ${formatDate(safeEndDate)}`);

  const response = await axios.get(
    "https://archive-api.open-meteo.com/v1/archive",
    {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: formatDate(startDate),
        end_date: formatDate(safeEndDate),        
        daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,shortwave_radiation_sum,et0_fao_evapotranspiration,wind_speed_10m_mean",
        timezone: "UTC",
      },
    }
  );

  return response.data;
};
