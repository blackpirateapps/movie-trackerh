import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme';
import { StarRating } from '../components/StarRating';

export const MovieDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { movieId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<any>(null);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=e97b878bc571b05dbfaec8423f03b9ad`);
        const data = await res.json();
        setMovie(data);
      } catch (e) {
        console.log('Error fetching movie details:', e);
      } finally {
        setLoading(false);
      }
    };
    if (movieId) fetchDetails();
  }, [movieId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!movie) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Movie not found.</Text>
      </SafeAreaView>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Poster & Basic Header Info */}
        <View style={styles.headerSection}>
          {posterUrl && <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{movie.title}</Text>
            {movie.tagline ? <Text style={styles.tagline}>"{movie.tagline}"</Text> : null}
            <Text style={styles.meta}>
              {movie.release_date?.split('-')[0]} • {movie.runtime} min • ★ {movie.vote_average?.toFixed(1)}
            </Text>

            <TouchableOpacity
              style={[styles.watchlistBtn, inWatchlist && styles.watchlistBtnActive]}
              onPress={() => setInWatchlist(!inWatchlist)}
            >
              <Text style={[styles.watchlistBtnText, inWatchlist && styles.watchlistBtnTextActive]}>
                {inWatchlist ? '✓ IN WATCHLIST' : '+ ADD TO WATCHLIST'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
          <Text style={styles.overviewText}>{movie.overview}</Text>
        </View>

        {/* Log & Rate Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RATE & REVIEW (1-10)</Text>

          <View style={{ marginVertical: 10 }}>
            <StarRating rating={userRating} onRatingChange={setUserRating} size="lg" />
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Write your review or thoughts..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
          />

          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>SAVE LOG & RATING</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 14,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagline: {
    color: COLORS.accent,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  watchlistBtn: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  watchlistBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.bgHover,
  },
  watchlistBtnText: {
    color: COLORS.textMain,
    fontSize: 11,
    fontWeight: 'bold',
  },
  watchlistBtnTextActive: {
    color: COLORS.accent,
  },
  sectionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overviewText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: COLORS.bgHover,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    color: COLORS.textMain,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.bgBase,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
