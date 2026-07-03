import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Checks the expiration time of a given JWT token.
 *
 * @param {string | null | undefined} authToken - The JWT token to check.
 * @returns {Promise<number | null>} - Returns the remaining time in seconds before the token expires,
 *                                    or null if the token is undefined or doesn't contain an expiration time,
 *                                    or 0 if an error occurs during the process.
 */
export const _checkToken = async (authToken: string | null | undefined): Promise<number | null> => {
  try {
    if (authToken !== undefined && authToken !== null) {
      // Cast the decoded token to JwtPayload to safely access the 'exp' property
      const decoded = jwt.decode(authToken) as JwtPayload | null;
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded && decoded.exp) {
        return decoded.exp - currentTime;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (e) {
    return 0;
  }
};
