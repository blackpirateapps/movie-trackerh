import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface UniversalSearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  in_db: boolean;
}

export async function GET(request: NextRequest) {
  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const type = searchParams.get('type') || 'all'; // 'all' | 'movie' | 'tv'

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  const searchTerm = `%${query.trim()}%`;
  const resultsMap = new Map<string, UniversalSearchResult>();

  // Run database and TMDB queries in parallel via Promise.allSettled for fast Vercel Function execution
  const tasks: Promise<any>[] = [];

  // Task 1: DB Movie Search
  if (type === 'all' || type === 'movie') {
    tasks.push(
      db.execute({
        sql: `
          SELECT id, title, overview, release_date, poster_path, backdrop_path, vote_average
          FROM movies
          WHERE title LIKE ? OR overview LIKE ?
          ORDER BY vote_average DESC
          LIMIT 15
        `,
        args: [searchTerm, searchTerm],
      }).then(res => ({ task: 'db_movie', rows: res.rows })).catch(() => ({ task: 'db_movie', rows: [] }))
    );
  }

  // Task 2: DB TV Search
  if (type === 'all' || type === 'tv') {
    tasks.push(
      db.execute({
        sql: `
          SELECT id, name as title, overview, first_air_date as release_date, poster_path, backdrop_path, vote_average
          FROM tv_shows
          WHERE name LIKE ? OR overview LIKE ?
          ORDER BY vote_average DESC
          LIMIT 15
        `,
        args: [searchTerm, searchTerm],
      }).then(res => ({ task: 'db_tv', rows: res.rows })).catch(() => ({ task: 'db_tv', rows: [] }))
    );
  }

  // Task 3: TMDB Movie Search
  if (TMDB_API_KEY && (type === 'all' || type === 'movie')) {
    tasks.push(
      axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: { api_key: TMDB_API_KEY, query: query.trim() },
        timeout: 4000
      }).then(res => ({ task: 'tmdb_movie', results: res.data?.results || [] }))
        .catch(() => ({ task: 'tmdb_movie', results: [] }))
    );
  }

  // Task 4: TMDB TV Search
  if (TMDB_API_KEY && (type === 'all' || type === 'tv')) {
    tasks.push(
      axios.get(`${TMDB_BASE_URL}/search/tv`, {
        params: { api_key: TMDB_API_KEY, query: query.trim() },
        timeout: 4000
      }).then(res => ({ task: 'tmdb_tv', results: res.data?.results || [] }))
        .catch(() => ({ task: 'tmdb_tv', results: [] }))
    );
  }

  const outcomes = await Promise.allSettled(tasks);

  for (const outcome of outcomes) {
    if (outcome.status === 'fulfilled' && outcome.value) {
      const data = outcome.value;

      if (data.task === 'db_movie') {
        for (const r of data.rows) {
          const key = `movie_${r.id}`;
          resultsMap.set(key, {
            id: Number(r.id),
            title: String(r.title),
            media_type: 'movie',
            overview: r.overview ? String(r.overview) : null,
            release_date: r.release_date ? String(r.release_date) : null,
            poster_path: r.poster_path ? String(r.poster_path) : null,
            backdrop_path: r.backdrop_path ? String(r.backdrop_path) : null,
            vote_average: r.vote_average != null ? Number(r.vote_average) : null,
            in_db: true
          });
        }
      }

      if (data.task === 'db_tv') {
        for (const r of data.rows) {
          const key = `tv_${r.id}`;
          resultsMap.set(key, {
            id: Number(r.id),
            title: String(r.title),
            media_type: 'tv',
            overview: r.overview ? String(r.overview) : null,
            release_date: r.release_date ? String(r.release_date) : null,
            poster_path: r.poster_path ? String(r.poster_path) : null,
            backdrop_path: r.backdrop_path ? String(r.backdrop_path) : null,
            vote_average: r.vote_average != null ? Number(r.vote_average) : null,
            in_db: true
          });
        }
      }

      if (data.task === 'tmdb_movie') {
        for (const r of data.results) {
          const key = `movie_${r.id}`;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              id: Number(r.id),
              title: String(r.title),
              media_type: 'movie',
              overview: r.overview ? String(r.overview) : null,
              release_date: r.release_date ? String(r.release_date) : null,
              poster_path: r.poster_path ? String(r.poster_path) : null,
              backdrop_path: r.backdrop_path ? String(r.backdrop_path) : null,
              vote_average: r.vote_average != null ? Number(r.vote_average) : null,
              in_db: false
            });
          }
        }
      }

      if (data.task === 'tmdb_tv') {
        for (const r of data.results) {
          const key = `tv_${r.id}`;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              id: Number(r.id),
              title: String(r.name || r.title),
              media_type: 'tv',
              overview: r.overview ? String(r.overview) : null,
              release_date: r.first_air_date ? String(r.first_air_date) : null,
              poster_path: r.poster_path ? String(r.poster_path) : null,
              backdrop_path: r.backdrop_path ? String(r.backdrop_path) : null,
              vote_average: r.vote_average != null ? Number(r.vote_average) : null,
              in_db: false
            });
          }
        }
      }
    }
  }

  const combinedResults = Array.from(resultsMap.values());
  const lowerQuery = query.toLowerCase().trim();

  // Smart Ranking Sort
  combinedResults.sort((a, b) => {
    const aLower = a.title.toLowerCase();
    const bLower = b.title.toLowerCase();

    // Exact title match gets top priority
    if (aLower === lowerQuery && bLower !== lowerQuery) return -1;
    if (bLower === lowerQuery && aLower !== lowerQuery) return 1;

    // Starts with query string gets second priority
    if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
    if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery)) return 1;

    // Local DB items get priority over non-cached TMDB items
    if (a.in_db && !b.in_db) return -1;
    if (!a.in_db && b.in_db) return 1;

    // Fall back to rating
    return (b.vote_average || 0) - (a.vote_average || 0);
  });

  return NextResponse.json(combinedResults, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}
