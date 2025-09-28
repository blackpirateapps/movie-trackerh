import bcrypt from 'bcryptjs';
import { db } from '../lib/turso.js';
import { signToken } from '../lib/jwt.js';
import cookie from 'cookie';

export const config = {
  runtime: 'edge',
};

async function handler(req) {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    try {
        if (req.method === 'POST') {
            const { email, username, password } = await req.json();

            if (action === 'signup') {
                // --- Signup Logic ---
                if (!email || !username || !password) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }

                const existingUser = await db.execute({
                    sql: "SELECT id FROM users WHERE email = ? OR username = ?",
                    args: [email, username]
                });

                if (existingUser.rows.length > 0) {
                    return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
                }

                const password_hash = await bcrypt.hash(password, 10);
                const result = await db.execute({
                    sql: "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    args: [username, email, password_hash]
                });

                const userId = result.lastInsertRowid;
                const user = { id: userId, username };
                const token = signToken(user);
                
                return createAuthResponse(token, user);
            }

            if (action === 'login') {
                // --- Login Logic ---
                if (!email || !password) {
                    return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
                }

                const result = await db.execute({
                    sql: "SELECT id, username, password_hash FROM users WHERE email = ?",
                    args: [email]
                });

                if (result.rows.length === 0) {
                    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
                }

                const userRecord = result.rows[0];
                const passwordMatch = await bcrypt.compare(password, userRecord.password_hash);

                if (!passwordMatch) {
                    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
                }
                
                const user = { id: userRecord.id, username: userRecord.username };
                const token = signToken(user);

                return createAuthResponse(token, user);
            }
        }
        
        if (req.method === 'POST' && action === 'logout') {
            // --- Logout Logic ---
             const cookieHeader = cookie.serialize('auth_token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                expires: new Date(0), // Expire immediately
                path: '/',
                sameSite: 'lax',
            });

            return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
                status: 200,
                headers: { 'Set-Cookie': cookieHeader },
            });
        }


        return new Response(JSON.stringify({ error: 'Invalid action or method' }), { status: 405 });

    } catch (error) {
        console.error('Auth API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

function createAuthResponse(token, user) {
    const cookieHeader = cookie.serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
    });

    return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieHeader,
        },
    });
}


export default handler;
