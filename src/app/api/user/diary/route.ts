import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('username');

    let targetUserId: number | string | null = null;

    if (usernameParam) {
      const { rows } = await db.execute({
        sql: 'SELECT id FROM users WHERE username = ?',
        args: [usernameParam],
      });
      if (rows.length === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      targetUserId = rows[0].id as number;
    } else {
      const authUser = authenticate(request, null, true);
      if (!authUser) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
      targetUserId = authUser.sub || authUser.id;
    }

    // 1. Fetch user movie logs
    const { rows: movieRows } = await db.execute({
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
          m.poster_path as poster_path,
          NULL as tvShowName,
          NULL as seasonEpisodeCode
        FROM user_movies um
        JOIN users u ON um.user_id = u.id
        JOIN movies m ON um.movie_id = m.id
        WHERE um.user_id = ?
      `,
      args: [targetUserId],
    });

    // 2. Fetch user episode logs
    const { rows: episodeRows } = await db.execute({
      sql: `
        SELECT 
          ue.id, 
          ue.user_id, 
          'tv' as type,
          NULL as movieId,
          ue.tv_show_id as tvShowId, 
          ue.rating, 
          NULL as review, 
          ue.watched_date, 
          ue.created_at, 
          ue.updated_at,
          u.username,
          NULL as movieTitle,
          t.poster_path as poster_path,
          t.name as tvShowName,
          'S' || ue.season_number || ' E' || ue.episode_number as seasonEpisodeCode
        FROM user_episodes ue
        JOIN users u ON ue.user_id = u.id
        JOIN tv_shows t ON ue.tv_show_id = t.id
        WHERE ue.user_id = ? AND ue.watched = 1
      `,
      args: [targetUserId],
    });

    // 3. Combine and sort chronologically descending
    const combined = [...movieRows, ...episodeRows].sort((a: any, b: any) => {
      const dateA = new Date(a.watched_date || a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.watched_date || b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(combined, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching user diary:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch diary' }, { status: 500 });
  }
}
