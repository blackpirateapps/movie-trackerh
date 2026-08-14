'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  BarChart3, Clock, Film, Tv, Star, Flame, Calendar, Filter, Sparkles, RefreshCw,
  ChevronDown, Layers, ArrowUpRight, TrendingUp, PieChart as PieChartIcon, Award,
  PlayCircle, User as UserIcon, Heart, Compass
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

interface StatsResponse {
  status: string;
  cached?: boolean;
  is_own_stats?: boolean;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  timeframe: {
    type: string;
    year: number;
    month: number;
    start_date: string;
    end_date: string;
  };
  available_years: number[];
  kpis: {
    total_hours: number;
    total_days: number;
    movies_count: number;
    shows_count: number;
    episodes_count: number;
    total_reviews: number;
    average_rating: number;
    current_streak: number;
    longest_streak: number;
  };
  time_series: Array<{
    date: string;
    label: string;
    hours: number;
    movies: number;
    episodes: number;
    total_titles: number;
  }>;
  rating_distribution: Array<{
    rating: number;
    count: number;
  }>;
  platform_breakdown: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  activity_heatmap: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  hourly_habit_matrix?: Array<{
    day: number;
    hour: number;
    count: number;
    level: number;
  }>;
  top_genres?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  top_creators?: Array<{
    name: string;
    role: string;
    count: number;
    avatar_url: string | null;
  }>;
  hall_of_fame?: Array<{
    id: number;
    title: string;
    type: 'movie' | 'tv';
    poster_path: string | null;
    rating: number;
    vote_average?: number;
    release_date?: string;
  }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Platform Color Palette
const getPlatformColor = (platformName: string, index: number): string => {
  const p = platformName.toLowerCase();
  if (p.includes('netflix')) return '#E50914';
  if (p.includes('hotstar') || p.includes('disney')) return '#0F84FA';
  if (p.includes('prime') || p.includes('amazon')) return '#00A8E1';
  if (p.includes('pirat') || p.includes('torrent')) return '#00FF66';
  if (p.includes('apple')) return '#E2E8F0';
  if (p.includes('hbo') || p.includes('max')) return '#9945FF';
  if (p.includes('hulu')) return '#1CE783';
  if (p.includes('youtube')) return '#FF0000';
  if (p.includes('theater') || p.includes('cinema')) return '#FFB800';

  const fallbacks = ['#A855F7', '#38BDF8', '#F43F5E', '#10B981', '#F59E0B', '#EC4899'];
  return fallbacks[index % fallbacks.length];
};

// Rating Bar Color Gradient (1-3 Red, 4-6 Amber, 7-10 Green)
const getRatingColor = (rating: number): string => {
  if (rating <= 3) return '#FF4D4D';
  if (rating <= 6) return '#FFB800';
  return '#00FF66';
};

export default function StatsPage() {
  const { user: currentUser } = useAuth();

  // Filters State
  const [timeframe, setTimeframe] = useState<'all' | 'yearly' | 'monthly' | 'weekly' | 'custom'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [sinceDate, setSinceDate] = useState<string>('');
  const [untilDate, setUntilDate] = useState<string>('');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');

  // Analytics Data State
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats(false);
  }, [timeframe, selectedYear, selectedMonth, sinceDate, untilDate, mediaType]);

  const fetchStats = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      let query = `/api/user/stats?timeframe=${timeframe}&media=${mediaType}`;
      if (timeframe === 'yearly') {
        query += `&year=${selectedYear}`;
      } else if (timeframe === 'monthly') {
        query += `&year=${selectedYear}&month=${selectedMonth}`;
      } else if (timeframe === 'custom' && sinceDate && untilDate) {
        query += `&since=${sinceDate}&until=${untilDate}`;
      }

      if (forceRefresh) {
        query += `&refresh=true`;
      }

      const res = await api.get<StatsResponse>(query);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Find Mode (Most Frequent) Rating
  const modeRating = useMemo(() => {
    if (!data?.rating_distribution?.length) return 0;
    let maxCount = -1;
    let modeVal = 0;
    data.rating_distribution.forEach(d => {
      if (d.count > maxCount && d.count > 0) {
        maxCount = d.count;
        modeVal = d.rating;
      }
    });
    return modeVal;
  }, [data]);

  // Cleaned Time Series with Dual-Line Breakdown
  const formattedTimeSeries = useMemo(() => {
    if (!data?.time_series?.length) return [];
    return data.time_series.map(d => ({
      ...d,
      movie_hours: Math.round((d.movies * 1.75) * 10) / 10,
      tv_hours: Math.round((d.episodes * 0.75) * 10) / 10
    }));
  }, [data]);

  // Custom Tooltip for Velocity Area & Dual-Line Chart
  const CustomTimeSeriesTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#121212] border border-[#00FF66] p-3 rounded text-xs font-mono shadow-xl space-y-1">
          <div className="font-bold text-[#00FF66] border-b border-[#333333] pb-1 mb-1 flex justify-between gap-2">
            <span>{d.label}</span>
            <span className="text-[#A0A0A0]">{d.date}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#EDEDED]">
            <span>Total Watch Time:</span>
            <strong className="text-[#00FF66]">{d.hours} hrs</strong>
          </div>
          <div className="flex justify-between gap-4 text-[#00FF66]">
            <span>🎬 Films Logged:</span>
            <span>{d.movies}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#00E5FF]">
            <span>📺 Episodes Logged:</span>
            <span>{d.episodes}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Rating Distribution Histogram
  const CustomRatingTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isMode = d.rating === modeRating;
      return (
        <div className="bg-[#121212] border border-[#333333] p-2.5 rounded text-xs font-mono shadow-lg space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span style={{ color: getRatingColor(d.rating) }} className="font-bold">
              ★ {d.rating} / 10 Rating
            </span>
            {isMode && (
              <span className="text-[9px] bg-[#00FF66]/20 text-[#00FF66] px-1.5 py-0.5 rounded font-bold uppercase">
                Most Frequent
              </span>
            )}
          </div>
          <div className="text-[#EDEDED] font-bold">
            {d.count} {d.count === 1 ? 'title' : 'titles'} logged
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      
      {/* Header Banner */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] rounded flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#EDEDED]">
                Flagship Analytics & Stats
              </h1>
              {data?.cached && (
                <span className="bg-[#121212] border border-[#333333] text-[10px] px-2 py-0.5 rounded font-mono text-[#A0A0A0]">
                  Cached (24h)
                </span>
              )}
            </div>
            <p className="text-xs text-[#A0A0A0]">
              Deep insights into viewing velocity, rating distributions, platform breakdown, watching habits, and Hall of Fame.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.is_own_stats && (
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
              title="Force clear DB cache and recalculate analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00FF66] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Analytics'}</span>
            </button>
          )}

          {currentUser && (
            <Link
              href={`/profile/${currentUser.username}`}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>My Profile</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sticky Timeframe Filter Bar */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-16 z-30 shadow-md">
        
        {/* Preset Timeframe Toggles */}
        <div className="flex items-center gap-1.5 bg-[#121212] p-1 border border-[#333333] rounded overflow-x-auto w-full lg:w-auto scrollbar-none">
          <button
            onClick={() => setTimeframe('all')}
            className={`btn text-xs py-1.5 px-3 font-bold transition-colors whitespace-nowrap ${
              timeframe === 'all' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('yearly')}
            className={`btn text-xs py-1.5 px-3 font-bold transition-colors whitespace-nowrap ${
              timeframe === 'yearly' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`btn text-xs py-1.5 px-3 font-bold transition-colors whitespace-nowrap ${
              timeframe === 'monthly' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`btn text-xs py-1.5 px-3 font-bold transition-colors whitespace-nowrap ${
              timeframe === 'weekly' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('custom')}
            className={`btn text-xs py-1.5 px-3 font-bold transition-colors whitespace-nowrap ${
              timeframe === 'custom' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Contextual Dropdowns & Date Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Year Picker */}
          {(timeframe === 'yearly' || timeframe === 'monthly') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-input text-xs py-1.5 px-3 bg-[#121212] border-[#333333] font-bold"
            >
              {(data?.available_years || [new Date().getFullYear()]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {/* Month Picker */}
          {timeframe === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-input text-xs py-1.5 px-3 bg-[#121212] border-[#333333] font-bold"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          )}

          {/* Custom Date Range Pickers */}
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                className="form-input text-xs py-1 px-2 bg-[#121212] border-[#333333]"
              />
              <span className="text-xs text-[#A0A0A0]">to</span>
              <input
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                className="form-input text-xs py-1 px-2 bg-[#121212] border-[#333333]"
              />
            </div>
          )}

          {/* Media Filter Toggle */}
          <div className="flex items-center gap-1 bg-[#121212] p-1 border border-[#333333] rounded">
            <button
              onClick={() => setMediaType('all')}
              className={`btn text-[10px] py-1 px-2 font-bold ${mediaType === 'all' ? 'bg-[#00FF66] text-[#121212]' : 'text-[#A0A0A0]'}`}
            >
              All
            </button>
            <button
              onClick={() => setMediaType('movie')}
              className={`btn text-[10px] py-1 px-2 font-bold ${mediaType === 'movie' ? 'bg-[#00FF66] text-[#121212]' : 'text-[#A0A0A0]'}`}
            >
              Films
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={`btn text-[10px] py-1 px-2 font-bold ${mediaType === 'tv' ? 'bg-[#00FF66] text-[#121212]' : 'text-[#A0A0A0]'}`}
            >
              TV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-[#1E1E1E] border border-[#333333] rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto" />
          <p className="font-bold text-sm text-[#EDEDED]">Calculating Watching Statistics...</p>
        </div>
      ) : error ? (
        <div className="card bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 p-6 text-center text-xs text-[#ff4d4d] space-y-2">
          <p className="font-bold">{error}</p>
          <button onClick={() => fetchStats(true)} className="btn btn-secondary text-xs py-1 px-3 inline-block">Retry</button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* KPI SUMMARY CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* KPI 1: Watch Time */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-4 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Time Spent</span>
                <Clock className="w-4 h-4 text-[#00FF66]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#EDEDED] font-mono">
                {data.kpis.total_hours} <span className="text-xs text-[#00FF66]">hrs</span>
              </div>
              <p className="text-[10px] text-[#A0A0A0]">
                Equivalent to <strong>{data.kpis.total_days} days</strong> non-stop
              </p>
            </div>

            {/* KPI 2: Media Watched */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-4 space-y-1">
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Media</span>
                <Film className="w-4 h-4 text-[#00FF66]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#EDEDED] font-mono">
                {data.kpis.movies_count + data.kpis.episodes_count}
              </div>
              <p className="text-[10px] text-[#A0A0A0]">
                {data.kpis.movies_count} films, {data.kpis.episodes_count} episodes
              </p>
            </div>

            {/* KPI 3: Average Rating */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-4 space-y-1">
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Avg Rating</span>
                <Star className="w-4 h-4 text-[#00FF66] fill-[#00FF66]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#00FF66] font-mono">
                {data.kpis.average_rating > 0 ? `${data.kpis.average_rating} / 10` : 'N/A'}
              </div>
              <p className="text-[10px] text-[#A0A0A0]">
                Across all logged titles
              </p>
            </div>

            {/* KPI 4: Streaks */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-4 space-y-1">
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span className="text-[10px] font-bold uppercase tracking-widest">Watch Streak</span>
                <Flame className="w-4 h-4 text-[#00FF66] fill-[#00FF66]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#EDEDED] font-mono">
                {data.kpis.current_streak} <span className="text-xs text-[#00FF66]">days</span>
              </div>
              <p className="text-[10px] text-[#A0A0A0]">
                Longest streak: <strong>{data.kpis.longest_streak} days</strong>
              </p>
            </div>
          </div>

          {/* GRAPH 1: WATCH VOLUME & DUAL-LINE VELOCITY CHART */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  WATCH TIME & VELOCITY OVER TIME
                </h2>
                <p className="text-xs text-[#A0A0A0]">Dynamic timeline comparing total watch hours, films, and TV episodes</p>
              </div>

              {/* Chart Legend Labels */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#00FF66]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]" />
                  Total Watch Time
                </span>
                <span className="flex items-center gap-1.5 text-[#00E5FF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
                  TV Episodes
                </span>
              </div>
            </div>

            {formattedTimeSeries.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A0A0A0] bg-[#121212] border border-[#333333] rounded">
                No watching activity logged for the selected period.
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="watchTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF66" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#A0A0A0"
                      tick={{ fill: '#A0A0A0', fontSize: 10 }}
                      tickLine={{ stroke: '#333333' }}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#A0A0A0"
                      tick={{ fill: '#A0A0A0', fontSize: 10 }}
                      tickLine={{ stroke: '#333333' }}
                    />
                    <Tooltip content={<CustomTimeSeriesTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      name="Total Hours"
                      stroke="#00FF66"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#watchTimeGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="tv_hours"
                      name="TV Episodes"
                      stroke="#00E5FF"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* GRID 2: RATING DISTRIBUTION & PLATFORM BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GRAPH 2: RATING DISTRIBUTION HISTOGRAM (SPECTRUM GRADIENT + MODE BADGE) */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#00FF66]" />
                    RATING DISTRIBUTION (1–10 SCALE)
                  </h2>
                  <p className="text-[11px] text-[#A0A0A0]">Visual rating spectrum across all logged titles</p>
                </div>
                {modeRating > 0 && (
                  <span className="bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 text-[10px] font-bold px-2 py-0.5 rounded">
                    Mode: ★ {modeRating}/10
                  </span>
                )}
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.rating_distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="rating"
                      stroke="#A0A0A0"
                      tick={{ fill: '#EDEDED', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis
                      stroke="#A0A0A0"
                      tick={{ fill: '#A0A0A0', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomRatingTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.rating_distribution.map((entry, index) => {
                        const isMode = entry.rating === modeRating;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isMode ? '#00FF66' : getRatingColor(entry.rating)}
                            fillOpacity={isMode ? 1.0 : 0.75}
                            stroke={getRatingColor(entry.rating)}
                            strokeWidth={isMode ? 2 : 1}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#A0A0A0] pt-1 font-mono border-t border-[#333333]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF4D4D]" /> 1-3 Poor</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFB800]" /> 4-6 Average</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00FF66]" /> 7-10 Excellent</span>
              </div>
            </div>

            {/* GRAPH 3: PLATFORM BREAKDOWN (COLOR-CODED DONUT CHART) */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#00FF66]" />
                PLATFORM BREAKDOWN ("WATCHED WHERE")
              </h2>

              {data.platform_breakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#A0A0A0] bg-[#121212] border border-[#333333] rounded">
                  No platform tags logged yet. Add platform tags on your TV shows!
                </div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.platform_breakdown}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {data.platform_breakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getPlatformColor(entry.name, index)}
                            stroke="#1E1E1E" 
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121212', borderColor: '#333333', color: '#EDEDED', fontSize: 12, borderRadius: 4 }}
                        formatter={(value: any, name: any) => [`${value} titles`, name]}
                      />
                      <Legend
                        formatter={(value) => <span className="text-xs text-[#EDEDED] font-bold">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* WIDGET GRID 3: TOP GENRES & MOST WATCHED CREATORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WIDGET 1: TOP GENRES (HORIZONTAL PROGRESS BARS) */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00FF66]" />
                TOP GENRES & CATEGORIES
              </h2>

              {data.top_genres && data.top_genres.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {data.top_genres.slice(0, 5).map((genre, idx) => (
                    <div key={genre.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#EDEDED] flex items-center gap-2">
                          <span className="text-[10px] text-[#00FF66] font-mono">#{idx + 1}</span>
                          {genre.name}
                        </span>
                        <span className="text-[#A0A0A0] font-mono">{genre.count} titles ({genre.percentage}%)</span>
                      </div>
                      <div className="w-full bg-[#121212] border border-[#333333] rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#00FF66] h-full rounded-full transition-all duration-500"
                          style={{ width: `${genre.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A0A0A0] italic">No genre data available.</p>
              )}
            </div>

            {/* WIDGET 2: MOST WATCHED CREATORS & STARS (CREATOR LIST) */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00FF66]" />
                MOST WATCHED CREATORS & STARS
              </h2>

              {data.top_creators && data.top_creators.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {data.top_creators.map((creator) => (
                    <div key={creator.name} className="flex items-center justify-between p-2 bg-[#121212] border border-[#333333] rounded">
                      <div className="flex items-center gap-3">
                        <img 
                          src={creator.avatar_url || 'https://via.placeholder.com/40'} 
                          alt={creator.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#333333] shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#EDEDED]">{creator.name}</h4>
                          <span className="text-[10px] text-[#A0A0A0] font-mono">{creator.role}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF66] bg-[#1E1E1E] border border-[#333333] px-2 py-0.5 rounded font-mono">
                        {creator.count} titles
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A0A0A0] italic">No creator stats logged yet.</p>
              )}
            </div>

          </div>

          {/* WIDGET 3: "HALL OF FAME" HIGHEST RATED VISUAL HIGHLIGHTS (POSTER GRID) */}
          {data.hall_of_fame && data.hall_of_fame.length > 0 && (
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00FF66]" />
                  HALL OF FAME (HIGHEST RATED RELEASES)
                </h2>
                <span className="text-[10px] text-[#A0A0A0] font-mono">Top Rated Favorites</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {data.hall_of_fame.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={`/${item.type}/${item.id}`}>
                    <div className="group cursor-pointer space-y-1">
                      <div className="relative aspect-[2/3] overflow-hidden rounded border border-[#333333] bg-[#121212]">
                        {item.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2 text-center text-[#A0A0A0] text-[10px]">
                            {item.title}
                          </div>
                        )}
                        <div className="absolute top-1 right-1 bg-[#121212]/90 border border-[#333333] text-[#00FF66] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-[#00FF66]" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                      <h4 className="text-[10px] font-bold text-[#EDEDED] truncate group-hover:text-[#00FF66] transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* WIDGET 4: TIME OF DAY & WATCHING HABITS (7x24 HEATMAP MATRIX) */}
          {data.hourly_habit_matrix && data.hourly_habit_matrix.length > 0 && (
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    TIME OF DAY & WATCHING HABITS (7x24 MATRIX)
                  </h2>
                  <p className="text-xs text-[#A0A0A0]">Breakdown of viewing activity by Day of Week (Y-Axis) vs Hour of Day (X-Axis)</p>
                </div>
              </div>

              <div className="bg-[#121212] p-4 border border-[#333333] rounded overflow-x-auto">
                <div className="min-w-[650px] space-y-1.5">
                  {/* Hours Header */}
                  <div className="flex items-center gap-1 pl-10 text-[9px] font-mono text-[#A0A0A0]">
                    {Array.from({ length: 24 }).map((_, h) => (
                      <span key={h} className="w-5 text-center">{h.toString().padStart(2, '0')}</span>
                    ))}
                  </div>

                  {/* 7 Days Rows */}
                  {DAYS_OF_WEEK.map((dayName, dIdx) => (
                    <div key={dayName} className="flex items-center gap-1">
                      <span className="w-9 text-[10px] font-bold text-[#A0A0A0]">{dayName}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 24 }).map((_, hIdx) => {
                          const cell = data.hourly_habit_matrix?.find(m => m.day === dIdx && m.hour === hIdx);
                          const count = cell ? cell.count : 0;
                          let bgClass = 'bg-[#1E1E1E] border-[#333333]';
                          if (cell?.level === 1) bgClass = 'bg-[#00FF66]/25 border-[#00FF66]/40';
                          else if (cell?.level === 2) bgClass = 'bg-[#00FF66]/55 border-[#00FF66]/70';
                          else if (cell?.level === 3) bgClass = 'bg-[#00FF66]/85 border-[#00FF66]';
                          else if (cell?.level === 4) bgClass = 'bg-[#00FF66] border-[#00FF66]';

                          return (
                            <div
                              key={hIdx}
                              title={`${dayName} at ${hIdx}:00 - ${count} ${count === 1 ? 'item' : 'items'} logged`}
                              className={`w-5 h-5 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${bgClass}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#A0A0A0] pt-3 font-mono border-t border-[#333333] mt-3">
                  <span>Inactive hour</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-xs bg-[#1E1E1E] border border-[#333333]" />
                    <span className="w-3 h-3 rounded-xs bg-[#00FF66]/25 border border-[#00FF66]/40" />
                    <span className="w-3 h-3 rounded-xs bg-[#00FF66]/55 border border-[#00FF66]/70" />
                    <span className="w-3 h-3 rounded-xs bg-[#00FF66]" />
                  </div>
                  <span>Peak watching hour</span>
                </div>
              </div>
            </div>
          )}

          {/* GRAPH 5: DAILY ACTIVITY HEATMAP (GITHUB STYLE 365-DAY PACING) */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                DAILY ACTIVITY MATRIX (365-DAY PACING)
              </h2>
              <span className="text-[10px] text-[#A0A0A0] font-mono">
                {data.activity_heatmap.filter(h => h.count > 0).length} active days in last year
              </span>
            </div>

            <div className="bg-[#121212] p-4 border border-[#333333] rounded overflow-x-auto">
              <div className="flex gap-1.5 flex-wrap min-w-[700px]">
                {data.activity_heatmap.map((h, i) => {
                  let bgClass = 'bg-[#1E1E1E] border-[#333333]';
                  if (h.level === 1) bgClass = 'bg-[#00FF66]/20 border-[#00FF66]/40';
                  else if (h.level === 2) bgClass = 'bg-[#00FF66]/50 border-[#00FF66]/60';
                  else if (h.level === 3) bgClass = 'bg-[#00FF66]/80 border-[#00FF66]';
                  else if (h.level === 4) bgClass = 'bg-[#00FF66] border-[#00FF66]';

                  return (
                    <div
                      key={i}
                      title={`${h.date}: ${h.count} titles logged`}
                      className={`w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 ${bgClass}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#A0A0A0] pt-3 font-mono border-t border-[#333333] mt-3">
                <span>Less active</span>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-[#1E1E1E] border border-[#333333]" />
                  <span className="w-3 h-3 rounded-xs bg-[#00FF66]/20 border border-[#00FF66]/40" />
                  <span className="w-3 h-3 rounded-xs bg-[#00FF66]/50 border border-[#00FF66]/60" />
                  <span className="w-3 h-3 rounded-xs bg-[#00FF66]" />
                </div>
                <span>More active</span>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
