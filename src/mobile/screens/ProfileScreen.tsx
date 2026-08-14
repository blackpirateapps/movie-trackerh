import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export const ProfileScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>USER PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.displayName}>Movie Enthusiast</Text>
          <Text style={styles.username}>@movie_fan</Text>
          <Text style={styles.bio}>Tracking films and TV series. Lover of sci-fi and thrillers.</Text>
        </View>

        {/* Developer & Integration Portal Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DEVELOPER & API PORTAL</Text>
          <Text style={styles.sectionDesc}>
            Manage REST API keys, export user data, or view API specifications.
          </Text>

          <TouchableOpacity style={styles.btnAccent}>
            <Text style={styles.btnAccentText}>🔑 GENERATE REST API KEY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSubtle}>
            <Text style={styles.btnSubtleText}>📦 FULL DATA EXPORT API</Text>
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
  profileCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgHover,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  displayName: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: COLORS.accent,
    fontSize: 13,
    marginTop: 2,
  },
  bio: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
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
    marginBottom: 6,
  },
  sectionDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  btnAccent: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnAccentText: {
    color: COLORS.bgBase,
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnSubtle: {
    backgroundColor: COLORS.bgHover,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSubtleText: {
    color: COLORS.textMain,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
