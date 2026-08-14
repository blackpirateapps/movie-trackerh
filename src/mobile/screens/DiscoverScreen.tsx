import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme';
import { MovieCard } from '../components/MovieCard';
import { TVShowCard } from '../components/TVShowCard';

export const DiscoverScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=e97b878bc571b05dbfaec8423f03b9ad&query=${encodeURIComponent(
          text
        )}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) => {
    if (mediaType === 'movie') return item.media_type === 'movie';
    if (mediaType === 'tv') return item.media_type === 'tv';
    return item.media_type === 'movie' || item.media_type === 'tv';
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>UNIVERSAL SEARCH</Text>
      </View>

      <View style={styles.searchBoxContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search films, TV shows..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>

      {/* Media Filter Switcher */}
      <View style={styles.filterRow}>
        {(['all', 'movie', 'tv'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, mediaType === type && styles.filterChipActive]}
            onPress={() => setMediaType(type)}
          >
            <Text style={[styles.filterChipText, mediaType === type && styles.filterChipTextActive]}>
              {type === 'all' ? 'ALL RESULTS' : type === 'movie' ? 'FILMS' : 'TV SHOWS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginVertical: 30 }} />
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.media_type}_${item.id}`}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              {item.media_type === 'movie' ? (
                <MovieCard
                  movie={{
                    id: item.id,
                    title: item.title || item.original_title,
                    poster_path: item.poster_path,
                    release_date: item.release_date,
                    vote_average: item.vote_average,
                  }}
                  onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
                />
              ) : (
                <TVShowCard
                  tvShow={{
                    id: item.id,
                    name: item.name || item.original_name,
                    poster_path: item.poster_path,
                    first_air_date: item.first_air_date,
                    vote_average: item.vote_average,
                  }}
                  onPress={() => navigation.navigate('TVDetail', { tvShowId: item.id })}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            query ? (
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            ) : (
              <Text style={styles.emptyText}>Type above to start searching TMDB & Database</Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgSurface,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  searchBoxContainer: {
    padding: 16,
  },
  input: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    color: COLORS.textMain,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgSurface,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: COLORS.bgBase,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    margin: 6,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
