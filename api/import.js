import { db } from '../backend/lib/turso.js';
import { authenticate } from '../backend/lib/auth.js';
import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function searchMovieOnTMDB(title, year, directors) {
  try {
    // First try searching by title and year
    let searchQuery = title;
    if (year) searchQuery += ` y:${year}`;
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: searchQuery,
        year: year || undefined
      },
    });

    if (response.data.results.length > 0) {
      return response.data.results[0];
    }

    // If no results, try just title
    const fallbackResponse = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title
      },
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
      ],
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

function parseLetterboxdRating(ratingStr) {
  if (!ratingStr) return null;
  const rating = parseFloat(ratingStr);
  return isNaN(rating) ? null : Math.min(Math.max(rating, 0.5), 5);
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
    const { csvData, importType = 'diary' } = req.body;

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required.' });
    }

    const results = [];
    const errors = [];
    let processed = 0;

    // Parse CSV data
    return new Promise((resolve, reject) => {
      const readable = Readable.from([csvData]);
      
      readable
        .pipe(csv())
        .on('data', async (row) => {
          try {
            processed++;
            
            // Extract data from CSV row
            const title = row.Title || row.title;
            const year = row.Year || row.year;
            const directors = row.Directors || row.directors;
            const rating = parseLetterboxdRating(row.Rating || row.rating);
            const review = row.Review || row.review || '';
            const watchedDate = parseLetterboxdDate(row.WatchedDate || row['Watched Date'] || row.Date);
            const tmdbId = row.tmdbID || row.tmdbId;
            const imdbId = row.imdbID || row.imdbId;

            if (!title) {
              errors.push({ row: processed, error: 'Missing title' });
              return;
            }

            // Find movie on TMDB
            let tmdbMovie = null;
            
            if (tmdbId) {
              // Use TMDB ID if available
              try {
                const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                  params: { api_key: TMDB_API_KEY }
                });
                tmdbMovie = response.data;
              } catch (error) {
                console.log(`TMDB ID ${tmdbId} not found, falling back to search`);
              }
            }

            if (!tmdbMovie) {
              // Search by title, year, directors
              tmdbMovie = await searchMovieOnTMDB(title, year, directors);
            }

            if (!tmdbMovie) {
              errors.push({ 
                row: processed, 
                title, 
                year,
                error: 'Movie not found on TMDB' 
              });
              return;
            }

            // Cache movie in database
            await cacheMovie(tmdbMovie);

            // Add to user's collection
            if (rating || review || watchedDate) {
              await db.execute({
                sql: `
                  INSERT INTO user_movies (user_id, movie_id, rating, review, watched_date)
                  VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(user_id, movie_id) DO UPDATE SET
                  rating = COALESCE(excluded.rating, rating),
                  review = CASE WHEN excluded.review != '' THEN excluded.review ELSE review END,
                  watched_date = COALESCE(excluded.watched_date, watched_date),
                  updated_at = CURRENT_TIMESTAMP
                `,
                args: [authUser.sub, tmdbMovie.id, rating, review.trim() || null, watchedDate],
              });
            }

            results.push({
              title: tmdbMovie.title,
              year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
              rating,
              review: review ? review.substring(0, 100) + '...' : null,
              watchedDate,
              imported: true
            });

          } catch (error) {
            console.error(`Error processing row ${processed}:`, error);
            errors.push({ 
              row: processed, 
              title: row.Title || row.title,
              error: error.message 
            });
          }
        })
        .on('end', () => {
          resolve(res.status(200).json({
            message: 'Import completed',
            imported: results.length,
            errors: errors.length,
            total: processed,
            results: results.slice(0, 10), // Show first 10 results
            errors: errors.slice(0, 10)   // Show first 10 errors
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