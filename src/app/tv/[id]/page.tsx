'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';
import { TVShow, Season, Episode } from '@/types';
import { 
  Tv, Calendar, Star, Heart, Trash2, CheckCircle2, Eye, 
  Tag, Plus, X, MessageSquare, AlertTriangle, Send, Layers, Clock
} from 'lucide-react';

const PRESET_PLATFORMS = ['Netflix', 'Hotstar', 'Pirated', 'Prime Video', 'Hulu', 'Apple TV+', 'HBO Max', 'Crunchyroll'];

export default function TVShowPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();

  const [show, setShow] = useState<TVShow | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<Season | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [seasonLoading, setSeasonLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [markShowLoading, setMarkShowLoading] = useState<boolean>(false);
  const [markSeasonLoading, setMarkSeasonLoading] = useState<boolean>(false);

  // Form State
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [watchedWhere, setWatchedWhere] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState<string>('');

  // Episode tracking loading map
  const [epLoadingMap, setEpLoadingMap] = useState<Record<string, boolean>>({});

  // Bulk mark watched date modal state
  const [bulkDateModal, setBulkDateModal] = useState<{
    type: 'show' | 'season';
    seasonNumber?: number;
  } | null>(null);
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchTVShowData = useCallback(async (showSpinner = false) => {
    if (!id) return;
    try {
      if (showSpinner) setLoading(true);
      const { data } = await api.get<TVShow>(`/api/tv?id=${id}`);
      setShow(data);
      
      if (data.currentUserTrack) {
        setRating(data.currentUserTrack.rating || 0);
        setReviewText(data.currentUserTrack.review || '');
        setIsFavorite(!!data.currentUserTrack.is_favorite);
        setStartDate(data.currentUserTrack.start_date || '');
        setEndDate(data.currentUserTrack.end_date || '');
        setWatchedWhere(data.currentUserTrack.watched_where || []);
      }

      if (data.seasons && data.seasons.length > 0) {
        const firstValidSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
        setSelectedSeasonNumber(prev => prev || firstValidSeason.season_number);
      }
    } catch (err) {
      console.error('Error fetching TV show:', err);
      if (showSpinner) {
        setError('Failed to fetch TV show details. Please try again.');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [id]);

  const fetchSeasonData = useCallback(async (seasonNum: number, showSpinner = true) => {
    if (!id) return;
    try {
      if (showSpinner) setSeasonLoading(true);
      const { data } = await api.get<Season>(`/api/tv?id=${id}&season=${seasonNum}`);
      setSeasonData(data);
    } catch (err) {
      console.error(`Error fetching season ${seasonNum}:`, err);
    } finally {
      if (showSpinner) setSeasonLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTVShowData(true);
  }, [fetchTVShowData]);

  useEffect(() => {
    if (selectedSeasonNumber !== undefined && id) {
      fetchSeasonData(selectedSeasonNumber, true);
    }
  }, [selectedSeasonNumber, fetchSeasonData, id]);

  const handleToggleFavorite = async () => {
    if (!user || !id) return;
    const newFav = !isFavorite;
    setIsFavorite(newFav);
    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'favorite',
        isFavorite: newFav
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setIsFavorite(!newFav);
    }
  };

  const handleSaveShowTrack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !id) return;

    setSubmitting(true);
    try {
      await api.post('/api/tv', {
        tvShowId: id,
        rating,
        review: reviewText.trim(),
        isFavorite,
        startDate: startDate || null,
        endDate: endDate || null,
        watchedWhere
      });
      await fetchTVShowData(false);
    } catch (err) {
      console.error('Error saving TV show track:', err);
      setError('Failed to save TV show entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShowTrack = async () => {
    if (!user || !id) return;
    if (!confirm('Are you sure you want to remove this TV show from your collection?')) return;

    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'delete'
      });
      setRating(0);
      setReviewText('');
      setIsFavorite(false);
      setStartDate('');
      setEndDate('');
      setWatchedWhere([]);
      await fetchTVShowData(false);
    } catch (err) {
      console.error('Error deleting TV show track:', err);
    }
  };

  const handleMarkShowAsWatched = async (targetDateString?: string) => {
    if (!user || !id) return;
    const dateToUse = targetDateString || bulkDate || new Date().toISOString().split('T')[0];
    setMarkShowLoading(true);
    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'mark_show_watched',
        watchedDate: dateToUse
      });
      await fetchTVShowData(false);
      if (selectedSeasonNumber) {
        await fetchSeasonData(selectedSeasonNumber, false);
      }
    } catch (err) {
      console.error('Error marking show watched:', err);
    } finally {
      setMarkShowLoading(false);
      setBulkDateModal(null);
    }
  };

  const handleMarkSeasonAsWatched = async (seasonNum: number, targetDateString?: string) => {
    if (!user || !id) return;
    const dateToUse = targetDateString || bulkDate || new Date().toISOString().split('T')[0];
    setMarkSeasonLoading(true);
    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'mark_season_watched',
        seasonNumber: seasonNum,
        watchedDate: dateToUse
      });
      await fetchTVShowData(false);
      await fetchSeasonData(seasonNum, false);
    } catch (err) {
      console.error('Error marking season watched:', err);
    } finally {
      setMarkSeasonLoading(false);
      setBulkDateModal(null);
    }
  };

  const handleToggleTag = (tag: string) => {
    setWatchedWhere(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !watchedWhere.includes(trimmed)) {
      setWatchedWhere(prev => [...prev, trimmed]);
      setCustomTag('');
    }
  };

  const handleEpisodeWatchedToggle = async (ep: Episode, currentWatched: boolean, currentRating?: number, currentWatchedDate?: string) => {
    if (!user || !id) return;
    const key = `${ep.season_number}_${ep.episode_number}`;

    setEpLoadingMap(prev => ({ ...prev, [key]: true }));

    try {
      const nextWatched = !currentWatched;
      const today = new Date().toISOString().split('T')[0];
      const dateToUse = nextWatched ? (currentWatchedDate || today) : null;

      await api.post('/api/tv', {
        tvShowId: id,
        action: 'episode_watched',
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        watched: nextWatched,
        rating: currentRating || null,
        watchedDate: dateToUse
      });

      setShow(prev => {
        if (!prev) return null;
        const updated = { ...(prev.userEpisodes || {}) };
        updated[key] = {
          watched: nextWatched,
          rating: currentRating,
          watched_date: dateToUse || undefined
        };
        return { ...prev, userEpisodes: updated };
      });
    } catch (err) {
      console.error('Error updating episode:', err);
    } finally {
      setEpLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleEpisodeRatingChange = async (ep: Episode, newRating: number) => {
    if (!user || !id) return;
    const key = `${ep.season_number}_${ep.episode_number}`;
    const epState = show?.userEpisodes?.[key];
    const today = new Date().toISOString().split('T')[0];
    const dateToUse = epState?.watched_date || today;

    setEpLoadingMap(prev => ({ ...prev, [key]: true }));

    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'episode_watched',
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        watched: true,
        rating: newRating,
        watchedDate: dateToUse
      });

      setShow(prev => {
        if (!prev) return null;
        const updated = { ...(prev.userEpisodes || {}) };
        updated[key] = {
          watched: true,
          rating: newRating,
          watched_date: dateToUse
        };
        return { ...prev, userEpisodes: updated };
      });
    } catch (err) {
      console.error('Error rating episode:', err);
    } finally {
      setEpLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleEpisodeDateChange = async (ep: Episode, newDate: string) => {
    if (!user || !id) return;
    const key = `${ep.season_number}_${ep.episode_number}`;
    const epState = show?.userEpisodes?.[key];

    setEpLoadingMap(prev => ({ ...prev, [key]: true }));

    try {
      await api.post('/api/tv', {
        tvShowId: id,
        action: 'episode_watched',
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        watched: true,
        rating: epState?.rating || null,
        watchedDate: newDate || null
      });

      setShow(prev => {
        if (!prev) return null;
        const updated = { ...(prev.userEpisodes || {}) };
        updated[key] = {
          watched: true,
          rating: epState?.rating,
          watched_date: newDate
        };
        return { ...prev, userEpisodes: updated };
      });
    } catch (err) {
      console.error('Error updating episode watched date:', err);
    } finally {
      setEpLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-sm w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto mb-3" />
          <p className="font-bold text-sm text-[#EDEDED]">Loading TV series data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-md w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="w-12 h-12 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm text-[#ff4d4d] mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchTVShowData(true);
            }}
            className="btn btn-primary mx-auto text-xs py-2 px-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!show) return null;

  const posterUrl = show.poster_path 
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 bg-[#121212] text-[#EDEDED]">

      {/* Header Card (Mobile First 4.3) */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Aspect 2/3 Poster Container */}
          <div className="w-32 md:w-48 shrink-0 aspect-[2/3] relative rounded overflow-hidden border border-[#333333] bg-[#2A2A2A]">
            {posterUrl ? (
              <img 
                src={posterUrl} 
                alt={show.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#A0A0A0]">
                <Tv className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-[10px] font-semibold">No Poster</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66] mb-1 block">
                  TELEVISION SERIES
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold text-[#EDEDED] leading-tight">
                  {show.name}
                </h1>
              </div>

              {/* Favorite Button */}
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded border transition-colors ${
                    isFavorite 
                      ? 'bg-[#00FF66] text-[#121212] border-[#00FF66]' 
                      : 'bg-[#1E1E1E] text-[#A0A0A0] border-[#333333] hover:text-[#EDEDED]'
                  }`}
                  title={isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#121212]' : ''}`} />
                </button>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {show.first_air_date && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#EDEDED] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00FF66]" />
                  Aired {new Date(show.first_air_date).getFullYear()}
                </span>
              )}
              {show.number_of_seasons && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#EDEDED] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#A0A0A0]" />
                  {show.number_of_seasons} S ({show.number_of_episodes} Ep)
                </span>
              )}
              {show.vote_average != null && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#00FF66] font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#00FF66]" />
                  TMDB {Number(show.vote_average).toFixed(1)} / 10
                </span>
              )}
            </div>

            {/* Genres */}
            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {show.genres.map(genre => (
                  <span 
                    key={genre.id} 
                    className="px-2 py-0.5 bg-[#121212] border border-[#333333] rounded text-[10px] font-medium text-[#A0A0A0]"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {show.overview && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">Synopsis</h3>
                <p className="text-sm text-[#EDEDED]/90 leading-relaxed font-normal">{show.overview}</p>
              </div>
            )}

            {/* Bulk Mark Button */}
            {user && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    setBulkDate(new Date().toISOString().split('T')[0]);
                    setBulkDateModal({ type: 'show' });
                  }}
                  disabled={markShowLoading}
                  className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {markShowLoading ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                      <span>Mark Entire Show as Watched</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Series Tracking Form */}
      {user && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#00FF66]" />
              {show.currentUserTrack ? 'Update Series Entry' : 'Log TV Show'}
            </h3>

            {show.currentUserTrack && (
              <button
                type="button"
                onClick={handleDeleteShowTrack}
                className="btn bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 text-xs py-1 px-2.5 flex items-center gap-1 hover:bg-[#ff4d4d] hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          <form onSubmit={handleSaveShowTrack} className="space-y-4">
            
            {/* Overall Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1.5">
                Overall Series Rating (1-10)
              </label>
              <StarRating 
                rating={rating}
                maxStars={10}
                onRatingChange={setRating}
                size="large"
              />
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input text-xs py-2"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input text-xs py-2"
                />
              </div>
            </div>

            {/* Watched Where Platform Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00FF66]" />
                Platform Tags
              </label>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_PLATFORMS.map((platform) => {
                  const selected = watchedWhere.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleToggleTag(platform)}
                      className={`btn text-[10px] py-0.5 px-2 ${
                        selected 
                          ? 'btn-primary' 
                          : 'btn-ghost text-[#A0A0A0]'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{platform}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Custom tag (e.g. Stremio)"
                  className="form-input text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="btn btn-secondary text-xs py-1.5 px-3 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label htmlFor="tvReview" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Series Review & Notes
              </label>
              <textarea
                id="tvReview"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="form-input h-24 resize-none text-xs"
                placeholder="Share your overall thoughts..."
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="btn btn-primary text-xs py-2.5 px-6 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Save TV Entry</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Season & Episode Breakdown */}
      {show.seasons && show.seasons.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[#EDEDED]">
              <Layers className="w-4 h-4 text-[#00FF66]" />
              Season Breakdown
            </h3>

            {user && (
              <button
                type="button"
                onClick={() => {
                  setBulkDate(new Date().toISOString().split('T')[0]);
                  setBulkDateModal({ type: 'season', seasonNumber: selectedSeasonNumber });
                }}
                disabled={markSeasonLoading}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
              >
                {markSeasonLoading ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span>Mark Season {selectedSeasonNumber} Watched</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Season Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#333333]">
            {show.seasons.map((season) => {
              const isActive = selectedSeasonNumber === season.season_number;
              return (
                <button
                  key={season.season_number}
                  onClick={() => setSelectedSeasonNumber(season.season_number)}
                  className={`btn text-xs py-1.5 px-3 whitespace-nowrap ${
                    isActive 
                      ? 'btn-primary' 
                      : 'btn-ghost text-[#A0A0A0]'
                  }`}
                >
                  {season.name || `Season ${season.season_number}`}
                  {season.episode_count ? ` (${season.episode_count})` : ''}
                </button>
              );
            })}
          </div>

          {/* Episodes List */}
          {seasonLoading ? (
            <div className="text-center py-8 text-[#A0A0A0]">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00FF66] border-t-transparent mx-auto mb-2" />
              <p className="text-xs font-medium">Loading Season {selectedSeasonNumber} episodes...</p>
            </div>
          ) : seasonData && seasonData.episodes && seasonData.episodes.length > 0 ? (
            <div className="space-y-3">
              {seasonData.episodes.map((ep) => {
                const epKey = `${ep.season_number}_${ep.episode_number}`;
                const epState = show.userEpisodes?.[epKey];
                const isEpWatched = epState?.watched || false;
                const epRating = epState?.rating || 0;
                const isEpLoading = epLoadingMap[epKey] || false;

                const stillUrl = ep.still_path 
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : null;

                return (
                  <div 
                    key={ep.episode_number}
                    className={`bg-[#121212] border border-[#333333] p-3.5 rounded transition-colors ${
                      isEpWatched ? 'border-[#00FF66]/40' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      
                      {/* Episode Still */}
                      <div className="w-full md:w-36 aspect-video shrink-0 relative rounded overflow-hidden bg-[#2A2A2A] border border-[#333333]">
                        {stillUrl ? (
                          <img 
                            src={stillUrl} 
                            alt={ep.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-[10px]">
                            No Still
                          </div>
                        )}
                        <span className="absolute top-1 left-1 bg-[#121212]/90 text-[#00FF66] border border-[#333333] px-1.5 py-0.5 rounded text-[9px] font-bold">
                          E{ep.episode_number}
                        </span>
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-[#EDEDED]">
                            {ep.episode_number}. {ep.name}
                          </h5>

                          {user && (
                            <button
                              onClick={() => handleEpisodeWatchedToggle(ep, isEpWatched, epRating, epState?.watched_date)}
                              disabled={isEpLoading}
                              className={`btn text-[10px] py-1 px-2.5 flex items-center gap-1 ${
                                isEpWatched ? 'btn-primary' : 'btn-secondary'
                              }`}
                            >
                              {isEpLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isEpWatched ? 'Watched ✓' : 'Mark Watched'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#A0A0A0] font-medium">
                          {ep.air_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#00FF66]" />
                              {ep.air_date}
                            </span>
                          )}
                          {ep.runtime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ep.runtime} min
                            </span>
                          )}
                          {ep.vote_average != null && (
                            <span className="flex items-center gap-1 text-[#00FF66]">
                              <Star className="w-3 h-3 fill-[#00FF66]" />
                              TMDB {Number(ep.vote_average).toFixed(1)}/10
                            </span>
                          )}
                        </div>

                        {/* Overview */}
                        {ep.overview && (
                          <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-2">
                            {ep.overview}
                          </p>
                        )}

                        {/* Controls */}
                        {user && isEpWatched && (
                          <div className="pt-2 border-t border-[#333333] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-[#A0A0A0]">Rating:</span>
                              <StarRating 
                                rating={epRating}
                                maxStars={10}
                                onRatingChange={(newRating) => handleEpisodeRatingChange(ep, newRating)}
                                size="small"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 bg-[#1E1E1E] px-2 py-0.5 border border-[#333333] rounded">
                              <Calendar className="w-3 h-3 text-[#00FF66]" />
                              <label htmlFor={`ep-date-${epKey}`} className="text-[10px] text-[#A0A0A0]">Watched:</label>
                              <input
                                id={`ep-date-${epKey}`}
                                type="date"
                                value={epState?.watched_date || ''}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleEpisodeDateChange(ep, e.target.value)}
                                className="text-[10px] font-medium bg-[#121212] text-[#EDEDED] border border-[#333333] rounded px-1 py-0.5"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0] text-center py-4">
              No episode info available for Season {selectedSeasonNumber}.
            </p>
          )}
        </div>
      )}

      {/* Community Reviews */}
      {show.reviews && show.reviews.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#EDEDED]">
            <MessageSquare className="w-4 h-4 text-[#00FF66]" />
            Community Reviews ({show.reviews.length})
          </h3>
          
          <div className="space-y-3">
            {show.reviews.map((review, index) => (
              <div key={index} className="bg-[#121212] border border-[#333333] p-4 rounded text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {review.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link 
                        href={`/profile/${review.username}`}
                        className="font-bold text-sm text-[#EDEDED] hover:text-[#00FF66] transition-colors"
                      >
                        {review.username}
                      </Link>
                      <StarRating rating={review.rating} readOnly size="small" />
                      <span className="text-[10px] text-[#A0A0A0]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {review.watched_where && review.watched_where.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap my-1">
                        {review.watched_where.map((platform, i) => (
                          <span 
                            key={i} 
                            className="bg-[#1E1E1E] border border-[#333333] px-1.5 py-0.2 rounded text-[9px] font-medium text-[#A0A0A0]"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-[#EDEDED]/90 leading-relaxed italic">
                      &ldquo;{review.review}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Mark Watched Date Modal */}
      {bulkDateModal && (
        <div className="fixed inset-0 bg-[#121212]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card bg-[#1E1E1E] border border-[#333333] max-w-md w-full p-6 space-y-4 rounded">
            <h4 className="text-base font-bold text-[#EDEDED]">
              {bulkDateModal.type === 'show' ? 'Mark Entire Show Watched' : `Mark Season ${bulkDateModal.seasonNumber} Watched`}
            </h4>
            <p className="text-xs text-[#A0A0A0]">
              Select watched date for {bulkDateModal.type === 'show' ? 'this show' : `Season ${bulkDateModal.seasonNumber}`}:
            </p>
            
            <div>
              <label htmlFor="bulkDateInput" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Watched Date
              </label>
              <input
                id="bulkDateInput"
                type="date"
                value={bulkDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBulkDate(e.target.value)}
                className="form-input text-xs py-2"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setBulkDateModal(null)}
                className="btn btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bulkDateModal.type === 'show') {
                    handleMarkShowAsWatched(bulkDate);
                  } else if (bulkDateModal.seasonNumber) {
                    handleMarkSeasonAsWatched(bulkDateModal.seasonNumber, bulkDate);
                  }
                }}
                className="btn btn-primary text-xs py-2 px-4"
              >
                Confirm & Mark Watched
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
