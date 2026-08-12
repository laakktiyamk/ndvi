import { setAuthToken } from "@sentinel-hub/sentinelhub-js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CDSE_TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

export const authenticate = async (): Promise<string> => {
  const clientId = process.env.CDSE_CLIENT_ID;
  const clientSecret = process.env.CDSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("CDSE credentials are missing from environment variables!");
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await axios.post(CDSE_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const authToken: string = response.data.access_token;

  // Asetetaan token kirjastolle edelleen, jotta muut sentinelhub-js kutsut toimii
  setAuthToken(authToken);

  return authToken;
};