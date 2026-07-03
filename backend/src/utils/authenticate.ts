import { setAuthToken, requestAuthToken } from "@sentinel-hub/sentinelhub-js";

import dotenv from "dotenv";
dotenv.config();

/**
 * Authenticates with the Sentinel Hub API using environment credentials.
 * 
 * @returns {Promise<string>} The authentication token.
 */
export const authenticate = async (): Promise<string> => {
  const clientId = process.env.sentinelHubClientId;
  const clientSecret = process.env.sentinelHubClientSecret;

  // Verify that the required environment variables are present
  if (!clientId || !clientSecret) {
    throw new Error("Sentinel Hub credentials are missing from environment variables!");
  }

  const authToken = await requestAuthToken(clientId, clientSecret);
   
  setAuthToken(authToken);  
  return authToken;
};
