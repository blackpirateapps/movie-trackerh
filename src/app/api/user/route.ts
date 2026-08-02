import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const action = searchParams.get('action');
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';
  const search = searchParams.get('search') || '';

  // Handle feed
  if (action === 'feed') {
    try {
      const authUser = authenticate(request, null, false);
      if (!authUser) {
        return NextResponse.json({ message: 'Authentication required for feed.' }, { status: 401 });
      }

      // Movie feed items
      const { rows: movieFeed } = await db.execute({
        sql: `
          SELECT 
            um.id, 
            um.user_id, 
            'movie' as type,
            um.movie_id as movieId, 
            NULL as tvShowId,
            um.rating, 
            um.review, 
            um.watched_date, 
            um.created_at, 
            um.updated_at,
            u.username,
            m.title as movieTitle,
            NULL as tvShowName
          FROM user_movies um
          JOIN users u ON um.user_id = u.id
          JOIN movies m ON um.movie_id = m.id
          WHERE um.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
             OR um.user_id = ?
        `,
        args: [authUser.sub, authUser.sub],
      });

      // TV Show feed items
      const { rows: tvFeed } = await db.execute({
        sql: `
          SELECT 
            uts.id, 
            uts.user_id, 
            'tv' as type,
            NULL as movieId,
            uts.tv_show_id as tvShowId, 
            uts.rating, 
            uts.review, 
            NULL as watched_date, 
            uts.created_at, 
            uts.updated_at,
            u.username,
            NULL as movieTitle,
            t.name as tvShowName
          FROM user_tv_shows uts
          JOIN users u ON uts.user_id = u.id
          JOIN tv_shows t ON uts.tv_show_id = t.id
          WHERE uts.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
             OR uts.user_id = ?
        `,
        args: [authUser.sub, authUser.sub],
      });

      const combined = [...movieFeed, ...tvFeed].sort((a: any, b: any) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      }).slice(0, 50);

      return NextResponse.json(combined, { status: 200 });
    } catch (error) {
      console.error('Error fetching feed:', error);
      return NextResponse.json({ message: 'Failed to fetch feed.' }, { status: 500 });
    }
  }

  // Handle users listing
  if (action === 'list') {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let searchQuery = '';
      let searchArgs: any[] = [];
      
      if (search) {
        searchQuery = 'WHERE username LIKE ? OR email LIKE ?';
        searchArgs = [`%${search}%`, `%${search}%`];
      }
      
      const { rows: users } = await db.execute({
        sql: `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.created_at,
            COUNT(DISTINCT um.id) as movies_count,
            COUNT(DISTINCT uts.id) as tv_count,
            COUNT(DISTINCT f1.follower_id) as followers_count,
            COUNT(DISTINCT f2.following_id) as following_count
          FROM users u
          LEFT JOIN user_movies um ON u.id = um.user_id
          LEFT JOIN user_tv_shows uts ON u.id = uts.user_id
          LEFT JOIN follows f1 ON u.id = f1.following_id
          LEFT JOIN follows f2 ON u.id = f2.follower_id
          ${searchQuery}
          GROUP BY u.id, u.username, u.email, u.created_at
          ORDER BY u.created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [...searchArgs, parseInt(limit), offset],
      });

      const { rows: countResult } = await db.execute({
        sql: `SELECT COUNT(*) as total FROM users ${searchQuery}`,
        args: searchArgs,
      });

      const total = countResult[0].total as number;
      const totalPages = Math.ceil(total / parseInt(limit));

      return NextResponse.json({
        users: users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          stats: {
            movies: user.movies_count,
            tv_shows: user.tv_count,
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
      return NextResponse.json({ message: 'Failed to fetch users.' }, { status: 500 });
    }
  }

  // Handle single user profile
  if (username) {
    try {
      const { rows } = await db.execute({
        sql: 'SELECT id, username, email, created_at FROM users WHERE username = ?',
        args: [username],
      });

      if (rows.length === 0) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const user = rows[0] as any;

      // User tracked movies
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

      // User tracked TV shows
      const { rows: rawTvShows } = await db.execute({
        sql: `
          SELECT 
            t.id, t.name, t.poster_path, t.backdrop_path, t.first_air_date,
            uts.rating, uts.review, uts.is_favorite, uts.start_date, uts.end_date, uts.watched_where,
            uts.created_at, uts.updated_at
          FROM user_tv_shows uts
          JOIN tv_shows t ON uts.tv_show_id = t.id
          WHERE uts.user_id = ?
          ORDER BY uts.updated_at DESC, uts.created_at DESC
        `,
        args: [user.id],
      });

      const tvShows = rawTvShows.map((row: any) => {
        let watchedWhere: string[] = [];
        if (row.watched_where) {
          try {
            watchedWhere = JSON.parse(row.watched_where as string);
          } catch (e) {
            watchedWhere = (row.watched_where as string).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        return {
          ...row,
          is_favorite: Boolean(row.is_favorite),
          watched_where: watchedWhere
        };
      });

      const { rows: followerStats } = await db.execute({
        sql: `
          SELECT 
            (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
            (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following
        `,
        args: [user.id, user.id],
      });

      const stats = followerStats[0];

      let isFollowing = false;
      try {
        const authUser = authenticate(request, null, false);
        if (authUser && authUser.sub !== user.id.toString()) {
          const { rows: followCheck } = await db.execute({
            sql: 'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
            args: [authUser.sub, user.id],
          });
          isFollowing = followCheck.length > 0;
        }
      } catch (authError) {
        // User not authenticated
      }

      return NextResponse.json({
        user,
        movies,
        tvShows,
        stats,
        isFollowing,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ message: 'Failed to fetch user profile.' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Username or action parameter is required.' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const authUser = authenticate(request, null, true);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const { action, followingId } = body;

  if (action === 'follow') {
    if (!followingId || followingId === parseInt(authUser.sub)) {
      return NextResponse.json({ message: 'Invalid user to follow.' }, { status: 400 });
    }

    try {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
        args: [authUser.sub, followingId],
      });

      const { rows: stats } = await db.execute({
        sql: 'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?',
        args: [followingId],
      });

      return NextResponse.json({ 
        message: 'Followed successfully.',
        followers: stats[0].followers
      });
    } catch (error) {
      console.error('Error following user:', error);
      return NextResponse.json({ message: 'Failed to follow user.' }, { status: 500 });
    }
  }

  if (action === 'unfollow') {
    if (!followingId) {
      return NextResponse.json({ message: 'Invalid user to unfollow.' }, { status: 400 });
    }

    try {
      await db.execute({
        sql: 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        args: [authUser.sub, followingId],
      });

      const { rows: stats } = await db.execute({
        sql: 'SELECT COUNT(*) as followers FROM follows WHERE following_id = ?',
        args: [followingId],
      });

      return NextResponse.json({ 
        message: 'Unfollowed successfully.',
        followers: stats[0].followers
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return NextResponse.json({ message: 'Failed to unfollow user.' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
}
