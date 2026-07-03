import axios, { AxiosResponse } from "axios";
import { calculateHeight, calculateWidth } from "../utils/calculateDim";

// Määritellään GeoJSON Polygon -rakenne geometrylle
interface GeoJSONPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

// Määritellään sisäisen funktion palautustyyppi
interface WidthHeight {
  width: number;
  height: number;
}

// Määritellään Sentinel Hubin tilastorajapinnan vastausrakenne
interface SentinelStatisticsResponse {
  data: any[]; // Sentinel Hubin palauttama data-taulukko
}

/**
 * Function to get statistics for a given geometry and time range.
 * 
 * @param {GeoJSONPolygon} geometry - The GeoJSON geometry object.
 * @param {string} dateFrom - The start date in ISO format (YYYY-MM-DD).
 * @param {string} dateTo - The end date in ISO format (YYYY-MM-DD).
 * @param {string} authToken - The valid Sentinel Hub bearer authentication token.
 * @returns {Promise<any[]>} The statistics data array.
 */
export const getStatistics = async (
  geometry: GeoJSONPolygon, 
  dateFrom: string, 
  dateTo: string,
  authToken: string // Välitetään token nyt parametrina, jotta se on helppo antaa Express-reitiltä
): Promise<any[]> => {
  
  // Evalscript on merkkijono, jota Sentinel Hub käyttää palvelimellaan
  const evalscript: string = `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B04", "B08", "dataMask"]
          }],
          output: [
            { id: "data", bands: 1 },
            { id: "dataMask", bands: 1 }
          ]
        };
      }
      
      function evaluatePixel(samples) { 
          let index = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
          return {
              data: [index, samples.B08, samples.B04],
              dataMask: [samples.dataMask]        
          };
      }
  `;

  /**
   * Internal helper function to get width and height for the image.
   */
  async function getWidthAndHeight(geom: GeoJSONPolygon): Promise<WidthHeight> {
    const res: number = 512;

    let width: number = res;
    // calculateHeight palauttaa Promisen, joten käytetään awaitia
    let height: number = await calculateHeight(geom, width);

    if (width < height) {
      height = res;
      width = await calculateWidth(geom, height);
    }

    return { width, height };
  }

  // Puretaan width ja height numeromuuttujiksi
  const { width, height }: WidthHeight = await getWidthAndHeight(geometry);
  const bearAuthToken: string = `Bearer ${authToken}`;

  // uusi osoite
  // url: "https://services.sentinel-hub.com/statistics/v1",
  try {
    // Tyypitetään axios-kutsu odottamaan SentinelStatisticsResponse-rakennetta
    const result: AxiosResponse<SentinelStatisticsResponse> = await axios({
      method: "post",
      url: "https://services.sentinel-hub.com/api/v1/statistics",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearAuthToken,
      },
      data: {
        input: {
          bounds: {
            geometry: geometry,
          },
          data: [
            {
              dataFilter: { maxCloudCoverage: 20 },
              type: "sentinel-2-l1c",
            },
          ],
        },
        aggregation: {
          timeRange: {
            from: dateFrom,
            to: dateTo,
          },
          aggregationInterval: {
            of: "P1D",
          },
          RESX: "10m",
          RESY: "10m",
          width: width,
          height: height,
          evalscript: evalscript,
        },
        calculations: {
          default: {},
        },
      },
    });

    return result.data.data;
  } catch (err) {
    console.error("Error fetching Sentinel statistics:", err);
    return [];
  }
};
