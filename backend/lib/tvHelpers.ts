import { db } from './turso';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function getAndCacheTVShow(tvId: string | number, forceFetch = false) {
  if (!forceFetch) {
    try {
      const { rows } = await db.execute({
        sql: 'SELECT id, name, overview, first_air_date, poster_path, backdrop_path, number_of_seasons, number_of_episodes, vote_average FROM tv_shows WHERE id = ?',
        args: [tvId],
      });
      if (rows.length > 0) {
        const show = rows[0];
        const seasonsRes = await db.execute({
          sql: 'SELECT season_number, name, overview, poster_path, air_date, episode_count FROM seasons WHERE tv_show_id = ? ORDER BY season_number ASC',
          args: [tvId],
        });
        return {
          ...show,
          seasons: seasonsRes.rows
        };
      }
    } catch (dbErr) {
      console.log('DB lookup before TMDB TV show failed (non-critical):', dbErr);
    }
  }

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

    const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error(`TMDB error: ${res.statusText}`);
    }
    const show = await res.json();

    try {
      const batchStmts: any[] = [
        {
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
        }
      ];

      if (Array.isArray(show.seasons)) {
        for (const season of show.seasons) {
          batchStmts.push({
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

      await db.batch(batchStmts, 'write');
    } catch (dbError) {
      console.log('DB caching TV show failed (non-critical):', dbError);
    }

    return show;
  } catch (error) {
    console.error('Error fetching TV show from TMDB:', error);
    throw new Error('TV Show not found');
  }
}

export async function getAndCacheSeason(tvId: string | number, seasonNumber: string | number, forceFetch = false) {
  if (!forceFetch) {
    try {
      const { rows } = await db.execute({
        sql: 'SELECT season_number, episode_number, name, overview, still_path, air_date, vote_average, runtime FROM episodes WHERE tv_show_id = ? AND season_number = ? ORDER BY episode_number ASC',
        args: [tvId, seasonNumber],
      });
      if (rows.length > 0) {
        return {
          season_number: Number(seasonNumber),
          episodes: rows
        };
      }
    } catch (dbErr) {
      console.log('DB lookup before TMDB season failed (non-critical):', dbErr);
    }
  }

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

    const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error(`TMDB season error: ${res.statusText}`);
    }
    const seasonData = await res.json();

    if (Array.isArray(seasonData.episodes) && seasonData.episodes.length > 0) {
      const batchStmts = seasonData.episodes.map((ep: any) => ({
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
      }));

      try {
        await db.batch(batchStmts, 'write');
      } catch (epError) {
        console.log('DB batch caching episodes failed (non-critical):', epError);
      }
    }

    return seasonData;
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} from TMDB:`, error);
    throw new Error('Season not found');
  }
}
