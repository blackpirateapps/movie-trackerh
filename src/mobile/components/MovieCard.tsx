import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { StarRating } from './StarRating';

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path?: string | null;
    release_date?: string;
    vote_average?: number;
    user_rating?: number;
  };
  onPress?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress }) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : 'https://via.placeholder.com/342x513/1E1E1E/A0A0A0?text=No+Poster';

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: imageUrl }} style={styles.poster} resizeMode="cover" />
        {movie.user_rating ? (
          <View style={styles.userRatingBadge}>
            <Text style={styles.userRatingText}>★ {movie.user_rating}</Text>
          </View>
        ) : movie.vote_average ? (
          <View style={styles.tmdbRatingBadge}>
            <Text style={styles.tmdbRatingText}>TMDB {movie.vote_average.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {movie.title}
        </Text>
        {releaseYear ? <Text style={styles.year}>{releaseYear}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  posterContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: COLORS.bgHover,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  userRatingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderColor: COLORS.accent,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userRatingText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tmdbRatingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tmdbRatingText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    padding: 8,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: 'bold',
  },
  year: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
