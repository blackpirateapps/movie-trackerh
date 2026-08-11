import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import { invalidateUserStatsCache } from '@/../backend/lib/statsCache';
import axios from 'axios';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function parseCSV(csvString: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(csvString);

    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

export async function POST(request: NextRequest) {
  const authUser = authenticate(request, null, true);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json();
  const { action, csvData, importType, movieName, movieId, originalData } = body;

  if (action === 'parse') {
    if (!csvData) {
      return NextResponse.json({ message: 'CSV data is required.' }, { status: 400 });
    }

    try {
      const records = await parseCSV(csvData);
      
      const movies = records.map((record) => {
        const name = record.Name || record.Title || record['Movie Title'] || '';
        const year = record.Year || record['Release Year'] || '';
        const date = record.Date || record['Watched Date'] || record.Added || null;
        const letterboxdURI = record['Letterboxd URI'] || record.URL || null;

        return {
          originalName: name,
          year,
          date,
          letterboxdURI
        };
      }).filter(m => m.originalName.trim().length > 0);

      return NextResponse.json({
        movies,
        total: movies.length,
        importType: importType || 'watched'
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return NextResponse.json({ message: 'Failed to parse CSV file.' }, { status: 400 });
    }
  }

  if (action === 'search') {
    if (!movieName) {
      return NextResponse.json({ message: 'Movie name is required.' }, { status: 400 });
    }

    try {
      if (!TMDB_API_KEY) {
        return NextResponse.json({ results: [] });
      }

      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: movieName
        }
      });

      return NextResponse.json({
        results: response.data.results.slice(0, 5)
      });
    } catch (error) {
      console.error('Error searching movie:', error);
      return NextResponse.json({ message: 'Failed to search movie.' }, { status: 500 });
    }
  }

  if (action === 'import') {
    if (!movieId || !originalData) {
      return NextResponse.json({ message: 'Movie ID and original data are required.' }, { status: 400 });
    }

    try {
      let movieData: any = null;
      if (TMDB_API_KEY) {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        movieData = response.data;
      } else {
        movieData = {
          id: Number(movieId),
          title: originalData.originalName,
          overview: 'Imported movie.',
          release_date: originalData.year ? `${originalData.year}-01-01` : '2024-01-01',
          poster_path: null,
          backdrop_path: null,
          runtime: 120,
          vote_average: 7.5
        };
      }

      await db.execute({
        sql: `INSERT OR IGNORE INTO movies (id, title, overview, release_date, poster_path, backdrop_path, runtime, vote_average) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          movieData.id,
          movieData.title,
          movieData.overview || '',
          movieData.release_date || null,
          movieData.poster_path || null,
          movieData.backdrop_path || null,
          movieData.runtime || null,
          movieData.vote_average || null
        ]
      });

      if (importType === 'watchlist') {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)',
          args: [authUser.sub, movieData.id]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO user_movies (user_id, movie_id, watched_date) 
                VALUES (?, ?, ?) 
                ON CONFLICT(user_id, movie_id) DO UPDATE SET 
                watched_date = excluded.watched_date,
                updated_at = CURRENT_TIMESTAMP`,
          args: [authUser.sub, movieData.id, originalData.date || new Date().toISOString().split('T')[0]]
        });
      }

      invalidateUserStatsCache(Number(authUser.sub || authUser.id)).catch(() => {});

      return NextResponse.json({
        message: 'Movie imported successfully.',
        movie: {
          id: movieData.id,
          title: movieData.title,
          year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : null,
          poster_path: movieData.poster_path
        }
      });
    } catch (error) {
      console.error('Error importing movie:', error);
      return NextResponse.json({ message: 'Failed to import movie.' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
}
