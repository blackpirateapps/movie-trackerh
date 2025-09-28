import { db } from '../lib/turso.js';
import { createProtectedHandler } from '../lib/auth.js';

export const config = {
  runtime: 'edge',
};

// Main handler that delegates based on method and params
async function handler(req, res, user) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const movieId = url.searchParams.get('id');

  if (req.method === 'GET') {
    if (query) {
      return searchMovies(query);
    }
    if (movieId) {
      return getMovieDetails(movieId, user?.id);
    }
  }

  if (req.method === 'POST') {
    const body = await req.json();
    return addUserMovieInteraction(user.id, body);
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}

// --- API Functions ---

// 1. Search for movies on TMDB
async function searchMovies(query) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from TMDB');
    const data = await response.json();
    return new Response(JSON.stringify(data.results), { status: 200 });
  } catch (error) {
    console.error('TMDB search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search movies' }), { status: 500 });
  }
}

// 2. Get movie details, caching if necessary
async function getMovieDetails(movieId, userId) {
    try {
        let movieResult = await db.execute({ sql: "SELECT * FROM movies WHERE id = ?", args: [movieId] });
        let movie;

        if (movieResult.rows.length === 0) {
            // Fetch from TMDB
            const tmdbUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`;
            const tmdbResponse = await fetch(tmdbUrl);
            if (!tmdbResponse.ok) throw new Error('Movie not found on TMDB');
            const tmdbMovie = await tmdbResponse.json();

            // Cache in our DB
            await db.execute({
                sql: "INSERT OR IGNORE INTO movies (id, title, overview, release_date, poster_path) VALUES (?, ?, ?, ?, ?)",
                args: [tmdbMovie.id, tmdbMovie.title, tmdbMovie.overview, tmdbMovie.release_date, tmdbMovie.poster_path],
            });
            movie = { id: tmdbMovie.id, title: tmdbMovie.title, overview: tmdbMovie.overview, release_date: tmdbMovie.release_date, poster_path: tmdbMovie.poster_path };
        } else {
            movie = movieResult.rows[0];
        }

        // Get reviews for this movie
        const reviewsResult = await db.execute({
            sql: `
                SELECT um.rating, um.review, um.watched_date, u.username
                FROM user_movies um
                JOIN users u ON um.user_id = u.id
                WHERE um.movie_id = ?
            `,
            args: [movieId]
        });

        // Check if the current user has reviewed this movie
        let currentUserReview = null;
        if (userId) {
            const userReviewResult = await db.execute({
                sql: `SELECT rating, review, watched_date FROM user_movies WHERE movie_id = ? AND user_id = ?`,
                args: [movieId, userId]
            });
            if (userReviewResult.rows.length > 0) {
                currentUserReview = userReviewResult.rows[0];
            }
        }
        
        const responseData = {
            ...movie,
            reviews: reviewsResult.rows,
            currentUserReview: currentUserReview
        };

        return new Response(JSON.stringify(responseData), { status: 200 });

    } catch (error) {
        console.error('Get movie details error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get movie details' }), { status: 500 });
    }
}

// 3. Add or update a user's movie rating/review
async function addUserMovieInteraction(userId, { movieId, rating, review, watched_date }) {
  try {
    const result = await db.execute({
      sql: `
        INSERT INTO user_movies (user_id, movie_id, rating, review, watched_date)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, movie_id)
        DO UPDATE SET
          rating = excluded.rating,
          review = excluded.review,
          watched_date = excluded.watched_date,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [userId, movieId, rating, review, watched_date],
    });
    return new Response(JSON.stringify({ success: true, ...result }), { status: 201 });
  } catch (error) {
    console.error('User movie interaction error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save movie interaction' }), { status: 500 });
  }
}

// Export the protected handler
export default createProtectedHandler(handler);
