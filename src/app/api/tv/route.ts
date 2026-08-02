import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function getAndCacheTVShow(tvId: string | number) {
  try {
    if (!TMDB_API_KEY) {
      return {
        id: Number(tvId),
        name: `TV Show ${tvId}`,
        overview: 'No overview available.',
        first_air_date: '2024-01-01',
        poster_path: null,
        backdrop_path: null,
        number_of_seasons: 1,
        number_of_episodes: 10,
        vote_average: 8.5,
        seasons: [
          {
            season_number: 1,
            name: 'Season 1',
            overview: 'Season 1 overview',
            poster_path: null,
            air_date: '2024-01-01',
            episode_count: 10,
          }
        ]
      };
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`);
    const show = response.data;

    // Cache TV show in DB
    try {
      await db.execute({
        sql: `
          INSERT INTO tv_shows (id, name, overview, first_air_date, poster_path, backdrop_path, number_of_seasons, number_of_episodes, vote_average)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          overview = excluded.overview,
          first_air_date = excluded.first_air_date,
          poster_path = excluded.poster_path,
          backdrop_path = excluded.backdrop_path,
          number_of_seasons = excluded.number_of_seasons,
          number_of_episodes = excluded.number_of_episodes,
          vote_average = excluded.vote_average
        `,
        args: [
          show.id,
          show.name,
          show.overview,
          show.first_air_date,
          show.poster_path,
          show.backdrop_path,
          show.number_of_seasons,
          show.number_of_episodes,
          show.vote_average
        ],
      });

      // Cache seasons metadata
      if (Array.isArray(show.seasons)) {
        for (const season of show.seasons) {
          await db.execute({
            sql: `
              INSERT INTO seasons (tv_show_id, season_number, name, overview, poster_path, air_date, episode_count)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(tv_show_id, season_number) DO UPDATE SET
              name = excluded.name,
              overview = excluded.overview,
              poster_path = excluded.poster_path,
              air_date = excluded.air_date,
              episode_count = excluded.episode_count
            `,
            args: [
              show.id,
              season.season_number,
              season.name,
              season.overview,
              season.poster_path,
              season.air_date,
              season.episode_count
            ]
          });
        }
      }
    } catch (dbError) {
      console.log('DB caching TV show failed (non-critical):', dbError);
    }

    return show;
  } catch (error) {
    console.error('Error fetching TV show from TMDB:', error);
    throw new Error('TV Show not found');
  }
}

async function getAndCacheSeason(tvId: string | number, seasonNumber: string | number) {
  try {
    if (!TMDB_API_KEY) {
      return {
        season_number: Number(seasonNumber),
        name: `Season ${seasonNumber}`,
        episodes: [
          {
            season_number: Number(seasonNumber),
            episode_number: 1,
            name: 'Pilot',
            overview: 'Sample episode overview.',
            still_path: null,
            air_date: '2024-01-01',
            vote_average: 8.0,
            runtime: 45
          }
        ]
      };
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
    const seasonData = response.data;

    // Cache episodes in DB
    if (Array.isArray(seasonData.episodes)) {
      for (const ep of seasonData.episodes) {
        try {
          await db.execute({
            sql: `
              INSERT INTO episodes (tv_show_id, season_number, episode_number, name, overview, still_path, air_date, vote_average, runtime)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(tv_show_id, season_number, episode_number) DO UPDATE SET
              name = excluded.name,
              overview = excluded.overview,
              still_path = excluded.still_path,
              air_date = excluded.air_date,
              vote_average = excluded.vote_average,
              runtime = excluded.runtime
            `,
            args: [
              Number(tvId),
              Number(seasonNumber),
              ep.episode_number,
              ep.name,
              ep.overview,
              ep.still_path,
              ep.air_date,
              ep.vote_average,
              ep.runtime
            ]
          });
        } catch (epError) {
          console.log('DB caching episode failed (non-critical):', epError);
        }
      }
    }

    return seasonData;
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} from TMDB:`, error);
    throw new Error('Season not found');
  }
}

