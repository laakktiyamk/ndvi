import { Request } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  _id: string;
  username: string;
}

export const getUserId = (req: Request): string => {
  try {
    const headers = req.headers as unknown as Record<string, string>
    const token = (headers['authorization'] || headers['Authorization'])?.split(' ')[1]
    if (!token) return '';

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())

    // Cognito token
    if (payload.iss?.includes('cognito-idp')) {
      return payload.sub || payload.email || '';
    }

    // Oma JWT
    const decoded = jwt.verify(token, process.env.SECRET as string) as JwtPayload;
    return decoded._id;

  } catch {
    return '';
  }
};