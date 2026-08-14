import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme';

export const TVDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { tvShowId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [tvShow, setTvShow] = useState<any>(null);
  const [markedWatched, setMarkedWatched] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tvShowId}?api_key=e97b878bc571b05dbfaec8423f03b9ad`);
        const data = await res.json();
        setTvShow(data);
      } catch (e) {
        console.log('Error fetching TV details:', e);
      } finally {
        setLoading(false);
      }
    };
    if (tvShowId) fetchDetails();
  }, [tvShowId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!tvShow) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>TV show not found.</Text>
      </SafeAreaView>
    );
  }

  const posterUrl = tvShow.poster_path
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Poster & Details */}
        <View style={styles.headerSection}>
          {posterUrl && <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{tvShow.name}</Text>
            <Text style={styles.meta}>
              {tvShow.first_air_date?.split('-')[0]} • {tvShow.number_of_seasons} Seasons • {tvShow.number_of_episodes} Episodes
            </Text>

            <TouchableOpacity
              style={[styles.bulkBtn, markedWatched && styles.bulkBtnActive]}
              onPress={() => setMarkedWatched(!markedWatched)}
            >
              <Text style={[styles.bulkBtnText, markedWatched && styles.bulkBtnTextActive]}>
                {markedWatched ? '✓ SHOW MARKED WATCHED' : 'MARK ENTIRE SHOW AS WATCHED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
          <Text style={styles.overviewText}>{tvShow.overview}</Text>
        </View>

        {/* Seasons List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SEASONS ({tvShow.seasons?.length || 0})</Text>
          {tvShow.seasons?.map((season: any) => (
            <View key={season.id} style={styles.seasonRow}>
              <Text style={styles.seasonName}>{season.name}</Text>
              <Text style={styles.seasonCount}>{season.episode_count} Episodes</Text>
            </View>
          ))}
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
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  bulkBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  bulkBtnActive: {
    backgroundColor: COLORS.bgHover,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  bulkBtnText: {
    color: COLORS.bgBase,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bulkBtnTextActive: {
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
  seasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  seasonName: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: 'bold',
  },
  seasonCount: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
