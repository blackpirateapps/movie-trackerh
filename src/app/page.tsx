'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MovieCard from '@/components/MovieCard';
import TVShowCard from '@/components/TVShowCard';
import StarRating from '@/components/StarRating';
import { Movie, TVShow } from '@/types';
import { 
  Search, 
  Flame, 
  ArrowRight, 
  Film, 
  Tv, 
  Check, 
  Star, 
  Edit3, 
  Play, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Plus
} from 'lucide-react';

interface NextEpisode {
  season_number: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
}

interface CurrentlyWatchingData {
  show: {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    number_of_seasons: number;
    number_of_episodes: number;
    vote_average: number;
  };
  progress: {
    watchedEpisodesCount: number;
    totalEpisodesCount: number;
    lastWatched: {
      season_number: number;
      episode_number: number;
      watched_date: string;
    } | null;
  };
  nextEpisode: NextEpisode | null;
  isCompleted: boolean;
  otherActiveShows: Array<{
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  }>;
}

interface WatchedMovieData {
  id: number;
  movieId: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  vote_average: number | null;
  rating: number | null;
  review: string | null;
  watched_date: string | null;
}

interface DashboardResponse {
  currentlyWatching: CurrentlyWatchingData | null;
  lastWatchedMovies: WatchedMovieData[];
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // Search State
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [query, setQuery] = useState<string>('');
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [tvResults, setTvResults] = useState<TVShow[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Trending State
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<TVShow[]>([]);
  const [trendingTab, setTrendingTab] = useState<'movie' | 'tv'>('movie');

  // Logged-in Dashboard State
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // Quick Actions State
  const [markingEp, setMarkingEp] = useState<boolean>(false);
  const [quickWatchSuccess, setQuickWatchSuccess] = useState<string | null>(null);

  // Movie Quick Rate/Review State
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [movieRating, setMovieRating] = useState<number>(0);
  const [movieReview, setMovieReview] = useState<string>('');
  const [savingMovie, setSavingMovie] = useState<boolean>(false);

  // Fetch Dashboard Data for Logged-In User
  const fetchDashboard = useCallback(async (tvShowId?: number) => {
    if (!user) return;
    setDashboardLoading(true);
    try {
      const url = tvShowId ? `/api/user/dashboard?tvShowId=${tvShowId}` : '/api/user/dashboard';
      const { data } = await api.get<DashboardResponse>(url);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setDashboardLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboard(selectedShowId || undefined);
    }
  }, [user, selectedShowId, fetchDashboard]);

  // Load Trending Items
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          api.get<Movie[]>('/api/movies?query=popular'),
          api.get<TVShow[]>('/api/tv?query=popular')
        ]);
        if (Array.isArray(movieRes.data)) {
          setTrendingMovies(movieRes.data.slice(0, 12));
        }
        if (Array.isArray(tvRes.data)) {
          setTrendingTv(tvRes.data.slice(0, 12));
        }
      } catch (error) {
        console.error('Failed to load trending items', error);
      }
    };
    loadTrending();
  }, []);

  // Handle Search
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearchLoading(true);
    try {
      if (searchType === 'movie') {
        const { data } = await api.get<Movie[]>(`/api/movies?query=${encodeURIComponent(query)}`);
        setMovieResults(Array.isArray(data) ? data : []);
        setTvResults([]);
      } else {
        const { data } = await api.get<TVShow[]>(`/api/tv?query=${encodeURIComponent(query)}`);
        setTvResults(Array.isArray(data) ? data : []);
        setMovieResults([]);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Quick Action: Mark Next Episode as Watched
  const handleMarkNextEpisode = async () => {
    if (!dashboardData?.currentlyWatching?.nextEpisode) return;
    const showId = dashboardData.currentlyWatching.show.id;
    const { season_number, episode_number } = dashboardData.currentlyWatching.nextEpisode;
    
    setMarkingEp(true);
    try {
      await api.post('/api/tv', {
        action: 'episode_watched',
        tvShowId: showId,
        seasonNumber: season_number,
        episodeNumber: episode_number,
        watched: true,
        watchedDate: new Date().toISOString().split('T')[0]
      });

      setQuickWatchSuccess(`Marked Season ${season_number} Episode ${episode_number} as watched!`);
      setTimeout(() => setQuickWatchSuccess(null), 4000);
      
      // Re-fetch dashboard data to calculate next episode
      await fetchDashboard(selectedShowId || undefined);
    } catch (error) {
      console.error('Failed to mark episode as watched', error);
    } finally {
      setMarkingEp(false);
    }
  };

  // Open Movie Quick Rate & Review Form
  const handleOpenMovieForm = (movie: WatchedMovieData) => {
    setEditingMovieId(movie.movieId);
    setMovieRating(movie.rating || 0);
    setMovieReview(movie.review || '');
  };

  // Quick Action: Save Movie Rating & Review
  const handleSaveMovieRateReview = async (movieId: number, watchedDate: string | null) => {
    setSavingMovie(true);
    try {
      await api.post('/api/movies', {
        movieId,
        rating: movieRating || null,
        review: movieReview.trim() || null,
        watchedDate: watchedDate || new Date().toISOString().split('T')[0]
      });

      // Update local state immediately
      setDashboardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          lastWatchedMovies: prev.lastWatchedMovies.map(m => 
            m.movieId === movieId 
              ? { ...m, rating: movieRating || null, review: movieReview.trim() || null }
              : m
          )
        };
      });
      
      setEditingMovieId(null);
    } catch (error) {
      console.error('Failed to save movie review', error);
    } finally {
      setSavingMovie(false);
    }
  };

  const currentlyWatching = dashboardData?.currentlyWatching;
  const lastWatchedMovies = dashboardData?.lastWatchedMovies || [];

  return (
    <div className="min-h-screen pb-16 bg-[#121212] text-[#EDEDED]">
      {/* Hero & Quick Search Header */}
      <section className="relative py-8 md:py-12 px-4 border-b border-[#333333] bg-[#1E1E1E]/50">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          
          {user ? (
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-[#00FF66] tracking-widest block">
                WELCOME BACK, {user.display_name || user.username}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-[#EDEDED] tracking-tight">
                Your <span className="text-[#00FF66]">Media Tracking</span> Hub
              </h1>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-[#00FF66] tracking-widest block">
                DATA-DENSE MEDIA TRACKING SYSTEM
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-[#EDEDED] tracking-tight leading-tight">
                Track Movies & <span className="text-[#00FF66]">TV Shows</span>
              </h1>
              <p className="text-sm text-[#A0A0A0] max-w-xl mx-auto">
                Minimalist media tracker. Rate films, log seasons, track individual episodes, and analyze watch history.
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-1">
            <div className="card-surface p-3 sm:p-4 border border-[#333333]">
              {/* Type Switcher */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSearchType('movie')}
                  className={`btn text-xs py-1 px-3 ${
                    searchType === 'movie' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Movies</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchType('tv')}
                  className={`btn text-xs py-1 px-3 ${
                    searchType === 'tv' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV Shows</span>
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === 'movie' ? "Search movies..." : "Search TV shows..."}
                    className="form-input text-sm py-2 pr-4 pl-10"
                  />
                  <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <button 
                  type="submit" 
                  disabled={searchLoading}
                  className="btn btn-primary px-5 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  {searchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                  ) : (
                    <>
                      <span>SEARCH</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Search Results Grid */}
      {(movieResults.length > 0 || tvResults.length > 0) && (
        <section className="py-8 px-4 max-w-6xl mx-auto">
          <h2 className="text-lg font-bold mb-4 text-[#EDEDED] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#00FF66]" />
            Search Results ({movieResults.length || tvResults.length})
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {movieResults.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
            {tvResults.map(show => (
              <Link key={show.id} href={`/tv/${show.id}`}>
                <TVShowCard show={show} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* LOGGED IN USER DASHBOARD SECTIONS */}
      {user && (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
          
          {/* SECTION 1: CURRENTLY WATCHING TV SHOW */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-2">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#00FF66]" />
                <h2 className="text-base font-bold text-[#EDEDED] uppercase tracking-wider text-xs">
                  Currently Watching TV Show
                </h2>
              </div>
              {currentlyWatching?.show && (
                <Link 
                  href={`/tv/${currentlyWatching.show.id}`}
                  className="text-xs text-[#00FF66] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View Show Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {dashboardLoading && !currentlyWatching ? (
              <div className="card p-8 text-center text-[#A0A0A0] animate-pulse">
                Loading currently watching show...
              </div>
            ) : currentlyWatching ? (
              <div className="space-y-4">
                {/* Main Currently Watching Showcase Card */}
                <div className="relative rounded-lg border border-[#333333] bg-[#1E1E1E] overflow-hidden">
                  
                  {/* Backdrop Background Image Overlay */}
                  {currentlyWatching.show.backdrop_path && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xs"
                      style={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/w1280${currentlyWatching.show.backdrop_path})`
                      }}
                    />
                  )}

                  <div className="relative z-10 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Left Column: Show Poster & Info */}
                    <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-center sm:items-start gap-4">
                      <Link href={`/tv/${currentlyWatching.show.id}`} className="shrink-0 group">
                        <div className="w-28 sm:w-36 md:w-44 aspect-[2/3] rounded border border-[#333333] overflow-hidden bg-[#2A2A2A] relative shadow-md">
                          {currentlyWatching.show.poster_path ? (
                            <img 
                              src={`https://image.tmdb.org/t/p/w300${currentlyWatching.show.poster_path}`}
                              alt={currentlyWatching.show.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-xs">
                              No Poster
                            </div>
                          )}
                          {currentlyWatching.show.vote_average != null && (
                            <div className="absolute top-1 right-1 bg-[#121212]/90 text-[#00FF66] border border-[#333333] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-[#00FF66] text-[#00FF66]" />
                              <span>{Number(currentlyWatching.show.vote_average).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="space-y-2 text-center sm:text-left md:text-left flex-1">
                        <Link href={`/tv/${currentlyWatching.show.id}`}>
                          <h3 className="text-lg md:text-xl font-bold text-[#EDEDED] hover:text-[#00FF66] transition-colors line-clamp-2">
                            {currentlyWatching.show.name}
                          </h3>
                        </Link>
                        
                        {/* Progress Indicator */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                            <span>Progress</span>
                            <span className="font-bold text-[#00FF66]">
                              {currentlyWatching.progress.watchedEpisodesCount} / {currentlyWatching.progress.totalEpisodesCount || '?'} Episodes
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-[#2A2A2A] rounded-full overflow-hidden border border-[#333333]">
                            <div 
                              className="h-full bg-[#00FF66] transition-all duration-500"
                              style={{ 
                                width: currentlyWatching.progress.totalEpisodesCount > 0 
                                  ? `${Math.min(100, Math.round((currentlyWatching.progress.watchedEpisodesCount / currentlyWatching.progress.totalEpisodesCount) * 100))}%`
                                  : '0%' 
                              }}
                            />
                          </div>
                        </div>

                        {currentlyWatching.progress.lastWatched && (
                          <p className="text-[11px] text-[#A0A0A0] flex items-center justify-center sm:justify-start gap-1">
                            <Clock className="w-3 h-3 text-[#00FF66]" />
                            <span>Last Watched: S{currentlyWatching.progress.lastWatched.season_number} E{currentlyWatching.progress.lastWatched.episode_number} ({currentlyWatching.progress.lastWatched.watched_date})</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Next Episode Quick Watch Card */}
                    <div className="md:col-span-8 bg-[#121212]/90 border border-[#333333] rounded-md p-4 sm:p-5 space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                        <span className="text-xs uppercase font-bold text-[#00FF66] tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          NEXT EPISODE UP TO WATCH
                        </span>
                        
                        {currentlyWatching.nextEpisode && (
                          <span className="bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 px-2 py-0.5 rounded text-xs font-bold font-mono">
                            S{currentlyWatching.nextEpisode.season_number} E{currentlyWatching.nextEpisode.episode_number}
                          </span>
                        )}
                      </div>

                      {quickWatchSuccess && (
                        <div className="bg-[#00FF66]/10 border border-[#00FF66] text-[#00FF66] px-3 py-2 rounded text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{quickWatchSuccess}</span>
                        </div>
                      )}

                      {currentlyWatching.isCompleted ? (
                        <div className="py-4 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-[#00FF66] mx-auto opacity-80" />
                          <h4 className="font-bold text-sm text-[#EDEDED]">Show Completed!</h4>
                          <p className="text-xs text-[#A0A0A0]">You have watched all available episodes of {currentlyWatching.show.name}.</p>
                        </div>
                      ) : currentlyWatching.nextEpisode ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {currentlyWatching.nextEpisode.still_path && (
                              <div className="w-full sm:w-40 aspect-video rounded overflow-hidden border border-[#333333] shrink-0 bg-[#2A2A2A]">
                                <img 
                                  src={`https://image.tmdb.org/t/p/w300${currentlyWatching.nextEpisode.still_path}`}
                                  alt={currentlyWatching.nextEpisode.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5 flex-1">
                              <h4 className="font-bold text-sm md:text-base text-[#EDEDED]">
                                {currentlyWatching.nextEpisode.name}
                              </h4>
                              {currentlyWatching.nextEpisode.air_date && (
                                <span className="text-[11px] text-[#A0A0A0] block">
                                  Air Date: {currentlyWatching.nextEpisode.air_date}
                                </span>
                              )}
                              {currentlyWatching.nextEpisode.overview && (
                                <p className="text-xs text-[#A0A0A0] line-clamp-3 leading-relaxed">
                                  {currentlyWatching.nextEpisode.overview}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* QUICK MARK WATCHED BUTTON */}
                          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                            <button
                              onClick={handleMarkNextEpisode}
                              disabled={markingEp}
                              className="btn btn-primary w-full sm:w-auto py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-all"
                            >
                              {markingEp ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>MARK S{currentlyWatching.nextEpisode.season_number} E{currentlyWatching.nextEpisode.episode_number} AS WATCHED</span>
                                </>
                              )}
                            </button>

                            <Link 
                              href={`/tv/${currentlyWatching.show.id}?season=${currentlyWatching.nextEpisode.season_number}`}
                              className="btn btn-ghost text-xs py-2 px-3 w-full sm:w-auto text-center"
                            >
                              <span>View Full Season</span>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#A0A0A0]">No episode details available.</p>
                      )}

                    </div>

                  </div>
                </div>

                {/* Other Active TV Shows Selector Chips */}
                {currentlyWatching.otherActiveShows.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] uppercase font-bold text-[#A0A0A0] tracking-wider block">
                      OTHER TRACKED TV SHOWS (CLICK TO SWITCH):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {currentlyWatching.otherActiveShows.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedShowId(s.id)}
                          className="flex items-center gap-2 p-1.5 pr-3 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#00FF66] rounded transition-colors text-left shrink-0 group"
                        >
                          <div className="w-8 aspect-[2/3] bg-[#2A2A2A] rounded overflow-hidden border border-[#333333]">
                            {s.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} 
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Tv className="w-4 h-4 m-auto opacity-50" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-[#EDEDED] group-hover:text-[#00FF66] max-w-[120px] truncate">
                            {s.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="card p-6 text-center space-y-3">
                <Tv className="w-8 h-8 text-[#A0A0A0] mx-auto opacity-60" />
                <p className="text-sm text-[#EDEDED] font-semibold">No Active TV Shows Tracked Yet</p>
                <p className="text-xs text-[#A0A0A0] max-w-md mx-auto">
                  Search for a TV show above and mark episodes as watched to track your TV progress right here on your home page!
                </p>
              </div>
            )}
          </section>

          {/* SECTION 2: LAST ADDED WATCHED MOVIES & QUICK RATE/REVIEW */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#00FF66]" />
                <h2 className="text-base font-bold text-[#EDEDED] uppercase tracking-wider text-xs">
                  Last Added Watched Movies
                </h2>
              </div>
              <Link 
                href={`/profile/${user.username}`}
                className="text-xs text-[#00FF66] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Full Film Log</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {dashboardLoading && lastWatchedMovies.length === 0 ? (
              <div className="card p-8 text-center text-[#A0A0A0] animate-pulse">
                Loading recently watched movies...
              </div>
            ) : lastWatchedMovies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lastWatchedMovies.map((movie) => {
                  const isEditing = editingMovieId === movie.movieId;
                  const isUnrated = movie.rating === null || movie.rating === undefined || movie.rating === 0;
                  const isUnreviewed = !movie.review || movie.review.trim() === '';
                  const needsAttention = isUnrated || isUnreviewed;

                  return (
                    <div 
                      key={movie.movieId}
                      className={`card-surface p-4 border rounded flex flex-col justify-between space-y-3 transition-colors ${
                        needsAttention ? 'border-[#00FF66]/40 bg-[#1E1E1E]' : 'border-[#333333] bg-[#1E1E1E]'
                      }`}
                    >
                      {/* Top Header: Poster + Title + Rating/Review Status */}
                      <div className="flex gap-3 items-start">
                        <Link href={`/movie/${movie.movieId}`} className="shrink-0 group">
                          <div className="w-16 aspect-[2/3] rounded border border-[#333333] overflow-hidden bg-[#2A2A2A] relative">
                            {movie.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-[#A0A0A0]">
                                No Image
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 space-y-1 min-w-0">
                          <Link href={`/movie/${movie.movieId}`}>
                            <h3 className="font-bold text-sm text-[#EDEDED] hover:text-[#00FF66] transition-colors truncate">
                              {movie.title}
                            </h3>
                          </Link>

                          {movie.watched_date && (
                            <span className="text-[10px] text-[#A0A0A0] block">
                              Watched: {movie.watched_date}
                            </span>
                          )}

                          {/* Existing Rating Badge */}
                          {movie.rating ? (
                            <div className="pt-0.5">
                              <StarRating rating={movie.rating} readOnly size="small" />
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-0.5 rounded">
                              UNRATED
                            </span>
                          )}

                          {/* Existing Review Quote */}
                          {movie.review ? (
                            <p className="text-xs text-[#EDEDED]/90 italic line-clamp-2 bg-[#121212]/80 p-1.5 rounded border border-[#333333] mt-1">
                              "{movie.review}"
                            </p>
                          ) : (
                            <span className="text-[10px] font-medium text-[#A0A0A0] block italic">
                              No review written
                            </span>
                          )}
                        </div>
                      </div>

                      {/* QUICK RATE & REVIEW FORM OR BUTTON */}
                      <div className="pt-2 border-t border-[#333333]">
                        {isEditing ? (
                          <div className="space-y-3 bg-[#121212] p-3 rounded border border-[#333333] animate-fadeIn">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-[#00FF66] tracking-wider block">
                                RATING (1 - 10 STARS):
                              </label>
                              <StarRating 
                                rating={movieRating} 
                                onRatingChange={(val) => setMovieRating(val)} 
                                size="medium" 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-[#EDEDED] tracking-wider block">
                                WRITE YOUR REVIEW:
                              </label>
                              <textarea
                                value={movieReview}
                                onChange={(e) => setMovieReview(e.target.value)}
                                placeholder="What did you think of the movie?"
                                rows={2}
                                className="form-input text-xs p-2 bg-[#1E1E1E] border border-[#333333] resize-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingMovieId(null)}
                                className="btn btn-ghost text-[11px] py-1 px-2.5"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveMovieRateReview(movie.movieId, movie.watched_date)}
                                disabled={savingMovie}
                                className="btn btn-primary text-[11px] py-1 px-3 flex items-center gap-1"
                              >
                                {savingMovie ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border border-[#121212] border-t-transparent" />
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Save Review</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenMovieForm(movie)}
                            className={`btn w-full text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                              needsAttention
                                ? 'btn-primary'
                                : 'btn-ghost'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>
                              {needsAttention ? 'QUICK RATE & REVIEW' : 'Edit Rating / Review'}
                            </span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-6 text-center space-y-2">
                <Film className="w-8 h-8 text-[#A0A0A0] mx-auto opacity-60" />
                <p className="text-sm text-[#EDEDED] font-semibold">No Movies Watched Yet</p>
                <p className="text-xs text-[#A0A0A0]">
                  Search for a movie above to rate, review, and log your film watch history!
                </p>
              </div>
            )}
          </section>

        </div>
      )}

      {/* TRENDING MEDIA GRID SECTION */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex flex-row items-center justify-between gap-4 mb-4 pb-2 border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#00FF66]" />
            <h2 className="text-base font-bold text-[#EDEDED] uppercase tracking-wider text-xs">
              Trending Releases
            </h2>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTrendingTab('movie')}
              className={`btn text-xs py-1 px-2.5 ${
                trendingTab === 'movie' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setTrendingTab('tv')}
              className={`btn text-xs py-1 px-2.5 ${
                trendingTab === 'tv' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {trendingTab === 'movie' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {trendingMovies.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {trendingTv.map(show => (
              <Link key={show.id} href={`/tv/${show.id}`}>
                <TVShowCard show={show} />
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
