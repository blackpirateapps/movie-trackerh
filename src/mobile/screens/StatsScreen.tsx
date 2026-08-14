import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export const StatsScreen: React.FC = () => {
  const statsData = {
    hoursWatched: 342,
    daysSpent: 14.25,
    filmsCount: 128,
    tvShowsCount: 45,
    avgRating: 8.4,
    currentStreak: 12,
    longestStreak: 28,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ANALYTICS & STATS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Metric Summary Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statsData.hoursWatched}h</Text>
            <Text style={styles.statLabel}>HOURS WATCHED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statsData.daysSpent}d</Text>
            <Text style={styles.statLabel}>DAYS NON-STOP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statsData.filmsCount}</Text>
            <Text style={styles.statLabel}>FILMS LOGGED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statsData.tvShowsCount}</Text>
            <Text style={styles.statLabel}>TV SHOWS TRACKED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>★ {statsData.avgRating}</Text>
            <Text style={styles.statLabel}>AVG RATING (1-10)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>🔥 {statsData.currentStreak}d</Text>
            <Text style={styles.statLabel}>WATCH STREAK</Text>
          </View>
        </View>

        {/* Rating Distribution Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RATING SPECTRUM (1-10)</Text>
          <View style={styles.spectrumBar}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const heightPct = num * 9;
              return (
                <View key={num} style={styles.spectrumCol}>
                  <View
                    style={[
                      styles.spectrumFill,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: num >= 7 ? COLORS.accent : num >= 4 ? COLORS.warning : COLORS.danger,
                      },
                    ]}
                  />
                  <Text style={styles.spectrumNum}>{num}</Text>
                </View>
              );
            })}
          </View>
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
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  spectrumBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
  },
  spectrumCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  spectrumFill: {
    width: 14,
    borderRadius: 2,
  },
  spectrumNum: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
});
