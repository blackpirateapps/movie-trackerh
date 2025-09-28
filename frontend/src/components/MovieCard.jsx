import StarRating from './StarRating';
import './MovieCard.css';

const MovieCard = ({ movie, showUserRating = false }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : '/api/placeholder/300/450';

  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';

  return (
    <div className="movie-card animate-fade-in">
      <div className="movie-poster">
        <img 
          src={posterUrl} 
          alt={movie.title}
          loading="lazy"
          className="poster-image"
        />
        <div className="movie-overlay">
          <div className="movie-info">
            <h3 className="movie-title">{movie.title}</h3>
            <p className="movie-year">{releaseYear}</p>
            {movie.vote_average && (
              <div className="movie-rating">
                <span className="rating-icon">⭐</span>
                <span className="rating-value">{movie.vote_average.toFixed(1)}</span>
              </div>
            )}
          </div>
          {showUserRating && movie.rating && (
            <div className="user-rating">
              <StarRating rating={movie.rating} readOnly size="small" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;