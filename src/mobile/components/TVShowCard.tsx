import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

interface TVShowCardProps {
  tvShow: {
    id: number;
    name: string;
    poster_path?: string | null;
    first_air_date?: string;
    vote_average?: number;
    user_rating?: number;
    is_favorite?: boolean;
  };
  onPress?: () => void;
}

export const TVShowCard: React.FC<TVShowCardProps> = ({ tvShow, onPress }) => {
  const imageUrl = tvShow.poster_path
    ? `https://image.tmdb.org/t/p/w342${tvShow.poster_path}`
    : 'https://via.placeholder.com/342x513/1E1E1E/A0A0A0?text=No+Poster';

  const airYear = tvShow.first_air_date ? tvShow.first_air_date.split('-')[0] : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: imageUrl }} style={styles.poster} resizeMode="cover" />
        {tvShow.is_favorite ? (
          <View style={styles.favBadge}>
            <Text style={styles.favText}>♥</Text>
          </View>
        ) : null}
        {tvShow.user_rating ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {tvShow.user_rating}</Text>
          </View>
        ) : tvShow.vote_average ? (
          <View style={styles.tmdbBadge}>
            <Text style={styles.tmdbText}>{tvShow.vote_average.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {tvShow.name}
        </Text>
        {airYear ? <Text style={styles.year}>{airYear}</Text> : null}
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
  favBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 77, 77, 0.9)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingBadge: {
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
  ratingText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tmdbBadge: {
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
  tmdbText: {
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
