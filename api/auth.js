import { signToken, verifyToken } from '../backend/lib/jwt.js';
import { db } from '../backend/lib/turso.js';
import bcrypt from 'bcryptjs';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Handle session check endpoint
  if (req.method === 'GET') {
    try {
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const decoded = verifyToken(token);
      const { rows } = await db.execute({
        sql: 'SELECT id, username, email FROM users WHERE id = ?',
        args: [decoded.sub],
      });

      if (rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      return res.status(200).json({ user: rows[0] });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid session' });
    }
  }

  if (req.method === 'POST') {
    const { action, email, password, username } = req.body;

    try {
      if (action === 'signup') {
        if (!email || !password || !username) {
          return res.status(400).json({ message: 'Email, password, and username are required.' });
        }

        const existingUser = await db.execute({
          sql: 'SELECT id FROM users WHERE email = ? OR username = ?',
          args: [email, username],
        });

        if (existingUser.rows.length > 0) {
          return res.status(409).json({ message: 'User with this email or username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.execute({
          sql: 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          args: [username, email, hashedPassword],
        });

        const userId = result.lastInsertRowid.toString();
        const user = { id: userId, username, email };
        const token = signToken({ sub: userId, username, email });

        // Set secure cookie
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        }));

        return res.status(201).json({ 
          user,
          message: 'Account created successfully!' 
        });
      }

      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required.' });
        }

        const { rows } = await db.execute({
          sql: 'SELECT id, username, email, password FROM users WHERE email = ?',
          args: [email],
        });

        if (rows.length === 0) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = signToken({ 
          sub: user.id.toString(), 
          username: user.username,
          email: user.email 
        });

        // Set secure cookie
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        }));

        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ 
          user: userWithoutPassword,
          message: 'Login successful!'
        });
      }

      if (action === 'logout') {
        res.setHeader('Set-Cookie', cookie.serialize('token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          expires: new Date(0),
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        }));

        return res.status(200).json({ message: 'Logged out successfully.' });
      }

      return res.status(400).json({ message: 'Invalid action.' });

    } catch (error) {
      console.error('Auth error:', error);

      if (error.message.includes('UNIQUE constraint failed: users.email')) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      if (error.message.includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ message: 'This username is already taken.' });
      }

      return res.status(500).json({ message: 'An internal server error occurred. Please try again.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}