export interface User {
  id: string | number;
  username: string;
  email: string;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  pref_default_layout?: 'grid' | 'list';
  pref_hide_nsfw?: boolean | number;
  pref_is_private?: boolean | number;
  created_at?: string;
  stats?: {
    movies: number;
    tv_shows?: number;
    hours_watched?: number;
    followers: number;
    following: number;
  };
}

export interface Movie {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  runtime?: number | null;
  vote_average?: number | null;
  rating?: number;
  review?: string;
  watched_date?: string;
  created_at?: string;
  updated_at?: string;
  genres?: Array<{ id: number; name: string }>;
  currentUserReview?: {
    rating?: number;
    review?: string;
    watched_date?: string;
    created_at?: string;
  } | null;
  isInWatchlist?: boolean;
  reviews?: MovieReview[];
}

export interface MovieReview {
  rating: number;
  review: string;
  watched_date?: string;
  created_at: string;
  username: string;
}

export interface Episode {
  id?: number;
  tv_show_id?: number;
  season_number: number;
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string | null;
  air_date?: string;
  vote_average?: number | null;
  runtime?: number | null;
  watched?: boolean;
  user_rating?: number | null;
}

export interface Season {
  id?: number;
  tv_show_id?: number;
  season_number: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  air_date?: string;
  episode_count?: number;
  episodes?: Episode[];
}

export interface TVShow {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number | null;
  genres?: Array<{ id: number; name: string }>;
  seasons?: Season[];
  currentUserTrack?: {
    rating?: number;
    review?: string;
    is_favorite?: boolean;
    start_date?: string;
    end_date?: string;
    watched_where?: string[];
    created_at?: string;
  } | null;
  userEpisodes?: Record<string, { watched: boolean; rating?: number; watched_date?: string }>;
  reviews?: TVShowReview[];
  // For profile list view
  rating?: number;
  review?: string;
  is_favorite?: boolean;
  start_date?: string;
  end_date?: string;
  watched_where?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TVShowReview {
  rating: number;
  review: string;
  is_favorite?: boolean;
  start_date?: string;
  end_date?: string;
  watched_where?: string[];
  created_at: string;
  username: string;
}

export interface FeedItem {
  id: number;
  user_id: number;
  type?: 'movie' | 'tv';
  movieId?: number;
  movie_id?: number;
  tvShowId?: number;
  tv_show_id?: number;
  rating: number;
  review: string;
  watched_date?: string;
  created_at: string;
  updated_at: string;
  username: string;
  movieTitle?: string;
  tvShowName?: string;
  poster_path?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
}
