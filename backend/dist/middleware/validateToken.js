"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware that authenticates a user using a JWT token.
 *
 * @remarks
 * This middleware:
 * - extracts the token from the `Authorization` header (`Bearer <token>`)
 * - verifies the token using the server's secret key
 * - attaches the decoded user payload to `req.user`
 * - rejects requests with missing, invalid, or expired tokens
 *
 * If authentication succeeds, the request continues to the next handler.
 *
 * @param req - Express request containing the JWT in the Authorization header.
 * @param res - Express response used to return authentication errors.
 * @param next - Callback to pass control to the next middleware or route.
 *
 * @returns A 401 response on failure, or `next()` on success.
 */
const authenticateUser = (req, res, next) => {
    const url = req.originalUrl;
    if (url === "/" || url.includes("login") || url.includes("register")) {
        return next();
    }
    const token = req.header("authorization")?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token not found." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};
exports.authenticateUser = authenticateUser;
