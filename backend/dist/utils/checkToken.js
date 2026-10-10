"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._checkToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Checks the expiration time of a given JWT token.
 *
 * @param {string | null | undefined} authToken - The JWT token to check.
 * @returns {Promise<number | null>} - Returns the remaining time in seconds before the token expires,
 *                                    or null if the token is undefined or doesn't contain an expiration time,
 *                                    or 0 if an error occurs during the process.
 */
const _checkToken = async (authToken) => {
    try {
        if (authToken !== undefined && authToken !== null) {
            // Cast the decoded token to JwtPayload to safely access the 'exp' property
            const decoded = jsonwebtoken_1.default.decode(authToken);
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded && decoded.exp) {
                return decoded.exp - currentTime;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    catch (e) {
        return 0;
    }
};
exports._checkToken = _checkToken;
