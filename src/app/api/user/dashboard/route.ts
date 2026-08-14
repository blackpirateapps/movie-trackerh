import { NextRequest, NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';
import { getAndCacheTVShow, getAndCacheSeason } from '@/../backend/lib/tvHelpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await ensureSchema();

  const authUser = authenticate(request, null, false);
  if (!authUser) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const userId = parseInt(authUser.sub);

  try {
    // 1. Fetch Recently Watched Movies
    const { rows: movieRows } = await db.execute({
      sql: `
        SELECT 
          um.id, 
          um.movie_id as movieId, 
          um.rating, 
          um.review, 
          um.watched_date, 
          um.created_at, 
          um.updated_at,
          m.title, 
          m.poster_path, 
          m.backdrop_path, 
          m.release_date, 
          m.runtime,
          m.vote_average
        FROM user_movies um
        JOIN movies m ON um.movie_id = m.id
        WHERE um.user_id = ?
        ORDER BY um.updated_at DESC, um.created_at DESC
        LIMIT 6
      `,
      args: [userId],
    });

    const lastWatchedMovies = movieRows.map((m: any) => ({
      id: m.id,
      movieId: m.movieId,
      title: m.title,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_date: m.release_date,
      runtime: m.runtime,
      vote_average: m.vote_average,
      rating: m.rating || null,
      review: m.review || null,
      watched_date: m.watched_date || null,
      updated_at: m.updated_at || m.created_at
    }));

    // 2. Fetch Active TV Shows for Currently Watching
    const { rows: activeShowRows } = await db.execute({
      sql: `
        SELECT 
          tv_show_id, 
          MAX(last_activity) as latest_time 
        FROM (
          SELECT tv_show_id, MAX(COALESCE(updated_at, created_at)) as last_activity 
          FROM user_episodes 
          WHERE user_id = ? AND watched = 1 
          GROUP BY tv_show_id
          
          UNION ALL
          
          SELECT tv_show_id, COALESCE(updated_at, created_at) as last_activity 
          FROM user_tv_shows 
          WHERE user_id = ?
        )
        GROUP BY tv_show_id
        ORDER BY latest_time DESC
        LIMIT 5
      `,
      args: [userId, userId],
    });

    const { searchParams } = new URL(request.url);
    const requestedTvShowId = searchParams.get('tvShowId');

    let currentlyWatching = null;

    if (activeShowRows.length > 0 || requestedTvShowId) {
      const primaryShowId = requestedTvShowId ? Number(requestedTvShowId) : Number(activeShowRows[0].tv_show_id);
      
      // Fetch show details
      let showMetaData: any = null;
      try {
        showMetaData = await getAndCacheTVShow(primaryShowId);
      } catch (err) {
        console.error('Failed to get TV show metadata for dashboard:', err);
      }

      if (showMetaData) {
        // Get user watched episodes for this show
        const { rows: watchedEpRows } = await db.execute({
          sql: `
            SELECT season_number, episode_number, watched_date, updated_at
            FROM user_episodes
            WHERE user_id = ? AND tv_show_id = ? AND watched = 1
            ORDER BY season_number ASC, episode_number ASC
          `,
          args: [userId, primaryShowId],
        });

        const watchedCount = watchedEpRows.length;
        let lastWatched = null;
        let nextEpisode: any = null;
        let isCompleted = false;

        if (watchedCount > 0) {
          lastWatched = watchedEpRows[watchedEpRows.length - 1];
          const currSeason = Number(lastWatched.season_number);
          const currEp = Number(lastWatched.episode_number);

          // Find season info to determine next episode
          let seasonData: any = null;
          try {
            seasonData = await getAndCacheSeason(primaryShowId, currSeason);
          } catch (e) {}

          const seasonEps = seasonData?.episodes || [];
          const nextEpInCurrSeason = seasonEps.find((e: any) => Number(e.episode_number) === currEp + 1);

          if (nextEpInCurrSeason) {
            nextEpisode = {
              season_number: currSeason,
              episode_number: currEp + 1,
              name: nextEpInCurrSeason.name || `Episode ${currEp + 1}`,
              overview: nextEpInCurrSeason.overview || '',
              still_path: nextEpInCurrSeason.still_path || null,
              air_date: nextEpInCurrSeason.air_date || null,
              runtime: nextEpInCurrSeason.runtime || null,
            };
          } else {
            // Try next season
            const nextSeasonNum = currSeason + 1;
            let nextSeasonData: any = null;
            try {
              nextSeasonData = await getAndCacheSeason(primaryShowId, nextSeasonNum);
            } catch (e) {}

            if (nextSeasonData && Array.isArray(nextSeasonData.episodes) && nextSeasonData.episodes.length > 0) {
              const firstEp = nextSeasonData.episodes[0];
              nextEpisode = {
                season_number: nextSeasonNum,
                episode_number: Number(firstEp.episode_number || 1),
                name: firstEp.name || 'Episode 1',
                overview: firstEp.overview || '',
                still_path: firstEp.still_path || null,
                air_date: firstEp.air_date || null,
                runtime: firstEp.runtime || null,
              };
            } else {
              // No more seasons/episodes found -> show completed!
              isCompleted = true;
            }
          }
        } else {
          // No episodes watched yet, next episode is S1 E1
          let seasonData: any = null;
          try {
            seasonData = await getAndCacheSeason(primaryShowId, 1);
          } catch (e) {}

          const firstEp = seasonData?.episodes?.[0];
          nextEpisode = {
            season_number: 1,
            episode_number: 1,
            name: firstEp?.name || 'Pilot',
            overview: firstEp?.overview || '',
            still_path: firstEp?.still_path || null,
            air_date: firstEp?.air_date || null,
            runtime: firstEp?.runtime || null,
          };
        }

        // Other active TV shows list for easy switching
        const otherShowIds = activeShowRows
          .map((r: any) => Number(r.tv_show_id))
          .filter((id: number) => id !== primaryShowId);
        const otherActiveShows: any[] = [];

        for (const showId of otherShowIds) {
          try {
            const meta = await getAndCacheTVShow(showId);
            otherActiveShows.push({
              id: meta.id,
              name: meta.name,
              poster_path: meta.poster_path,
              backdrop_path: meta.backdrop_path,
            });
          } catch (e) {}
        }

        currentlyWatching = {
          show: {
            id: showMetaData.id,
            name: showMetaData.name,
            overview: showMetaData.overview,
            poster_path: showMetaData.poster_path,
            backdrop_path: showMetaData.backdrop_path,
            number_of_seasons: showMetaData.number_of_seasons,
            number_of_episodes: showMetaData.number_of_episodes,
            vote_average: showMetaData.vote_average,
          },
          progress: {
            watchedEpisodesCount: watchedCount,
            totalEpisodesCount: showMetaData.number_of_episodes || (showMetaData.seasons ? showMetaData.seasons.reduce((acc: number, s: any) => acc + (s.episode_count || 0), 0) : 0),
            lastWatched: lastWatched ? {
              season_number: Number(lastWatched.season_number),
              episode_number: Number(lastWatched.episode_number),
              watched_date: lastWatched.watched_date,
            } : null,
          },
          nextEpisode,
          isCompleted,
          otherActiveShows,
        };
      }
    }

    return NextResponse.json({
      currentlyWatching,
      lastWatchedMovies,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard data.' }, { status: 500 });
  }
}
