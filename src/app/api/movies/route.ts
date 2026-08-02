import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function getAndCacheMovie(movieId: string | number) {
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

      return NextResponse.json(results);
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

  return NextResponse.json({ message: 'Query or ID parameter is required.' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const authUser = authenticate(request, null, true);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const { movieId, rating, review, watchedDate, action } = body;

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
        return NextResponse.json({ message: 'Removed from watchlist', isInWatchlist: false });
      } else {
        await db.execute({
          sql: 'INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)',
          args: [authUser.sub, movieId],
        });
        return NextResponse.json({ message: 'Added to watchlist', isInWatchlist: true });
      }
    } catch (error) {
      console.error('Error managing watchlist:', error);
      return NextResponse.json({ message: 'Failed to update watchlist.' }, { status: 500 });
    }
  }

  if (!movieId) {
    return NextResponse.json({ message: 'Movie ID is required.' }, { status: 400 });
  }

  try {
    await getAndCacheMovie(movieId);
    await db.execute({
      sql: `
        INSERT INTO user_movies (user_id, movie_id, rating, review, watched_date)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, movie_id) DO UPDATE SET
        rating = excluded.rating,
        review = excluded.review,
        watched_date = excluded.watched_date,
        updated_at = CURRENT_TIMESTAMP
      `,
      args: [authUser.sub, movieId, rating || null, review || null, watchedDate || null],
    });

    return NextResponse.json({ message: 'Movie tracked successfully.' });
  } catch (error) {
    console.error('Error tracking movie:', error);
    return NextResponse.json({ message: 'Failed to track movie.' }, { status: 500 });
  }
}
