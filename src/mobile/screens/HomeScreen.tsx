import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../theme';
import { MovieCard } from '../components/MovieCard';
import { TVShowCard } from '../components/TVShowCard';
import { StarRating } from '../components/StarRating';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [popularTV, setPopularTV] = useState<any[]>([]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      // Fetch popular releases directly from TMDB or API endpoints
      const resMovies = await fetch('https://api.themoviedb.org/3/trending/movie/week?api_key=e97b878bc571b05dbfaec8423f03b9ad');
      const dataMovies = await resMovies.json();
      setPopularMovies(dataMovies.results || []);

      const resTV = await fetch('https://api.themoviedb.org/3/trending/tv/week?api_key=e97b878bc571b05dbfaec8423f03b9ad');
      const dataTV = await resTV.json();
      setPopularTV(dataTV.results || []);
    } catch (e) {
      console.log('Error fetching home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>CINE<Text style={styles.brandAccent}>TRACKER</Text></Text>
          <Text style={styles.brandSubtitle}>MOBILE</Text>
        </View>
        <TouchableOpacity
          style={styles.profileIconBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Quick Search Action Bar */}
        <TouchableOpacity
          style={styles.searchBarContainer}
          onPress={() => navigation.navigate('Discover')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchPlaceholder}>🔍 Search movies, TV shows...</Text>
          <View style={styles.searchBadge}>
            <Text style={styles.searchBadgeText}>Cmd+K</Text>
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Featured Trending Movies */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TRENDING MOVIES</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
                  <Text style={styles.seeAllText}>SEE ALL ›</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {popularMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Featured Trending TV Shows */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>POPULAR TV SERIES</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
                  <Text style={styles.seeAllText}>SEE ALL ›</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {popularTV.map((show) => (
                  <TVShowCard
                    key={show.id}
                    tvShow={show}
                    onPress={() => navigation.navigate('TVDetail', { tvShowId: show.id })}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgSurface,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  brandTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandAccent: {
    color: COLORS.accent,
  },
  brandSubtitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgHover,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  searchBadge: {
    backgroundColor: COLORS.bgHover,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  searchBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  seeAllText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
});
