import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import { validateApiKey, checkRateLimit } from '@/../backend/lib/apiKeys';

export async function GET(req: Request) {
  try {
    await ensureSchema();

    // 1. Determine authentication method
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization') || '';
    const xApiKeyHeader = req.headers.get('x-api-key') || '';
    const queryApiKey = url.searchParams.get('api_key') || '';

    let rawApiKey = '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      rawApiKey = authHeader.substring(7).trim();
    } else if (xApiKeyHeader.trim()) {
      rawApiKey = xApiKeyHeader.trim();
    } else if (queryApiKey.trim()) {
      rawApiKey = queryApiKey.trim();
    }

    let userId: number | null = null;
    let keyId: number | null = null;

    let rateLimitResult = {
      allowed: true,
      limit: 60,
      remaining: 60,
      resetSeconds: 60,
    };

    if (rawApiKey) {
      // Authenticate via API Key
      const keyVal = await validateApiKey(rawApiKey);
      if (!keyVal.valid || !keyVal.userId || !keyVal.keyId) {
        return NextResponse.json(
          {
            error: keyVal.error || 'Invalid or revoked API key',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        );
      }

      userId = keyVal.userId;
      keyId = keyVal.keyId;

      // Rate limit check for API key
      rateLimitResult = await checkRateLimit(keyId, 60);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Maximum 60 requests per minute allowed.',
            code: 'TOO_MANY_REQUESTS',
            retry_after_seconds: rateLimitResult.resetSeconds,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(rateLimitResult.resetSeconds),
              'Retry-After': String(rateLimitResult.resetSeconds),
            },
          }
        );
      }
    } else {
      // Fallback: Cookie session authentication
      const userPayload = authenticate(req, null, false);
      if (!userPayload) {
        return NextResponse.json(
          {
            error:
              'Authentication required. Provide an API key via "Authorization: Bearer <key>", "X-API-Key" header, or "api_key" parameter.',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        );
      }
      userId = userPayload.id;
    }

    // 2. Parse query parameters
    const includeParam = url.searchParams.get('include') || 'profile,stats,movies,tv,episodes,watchlist,social';
    const includes = new Set(includeParam.split(',').map((s) => s.trim().toLowerCase()));
    const sinceParam = url.searchParams.get('since') || '';

    // Response structure
    const responseData: Record<string, any> = {
      status: 'success',
      data_version: '1.0',
      generated_at: new Date().toISOString(),
    };

    // 3. User Profile
    const userRes = await db.execute({
      sql: `SELECT id, username, email, display_name, bio, website, avatar_url, pref_default_layout, pref_hide_nsfw, pref_is_private, created_at FROM users WHERE id = ?`,
      args: [userId],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const u = userRes.rows[0];
    const userObj = {
      id: Number(u.id),
      username: String(u.username),
      email: String(u.email),
      display_name: u.display_name ? String(u.display_name) : String(u.username),
      bio: u.bio ? String(u.bio) : null,
      website: u.website ? String(u.website) : null,
      avatar_url: u.avatar_url ? String(u.avatar_url) : null,
      preferences: {
        default_layout: String(u.pref_default_layout || 'grid'),
        hide_nsfw: Boolean(u.pref_hide_nsfw),
        is_private: Boolean(u.pref_is_private),
      },
      created_at: String(u.created_at),
    };

    if (includes.has('profile')) {
      responseData.user = userObj;
    }

    // 4. Movies Watched
    let movies: any[] = [];
    if (includes.has('movies') || includes.has('stats')) {
      let moviesSql = `
        SELECT um.id as log_id, um.movie_id, m.title, m.overview, m.release_date, m.poster_path, m.backdrop_path, m.runtime, m.vote_average as tmdb_vote_average,
               um.rating as user_rating, um.review as user_review, um.watched_date, um.created_at, um.updated_at
        FROM user_movies um
        JOIN movies m ON um.movie_id = m.id
        WHERE um.user_id = ?
      `;
      const moviesArgs: any[] = [userId];

      if (sinceParam) {
        moviesSql += ` AND (um.updated_at >= ? OR um.watched_date >= ?)`;
        moviesArgs.push(sinceParam, sinceParam);
      }

      moviesSql += ` ORDER BY um.updated_at DESC`;

      const moviesRes = await db.execute({ sql: moviesSql, args: moviesArgs });
      movies = moviesRes.rows.map((row: any) => ({
        log_id: Number(row.log_id),
        movie_id: Number(row.movie_id),
        title: String(row.title),
        overview: row.overview ? String(row.overview) : null,
        release_date: row.release_date ? String(row.release_date) : null,
        poster_path: row.poster_path ? String(row.poster_path) : null,
        backdrop_path: row.backdrop_path ? String(row.backdrop_path) : null,
        runtime_minutes: row.runtime ? Number(row.runtime) : null,
        tmdb_vote_average: row.tmdb_vote_average ? Number(row.tmdb_vote_average) : null,
        user_rating: row.user_rating ? Number(row.user_rating) : null,
        user_review: row.user_review ? String(row.user_review) : null,
        watched_date: row.watched_date ? String(row.watched_date) : null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));

      if (includes.has('movies')) {
        responseData.movies = movies;
      }
    }

    // 5. TV Shows Watched
    let tvShows: any[] = [];
    if (includes.has('tv') || includes.has('stats')) {
      let tvSql = `
        SELECT uts.id as log_id, uts.tv_show_id, t.name, t.overview, t.first_air_date, t.poster_path, t.backdrop_path, t.number_of_seasons, t.number_of_episodes, t.vote_average as tmdb_vote_average,
               uts.rating as user_rating, uts.review as user_review, uts.is_favorite, uts.start_date, uts.end_date, uts.watched_where, uts.created_at, uts.updated_at
        FROM user_tv_shows uts
        JOIN tv_shows t ON uts.tv_show_id = t.id
        WHERE uts.user_id = ?
      `;
      const tvArgs: any[] = [userId];

      if (sinceParam) {
        tvSql += ` AND (uts.updated_at >= ? OR uts.start_date >= ?)`;
        tvArgs.push(sinceParam, sinceParam);
      }

      tvSql += ` ORDER BY uts.updated_at DESC`;

      const tvRes = await db.execute({ sql: tvSql, args: tvArgs });
      tvShows = tvRes.rows.map((row: any) => {
        let watchedWhereTags: string[] = [];
        if (row.watched_where) {
          try {
            watchedWhereTags = JSON.parse(String(row.watched_where));
          } catch (e) {
            watchedWhereTags = [];
          }
        }

        return {
          log_id: Number(row.log_id),
          tv_show_id: Number(row.tv_show_id),
          name: String(row.name),
          overview: row.overview ? String(row.overview) : null,
          first_air_date: row.first_air_date ? String(row.first_air_date) : null,
          poster_path: row.poster_path ? String(row.poster_path) : null,
          backdrop_path: row.backdrop_path ? String(row.backdrop_path) : null,
          number_of_seasons: row.number_of_seasons ? Number(row.number_of_seasons) : null,
          number_of_episodes: row.number_of_episodes ? Number(row.number_of_episodes) : null,
          tmdb_vote_average: row.tmdb_vote_average ? Number(row.tmdb_vote_average) : null,
          user_rating: row.user_rating ? Number(row.user_rating) : null,
          user_review: row.user_review ? String(row.user_review) : null,
          is_favorite: Boolean(row.is_favorite),
          start_date: row.start_date ? String(row.start_date) : null,
          end_date: row.end_date ? String(row.end_date) : null,
          watched_where: watchedWhereTags,
          created_at: String(row.created_at),
          updated_at: String(row.updated_at),
        };
      });

      if (includes.has('tv')) {
        responseData.tv_shows = tvShows;
      }
    }

    // 6. Episodes Watched
    let episodes: any[] = [];
    if (includes.has('episodes') || includes.has('stats')) {
      let epSql = `
        SELECT ue.id as log_id, ue.tv_show_id, t.name as tv_show_name, ue.season_number, ue.episode_number,
               e.name as episode_name, e.overview as episode_overview, e.still_path, e.air_date, e.runtime as episode_runtime, e.vote_average as tmdb_vote_average,
               ue.watched, ue.watched_date, ue.rating as user_rating, ue.created_at, ue.updated_at
        FROM user_episodes ue
        JOIN tv_shows t ON ue.tv_show_id = t.id
        LEFT JOIN episodes e ON (ue.tv_show_id = e.tv_show_id AND ue.season_number = e.season_number AND ue.episode_number = e.episode_number)
        WHERE ue.user_id = ? AND ue.watched = 1
      `;
      const epArgs: any[] = [userId];

      if (sinceParam) {
        epSql += ` AND (ue.updated_at >= ? OR ue.watched_date >= ?)`;
        epArgs.push(sinceParam, sinceParam);
      }

      epSql += ` ORDER BY ue.updated_at DESC, ue.season_number ASC, ue.episode_number ASC`;

      const epRes = await db.execute({ sql: epSql, args: epArgs });
      episodes = epRes.rows.map((row: any) => ({
        log_id: Number(row.log_id),
        tv_show_id: Number(row.tv_show_id),
        tv_show_name: String(row.tv_show_name),
        season_number: Number(row.season_number),
        episode_number: Number(row.episode_number),
        episode_name: row.episode_name ? String(row.episode_name) : `Episode ${row.episode_number}`,
        overview: row.episode_overview ? String(row.episode_overview) : null,
        still_path: row.still_path ? String(row.still_path) : null,
        air_date: row.air_date ? String(row.air_date) : null,
        runtime_minutes: row.episode_runtime ? Number(row.episode_runtime) : null,
        tmdb_vote_average: row.tmdb_vote_average ? Number(row.tmdb_vote_average) : null,
        watched: Boolean(row.watched),
        watched_date: row.watched_date ? String(row.watched_date) : null,
        user_rating: row.user_rating ? Number(row.user_rating) : null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));

      if (includes.has('episodes')) {
        responseData.episodes = episodes;
      }
    }

    // 7. Watchlist
    let watchlist: any[] = [];
    if (includes.has('watchlist') || includes.has('stats')) {
      const wlRes = await db.execute({
        sql: `
          SELECT w.id as item_id, w.movie_id, m.title, m.overview, m.release_date, m.poster_path, m.backdrop_path, m.runtime, m.vote_average as tmdb_vote_average, w.created_at as added_at
          FROM watchlist w
          JOIN movies m ON w.movie_id = m.id
          WHERE w.user_id = ?
          ORDER BY w.created_at DESC
        `,
        args: [userId],
      });

      watchlist = wlRes.rows.map((row: any) => ({
        item_id: Number(row.item_id),
        movie_id: Number(row.movie_id),
        title: String(row.title),
        overview: row.overview ? String(row.overview) : null,
        release_date: row.release_date ? String(row.release_date) : null,
        poster_path: row.poster_path ? String(row.poster_path) : null,
        backdrop_path: row.backdrop_path ? String(row.backdrop_path) : null,
        runtime_minutes: row.runtime ? Number(row.runtime) : null,
        tmdb_vote_average: row.tmdb_vote_average ? Number(row.tmdb_vote_average) : null,
        added_at: String(row.added_at),
      }));

      if (includes.has('watchlist')) {
        responseData.watchlist = watchlist;
      }
    }

    // 8. Social Graph
    if (includes.has('social') || includes.has('stats')) {
      const followersRes = await db.execute({
        sql: `SELECT u.id, u.username, u.display_name, u.avatar_url FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.following_id = ?`,
        args: [userId],
      });

      const followingRes = await db.execute({
        sql: `SELECT u.id, u.username, u.display_name, u.avatar_url FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = ?`,
        args: [userId],
      });

      const followers = followersRes.rows.map((row: any) => ({
        id: Number(row.id),
        username: String(row.username),
        display_name: row.display_name ? String(row.display_name) : String(row.username),
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      }));

      const following = followingRes.rows.map((row: any) => ({
        id: Number(row.id),
        username: String(row.username),
        display_name: row.display_name ? String(row.display_name) : String(row.username),
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      }));

      if (includes.has('social')) {
        responseData.social = {
          followers,
          following,
        };
      }
    }

    // 9. Stats Summary
    if (includes.has('stats')) {
      let totalMovieMinutes = 0;
      movies.forEach((m) => {
        totalMovieMinutes += m.runtime_minutes || 105; // Fallback average movie length
      });

      let totalEpisodeMinutes = 0;
      episodes.forEach((e) => {
        totalEpisodeMinutes += e.runtime_minutes || 45; // Fallback average episode length
      });

      const totalHours = Math.round(((totalMovieMinutes + totalEpisodeMinutes) / 60) * 10) / 10;
      const movieReviews = movies.filter((m) => m.user_review && m.user_review.trim().length > 0).length;
      const tvReviews = tvShows.filter((t) => t.user_review && t.user_review.trim().length > 0).length;
      const favoriteShowsCount = tvShows.filter((t) => t.is_favorite).length;

      responseData.stats = {
        total_movies_watched: movies.length,
        total_tv_shows_tracked: tvShows.length,
        total_episodes_watched: episodes.length,
        total_hours_watched: totalHours,
        total_reviews: movieReviews + tvReviews,
        total_favorites: favoriteShowsCount,
        watchlist_count: watchlist.length,
      };
    }

    // Return JSON response with rate limit headers
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetSeconds),
      },
    });
  } catch (error: any) {
    console.error('Error in API data export endpoint:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error processing data export',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
