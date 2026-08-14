import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../theme';

const MOCK_FEED = [
  {
    id: '1',
    user: 'cinemaniac',
    action: 'rated movie',
    title: 'Dune: Part Two',
    rating: 10,
    review: 'Masterpiece of modern sci-fi filmmaking. Sound design is legendary.',
    time: '2h ago',
  },
  {
    id: '2',
    user: 'alex_director',
    action: 'tracked TV show',
    title: 'The Bear (Season 3)',
    rating: 9,
    review: 'Frenetic, tense, beautifully shot episodes.',
    time: '4h ago',
  },
  {
    id: '3',
    user: 'film_critic_99',
    action: 'added to watchlist',
    title: 'Oppenheimer',
    rating: 9,
    review: 'Unbelievable performance and score.',
    time: '1d ago',
  },
];

export const FeedScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>COMMUNITY ACTIVITY FEED</Text>
      </View>

      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.feedCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>@{item.user}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>

            <Text style={styles.actionText}>{item.action} <Text style={styles.itemTitle}>{item.title}</Text></Text>

            {item.rating ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {item.rating}/10</Text>
              </View>
            ) : null}

            {item.review ? (
              <Text style={styles.reviewText}>"{item.review}"</Text>
            ) : null}
          </View>
        )}
      />
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
  listContent: {
    padding: 16,
  },
  feedCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userName: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 13,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  actionText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  itemTitle: {
    color: COLORS.textMain,
    fontWeight: 'bold',
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgHover,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  reviewText: {
    color: COLORS.textMain,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
