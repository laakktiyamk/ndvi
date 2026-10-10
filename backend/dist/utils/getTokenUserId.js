"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getUserId = (req) => {
    try {
        const headers = req.headers;
        const token = (headers['authorization'] || headers['Authorization'])?.split(' ')[1];
        if (!token)
            return '';
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        // Cognito token
        if (payload.iss?.includes('cognito-idp')) {
            return payload.sub || payload.email || '';
        }
        // Oma JWT
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET);
        return decoded._id;
    }
    catch {
        return '';
    }
};
exports.getUserId = getUserId;
