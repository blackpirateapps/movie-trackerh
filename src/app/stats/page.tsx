'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  BarChart3, Clock, Film, Tv, Star, Flame, Calendar, Filter, Sparkles, RefreshCw, ChevronDown, Layers, ArrowUpRight, TrendingUp, PieChart as PieChartIcon, Award, PlayCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';

interface StatsResponse {
  status: string;
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
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PLATFORM_COLORS = [
  '#00FF66', '#00CC52', '#33FF88', '#66FFAA', '#99FFCC',
  '#00B347', '#008033', '#1E1E1E', '#333333'
];

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
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, [timeframe, selectedYear, selectedMonth, sinceDate, untilDate, mediaType]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      let query = `/api/user/stats?timeframe=${timeframe}&media=${mediaType}`;
      if (timeframe === 'yearly') {
        query += `&year=${selectedYear}`;
      } else if (timeframe === 'monthly') {
        query += `&year=${selectedYear}&month=${selectedMonth}`;
      } else if (timeframe === 'custom' && sinceDate && untilDate) {
        query += `&since=${sinceDate}&until=${untilDate}`;
      }

      const res = await api.get<StatsResponse>(query);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics statistics');
    } finally {
      setLoading(false);
    }
  };

  // Custom Tooltip for Recharts Time Series Area Chart
  const CustomTimeSeriesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#121212] border border-[#00FF66] p-3 rounded text-xs font-mono shadow-xl space-y-1">
          <div className="font-bold text-[#00FF66] border-b border-[#333333] pb-1 mb-1">
            {d.label} ({d.date})
          </div>
          <div className="flex justify-between gap-4 text-[#EDEDED]">
            <span>Watch Time:</span>
            <strong className="text-[#00FF66]">{d.hours} hrs</strong>
          </div>
          <div className="flex justify-between gap-4 text-[#A0A0A0]">
            <span>Movies Logged:</span>
            <span>{d.movies}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#A0A0A0]">
            <span>Episodes Logged:</span>
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
      return (
        <div className="bg-[#121212] border border-[#333333] p-2.5 rounded text-xs font-mono">
          <span className="text-[#00FF66] font-bold">★ {d.rating} / 10 Rating:</span>
          <span className="ml-2 text-[#EDEDED] font-bold">{d.count} titles</span>
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
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
              Flagship Analytics & Stats
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Deep insights into your watching velocity, rating distributions, platform share, and activity streaks.
            </p>
          </div>
        </div>

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
          <button onClick={fetchStats} className="btn btn-secondary text-xs py-1 px-3 inline-block">Retry</button>
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

          {/* GRAPH 1: WATCH VOLUME & VELOCITY AREA CHART */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  WATCH TIME & VELOCITY OVER TIME
                </h2>
                <p className="text-xs text-[#A0A0A0]">Daily and period watch hours accumulation</p>
              </div>
            </div>

            {data.time_series.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A0A0A0] bg-[#121212] border border-[#333333] rounded">
                No watching activity logged for the selected period.
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.time_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="watchTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF66" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#A0A0A0"
                      tick={{ fill: '#A0A0A0', fontSize: 10 }}
                      tickLine={{ stroke: '#333333' }}
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
                      stroke="#00FF66"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#watchTimeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* GRID 2: RATING DISTRIBUTION & PLATFORM SHARE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GRAPH 2: RATING DISTRIBUTION HISTOGRAM */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                <Star className="w-4 h-4 text-[#00FF66]" />
                RATING DISTRIBUTION (1–10 SCALE)
              </h2>

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
                    <Bar dataKey="count" fill="#00FF66" radius={[4, 4, 0, 0]}>
                      {data.rating_distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.count === Math.max(...data.rating_distribution.map(d => d.count)) && entry.count > 0 ? '#00FF66' : '#2A2A2A'}
                          stroke={entry.count > 0 ? '#00FF66' : '#333333'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAPH 3: PLATFORM SHARE (WATCHED WHERE) */}
            <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#00FF66]" />
                PLATFORM BREAKDOWN ("WATCHED WHERE")
              </h2>

              {data.platform_breakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#A0A0A0] bg-[#121212] border border-[#333333] rounded">
                  No platform tags logged yet.
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
                          <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#121212', borderColor: '#333333', color: '#EDEDED', fontSize: 12 }}
                      />
                      <Legend
                        formatter={(value) => <span className="text-xs text-[#A0A0A0] font-medium">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* GRAPH 4: DAILY ACTIVITY HEATMAP (GITHUB STYLE) */}
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

              <div className="flex items-center justify-between text-[10px] text-[#A0A0A0] pt-3 font-mono">
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
