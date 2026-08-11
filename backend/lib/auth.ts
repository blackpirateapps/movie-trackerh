import jwt from 'jsonwebtoken';
import { parseCookie } from 'cookie';
import { JWTPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticate(req: any, res: any = null, required: boolean = true): (JWTPayload & { id: number }) | null {
  let cookieHeader = '';
  if (req && req.headers) {
    if (typeof req.headers.get === 'function') {
      cookieHeader = req.headers.get('cookie') || '';
    } else {
      cookieHeader = req.headers.cookie || '';
    }
  }

  const cookies = parseCookie ? parseCookie(cookieHeader) : {};
  const token = cookies.token;

  if (!token) {
    if (required && res && typeof res.status === 'function') {
      res.status(401).json({ message: 'Authentication required.' });
    }
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const numericId = Number(decoded.id || decoded.sub);
    return { ...decoded, id: numericId };
  } catch (error) {
    if (required && res && typeof res.status === 'function') {
      res.status(401).json({ message: 'Invalid token.' });
    }
    return null;
  }
}
