import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyToken } from '@/../backend/lib/jwt';
import { db } from '@/../backend/lib/turso';
import bcrypt from 'bcryptjs';
import { parseCookie, stringifySetCookie } from 'cookie';

export const dynamic = 'force-dynamic';

async function getPasswordColumnName(): Promise<string> {
  try {
    const { rows } = await db.execute("PRAGMA table_info(users)");
    const columnNames = rows.map((r: any) => r.name);
    if (columnNames.includes('password_hash')) {
      return 'password_hash';
    }
    if (columnNames.includes('password')) {
      return 'password';
    }
  } catch (err) {
    console.error('PRAGMA table_info error:', err);
  }
  return 'password_hash';
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookie(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { rows } = await db.execute({
      sql: 'SELECT id, username, email FROM users WHERE id = ?',
      args: [decoded.sub],
    });

    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({ user: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, username, rootPassword, usernameOrEmail, newPassword } = body;

    if (action === 'reset-password') {
      const ROOT_ADMIN_PASSWORD = process.env.ROOT_ADMIN_PASSWORD || 'admin123';
      
      if (!rootPassword || rootPassword !== ROOT_ADMIN_PASSWORD) {
        return NextResponse.json({ message: 'Invalid root admin password.' }, { status: 403 });
      }

      if (!usernameOrEmail || !newPassword) {
        return NextResponse.json({ message: 'Target username/email and new password are required.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      const { rows } = await db.execute({
        sql: 'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
        args: [usernameOrEmail, usernameOrEmail],
      });

      if (rows.length === 0) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const user = rows[0] as any;
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const passwordCol = await getPasswordColumnName();

      await db.execute({
        sql: `UPDATE users SET ${passwordCol} = ? WHERE id = ?`,
        args: [hashedPassword, user.id],
      });

      return NextResponse.json({ 
        message: `Password for user "${user.username}" successfully reset.` 
      }, { status: 200 });
    }

    if (action === 'signup') {
      if (!email || !password || !username) {
        return NextResponse.json({ message: 'Email, password, and username are required.' }, { status: 400 });
      }

      const existingUser = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ? OR username = ?',
        args: [email, username],
      });

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ message: 'User with this email or username already exists.' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const passwordCol = await getPasswordColumnName();

      const result = await db.execute({
        sql: `INSERT INTO users (username, email, ${passwordCol}) VALUES (?, ?, ?)`,
        args: [username, email, hashedPassword],
      });

      const userId = result.lastInsertRowid!.toString();
      const user = { id: userId, username, email };
      const token = signToken({ sub: userId, username, email });

      const setCookieHeader = stringifySetCookie({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      const response = NextResponse.json({ 
        user,
        message: 'Account created successfully!' 
      }, { status: 201 });
      response.headers.set('Set-Cookie', setCookieHeader);
      return response;
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
      }

      const passwordCol = await getPasswordColumnName();
      const { rows } = await db.execute({
        sql: `SELECT id, username, email, ${passwordCol} as password FROM users WHERE email = ?`,
        args: [email],
      });

      if (rows.length === 0) {
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }

      const user = rows[0] as any;
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }

      const token = signToken({ 
        sub: user.id.toString(), 
        username: user.username,
        email: user.email 
      });

      const setCookieHeader = stringifySetCookie({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      const { password: _, ...userWithoutPassword } = user;
      const response = NextResponse.json({ 
        user: userWithoutPassword,
        message: 'Login successful!'
      }, { status: 200 });
      response.headers.set('Set-Cookie', setCookieHeader);
      return response;
    }

    if (action === 'logout') {
      const setCookieHeader = stringifySetCookie({
        name: 'token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      const response = NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });
      response.headers.set('Set-Cookie', setCookieHeader);
      return response;
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });

  } catch (error: any) {
    console.error('Auth error:', error);

    if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }
    if (error.message && error.message.includes('UNIQUE constraint failed: users.username')) {
      return NextResponse.json({ message: 'This username is already taken.' }, { status: 409 });
    }

    return NextResponse.json({ message: 'An internal server error occurred. Please try again.' }, { status: 500 });
  }
}
