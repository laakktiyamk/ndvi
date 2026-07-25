"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = void 0;
//import { authenticate as authAuthenticate } from "../utils/authenticate";
const authenticate_1 = require("../utils/authenticate");
const checkToken_1 = require("../utils/checkToken");
// Global variable to store the active token
let authToken = null;
/**
 * Authenticates with the Sentinel Hub and retrieves an authentication token.
 *
 * @returns {Promise<string>} - A promise that resolves to the authentication token.
 */
const _authenticate = async () => {
    //authToken = await authAuthenticate();
    authToken = await (0, authenticate_1.authenticate)();
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
const doCheckToken = async () => {
    // If no token exists yet, authenticate first
    if (!authToken) {
        await _authenticate();
        return;
    }
    const expTime = await (0, checkToken_1._checkToken)(authToken);
    console.log("Expiration time: ", expTime);
    if (expTime !== null && expTime <= 600) {
        await _authenticate();
    }
};
/**
 * Middleware that checks the token and attaches it to the request object.
 *
 * @param {SentinelRequest} request - The HTTP request object.
 * @param {Response} response - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the middleware function completes.
 */
const checkToken = async (request, response, next) => {
    try {
        await doCheckToken();
        // Attach properties to the request object
        request.doCheckToken = doCheckToken;
        request.authToken = authToken;
        next();
    }
    catch (error) {
        next(error); // Pass errors to the Express error handler
    }
};
exports.checkToken = checkToken;
