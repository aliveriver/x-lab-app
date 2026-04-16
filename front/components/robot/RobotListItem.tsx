import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type RobotListItemProps = {
  robotCode: string;
  robotName: string;
};

export default function RobotListItem({ robotCode, robotName }: RobotListItemProps) {
  return (
    <Link href={`/robot/${robotCode}`} asChild>
      <Pressable>
        {({ pressed }) => (
          <LinearGradient
            colors={['#003d79', '#011e41']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome name="android" size={32} color="#00e5ff" />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{robotName}</Text>
              <Text style={styles.code}>ID: {robotCode}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#00e5ff" />
          </LinearGradient>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  code: {
    fontSize: 12,
    color: '#00e5ff',
    opacity: 0.8,
  },
});
