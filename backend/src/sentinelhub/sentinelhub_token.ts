import { Request, Response, NextFunction } from "express";
//import { authenticate} from "../utils/authenticate";
import { authenticate} from "../utils/authenticate_CDSE";
import {_checkToken} from "../utils/checkToken";

// Global variable to store the active token
let authToken: string | null = null;

/**
 * Authenticates with the Sentinel Hub and retrieves an authentication token.
 *
 * @returns {Promise<string>} - A promise that resolves to the authentication token.
 */
const _authenticate = async (): Promise<string> => {
  //authToken = await authAuthenticate();
  authToken = await authenticate();
  return authToken;
};

_authenticate().catch((err) => {
  console.error("Initial authentication failed:", err);
});

/**
 * Checks the token expiration time and re-authenticates if the token is about to expire.
 *
 * @returns {Promise<void>} - A promise that resolves when the token check and possible re-authentication are complete.
 */
const doCheckToken = async (): Promise<void> => {
  // If no token exists yet, authenticate first
  if (!authToken) {
    await _authenticate();
    return;
  }

  const expTime = await _checkToken(authToken);
  console.log("Expiration time: ", expTime);

  if (expTime !== null && expTime <= 600) {
    await _authenticate();
  }
};

// Extend the Express Request interface to accept custom properties
export interface SentinelRequest extends Request {
  doCheckToken?: () => Promise<void>;
  authToken?: string | null;
}

/**
 * Middleware that checks the token and attaches it to the request object.
 *
 * @param {SentinelRequest} request - The HTTP request object.
 * @param {Response} response - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the middleware function completes.
 */
export const checkToken = async (
  request: SentinelRequest,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await doCheckToken();

    // Attach properties to the request object
    request.doCheckToken = doCheckToken;
    request.authToken = authToken;
    
    next();
  } catch (error) {
    next(error); // Pass errors to the Express error handler
  }
};
