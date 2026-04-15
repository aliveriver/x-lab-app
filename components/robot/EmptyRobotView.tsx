import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';

type EmptyRobotViewProps = {
  onAddPress: () => void;
};

export default function EmptyRobotView({ onAddPress }: EmptyRobotViewProps) {
  return (
    <View style={styles.container}>
      <FontAwesome name="microchip" size={80} color="rgba(0, 229, 255, 0.4)" style={styles.icon} />
      <Text style={styles.title}>神经网未接入终端</Text>
      <Text style={styles.subtitle}>当前系统未检测到任何绑定的机器人单元，请初始化网络。</Text>

      <Pressable onPress={onAddPress} style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.8 : 1 }
      ]}>
        <View style={styles.buttonInner}>
          <FontAwesome name="plus" size={18} color="#011e41" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>接入新终端</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  icon: {
    marginBottom: 20,
    textShadowColor: 'rgba(0, 229, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00e5ff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#00e5ff',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#011e41',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
