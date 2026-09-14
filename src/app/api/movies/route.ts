import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import { invalidateUserStatsCache } from '@/../backend/lib/statsCache';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function getAndCacheMovie(movieId: string | number, forceFetch = false) {
  if (!forceFetch) {
    try {
      const { rows } = await db.execute({
        sql: 'SELECT id, title, overview, release_date, poster_path, backdrop_path, runtime, vote_average FROM movies WHERE id = ?',
        args: [movieId],
      });
      if (rows.length > 0) {
        return rows[0];
      }
    } catch (dbErr) {
      console.log('DB lookup before TMDB failed (non-critical):', dbErr);
    }
  }

  try {
    if (!TMDB_API_KEY) {
      return {
        id: Number(movieId),
        title: `Movie ${movieId}`,
        overview: 'No overview available.',
        release_date: '2024-01-01',
        poster_path: null,
        backdrop_path: null,
        runtime: 120,
        vote_average: 8.0,
      };
    }
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const movie = response.data;

    try {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO movies (id, title, overview, release_date, poster_path, backdrop_path, runtime, vote_average) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [movie.id, movie.title, movie.overview, movie.release_date, movie.poster_path, movie.backdrop_path, movie.runtime, movie.vote_average],
      });
    } catch (dbError) {
      console.log('DB caching failed (non-critical):', dbError);
    }

    return movie;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    throw new Error('Movie not found');
  }
}

async function getUserReview(userId: string | number, movieId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: 'SELECT rating, review, watched_date, created_at FROM user_movies WHERE user_id = ? AND movie_id = ?',
      args: [userId, movieId],
    });
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log('Could not fetch user review (non-critical):', error);
    return null;
  }
}

async function getMovieReviews(movieId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: `
        SELECT 
          um.rating, 
          um.review, 
          um.watched_date, 
          um.created_at,
          u.username 
        FROM user_movies um
        JOIN users u ON um.user_id = u.id
        WHERE um.movie_id = ? AND (um.review IS NOT NULL AND um.review != '')
        ORDER BY um.created_at DESC
        LIMIT 10
      `,
      args: [movieId],
    });
    return rows;
  } catch (error) {
    console.log('Could not fetch movie reviews (non-critical):', error);
    return [];
  }
}

