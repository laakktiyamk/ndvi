import crypto from "crypto";

/**
 * Calculates the SHA-256 hash of a given geometry object or string.
 * @param {unknown | string} geometry - The geometry object or string.
 * @returns {string} The SHA-256 hash.
 */
export const sha256 = (geometry: unknown | string): string => {
  let jsonString: string;
  
  if (typeof geometry !== "string") {
    jsonString = JSON.stringify(geometry);
  } else {
    jsonString = geometry;
  }
  
  const hash = crypto.createHash("sha256").update(jsonString).digest("hex");
  return hash;
};