async function getUserTVTrack(userId: string | number, tvId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: 'SELECT rating, review, is_favorite, start_date, end_date, watched_where, created_at FROM user_tv_shows WHERE user_id = ? AND tv_show_id = ?',
      args: [userId, tvId],
    });
    if (rows.length > 0) {
      const row = rows[0];
      let watchedWhere: string[] = [];
      if (row.watched_where) {
        try {
          watchedWhere = JSON.parse(row.watched_where as string);
        } catch (e) {
          watchedWhere = (row.watched_where as string).split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return {
        ...row,
        is_favorite: Boolean(row.is_favorite),
        watched_where: watchedWhere
      };
    }
    return null;
  } catch (error) {
    console.log('Could not fetch user TV track (non-critical):', error);
    return null;
  }
}

async function getUserEpisodes(userId: string | number, tvId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: 'SELECT season_number, episode_number, watched, rating FROM user_episodes WHERE user_id = ? AND tv_show_id = ?',
      args: [userId, tvId],
    });
    const map: Record<string, { watched: boolean; rating?: number }> = {};
    for (const r of rows) {
      const key = `${r.season_number}_${r.episode_number}`;
      map[key] = {
        watched: Boolean(r.watched),
        rating: (r.rating as number) || undefined
      };
    }
    return map;
  } catch (error) {
    console.log('Could not fetch user episodes (non-critical):', error);
    return {};
  }
}

