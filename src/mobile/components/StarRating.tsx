import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

interface StarRatingProps {
  rating: number; // 1 to 10
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}) => {
  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((star) => {
          const isFilled = star <= rating;
          return (
            <TouchableOpacity
              key={star}
              disabled={readonly}
              onPress={() => onRatingChange && onRatingChange(star)}
              style={styles.starBtn}
            >
              <Text
                style={[
                  styles.starText,
                  { fontSize: getFontSize() },
                  isFilled ? styles.starActive : styles.starInactive,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {rating > 0 && (
        <Text style={[styles.badgeText, { fontSize: getFontSize() }]}>
          {rating}/10
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    paddingHorizontal: 1,
  },
  starText: {
    lineHeight: 22,
  },
  starActive: {
    color: COLORS.accent,
  },
  starInactive: {
    color: COLORS.borderSubtle,
  },
  badgeText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
