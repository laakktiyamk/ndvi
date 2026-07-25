import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Shape of the decoded JWT payload stored in `req.user`.
 *
 * @remarks
 * This interface extends `JwtPayload` and represents the authenticated
 * user's identity as extracted from the JWT token. It is injected into
 * `req.user` by the `authenticateUser` middleware.
 */
export interface DecodedUser extends JwtPayload {
  _id: string;
  username: string;
}

/**
 * Global Express type augmentation.
 *
 * @remarks
 * This extends the Express `Request` interface so that all route handlers
 * can safely access `req.user` without additional casting.
 *
 * This avoids repetitive type assertions throughout the codebase.
 */
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}

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
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  
  
  const url = req.originalUrl; 
  if (url === "/" || url.includes("login") || url.includes("register")) {
    return next();
  }
  
  const token = req.header("authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token not found." });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET as string) as DecodedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
