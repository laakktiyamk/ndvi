"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const sentinelhub_js_1 = require("@sentinel-hub/sentinelhub-js");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const authenticate = async () => {
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
    const response = await axios_1.default.post(CDSE_TOKEN_URL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const authToken = response.data.access_token;
    // Asetetaan token kirjastolle edelleen, jotta muut sentinelhub-js kutsut toimii
    (0, sentinelhub_js_1.setAuthToken)(authToken);
    return authToken;
};
exports.authenticate = authenticate;
