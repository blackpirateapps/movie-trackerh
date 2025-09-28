import { signToken } from '../backend/lib/jwt.js';
import { db } from '../backend/lib/turso.js';
import bcrypt from 'bcryptjs';
import cookie from 'cookie';

// Vercel serverless function signature
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { action, email, password, username } = req.body;

        try {
            if (action === 'signup') {
                if (!email || !password || !username) {
                    return res.status(400).json({ message: 'Email, password, and username are required.' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await db.execute({
                    sql: 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    args: [username, email, hashedPassword],
                });
                
                const userId = result.lastInsertRowid.toString();
                const user = { id: userId, username, email };

                const token = signToken({ sub: userId, username });
                res.setHeader('Set-Cookie', cookie.serialize('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== 'development',
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    sameSite: 'strict',
                    path: '/',
                }));
                return res.status(201).json({ user });
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
                    return res.status(401).json({ message: 'Invalid credentials.' });
                }

                const user = rows[0];
                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid credentials.' });
                }
                
                const token = signToken({ sub: user.id.toString(), username: user.username });
                res.setHeader('Set-Cookie', cookie.serialize('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== 'development',
                    maxAge: 60 * 60 * 24 * 7,
                    sameSite: 'strict',
                    path: '/',
                }));
                
                const { password: _, ...userWithoutPassword } = user;
                return res.status(200).json({ user: userWithoutPassword });
            }

            if (action === 'logout') {
                 res.setHeader('Set-Cookie', cookie.serialize('token', '', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== 'development',
                    expires: new Date(0), // Set expiry date to the past
                    sameSite: 'strict',
                    path: '/',
                }));
                return res.status(200).json({ message: 'Logged out successfully.' });
            }

            return res.status(400).json({ message: 'Invalid action.' });

        } catch (error) {
            console.error(error);
            if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.email')) {
                 return res.status(409).json({ message: 'Email already in use.' });
            }
            if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.username')) {
                 return res.status(409).json({ message: 'Username already taken.' });
            }
            return res.status(500).json({ message: 'An internal server error occurred.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

