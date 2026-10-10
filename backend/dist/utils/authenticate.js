"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const sentinelhub_js_1 = require("@sentinel-hub/sentinelhub-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Authenticates with the Sentinel Hub API using environment credentials.
 *
 * @returns {Promise<string>} The authentication token.
 */
const authenticate = async () => {
    const clientId = process.env.sentinelHubClientId;
    const clientSecret = process.env.sentinelHubClientSecret;
    // Verify that the required environment variables are present
    if (!clientId || !clientSecret) {
        throw new Error("Sentinel Hub credentials are missing from environment variables!");
    }
    const authToken = await (0, sentinelhub_js_1.requestAuthToken)(clientId, clientSecret);
    (0, sentinelhub_js_1.setAuthToken)(authToken);
    return authToken;
};
exports.authenticate = authenticate;
