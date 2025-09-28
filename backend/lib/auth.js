import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticate(req, res, required = true) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    if (required) {
      res.status(401).json({ message: 'Authentication required.' });
      return null;
    }
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (required) {
      res.status(401).json({ message: 'Invalid token.' });
      return null;
    }
    return null;
  }
}