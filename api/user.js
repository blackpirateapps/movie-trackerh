import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username, action } = req.query;

    // Handle feed request
    if (action === 'feed') {
      const authUser = authenticate(req, res);
      if (!authUser) {
        return;
      }

      try {
        const { rows } = await db.execute({
          sql: `
            SELECT u.username, m.title as movieTitle, um.rating, um.review, um.updated_at
            FROM user_movies um
            JOIN users u ON um.user_id = u.id
            JOIN movies m ON um.movie_id = m.id
            JOIN follows f ON f.following_id = um.user_id
            WHERE f.follower_id = ?
            ORDER BY um.updated_at DESC
            LIMIT 50
          `,
          args: [authUser.sub],
        });

        return res.status(200).json(rows);
      } catch (error) {
        console.error('Error fetching feed:', error);
        return res.status(500).json({ message: 'Failed to fetch feed.' });
      }
    }

    // Handle user profile request
    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    try {
      const userResult = await db.execute({
        sql: 'SELECT id, username FROM users WHERE username = ?',
        args: [username],
      });

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const user = userResult.rows[0];
      
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

  if (req.method === 'POST') {
    const authUser = authenticate(req, res);
    if (!authUser) {
      return;
    }

    const { action } = req.query;
    const { followingId } = req.body;

    if (!action || !followingId) {
      return res.status(400).json({ message: 'Action and followingId are required.' });
    }

    try {
      if (action === 'follow') {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
          args: [authUser.sub, followingId],
        });
        return res.status(200).json({ message: 'User followed.' });
      }

      if (action === 'unfollow') {
        await db.execute({
          sql: 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
          args: [authUser.sub, followingId],
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