async function getTVReviews(tvId: string | number) {
  try {
    const { rows } = await db.execute({
      sql: `
        SELECT 
          uts.rating, 
          uts.review, 
          uts.is_favorite,
          uts.start_date,
          uts.end_date,
          uts.watched_where,
          uts.created_at,
          u.username 
        FROM user_tv_shows uts
        JOIN users u ON uts.user_id = u.id
        WHERE uts.tv_show_id = ? AND (uts.review IS NOT NULL AND uts.review != '')
        ORDER BY uts.created_at DESC
        LIMIT 10
      `,
      args: [tvId],
    });
    return rows.map(r => {
      let watchedWhere: string[] = [];
      if (r.watched_where) {
        try {
          watchedWhere = JSON.parse(r.watched_where as string);
        } catch (e) {
          watchedWhere = (r.watched_where as string).split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      return {
        ...r,
        is_favorite: Boolean(r.is_favorite),
        watched_where: watchedWhere
      };
    });
  } catch (error) {
    console.log('Could not fetch TV reviews (non-critical):', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const id = searchParams.get('id');
  const seasonNumber = searchParams.get('season');

  // Search TV shows
  if (query) {
    try {
      if (!TMDB_API_KEY) {
        return NextResponse.json([]);
      }
      const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
        },
      });
      return NextResponse.json(response.data.results);
    } catch (error: any) {
      console.error('TMDB TV search error:', error.response ? error.response.data : error.message);
      return NextResponse.json({ message: 'Failed to search TV shows.' }, { status: 500 });
    }
  }

  // Get specific season with episodes
  if (id && seasonNumber !== null && seasonNumber !== undefined) {
    try {
      const seasonData = await getAndCacheSeason(id, seasonNumber);
      let userEpisodes: Record<string, { watched: boolean; rating?: number }> = {};
      try {
        const authUser = authenticate(request, null, false);
        if (authUser) {
          userEpisodes = await getUserEpisodes(authUser.sub, id);
        }
      } catch (e) {
        // Not authenticated
      }
      return NextResponse.json({
        ...seasonData,
        userEpisodes
      });
    } catch (error) {
      console.error('Error fetching season:', error);
      return NextResponse.json({ message: 'Season not found.' }, { status: 404 });
    }
  }

  // Get TV show details
  if (id) {
    try {
      const show = await getAndCacheTVShow(id);

      let currentUserTrack = null;
      let userEpisodes = {};
      try {
        const authUser = authenticate(request, null, false);
        if (authUser) {
          currentUserTrack = await getUserTVTrack(authUser.sub, id);
          userEpisodes = await getUserEpisodes(authUser.sub, id);
        }
      } catch (authError) {
        // User not authenticated
      }

      const reviews = await getTVReviews(id);

      return NextResponse.json({
        ...show,
        currentUserTrack,
        userEpisodes,
        reviews
      });
    } catch (error) {
      console.error('Error fetching TV show:', error);
      return NextResponse.json({ message: 'TV Show not found.' }, { status: 404 });
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
  const { tvShowId, action, rating, review, isFavorite, startDate, endDate, watchedWhere, seasonNumber, episodeNumber, watched } = body;

  if (!tvShowId) {
    return NextResponse.json({ message: 'TV Show ID is required.' }, { status: 400 });
  }

  // Ensure TV Show is cached
  try {
    await getAndCacheTVShow(tvShowId);
  } catch (e) {
    // Non-critical
  }

  // Toggle Favorite
  if (action === 'favorite') {
    try {
      const existing = await getUserTVTrack(authUser.sub, tvShowId);
      const newFavStatus = isFavorite !== undefined ? (isFavorite ? 1 : 0) : (existing?.is_favorite ? 0 : 1);

      await db.execute({
        sql: `
          INSERT INTO user_tv_shows (user_id, tv_show_id, is_favorite)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, tv_show_id) DO UPDATE SET
          is_favorite = excluded.is_favorite,
          updated_at = CURRENT_TIMESTAMP
        `,
        args: [authUser.sub, tvShowId, newFavStatus],
      });

      return NextResponse.json({ message: 'Favorite status updated.', is_favorite: Boolean(newFavStatus) });
    } catch (error) {
      console.error('Error updating favorite:', error);
      return NextResponse.json({ message: 'Failed to update favorite.' }, { status: 500 });
    }
  }

  // Delete TV show from user collection
  if (action === 'delete') {
    try {
      await db.execute({
        sql: 'DELETE FROM user_tv_shows WHERE user_id = ? AND tv_show_id = ?',
        args: [authUser.sub, tvShowId],
      });
      await db.execute({
        sql: 'DELETE FROM user_episodes WHERE user_id = ? AND tv_show_id = ?',
        args: [authUser.sub, tvShowId],
      });
      return NextResponse.json({ message: 'TV Show deleted from your collection.' });
    } catch (error) {
      console.error('Error deleting TV show:', error);
      return NextResponse.json({ message: 'Failed to delete TV show.' }, { status: 500 });
    }
  }

  // Mark/rate individual episode
  if (action === 'episode_watched') {
    if (seasonNumber === undefined || episodeNumber === undefined) {
      return NextResponse.json({ message: 'Season number and episode number required.' }, { status: 400 });
    }
    try {
      const isWatched = watched !== undefined ? (watched ? 1 : 0) : 1;
      const today = new Date().toISOString().split('T')[0];

      await db.execute({
        sql: `
          INSERT INTO user_episodes (user_id, tv_show_id, season_number, episode_number, watched, watched_date, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, tv_show_id, season_number, episode_number) DO UPDATE SET
          watched = excluded.watched,
          watched_date = excluded.watched_date,
          rating = excluded.rating,
          updated_at = CURRENT_TIMESTAMP
        `,
        args: [authUser.sub, tvShowId, seasonNumber, episodeNumber, isWatched, today, rating || null],
      });

      return NextResponse.json({ message: 'Episode updated successfully.' });
    } catch (error) {
      console.error('Error updating episode:', error);
      return NextResponse.json({ message: 'Failed to update episode.' }, { status: 500 });
    }
  }

  // Default: Add / Track TV show (rating, review, dates, watched_where)
  try {
    const watchedWhereStr = Array.isArray(watchedWhere) ? JSON.stringify(watchedWhere) : (watchedWhere || null);

    await db.execute({
      sql: `
        INSERT INTO user_tv_shows (user_id, tv_show_id, rating, review, is_favorite, start_date, end_date, watched_where)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, tv_show_id) DO UPDATE SET
        rating = excluded.rating,
        review = excluded.review,
        is_favorite = COALESCE(excluded.is_favorite, user_tv_shows.is_favorite),
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        watched_where = excluded.watched_where,
        updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        authUser.sub,
        tvShowId,
        rating || null,
        review || null,
        isFavorite ? 1 : 0,
        startDate || null,
        endDate || null,
        watchedWhereStr
      ],
    });

    return NextResponse.json({ message: 'TV show tracked successfully.' });
  } catch (error) {
    console.error('Error tracking TV show:', error);
    return NextResponse.json({ message: 'Failed to track TV show.' }, { status: 500 });
  }
}
