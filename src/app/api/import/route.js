import { NextResponse } from 'next/server';
import { db } from '@/../backend/lib/turso.js';
import { authenticate } from '@/../backend/lib/auth.js';
import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function searchMoviesOnTMDB(title) {
  try {
    if (!TMDB_API_KEY) return [];
    const cleanTitle = title.replace(/["""]/g, '').trim();
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: cleanTitle
      }
    });

    return response.data.results.slice(0, 10);
  } catch (error) {
    console.error(`Error searching for movie: ${title}`, error);
    return [];
  }
}

async function getMovieDetails(movieId) {
  try {
    if (!TMDB_API_KEY) {
      return {
        id: movieId,
        title: `Movie ${movieId}`,
        overview: 'Imported movie details',
        release_date: '2024-01-01',
        poster_path: null,
        backdrop_path: null,
        runtime: 120,
        vote_average: 7.5
      };
    }
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

export async function POST(request) {
  const authUser = authenticate(request, null, true);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const { action, csvData, importType } = body;

  if (action === 'parse') {
    if (!csvData || !importType) {
      return NextResponse.json({ message: 'CSV data and import type are required.' }, { status: 400 });
    }

    try {
      const movies = [];
      await new Promise((resolve, reject) => {
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
          .on('end', resolve)
          .on('error', reject);
      });

      return NextResponse.json({
        movies,
        total: movies.length,
        importType
      });
    } catch (error) {
      return NextResponse.json({ message: 'Failed to parse CSV', error: error.message }, { status: 500 });
    }
  }

  if (action === 'search') {
    const { movieName } = body;
    if (!movieName) {
      return NextResponse.json({ message: 'Movie name is required.' }, { status: 400 });
    }

    try {
      const searchResults = await searchMoviesOnTMDB(movieName);
      return NextResponse.json({ results: searchResults });
    } catch (error) {
      return NextResponse.json({ message: 'Search failed', error: error.message }, { status: 500 });
    }
  }

  if (action === 'import') {
    const { movieId, originalData, importType: impType } = body;
    
    if (!movieId || !originalData || !impType) {
      return NextResponse.json({ message: 'Movie ID, original data, and import type are required.' }, { status: 400 });
    }

    try {
      const movieDetails = await getMovieDetails(movieId);
      if (!movieDetails) {
        return NextResponse.json({ message: 'Movie not found.' }, { status: 404 });
      }

      await cacheMovie(movieDetails);

      if (impType === 'watched') {
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
      } else if (impType === 'watchlist') {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO watchlist (user_id, movie_id, created_at) VALUES (?, ?, ?)',
          args: [authUser.sub, movieId, originalData.date || new Date().toISOString()]
        });
      }

      return NextResponse.json({
        message: 'Movie imported successfully',
        movie: {
          id: movieDetails.id,
          title: movieDetails.title,
          year: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : null,
          poster_path: movieDetails.poster_path
        }
      });

    } catch (error) {
      return NextResponse.json({ message: 'Import failed', error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
}
