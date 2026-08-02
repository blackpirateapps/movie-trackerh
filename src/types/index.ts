export interface User {
  id: string | number;
  username: string;
  email: string;
  created_at?: string;
  stats?: {
    movies: number;
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

export interface FeedItem {
  id: number;
  user_id: number;
  movieId: number;
  movie_id?: number;
  rating: number;
  review: string;
  watched_date?: string;
  created_at: string;
  updated_at: string;
  username: string;
  movieTitle: string;
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
