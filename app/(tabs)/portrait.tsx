import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function PortraitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>用户画像数据</Text>
      <View style={styles.separator} lightColor="#00e5ff" darkColor="rgba(0, 229, 255, 0.2)" />
      <Text style={styles.subtitle}>Behavioral Portrait Analysis</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00e5ff',
    textShadowColor: 'rgba(0, 229, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  separator: {
    marginVertical: 30,
    height: 2,
    width: '80%',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    letterSpacing: 2,
  }
});
