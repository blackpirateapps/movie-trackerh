'use client';

import React from 'react';
import StarRating from './StarRating';
import { TVShow } from '@/types';
import { Star, Heart, Tv } from 'lucide-react';

interface TVShowCardProps {
  show: TVShow;
  showUserRating?: boolean;
}

const TVShowCard: React.FC<TVShowCardProps> = ({ show, showUserRating = false }) => {
  const posterUrl = show.poster_path 
    ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  const releaseYear = show.first_air_date 
    ? new Date(show.first_air_date).getFullYear()
    : 'N/A';

  return (
    <div className="group cursor-pointer relative pt-2">
      {/* Tape Strip Accent */}
      <div className="tape-strip" />

      <div 
        className="bg-white border-3 border-[#2d2d2d] p-2.5 shadow-[4px_4px_0px_0px_#2d2d2d] transition-all duration-200 group-hover:shadow-[6px_6px_0px_0px_#2d2d2d] group-hover:-translate-y-1 group-hover:rotate-1"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Poster Container */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-[15px_225px_15px_255px/255px_15px_225px_15px] border-2 border-[#2d2d2d] bg-[#e5e0d8]">
          <img 
            src={posterUrl} 
            alt={show.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Favorite Badge */}
          {show.is_favorite && (
            <div className="absolute top-2 left-2 bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] rounded-full p-1.5 shadow-[2px_2px_0px_#2d2d2d]">
              <Heart className="w-3.5 h-3.5 fill-white stroke-[2]" />
            </div>
          )}

          {/* Top Badge: Rating */}
          {show.vote_average != null && (
            <div className="absolute top-2 right-2 bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
              <span>{Number(show.vote_average).toFixed(1)}</span>
            </div>
          )}

          {/* Type Tag */}
          <div className="absolute bottom-2 left-2 bg-[#2d5da1] text-white border border-[#2d2d2d] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_#2d2d2d]">
            <Tv className="w-3 h-3 stroke-[2.5]" />
            <span>TV Show</span>
          </div>
        </div>

        {/* Text Info */}
        <div className="mt-2 px-1">
          <h3 className="font-heading font-bold text-lg text-[#2d2d2d] leading-snug line-clamp-1 group-hover:text-[#ff4d4d] transition-colors">
            {show.name}
          </h3>

          <div className="flex items-center justify-between mt-1 text-sm font-semibold text-[#2d2d2d]/80">
            <span className="bg-[#e5e0d8] px-2 py-0.5 rounded-full border border-[#2d2d2d] text-xs">
              {releaseYear}
            </span>

            {showUserRating && show.rating && (
              <StarRating rating={show.rating} readOnly size="small" />
            )}
          </div>

          {/* Watched Where Platform Tags */}
          {show.watched_where && show.watched_where.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {show.watched_where.slice(0, 3).map((tag, i) => (
                <span 
                  key={i}
                  className="bg-[#fff9c4] text-[#2d2d2d] border border-[#2d2d2d] px-1.5 py-0.2 rounded text-[10px] font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVShowCard;
