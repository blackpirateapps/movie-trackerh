import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';

export default async function handler(req, res) {
    const { username, action, userIdToFollow } = req.query;

    if (req.method === 'GET') {
         if (!username) {
            return res.status(400).json({ message: 'Username is required.' });
        }

        try {
            // Fetch user profile
            const userResult = await db.execute({
                sql: 'SELECT id, username FROM users WHERE username = ?',
                args: [username],
            });

            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }
            const user = userResult.rows[0];

            // Fetch user's movies
            const moviesResult = await db.execute({
                sql: `
                    SELECT m.id, m.title, m.poster_path, um.rating, um.review, um.created_at
                    FROM user_movies um
                    JOIN movies m ON um.movie_id = m.id
                    WHERE um.user_id = ?
                    ORDER BY um.created_at DESC
                `,
                args: [user.id],
            });

            return res.status(200).json({ user, movies: moviesResult.rows });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return res.status(500).json({ message: 'Failed to fetch user profile.' });
        }
    }

    // All actions below require authentication
    const authUser = authenticate(req, res);
    if (!authUser) {
        return;
    }

    if (req.method === 'POST') {
        if (!action || !userIdToFollow) {
             return res.status(400).json({ message: 'Action and userIdToFollow are required.' });
        }

        try {
            if (action === 'follow') {
                await db.execute({
                    sql: 'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
                    args: [authUser.sub, userIdToFollow],
                });
                return res.status(200).json({ message: 'User followed.' });
            }
            if (action === 'unfollow') {
                await db.execute({
                    sql: 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
                    args: [authUser.sub, userIdToFollow],
                });
                return res.status(200).json({ message: 'User unfollowed.' });
            }
            return res.status(400).json({ message: 'Invalid action.' });
        } catch (error) {
            console.error(`Error with action ${action}:`, error);
            return res.status(500).json({ message: `Failed to ${action} user.` });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}

