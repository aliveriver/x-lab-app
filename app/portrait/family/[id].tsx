import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_FAMILY_PORTRAIT } from '@/constants/MockData';

export default function FamilyPortraitDetail() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '家庭综合画像解析', headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#ffffff' }} />
      
      <ScrollView contentContainerStyle={styles.scrollArea}>
        <LinearGradient colors={['#004e92', '#000428']} style={styles.heroCard}>
          <FontAwesome name="sitemap" size={60} color="#00e5ff" style={styles.heroIcon} />
          <Text style={styles.heroId}>Family Node: {MOCK_FAMILY_PORTRAIT.familyID}</Text>
          <Text style={styles.heroSub}>绑定终端：{id}</Text>
        </LinearGradient>

        <View style={styles.infoBlock}>
          <View style={styles.blockHeader}>
            <FontAwesome name="file-text" size={18} color="#00e5ff" />
            <Text style={styles.blockTitle}>家庭生态综合分析档案</Text>
          </View>
          <Text style={styles.blockContent}>{MOCK_FAMILY_PORTRAIT.content}</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaText}>档案初次生成：{new Date(MOCK_FAMILY_PORTRAIT.createdAt).toLocaleString()}</Text>
          <Text style={styles.metaText}>最近动态覆写：{new Date(MOCK_FAMILY_PORTRAIT.updatedAt).toLocaleString()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#011e41' },
  scrollArea: { padding: 20, paddingTop: 30 },
  heroCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  heroIcon: { marginBottom: 20, textShadowColor: '#00e5ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  heroId: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 8, letterSpacing: 2 },
  heroSub: { color: '#00e5ff', fontSize: 14, opacity: 0.8 },
  
  infoBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: 20,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent' },
  blockTitle: { color: '#00e5ff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  blockContent: { color: '#ffffff', fontSize: 15, lineHeight: 28 },
  
  metaBlock: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: 20,
  },
  metaText: { color: '#475569', fontSize: 12, marginBottom: 5 }
});
