import { parse } from 'cookie';
import { verifyToken } from './jwt.js';

export function authenticate(req) {
    const cookies = parse(req.headers.get('cookie') || '');
    const token = cookies.auth_token;

    if (!token) {
        return null;
    }

    const user = verifyToken(token);
    return user;
}

export function createProtectedHandler(handler) {
    return async (req, res) => {
        const user = authenticate(req);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return handler(req, res, user);
    };
}
