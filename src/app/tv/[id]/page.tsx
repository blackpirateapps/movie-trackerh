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
  Tag, Plus, X, MessageSquare, AlertTriangle, Send, ChevronRight, Layers, Clock
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

      // Update local show userEpisodes state
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#ff4d4d] mx-auto mb-4" />
          <p className="font-bold text-xl text-[#2d2d2d]">Loading TV Show details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-postit text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#2d2d2d]">
            <AlertTriangle className="w-8 h-8 stroke-[3]" />
          </div>
          <p className="font-bold text-xl text-[#ff4d4d] mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchTVShowData(true);
            }}
            className="btn btn-primary mx-auto"
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
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* TV Show Header Card */}
        <div className="card relative">
          <div className="tape-strip" />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Taped Poster Photo */}
            <div className="w-full lg:w-72 shrink-0 relative pt-2">
              <div className="tape-strip" />
              <div 
                className="bg-white border-3 border-[#2d2d2d] p-3 shadow-[6px_6px_0px_#2d2d2d] -rotate-1"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <img 
                  src={posterUrl} 
                  alt={show.name}
                  className="w-full h-auto rounded-[15px_225px_15px_255px/255px_15px_225px_15px] border-2 border-[#2d2d2d]"
                />
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl lg:text-6xl font-heading font-bold text-[#2d2d2d] leading-tight flex items-center gap-3">
                  <Tv className="w-8 h-8 text-[#2d5da1] shrink-0 stroke-[3]" />
                  <span>{show.name}</span>
                </h1>

                {/* Favorite Toggle Button */}
                {user && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`btn p-3 rounded-full border-3 ${
                      isFavorite 
                        ? 'bg-[#ff4d4d] text-white' 
                        : 'bg-white text-[#2d2d2d]'
                    }`}
                    title={isFavorite ? 'Remove from Favorites' : 'Mark as Favorite'}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white stroke-[2]' : 'stroke-[2.5]'}`} />
                  </button>
                )}
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                {show.first_air_date && (
                  <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#ff4d4d] stroke-[2.5]" />
                    First Aired {new Date(show.first_air_date).getFullYear()}
                  </span>
                )}
                {show.number_of_seasons && (
                  <span className="bg-[#e5e0d8] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#2d5da1] stroke-[2.5]" />
                    {show.number_of_seasons} Seasons ({show.number_of_episodes} Episodes)
                  </span>
                )}
                {show.vote_average != null && (
                  <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
                    TMDB {Number(show.vote_average).toFixed(1)} / 10
                  </span>
                )}
              </div>

              {/* Genres */}
              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {show.genres.map(genre => (
                    <span 
                      key={genre.id} 
                      className="px-3 py-0.5 bg-white border border-[#2d2d2d] rounded-full text-xs font-bold shadow-[1px_1px_0px_#2d2d2d]"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {show.overview && (
                <div className="bg-[#fdfbf7] border-2 border-[#2d2d2d] p-4 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d]">
                  <h3 className="font-heading font-bold text-xl mb-1 text-[#2d5da1]">Series Overview</h3>
                  <p className="text-lg text-[#2d2d2d] font-body leading-relaxed">{show.overview}</p>
                </div>
              )}

              {/* Quick Actions */}
              {user && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      setBulkDate(new Date().toISOString().split('T')[0]);
                      setBulkDateModal({ type: 'show' });
                    }}
                    disabled={markShowLoading}
                    className="btn btn-secondary text-base flex items-center gap-2"
                  >
                    {markShowLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-[#2d5da1] stroke-[2.5]" />
                        <span>Mark Entire Show as Watched</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User TV Show Tracking Form */}
        {user && (
          <div className="card-postit relative">
            <div className="thumbtack" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-heading font-bold text-[#2d2d2d]">
                {show.currentUserTrack ? 'Update TV Show Tracking' : 'Add to Your TV Collection'}
              </h3>

              {show.currentUserTrack && (
                <button
                  type="button"
                  onClick={handleDeleteShowTrack}
                  className="btn bg-[#ff4d4d] text-white text-sm py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  Delete Show
                </button>
              )}
            </div>

            <form onSubmit={handleSaveShowTrack} className="space-y-6">
              
              {/* Overall Rating out of 10 */}
              <div>
                <label className="block text-lg font-bold mb-2 text-[#2d2d2d]">
                  Overall Series Rating (1 to 10 Scale)
                </label>
                <StarRating 
                  rating={rating}
                  maxStars={10}
                  onRatingChange={setRating}
                  size="large"
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-base font-bold mb-1 text-[#2d2d2d]">
                    Start Date (When you started watching)
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-base font-bold mb-1 text-[#2d2d2d]">
                    End Date (When you finished / dropped)
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Watched Where Platform Tags */}
              <div>
                <label className="block text-lg font-bold mb-2 text-[#2d2d2d] flex items-center gap-2">
                  <Tag className="w-5 h-5 stroke-[2.5] text-[#2d5da1]" />
                  Watched Where (Platform Tags)
                </label>
                
                {/* Preset Platform Pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_PLATFORMS.map((platform) => {
                    const selected = watchedWhere.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => handleToggleTag(platform)}
                        className={`btn text-xs py-1 px-3 border-2 ${
                          selected 
                            ? 'bg-[#ff4d4d] text-white border-[#2d2d2d]' 
                            : 'bg-white text-[#2d2d2d] border-[#2d2d2d]'
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
                    placeholder="Add custom tag (e.g. Stremio, DVD)"
                    className="form-input text-sm py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="btn btn-secondary text-sm py-2 px-4 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Add Tag
                  </button>
                </div>

                {/* Active Tag Chips */}
                {watchedWhere.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-3 pt-2 border-t border-dashed border-[#2d2d2d]/30">
                    <span className="text-xs font-bold text-[#2d2d2d]">Selected Tags:</span>
                    {watchedWhere.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#fff9c4] border-2 border-[#2d2d2d] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-[1px_1px_0px_#2d2d2d]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className="hover:text-[#ff4d4d] ml-1 font-bold"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label htmlFor="tvReview" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                  Series Review & Notes
                </label>
                <textarea
                  id="tvReview"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="form-input h-32 resize-none"
                  placeholder="Share your overall thoughts on the story, characters, and writing..."
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary text-xl py-3 px-8 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 stroke-[2.5]" />
                    <span>Save TV Show Entry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Season & Episode Breakdown Section */}
        {show.seasons && show.seasons.length > 0 && (
          <div className="card relative">
            <div className="tape-strip" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-3xl font-heading font-bold flex items-center gap-3">
                <Layers className="w-7 h-7 text-[#2d5da1] stroke-[2.5]" />
                Season & Episode Breakdown
              </h3>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkDate(new Date().toISOString().split('T')[0]);
                    setBulkDateModal({ type: 'season', seasonNumber: selectedSeasonNumber });
                  }}
                  disabled={markSeasonLoading}
                  className="btn btn-secondary text-sm flex items-center gap-2 self-start sm:self-auto"
                >
                  {markSeasonLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#2d5da1] stroke-[2.5]" />
                      <span>Mark Season {selectedSeasonNumber} as Watched</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Season Selector Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-3 border-b-2 border-dashed border-[#2d2d2d]/30 mb-6">
              {show.seasons.map((season) => {
                const isActive = selectedSeasonNumber === season.season_number;
                return (
                  <button
                    key={season.season_number}
                    onClick={() => setSelectedSeasonNumber(season.season_number)}
                    className={`btn text-base py-2 px-5 whitespace-nowrap border-3 ${
                      isActive 
                        ? 'bg-[#ff4d4d] text-white border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d]' 
                        : 'bg-white text-[#2d2d2d] border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d]'
                    }`}
                  >
                    {season.name || `Season ${season.season_number}`}
                    {season.episode_count ? ` (${season.episode_count} ep)` : ''}
                  </button>
                );
              })}
            </div>

            {/* Selected Season Detail & Episode List */}
            {seasonLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-[#2d5da1] mx-auto mb-3" />
                <p className="font-bold text-lg text-[#2d2d2d]">Loading Season {selectedSeasonNumber} episodes...</p>
              </div>
            ) : seasonData && seasonData.episodes && seasonData.episodes.length > 0 ? (
              <div className="space-y-6">
                
                {/* Season Header Info */}
                {seasonData.overview && (
                  <div className="bg-[#fff9c4] border-2 border-[#2d2d2d] p-4 rounded-xl shadow-[3px_3px_0px_#2d2d2d] mb-6">
                    <h4 className="font-heading font-bold text-xl mb-1 text-[#2d2d2d]">
                      {seasonData.name} Overview
                    </h4>
                    <p className="text-base text-[#2d2d2d] font-body">{seasonData.overview}</p>
                  </div>
                )}

                {/* Episodes Grid */}
                <div className="space-y-4">
                  {seasonData.episodes.map((ep) => {
                    const epKey = `${ep.season_number}_${ep.episode_number}`;
                    const epState = show.userEpisodes?.[epKey];
                    const isEpWatched = epState?.watched || false;
                    const epRating = epState?.rating || 0;
                    const isEpLoading = epLoadingMap[epKey] || false;

                    const stillUrl = ep.still_path 
                      ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                      : 'https://via.placeholder.com/300x169?text=No+Still';

                    return (
                      <div 
                        key={ep.episode_number}
                        className={`bg-[#fdfbf7] border-3 border-[#2d2d2d] p-4 rounded-[20px_255px_20px_255px/255px_20px_255px_20px] shadow-[4px_4px_0px_#2d2d2d] transition-all ${
                          isEpWatched ? 'bg-[#fff9c4]/30' : ''
                        }`}
                      >
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          
                          {/* Episode Still Image */}
                          <div className="w-full md:w-48 shrink-0 relative">
                            <img 
                              src={stillUrl} 
                              alt={ep.name}
                              className="w-full aspect-video object-cover border-2 border-[#2d2d2d] rounded-lg shadow-[2px_2px_0px_#2d2d2d]"
                            />
                            <span className="absolute top-2 left-2 bg-[#2d5da1] text-white border border-[#2d2d2d] px-2 py-0.5 rounded text-xs font-bold shadow-[1px_1px_0px_#2d2d2d]">
                              E{ep.episode_number}
                            </span>
                          </div>

                          {/* Episode Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h5 className="font-heading font-bold text-2xl text-[#2d2d2d]">
                                {ep.episode_number}. {ep.name}
                              </h5>

                              {/* Watched Toggle & Rating */}
                              {user && (
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    onClick={() => handleEpisodeWatchedToggle(ep, isEpWatched, epRating, epState?.watched_date)}
                                    disabled={isEpLoading}
                                    className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                                      isEpWatched ? 'btn-primary' : 'btn-secondary'
                                    }`}
                                  >
                                    {isEpLoading ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current" />
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                        <span>{isEpWatched ? 'Watched ✓' : 'Mark Watched'}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#2d2d2d]/80">
                              {ep.air_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[#ff4d4d]" />
                                  {ep.air_date}
                                </span>
                              )}
                              {ep.runtime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#2d5da1]" />
                                  {ep.runtime} min
                                </span>
                              )}
                              {ep.vote_average != null && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
                                  TMDB {Number(ep.vote_average).toFixed(1)}/10
                                </span>
                              )}
                            </div>

                            {/* Overview */}
                            {ep.overview && (
                              <p className="text-base text-[#2d2d2d] font-body leading-relaxed">
                                {ep.overview}
                              </p>
                            )}

                            {/* Episode Rating & Watched Date controls */}
                            {user && isEpWatched && (
                              <div className="pt-2 border-t border-dashed border-[#2d2d2d]/30 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#2d2d2d]">Rating (1-10):</span>
                                  <StarRating 
                                    rating={epRating}
                                    maxStars={10}
                                    onRatingChange={(newRating) => handleEpisodeRatingChange(ep, newRating)}
                                    size="small"
                                  />
                                </div>

                                <div className="flex items-center gap-2 bg-white px-2 py-1 border border-[#2d2d2d] rounded-lg shadow-[1px_1px_0px_#2d2d2d]">
                                  <Calendar className="w-3.5 h-3.5 text-[#2d5da1] stroke-[2.5]" />
                                  <label htmlFor={`ep-date-${epKey}`} className="text-xs font-bold text-[#2d2d2d]">Watched Date:</label>
                                  <input
                                    id={`ep-date-${epKey}`}
                                    type="date"
                                    value={epState?.watched_date || ''}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleEpisodeDateChange(ep, e.target.value)}
                                    className="text-xs font-bold bg-[#fff9c4] border border-[#2d2d2d] rounded px-1.5 py-0.5"
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
              </div>
            ) : (
              <p className="text-lg font-bold text-[#2d2d2d]/70 text-center py-8">
                No episode information available for Season {selectedSeasonNumber}.
              </p>
            )}
          </div>
        )}

        {/* Public Reviews */}
        {show.reviews && show.reviews.length > 0 && (
          <div className="card relative">
            <div className="thumbtack" />
            <h3 className="text-3xl font-heading font-bold mb-6 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 stroke-[2.5] text-[#2d5da1]" />
              Community Reviews ({show.reviews.length})
            </h3>
            
            <div className="space-y-6">
              {show.reviews.map((review, index) => (
                <div key={index} className="bg-[#fdfbf7] border-2 border-[#2d2d2d] p-5 rounded-[20px_255px_20px_255px/255px_20px_255px_20px] shadow-[4px_4px_0px_#2d2d2d]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-lg font-bold shrink-0 shadow-[2px_2px_0px_#2d2d2d]">
                      {review.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Link 
                          href={`/profile/${review.username}`}
                          className="font-heading font-bold text-xl text-[#2d2d2d] hover:text-[#ff4d4d] transition-colors"
                        >
                          {review.username}
                        </Link>
                        {review.rating > 0 && (
                          <StarRating rating={review.rating} maxStars={10} readOnly size="small" />
                        )}
                        <span className="text-xs font-semibold text-[#2d2d2d]/60">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Watched Where Tags */}
                      {review.watched_where && review.watched_where.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          {review.watched_where.map((platform, i) => (
                            <span 
                              key={i} 
                              className="bg-[#fff9c4] border border-[#2d2d2d] px-2 py-0.2 rounded text-[10px] font-bold"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-lg font-body text-[#2d2d2d] leading-relaxed italic">
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="card-postit max-w-md w-full relative animate-in fade-in zoom-in duration-150">
              <div className="thumbtack" />
              <h4 className="text-2xl font-heading font-bold text-[#2d2d2d] mb-2">
                {bulkDateModal.type === 'show' ? 'Mark Entire Show Watched' : `Mark Season ${bulkDateModal.seasonNumber} Watched`}
              </h4>
              <p className="text-sm font-body text-[#2d2d2d]/80 mb-4">
                Select the date you watched {bulkDateModal.type === 'show' ? 'this show' : `Season ${bulkDateModal.seasonNumber}`}:
              </p>
              
              <div className="mb-6">
                <label htmlFor="bulkDateInput" className="block text-sm font-bold mb-1 text-[#2d2d2d]">
                  Watched Date:
                </label>
                <input
                  id="bulkDateInput"
                  type="date"
                  value={bulkDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setBulkDateModal(null)}
                  className="btn btn-secondary text-sm py-2 px-4"
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
                  className="btn btn-primary text-sm py-2 px-5"
                >
                  Confirm & Mark Watched
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
