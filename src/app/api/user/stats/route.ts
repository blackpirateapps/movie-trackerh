import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/../backend/lib/turso';
import { authenticate } from '@/../backend/lib/auth';

export async function GET(req: Request) {
  try {
    await ensureSchema();

    const url = new URL(req.url);
    const usernameParam = url.searchParams.get('username') || '';
    const timeframe = url.searchParams.get('timeframe') || 'all'; // all | yearly | monthly | weekly | custom
    const yearParam = url.searchParams.get('year') || String(new Date().getFullYear());
    const monthParam = url.searchParams.get('month') || String(new Date().getMonth() + 1);
    const sinceParam = url.searchParams.get('since') || '';
    const untilParam = url.searchParams.get('until') || '';
    const mediaParam = url.searchParams.get('media') || 'all'; // all | movie | tv

    let userId: number | null = null;
    let targetUser: any = null;

    if (usernameParam) {
      const uRes = await db.execute({
        sql: `SELECT id, username, display_name, avatar_url, created_at FROM users WHERE username = ?`,
        args: [usernameParam],
      });
      if (uRes.rows.length === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      targetUser = uRes.rows[0];
      userId = Number(targetUser.id);
    } else {
      const userPayload = authenticate(req, null, false);
      if (!userPayload) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      userId = userPayload.id;
      const uRes = await db.execute({
        sql: `SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?`,
        args: [userId],
      });
      if (uRes.rows.length > 0) {
        targetUser = uRes.rows[0];
      }
    }

    // 1. Calculate Date Range Boundaries
    const targetYear = parseInt(yearParam, 10) || new Date().getFullYear();
    const targetMonth = parseInt(monthParam, 10) || (new Date().getMonth() + 1);

    let startDateStr = '1970-01-01';
    let endDateStr = '2099-12-31';

    const now = new Date();

    if (timeframe === 'yearly') {
      startDateStr = `${targetYear}-01-01`;
      endDateStr = `${targetYear}-12-31`;
    } else if (timeframe === 'monthly') {
      const padM = String(targetMonth).padStart(2, '0');
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      startDateStr = `${targetYear}-${padM}-01`;
      endDateStr = `${targetYear}-${padM}-${String(lastDay).padStart(2, '0')}`;
    } else if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDateStr = sevenDaysAgo.toISOString().split('T')[0];
      endDateStr = now.toISOString().split('T')[0];
    } else if (timeframe === 'custom' && sinceParam && untilParam) {
      startDateStr = sinceParam;
      endDateStr = untilParam;
    }

    // 2. Fetch User Movies
    let moviesResRows: any[] = [];
    if (mediaParam === 'all' || mediaParam === 'movie') {
      const moviesRes = await db.execute({
        sql: `
          SELECT um.id, um.movie_id, m.title, m.runtime, m.release_date, um.rating, um.review, um.watched_date, um.created_at, um.updated_at
          FROM user_movies um
          JOIN movies m ON um.movie_id = m.id
          WHERE um.user_id = ?
            AND (
              (um.watched_date IS NOT NULL AND um.watched_date >= ? AND um.watched_date <= ?)
              OR (um.watched_date IS NULL AND DATE(um.created_at) >= ? AND DATE(um.created_at) <= ?)
            )
          ORDER BY COALESCE(um.watched_date, DATE(um.created_at)) ASC
        `,
        args: [userId, startDateStr, endDateStr, startDateStr, endDateStr],
      });
      moviesResRows = moviesRes.rows;
    }

    // 3. Fetch User TV Shows
    let tvShowsResRows: any[] = [];
    if (mediaParam === 'all' || mediaParam === 'tv') {
      const tvShowsRes = await db.execute({
        sql: `
          SELECT uts.id, uts.tv_show_id, t.name, t.first_air_date, uts.rating, uts.review, uts.is_favorite, uts.start_date, uts.end_date, uts.watched_where, uts.created_at, uts.updated_at
          FROM user_tv_shows uts
          JOIN tv_shows t ON uts.tv_show_id = t.id
          WHERE uts.user_id = ?
        `,
        args: [userId],
      });
      tvShowsResRows = tvShowsRes.rows;
    }

    // 4. Fetch User Episodes
    let episodesResRows: any[] = [];
    if (mediaParam === 'all' || mediaParam === 'tv') {
      const episodesRes = await db.execute({
        sql: `
          SELECT ue.id, ue.tv_show_id, t.name as tv_show_name, ue.season_number, ue.episode_number,
                 e.runtime as episode_runtime, ue.watched, ue.watched_date, ue.rating, ue.created_at, ue.updated_at
          FROM user_episodes ue
          JOIN tv_shows t ON ue.tv_show_id = t.id
          LEFT JOIN episodes e ON (ue.tv_show_id = e.tv_show_id AND ue.season_number = e.season_number AND ue.episode_number = e.episode_number)
          WHERE ue.user_id = ? AND ue.watched = 1
            AND (
              (ue.watched_date IS NOT NULL AND ue.watched_date >= ? AND ue.watched_date <= ?)
              OR (ue.watched_date IS NULL AND DATE(ue.created_at) >= ? AND DATE(ue.created_at) <= ?)
            )
          ORDER BY COALESCE(ue.watched_date, DATE(ue.created_at)) ASC
        `,
        args: [userId, startDateStr, endDateStr, startDateStr, endDateStr],
      });
      episodesResRows = episodesRes.rows;
    }

    // 5. Aggregate KPIs
    let totalMovieMinutes = 0;
    moviesResRows.forEach((m: any) => {
      totalMovieMinutes += m.runtime ? Number(m.runtime) : 105;
    });

    let totalEpisodeMinutes = 0;
    episodesResRows.forEach((e: any) => {
      totalEpisodeMinutes += e.episode_runtime ? Number(e.episode_runtime) : 45;
    });

    const totalHours = Math.round(((totalMovieMinutes + totalEpisodeMinutes) / 60) * 10) / 10;
    const totalDays = Math.round((totalHours / 24) * 10) / 10;

    // Ratings calculation
    const allRatings: number[] = [];
    moviesResRows.forEach((m: any) => {
      if (m.rating && Number(m.rating) > 0) allRatings.push(Number(m.rating));
    });
    episodesResRows.forEach((e: any) => {
      if (e.rating && Number(e.rating) > 0) allRatings.push(Number(e.rating));
    });
    tvShowsResRows.forEach((t: any) => {
      if (t.rating && Number(t.rating) > 0) allRatings.push(Number(t.rating));
    });

    const avgRating = allRatings.length > 0 
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10 
      : 0;

    // Rating distribution (1 to 10 scale)
    const ratingDistMap: Record<number, number> = {};
    for (let r = 1; r <= 10; r++) ratingDistMap[r] = 0;
    allRatings.forEach((r) => {
      const roundedRating = Math.min(10, Math.max(1, Math.round(r)));
      ratingDistMap[roundedRating] = (ratingDistMap[roundedRating] || 0) + 1;
    });
    const ratingDistribution = Object.keys(ratingDistMap).map((r) => ({
      rating: Number(r),
      count: ratingDistMap[Number(r)],
    }));

    // Platform breakdown ("watched_where")
    const platformMap: Record<string, number> = {};
    tvShowsResRows.forEach((t: any) => {
      if (t.watched_where) {
        try {
          const tags: string[] = JSON.parse(String(t.watched_where));
          tags.forEach((tag) => {
            const cleanTag = tag.trim();
            if (cleanTag) {
              platformMap[cleanTag] = (platformMap[cleanTag] || 0) + 1;
            }
          });
        } catch (err) {
          // Ignore invalid JSON
        }
      }
    });

    const totalPlatformTags = Object.values(platformMap).reduce((a, b) => a + b, 0) || 1;
    const platformBreakdown = Object.entries(platformMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalPlatformTags) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Time Series Aggregation (Daily / Weekly / Monthly)
    const dailyMap: Record<string, { date: string; label: string; hours: number; movies: number; episodes: number }> = {};

    moviesResRows.forEach((m: any) => {
      const rawDate = m.watched_date || (m.created_at ? String(m.created_at).split('T')[0] : '');
      if (rawDate) {
        if (!dailyMap[rawDate]) {
          const dObj = new Date(rawDate);
          const label = isNaN(dObj.getTime()) ? rawDate : dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyMap[rawDate] = { date: rawDate, label, hours: 0, movies: 0, episodes: 0 };
        }
        dailyMap[rawDate].movies += 1;
        dailyMap[rawDate].hours += (m.runtime ? Number(m.runtime) : 105) / 60;
      }
    });

    episodesResRows.forEach((e: any) => {
      const rawDate = e.watched_date || (e.created_at ? String(e.created_at).split('T')[0] : '');
      if (rawDate) {
        if (!dailyMap[rawDate]) {
          const dObj = new Date(rawDate);
          const label = isNaN(dObj.getTime()) ? rawDate : dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyMap[rawDate] = { date: rawDate, label, hours: 0, movies: 0, episodes: 0 };
        }
        dailyMap[rawDate].episodes += 1;
        dailyMap[rawDate].hours += (e.episode_runtime ? Number(e.episode_runtime) : 45) / 60;
      }
    });

    const sortedDates = Object.keys(dailyMap).sort();
    const timeSeries = sortedDates.map((d) => ({
      date: d,
      label: dailyMap[d].label,
      hours: Math.round(dailyMap[d].hours * 10) / 10,
      movies: dailyMap[d].movies,
      episodes: dailyMap[d].episodes,
      total_titles: dailyMap[d].movies + dailyMap[d].episodes,
    }));

    // 7. Streak Calculation & Heatmap (Last 365 Days)
    const activeDatesSet = new Set(sortedDates);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check streak backward from today
    const checkDate = new Date();
    while (true) {
      const iso = checkDate.toISOString().split('T')[0];
      if (activeDatesSet.has(iso)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today hasn't been logged yet, check yesterday before stopping
        if (currentStreak === 0 && iso === new Date().toISOString().split('T')[0]) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    // Longest streak
    const allUniqueDates = Array.from(activeDatesSet).sort();
    for (let i = 0; i < allUniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(allUniqueDates[i - 1]);
        const curr = new Date(allUniqueDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Daily Activity Heatmap (Last 365 days)
    const heatmap: Array<{ date: string; count: number; level: number }> = [];
    const endDateHeatmap = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(endDateHeatmap.getTime() - i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      const dayData = dailyMap[iso];
      const count = dayData ? dayData.movies + dayData.episodes : 0;
      let level = 0;
      if (count > 0 && count <= 2) level = 1;
      else if (count > 2 && count <= 4) level = 2;
      else if (count > 4 && count <= 6) level = 3;
      else if (count > 6) level = 4;

      heatmap.push({ date: iso, count, level });
    }

    // 8. Available Years List (for Filter Dropdown)
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());

    moviesResRows.forEach((m) => {
      const d = m.watched_date || m.created_at;
      if (d) yearsSet.add(new Date(d).getFullYear());
    });
    episodesResRows.forEach((e) => {
      const d = e.watched_date || e.created_at;
      if (d) yearsSet.add(new Date(d).getFullYear());
    });

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({
      status: 'success',
      user: {
        id: Number(targetUser.id),
        username: String(targetUser.username),
        display_name: targetUser.display_name ? String(targetUser.display_name) : String(targetUser.username),
        avatar_url: targetUser.avatar_url ? String(targetUser.avatar_url) : null,
      },
      timeframe: {
        type: timeframe,
        year: targetYear,
        month: targetMonth,
        start_date: startDateStr,
        end_date: endDateStr,
      },
      available_years: availableYears,
      kpis: {
        total_hours: totalHours,
        total_days: totalDays,
        movies_count: moviesResRows.length,
        shows_count: tvShowsResRows.length,
        episodes_count: episodesResRows.length,
        total_reviews: moviesResRows.filter(m => m.review).length + tvShowsResRows.filter(t => t.review).length,
        average_rating: avgRating,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
      time_series: timeSeries,
      rating_distribution: ratingDistribution,
      platform_breakdown: platformBreakdown,
      activity_heatmap: heatmap,
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
