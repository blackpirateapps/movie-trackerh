import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Add a check to ensure the API key is set
if (!TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is not defined in environment variables.");
}

// Function to get movie from TMDB and cache it
async function getAndCacheMovie(movieId) {
  try {
    const { rows } = await db.execute({
      sql: 'SELECT * FROM movies WHERE id = ?',
      args: [movieId],
    });
    
    if (rows.length > 0) {
      return rows[0];
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const movie = response.data;

    await db.execute({
      sql: 'INSERT OR IGNORE INTO movies (id, title, overview, release_date, poster_path) VALUES (?, ?, ?, ?, ?)',
      args: [movie.id, movie.title, movie.overview, movie.release_date, movie.poster_path],
    });

    return movie;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Handle GET requests for movie search
  if (req.method === 'GET') {
    // Parse query parameters from URL - Vercel compatible approach
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

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

  // Handle POST requests for adding movies
  if (req.method === 'POST') {
    const authUser = authenticate(req, res);
    if (!authUser) {
      return; // The authenticate function handles sending the 401 response
    }

    const { movieId, rating, review } = req.body;
    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required.' });
    }

    try {
      await getAndCacheMovie(movieId);
      await db.execute({
        sql: `
          INSERT INTO user_movies (user_id, movie_id, rating, review)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, movie_id) DO UPDATE SET
          rating = excluded.rating,
          review = excluded.review,
          updated_at = CURRENT_TIMESTAMP
        `,
        args: [authUser.sub, movieId, rating, review],
      });

      return res.status(200).json({ message: 'Movie tracked successfully.' });
    } catch (error) {
      console.error('Error tracking movie:', error);
      return res.status(500).json({ message: 'Failed to track movie.' });
    }
  }

  // Handle unsupported methods
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}