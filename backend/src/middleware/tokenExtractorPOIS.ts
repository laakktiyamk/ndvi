import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Laajennetaan Expressin Request-tyyppiä, jotta se sallii uudet ominaisuudet
export interface TokenRequest extends Request {
  token?: string;
  user?: any;
  admin?: boolean;
}

/**
 * Retrieves the token from the request headers.
 * @param {Request} request - The HTTP request object.
 * @returns {string|null} The extracted token or null if not found.
 */
const getTokenFrom = (request: Request): string | null => {
  const authorization = request.get("authorization");

  // Huom: Varmistetaan pienten/suurten kirjainten toimivuus toLowerCase()-metodilla
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

/**
 * Middleware for extracting and verifying JWT token from requests.
 */
export const tokenExtractor = (
  request: TokenRequest,
  response: Response,
  next: NextFunction
): void => {
  const url = request.originalUrl;

  // Allow access to routes like '/' or those involving user authentication
  if (url === "/" || url.includes("login") || url.includes("register")) {
    return next();
  }

  const token = getTokenFrom(request);

  if (!token) {
    console.log("!token - Token missing from headers");
    response.status(401).json({ error: "token missing or invalid" });
    return;
  }

  request.token = token;

  try {
    const secret = process.env.TOKEN;
    if (!secret) {
      throw new Error("JWT Secret (process.env.TOKEN) is missing!");
    }

    const decodedToken = jwt.verify(token, secret) as any;

    if (decodedToken && decodedToken.id) {
      request.user = decodedToken.user;
      request.admin = decodedToken.admin;
    }

    next();
  } catch (error: any) {
    console.error("Token verification failed:", error.message);
    response.status(401).json({ error: "token missing or invalid" });
    return;
  }
};
