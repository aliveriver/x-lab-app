import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';

type MbtiBarProps = {
  leftLabel: string;
  leftCode: string; // e.g. E
  leftValue: number; // percentage e.g. 85.6
  rightLabel: string;
  rightCode: string; // e.g. I
  rightValue: number; // percentage
};

export default function MbtiOpposingBar({ leftLabel, leftCode, leftValue, rightLabel, rightCode, rightValue }: MbtiBarProps) {
  const isLeftDominant = leftValue >= rightValue;
  
  // Choose color based on dominance: neon cyan for dominant side, grey for inferior side.
  const DOMINANT_COLOR = '#00e5ff'; // Or green if exactly mimicking, but matching app theme is better
  const INFERIOR_COLOR = '#94a3b8';

  return (
    <View style={styles.container}>
      {/* Top Labels Row */}
      <View style={styles.labelsRow}>
        <View style={styles.colLeft}>
          <Text style={[styles.traitTitle, { color: isLeftDominant ? DOMINANT_COLOR : INFERIOR_COLOR }]}>
            {leftLabel} ({leftCode})
          </Text>
          <Text style={[styles.traitValue, { color: isLeftDominant ? DOMINANT_COLOR : INFERIOR_COLOR }]}>
            {leftValue.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.colRight}>
          <Text style={[styles.traitTitle, { color: !isLeftDominant ? DOMINANT_COLOR : INFERIOR_COLOR }]}>
            {rightLabel} ({rightCode})
          </Text>
          <Text style={[styles.traitValue, { color: !isLeftDominant ? DOMINANT_COLOR : INFERIOR_COLOR }]}>
            {rightValue.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Opposing Bar Representation */}
      <View style={styles.barBackground}>
        {isLeftDominant ? (
          <View style={[styles.barFill, { left: 0, width: `${leftValue}%` }]} />
        ) : (
          <View style={[styles.barFill, { right: 0, width: `${rightValue}%` }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  colLeft: {
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  colRight: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  traitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 1,
  },
  traitValue: {
    fontSize: 12,
  },
  barBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#00e5ff',
    borderRadius: 5,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  }
});
