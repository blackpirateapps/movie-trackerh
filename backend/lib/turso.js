import { createClient } from '@libsql/client'; // FIX: Use the correct package name
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    throw new Error('TURSO_DATABASE_URL is not defined in the environment variables.');
}

export const db = createClient({
    url,
    authToken,
});

