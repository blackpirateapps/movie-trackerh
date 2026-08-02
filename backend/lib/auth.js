import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticate(req, res = null, required = true) {
  let cookieHeader = '';
  if (req && req.headers) {
    if (typeof req.headers.get === 'function') {
      cookieHeader = req.headers.get('cookie') || '';
    } else {
      cookieHeader = req.headers.cookie || '';
    }
  }

  const cookies = cookie.parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    if (required && res && typeof res.status === 'function') {
      res.status(401).json({ message: 'Authentication required.' });
    }
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (required && res && typeof res.status === 'function') {
      res.status(401).json({ message: 'Invalid token.' });
    }
    return null;
  }
}