import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is not defined in environment variables.");
}

async function getAndCacheMovie(movieId) {
  try {
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

async function getUserReview(userId, movieId) {
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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, id } = req.query;
    
    if (query) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: query,
          },
        });
        return res.status(200).json(response.data.results);
      } catch (error) {
        console.error('TMDB search error:', error.response ? error.response.data : error.message);
        return res.status(500).json({ message: 'Failed to search movies due to an external service error.' });
      }
    }
    
    if (id) {
      try {
        const movie = await getAndCacheMovie(id);
        
        let currentUserReview = null;
        try {
          const authUser = authenticate(req, res, false); // Non-blocking auth
          if (authUser) {
            currentUserReview = await getUserReview(authUser.sub, id);
          }
        } catch (authError) {
          // User not authenticated - that's fine
        }

        return res.status(200).json({
          ...movie,
          currentUserReview
        });
      } catch (error) {
        console.error('Error fetching movie:', error);
        return res.status(404).json({ message: 'Movie not found.' });
      }
    }

    return res.status(400).json({ message: 'Query or ID parameter is required.' });
  }

  if (req.method === 'POST') {
    const authUser = authenticate(req, res);
    if (!authUser) {
      return;
    }

    const { movieId, rating, review, watchedDate } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required.' });
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

      return res.status(200).json({ message: 'Movie tracked successfully.' });
    } catch (error) {
      console.error('Error tracking movie:', error);
      return res.status(500).json({ message: 'Failed to track movie.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}