async function checkWatchlistStatus(userId: string | number, movieId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: 'SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?',
      args: [userId, movieId],
    });
    return rows.length > 0;
  } catch (error) {
    console.log('Could not check watchlist status (non-critical):', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const id = searchParams.get('id');

  if (query) {
    try {
      if (!TMDB_API_KEY) {
        return NextResponse.json([]);
      }

      let endpoint = `${TMDB_BASE_URL}/search/movie`;
      let params: Record<string, any> = { api_key: TMDB_API_KEY, query };

      if (query === 'popular' || query === 'trending') {
        const currentYear = new Date().getFullYear();
        endpoint = `${TMDB_BASE_URL}/discover/movie`;
        params = {
          api_key: TMDB_API_KEY,
          sort_by: 'popularity.desc',
          'primary_release_date.gte': `${currentYear}-01-01`,
        };
      }

      const response = await axios.get(endpoint, { params });
      let results = response.data.results || [];
      
      // Fallback to trending/movie/week if discover yields few results
      if ((query === 'popular' || query === 'trending') && results.length === 0) {
        const trendRes = await axios.get(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
        results = trendRes.data.results || [];
      }

      const headers: Record<string, string> = {};
      if (query === 'popular' || query === 'trending') {
        headers['Cache-Control'] = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
      }

      return NextResponse.json(results, { headers });
    } catch (error: any) {
      console.error('TMDB search error:', error.response ? error.response.data : error.message);
      return NextResponse.json({ message: 'Failed to search movies due to an external service error.' }, { status: 500 });
    }
  }

  if (id) {
    try {
      const movie = await getAndCacheMovie(id);
      
      let currentUserReview = null;
      let isInWatchlist = false;
      try {
        const authUser = authenticate(request, null, false);
        if (authUser) {
          currentUserReview = await getUserReview(authUser.sub, id);
          isInWatchlist = await checkWatchlistStatus(authUser.sub, id);
        }
      } catch (authError) {
        // User not authenticated
      }

      const reviews = await getMovieReviews(id);

      return NextResponse.json({
        ...movie,
        currentUserReview,
        isInWatchlist,
        reviews
      });
    } catch (error) {
      console.error('Error fetching movie:', error);
      return NextResponse.json({ message: 'Movie not found.' }, { status: 404 });
    }
  }

  const authUser = authenticate(request, null, false);
  if (authUser) {
    const isWatchlist = searchParams.get('watchlist') === 'true';
    const isFavorite = searchParams.get('favorite') === 'true';

    if (isWatchlist) {
      const { rows } = await db.execute({
        sql: `
          SELECT 
            m.id, 
            m.title, 
            m.overview, 
            m.poster_path, 
            m.backdrop_path, 
            m.release_date, 
            m.runtime, 
            m.vote_average,
            1 as in_watchlist,
            w.created_at
          FROM watchlist w
          JOIN movies m ON w.movie_id = m.id
          WHERE w.user_id = ?
          ORDER BY w.created_at DESC
        `,
        args: [authUser.sub],
      });
      return NextResponse.json(rows);
    }

    const { rows } = await db.execute({
      sql: `
        SELECT 
          m.id, 
          m.title, 
          m.overview, 
          m.poster_path, 
          m.backdrop_path, 
          m.release_date, 
          m.runtime, 
          m.vote_average,
          um.rating, 
          um.review, 
          um.watched_date,
          COALESCE(um.is_favorite, 0) as is_favorite,
          um.watched_where,
          um.created_at, 
          um.updated_at
        FROM user_movies um
        JOIN movies m ON um.movie_id = m.id
        WHERE um.user_id = ? ${isFavorite ? 'AND um.is_favorite = 1' : ''}
        ORDER BY COALESCE(um.watched_date, um.created_at) DESC
      `,
      args: [authUser.sub],
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json({ message: 'Query or ID parameter is required.' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const authUser = authenticate(request, null, true);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const { movieId, rating, review, watchedDate, action, isFavorite, watchedWhere } = body;

  if (action === 'watchlist') {
    if (!movieId) {
      return NextResponse.json({ message: 'Movie ID is required.' }, { status: 400 });
    }

    try {
      await getAndCacheMovie(movieId);
      const isInWatchlist = await checkWatchlistStatus(authUser.sub, movieId);

      if (isInWatchlist) {
        await db.execute({
          sql: 'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?',
          args: [authUser.sub, movieId],
        });
        invalidateUserStatsCache(Number(authUser.sub || authUser.id)).catch(() => {});
        return NextResponse.json({ message: 'Removed from watchlist', isInWatchlist: false });
      } else {
        await db.execute({
          sql: 'INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)',
          args: [authUser.sub, movieId],
        });
        invalidateUserStatsCache(Number(authUser.sub || authUser.id)).catch(() => {});
        return NextResponse.json({ message: 'Added to watchlist', isInWatchlist: true });
      }
    } catch (error) {
      console.error('Error managing watchlist:', error);
      return NextResponse.json({ message: 'Failed to update watchlist.' }, { status: 500 });
    }
  }

  if (action === 'favorite') {
    if (!movieId) {
      return NextResponse.json({ message: 'Movie ID is required.' }, { status: 400 });
    }

    try {
      await getAndCacheMovie(movieId);
      let favVal: number;
      if (isFavorite !== undefined) {
        favVal = isFavorite ? 1 : 0;
      } else {
        const { rows } = await db.execute({
          sql: 'SELECT is_favorite FROM user_movies WHERE user_id = ? AND movie_id = ?',
          args: [authUser.sub, movieId],
        });
        favVal = rows.length > 0 && rows[0].is_favorite ? 0 : 1;
      }

      await db.execute({
        sql: `
          INSERT INTO user_movies (user_id, movie_id, is_favorite)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, movie_id) DO UPDATE SET
          is_favorite = excluded.is_favorite,
          updated_at = CURRENT_TIMESTAMP
        `,
        args: [authUser.sub, movieId, favVal],
      });

      return NextResponse.json({ message: 'Favorite updated', isFavorite: favVal === 1 });
    } catch (error) {
      console.error('Error updating favorite:', error);
      return NextResponse.json({ message: 'Failed to update favorite.' }, { status: 500 });
    }
  }

  if (!movieId) {
    return NextResponse.json({ message: 'Movie ID is required.' }, { status: 400 });
  }

  try {
    await getAndCacheMovie(movieId);
    const watchedWhereStr = watchedWhere
      ? (Array.isArray(watchedWhere) ? JSON.stringify(watchedWhere) : String(watchedWhere))
      : null;

    await db.execute({
      sql: `
        INSERT INTO user_movies (user_id, movie_id, rating, review, watched_date, watched_where)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, movie_id) DO UPDATE SET
        rating = COALESCE(excluded.rating, user_movies.rating),
        review = COALESCE(excluded.review, user_movies.review),
        watched_date = COALESCE(excluded.watched_date, user_movies.watched_date),
        watched_where = COALESCE(excluded.watched_where, user_movies.watched_where),
        updated_at = CURRENT_TIMESTAMP
      `,
      args: [authUser.sub, movieId, rating || null, review || null, watchedDate || null, watchedWhereStr],
    });

    invalidateUserStatsCache(Number(authUser.sub || authUser.id)).catch(() => {});
    return NextResponse.json({ message: 'Movie tracked successfully.' });
  } catch (error) {
    console.error('Error tracking movie:', error);
    return NextResponse.json({ message: 'Failed to track movie.' }, { status: 500 });
  }
}
