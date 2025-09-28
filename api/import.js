import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';
import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function searchMovieOnTMDB(title, year) {
  try {
    const cleanTitle = title.replace(/["""]/g, '').trim();
    
    let searchQuery = cleanTitle;
    if (year) {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: searchQuery,
          year: year
        }
      });

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }
    }

    const fallbackResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: cleanTitle
      }
    });

    return fallbackResponse.data.results[0] || null;
  } catch (error) {
    console.error(`Error searching for movie: ${title}`, error);
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

async function processWatchedMovie(authUser, row, processed) {
  const name = row.Name || row.name;
  const year = row.Year || row.year;
  const date = parseLetterboxdDate(row.Date || row.date);

  if (!name) {
    return { error: { row: processed, error: 'Missing movie name' } };
  }

  const tmdbMovie = await searchMovieOnTMDB(name, year);
  if (!tmdbMovie) {
    return { 
      error: { 
        row: processed, 
        title: name, 
        year,
        error: 'Movie not found on TMDB' 
      } 
    };
  }

  await cacheMovie(tmdbMovie);

  await db.execute({
    sql: `
      INSERT INTO user_movies (user_id, movie_id, watched_date)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, movie_id) DO UPDATE SET
      watched_date = COALESCE(excluded.watched_date, watched_date),
      updated_at = CURRENT_TIMESTAMP
    `,
    args: [authUser.sub, tmdbMovie.id, date]
  });

  return {
    result: {
      title: tmdbMovie.title,
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
      watchedDate: date,
      imported: true,
      type: 'watched'
    }
  };
}

async function processWatchlistMovie(authUser, row, processed) {
  const name = row.Name || row.name;
  const year = row.Year || row.year;
  const dateAdded = parseLetterboxdDate(row.Date || row.date);

  if (!name) {
    return { error: { row: processed, error: 'Missing movie name' } };
  }

  const tmdbMovie = await searchMovieOnTMDB(name, year);
  if (!tmdbMovie) {
    return { 
      error: { 
        row: processed, 
        title: name, 
        year,
        error: 'Movie not found on TMDB' 
      } 
    };
  }

  await cacheMovie(tmdbMovie);

  await db.execute({
    sql: 'INSERT OR IGNORE INTO watchlist (user_id, movie_id, created_at) VALUES (?, ?, ?)',
    args: [authUser.sub, tmdbMovie.id, dateAdded || new Date().toISOString()]
  });

  return {
    result: {
      title: tmdbMovie.title,
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
      dateAdded,
      imported: true,
      type: 'watchlist'
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authUser = authenticate(req, res);
  if (!authUser) {
    return;
  }

  try {
    const { csvData, importType } = req.body;

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required.' });
    }

    if (!importType || !['watched', 'watchlist'].includes(importType)) {
      return res.status(400).json({ message: 'Import type must be either "watched" or "watchlist".' });
    }

    const results = [];
    const errors = [];
    let processed = 0;

    return new Promise((resolve, reject) => {
      const readable = Readable.from([csvData]);
      const processFunction = importType === 'watched' ? processWatchedMovie : processWatchlistMovie;
      
      readable
        .pipe(csv())
        .on('data', async (row) => {
          try {
            processed++;
            
            const result = await processFunction(authUser, row, processed);
            
            if (result.error) {
              errors.push(result.error);
            } else if (result.result) {
              results.push(result.result);
            }

          } catch (error) {
            console.error(`Error processing row ${processed}:`, error);
            errors.push({ 
              row: processed, 
              title: row.Name || row.name,
              error: error.message 
            });
          }
        })
        .on('end', () => {
          resolve(res.status(200).json({
            message: `${importType === 'watched' ? 'Watched movies' : 'Watchlist'} import completed`,
            imported: results.length,
            errors: errors.length,
            total: processed,
            importType,
            results: results.slice(0, 20),
            errors: errors.slice(0, 10)
          }));
        })
        .on('error', (error) => {
          reject(res.status(500).json({ message: 'Failed to process CSV', error: error.message }));
        });
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ message: 'Import failed', error: error.message });
  }
}