import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username, action, page = 1, limit = 20, search = '' } = req.query;
    
    // Handle users listing
    if (action === 'list') {
      try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let searchQuery = '';
        let searchArgs = [];
        
        if (search) {
          searchQuery = 'WHERE username LIKE ? OR email LIKE ?';
          searchArgs = [`%${search}%`, `%${search}%`];
        }
        
        // Get users with stats
        const { rows: users } = await db.execute({
          sql: `
            SELECT 
              u.id, 
              u.username, 
              u.email, 
              u.created_at,
              COUNT(DISTINCT um.id) as movies_count,
              COUNT(DISTINCT f1.follower_id) as followers_count,
              COUNT(DISTINCT f2.following_id) as following_count
            FROM users u
            LEFT JOIN user_movies um ON u.id = um.user_id
            LEFT JOIN follows f1 ON u.id = f1.following_id
            LEFT JOIN follows f2 ON u.id = f2.follower_id
            ${searchQuery}
            GROUP BY u.id, u.username, u.email, u.created_at
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
          `,
          args: [...searchArgs, parseInt(limit), offset],
        });

        // Get total count for pagination
        const { rows: countResult } = await db.execute({
          sql: `SELECT COUNT(*) as total FROM users ${searchQuery}`,
          args: searchArgs,
        });

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));

        return res.status(200).json({
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            stats: {
              movies: user.movies_count,
              followers: user.followers_count,
              following: user.following_count
            }
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasMore: parseInt(page) < totalPages
          }
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Failed to fetch users.' });
      }
    }

    // Handle single user profile
    if (username) {
      try {
        // Get user details
        const { rows } = await db.execute({
          sql: 'SELECT id, username, email, created_at FROM users WHERE username = ?',
          args: [username],
        });

        if (rows.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
        }

        const user = rows[0];

        // Get user's movies with details
        const { rows: movies } = await db.execute({
          sql: `
            SELECT 
              m.id, m.title, m.poster_path, m.release_date,
              um.rating, um.review, um.watched_date, um.created_at, um.updated_at
            FROM user_movies um
            JOIN movies m ON um.movie_id = m.id
            WHERE um.user_id = ?
            ORDER BY um.updated_at DESC, um.created_at DESC
          `,
          args: [user.id],
        });

        // Get follower/following stats
        const { rows: followerStats } = await db.execute({
          sql: `
            SELECT 
              (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following
          `,
          args: [user.id, user.id],
        });

        const stats = followerStats[0];

        // Check if current user is following this user
        let isFollowing = false;
        try {
          const authUser = authenticate(req, res, false);
          if (authUser && authUser.sub !== user.id.toString()) {
            const { rows: followCheck } = await db.execute({
              sql: 'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
              args: [authUser.sub, user.id],
            });
            isFollowing = followCheck.length > 0;
          }
        } catch (authError) {
          // User not authenticated, isFollowing stays false
        }

        return res.status(200).json({
          user,
          movies,
          stats,
          isFollowing,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Failed to fetch user profile.' });
      }
    }

    return res.status(400).json({ message: 'Username or action parameter is required.' });
  }

  if (req.method === 'POST') {
    const authUser = authenticate(req, res);
    if (!authUser) {
      return;
    }

    const { action, followingId } = req.body;

    if (action === 'follow') {
      if (!followingId || followingId === parseInt(authUser.sub)) {
        return res.status(400).json({ message: 'Invalid user to follow.' });
      }

      try {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
          args: [authUser.sub, followingId],
        });

        // Get updated follower count
        const { rows: stats } = await db.execute({
          sql: 'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?',
          args: [followingId],
        });

        return res.status(200).json({ 
          message: 'Followed successfully.',
          followers: stats[0].followers
        });
      } catch (error) {
        console.error('Error following user:', error);
        return res.status(500).json({ message: 'Failed to follow user.' });
      }
    }

    if (action === 'unfollow') {
      if (!followingId) {
        return res.status(400).json({ message: 'Invalid user to unfollow.' });
      }

      try {
        await db.execute({
          sql: 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
          args: [authUser.sub, followingId],
        });

        // Get updated follower count
        const { rows: stats } = await db.execute({
          sql: 'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?',
          args: [followingId],
        });

        return res.status(200).json({ 
          message: 'Unfollowed successfully.',
          followers: stats[0].followers
        });
      } catch (error) {
        console.error('Error unfollowing user:', error);
        return res.status(500).json({ message: 'Failed to unfollow user.' });
      }
    }

    return res.status(400).json({ message: 'Invalid action.' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}