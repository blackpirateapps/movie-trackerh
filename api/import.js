import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';
import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function searchMoviesOnTMDB(title) {
  try {
    const cleanTitle = title.replace(/["""]/g, '').trim();
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: cleanTitle
      }
    });

    return response.data.results.slice(0, 10); // Return top 10 matches
  } catch (error) {
    console.error(`Error searching for movie: ${title}`, error);
    return [];
  }
}

async function getMovieDetails(movieId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: { api_key: TMDB_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error);
    return null;
  }
}

async function cacheMovie(tmdbMovie) {
  try {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO movies (id, title, overview, release_date, poster_path, backdrop_path, runtime, vote_average) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        tmdbMovie.id, 
        tmdbMovie.title, 
        tmdbMovie.overview, 
        tmdbMovie.release_date, 
        tmdbMovie.poster_path, 
        tmdbMovie.backdrop_path,
        tmdbMovie.runtime || null,
        tmdbMovie.vote_average
      ]
    });
  } catch (error) {
    console.log('Movie caching failed (non-critical):', error);
  }
}

function parseLetterboxdDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const authUser = authenticate(req, res);
  if (!authUser) {
    return;
  }

  if (req.method === 'POST') {
    const { action, csvData, importType } = req.body;

    // Parse CSV and return all movies for interactive processing
    if (action === 'parse') {
      if (!csvData || !importType) {
        return res.status(400).json({ message: 'CSV data and import type are required.' });
      }

      try {
        const movies = [];
        return new Promise((resolve, reject) => {
          const readable = Readable.from([csvData]);
          
          readable
            .pipe(csv())
            .on('data', (row) => {
              const name = row.Name || row.name;
              const year = row.Year || row.year;
              const date = row.Date || row.date;
              
              if (name) {
                movies.push({
                  originalName: name,
                  year: year,
                  date: parseLetterboxdDate(date),
                  letterboxdURI: row['Letterboxd URI'] || row.letterboxdURI
                });
              }
            })
            .on('end', () => {
              resolve(res.status(200).json({
                movies,
                total: movies.length,
                importType
              }));
            })
            .on('error', (error) => {
              reject(res.status(500).json({ message: 'Failed to parse CSV', error: error.message }));
            });
        });
      } catch (error) {
        return res.status(500).json({ message: 'Parse failed', error: error.message });
      }
    }

    // Search for a specific movie
    if (action === 'search') {
      const { movieName } = req.body;
      
      if (!movieName) {
        return res.status(400).json({ message: 'Movie name is required.' });
      }

      try {
        const searchResults = await searchMoviesOnTMDB(movieName);
        return res.status(200).json({ results: searchResults });
      } catch (error) {
        return res.status(500).json({ message: 'Search failed', error: error.message });
      }
    }

    // Import selected movie
    if (action === 'import') {
      const { movieId, originalData, importType } = req.body;
      
      if (!movieId || !originalData || !importType) {
        return res.status(400).json({ message: 'Movie ID, original data, and import type are required.' });
      }

      try {
        const movieDetails = await getMovieDetails(movieId);
        if (!movieDetails) {
          return res.status(404).json({ message: 'Movie not found.' });
        }

        await cacheMovie(movieDetails);

        if (importType === 'watched') {
          await db.execute({
            sql: `
              INSERT INTO user_movies (user_id, movie_id, watched_date)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id, movie_id) DO UPDATE SET
              watched_date = COALESCE(excluded.watched_date, watched_date),
              updated_at = CURRENT_TIMESTAMP
            `,
            args: [authUser.sub, movieId, originalData.date]
          });
        } else if (importType === 'watchlist') {
          await db.execute({
            sql: 'INSERT OR IGNORE INTO watchlist (user_id, movie_id, created_at) VALUES (?, ?, ?)',
            args: [authUser.sub, movieId, originalData.date || new Date().toISOString()]
          });
        }

        return res.status(200).json({
          message: 'Movie imported successfully',
          movie: {
            id: movieDetails.id,
            title: movieDetails.title,
            year: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : null,
            poster_path: movieDetails.poster_path
          }
        });

      } catch (error) {
        return res.status(500).json({ message: 'Import failed', error: error.message });
      }
    }

    return res.status(400).json({ message: 'Invalid action.' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}