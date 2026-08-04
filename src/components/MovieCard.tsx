'use client';

import React from 'react';
import StarRating from './StarRating';
import { Movie } from '@/types';
import { Star, Film } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  showUserRating?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, showUserRating = false }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : null;

  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';

  return (
    <div className="group cursor-pointer flex flex-col space-y-1.5">
      {/* Aspect Ratio 2/3 Wrapper */}
      <div className="relative aspect-[2/3] overflow-hidden rounded border border-[#333333] bg-[#2A2A2A]">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#2A2A2A] text-[#A0A0A0] p-2 text-center">
            <Film className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-[10px] font-semibold line-clamp-2">{movie.title}</span>
          </div>
        )}
        
        {/* Hover Dark Overlay */}
        <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2 text-xs text-[#EDEDED]">
          <span className="font-bold text-[#00FF66] text-[11px] mb-1 line-clamp-1">{movie.title}</span>
          {movie.overview && (
            <p className="text-[10px] text-[#A0A0A0] line-clamp-3 leading-tight">{movie.overview}</p>
          )}
        </div>

        {/* TMDB Rating Badge */}
        {movie.vote_average != null && (
          <div className="absolute top-1 right-1 z-10 bg-[#121212]/90 text-[#00FF66] border border-[#333333] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-[#00FF66] text-[#00FF66]" />
            <span>{Number(movie.vote_average).toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info Header */}
      <div>
        <h3 className="font-bold text-xs text-[#EDEDED] line-clamp-1 group-hover:text-[#00FF66] transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-0.5 text-[10px] text-[#A0A0A0]">
          <span className="uppercase font-semibold tracking-wider">{releaseYear}</span>
          {showUserRating && movie.rating && (
            <StarRating rating={movie.rating} readOnly size="small" />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
