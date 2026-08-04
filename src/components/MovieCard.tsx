'use client';

import React from 'react';
import StarRating from './StarRating';
import { Movie } from '@/types';
import { Star } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  showUserRating?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, showUserRating = false }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';

  return (
    <div className="group cursor-pointer relative pt-2">
      {/* Tape Strip Accent at Top Center */}
      <div className="tape-strip" />

      <div 
        className="bg-white border-3 border-[#2d2d2d] p-2.5 shadow-[4px_4px_0px_0px_#2d2d2d] transition-all duration-200 group-hover:shadow-[6px_6px_0px_0px_#2d2d2d] group-hover:-translate-y-1 group-hover:rotate-1"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Poster Container */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-[15px_225px_15px_255px/255px_15px_225px_15px] border-2 border-[#2d2d2d] bg-[#e5e0d8]">
          <img 
            src={posterUrl} 
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Top Badge: TMDB Rating */}
          {movie.vote_average != null && (
            <div className="absolute top-2 right-2 bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
              <span>{Number(movie.vote_average).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Text Info */}
        <div className="mt-2 px-1">
          <h3 className="font-heading font-bold text-lg text-[#2d2d2d] leading-snug line-clamp-1 group-hover:text-[#ff4d4d] transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-sm font-semibold text-[#2d2d2d]/80">
            <span className="bg-[#e5e0d8] px-2 py-0.5 rounded-full border border-[#2d2d2d] text-xs">
              {releaseYear}
            </span>
            {showUserRating && movie.rating && (
              <StarRating rating={movie.rating} readOnly size="small" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
