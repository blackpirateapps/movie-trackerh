import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
