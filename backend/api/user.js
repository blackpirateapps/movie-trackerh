import { db } from '../lib/turso.js';
import { createProtectedHandler } from '../lib/auth.js';

export const config = {
  runtime: 'edge',
};

async function handler(req, res, user) {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
        if (username) {
            return getUserProfile(username, user.id);
        }
        if (action === 'feed') {
            return getUserFeed(user.id);
        }
    }

    if (req.method === 'POST' && action === 'follow') {
        const { followingId } = await req.json();
        return followUser(user.id, followingId);
    }
    
    if (req.method === 'POST' && action === 'unfollow') {
        const { followingId } = await req.json();
        return unfollowUser(user.id, followingId);
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}

// --- API Functions ---

async function getUserProfile(username, currentUserId) {
    try {
        const userResult = await db.execute({
            sql: "SELECT id, username, created_at FROM users WHERE username = ?",
            args: [username],
        });

        if (userResult.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
        const profileUser = userResult.rows[0];

        // Get user's movie reviews
        const moviesResult = await db.execute({
            sql: `
                SELECT m.id, m.title, m.poster_path, um.rating, um.review, um.watched_date
                FROM user_movies um
                JOIN movies m ON um.movie_id = m.id
                WHERE um.user_id = ?
                ORDER BY um.updated_at DESC
            `,
            args: [profileUser.id]
        });

        // Get follower/following counts
        const followersResult = await db.execute({ sql: "SELECT COUNT(*) as count FROM follows WHERE following_id = ?", args: [profileUser.id] });
        const followingResult = await db.execute({ sql: "SELECT COUNT(*) as count FROM follows WHERE follower_id = ?", args: [profileUser.id] });
        
        // Check if the current user is following this profile
        const isFollowingResult = await db.execute({
            sql: "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
            args: [currentUserId, profileUser.id]
        });

        const profileData = {
            user: profileUser,
            movies: moviesResult.rows,
            stats: {
                followers: followersResult.rows[0].count,
                following: followingResult.rows[0].count,
            },
            isFollowing: isFollowingResult.rows.length > 0,
        };

        return new Response(JSON.stringify(profileData), { status: 200 });

    } catch (error) {
        console.error('Get profile error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get user profile' }), { status: 500 });
    }
}

async function followUser(followerId, followingId) {
    if (followerId === followingId) {
        return new Response(JSON.stringify({ error: "You cannot follow yourself" }), { status: 400 });
    }
    try {
        await db.execute({
            sql: "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
            args: [followerId, followingId]
        });
        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error('Follow error:', error);
        return new Response(JSON.stringify({ error: "Failed to follow user" }), { status: 500 });
    }
}

async function unfollowUser(followerId, followingId) {
    try {
        await db.execute({
            sql: "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
            args: [followerId, followingId]
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Unfollow error:', error);
        return new Response(JSON.stringify({ error: "Failed to unfollow user" }), { status: 500 });
    }
}

async function getUserFeed(userId) {
    try {
        const feedResult = await db.execute({
            sql: `
                SELECT
                    u.username,
                    m.id as movieId,
                    m.title as movieTitle,
                    m.poster_path as moviePoster,
                    um.rating,
                    um.review,
                    um.updated_at
                FROM user_movies um
                JOIN users u ON um.user_id = u.id
                JOIN movies m ON um.movie_id = m.id
                WHERE um.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
                ORDER BY um.updated_at DESC
                LIMIT 50
            `,
            args: [userId]
        });
        return new Response(JSON.stringify(feedResult.rows), { status: 200 });
    } catch (error) {
        console.error('Get feed error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get feed' }), { status: 500 });
    }
}


export default createProtectedHandler(handler);
