import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_USER_PORTRAITS } from '@/constants/MockData';

export default function UserPortraitDetail() {
  const { id } = useLocalSearchParams();
  const userData = MOCK_USER_PORTRAITS.find(u => u.portraitID === id) || MOCK_USER_PORTRAITS[0];
  const { mbti, big5 } = userData;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '独立用户档案解构', headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#ffffff' }} />
      
      <ScrollView contentContainerStyle={styles.scrollArea}>
        {/* Core Identity Panel */}
        <LinearGradient colors={['#003d79', '#011e41']} style={styles.heroCard}>
          <FontAwesome name="user-circle" size={60} color="#00e5ff" style={styles.heroIcon} />
          <Text style={styles.heroName}>{userData.userName}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>职能: {userData.profession}</Text>
            <Text style={styles.tag}>年限: {userData.age}</Text>
            <Text style={styles.tag}>族属: {userData.familyTies}</Text>
          </View>
        </LinearGradient>

        {/* MBTI Stats */}
        <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.statsCard}>
          <Text style={styles.sectionTitle}>人格矩阵剖析 (MBTI)</Text>
          <View style={styles.mbtiGrid}>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>E</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.E}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.E}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>I</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.I}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.I}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>S</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.S}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.S}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>N</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.N}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.N}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>T</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.T}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.T}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>F</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.F}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.F}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>J</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.J}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.J}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.mbtiLabel}>P</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${mbti.P}%`}]}/></View><Text style={styles.mbtiValue}>{mbti.P}%</Text></View>
          </View>
        </LinearGradient>

        <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.statsCard}>
          <Text style={styles.sectionTitle}>大五人格系数 (Big 5)</Text>
          <View style={styles.mbtiGrid}>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>神经质</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.neuroticism}%`}]}/></View><Text style={styles.mbtiValue}>{big5.neuroticism}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>外向性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.extraversion}%`}]}/></View><Text style={styles.mbtiValue}>{big5.extraversion}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>开放性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.openness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.openness}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>宜人性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.agreeableness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.agreeableness}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>尽责性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.conscientiousness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.conscientiousness}%</Text></View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#011e41' },
  scrollArea: { padding: 20 },
  heroCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    marginBottom: 20,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heroIcon: { marginBottom: 15 },
  heroName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: 'transparent' },
  tag: {
    color: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 5,
    marginBottom: 5,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  
  statsCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: 20,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#00e5ff', marginBottom: 15, letterSpacing: 1 },
  mbtiGrid: { backgroundColor: 'transparent' },
  mbtiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: 'transparent' },
  mbtiLabel: { color: '#94a3b8', width: 25, fontSize: 14, fontWeight: 'bold' },
  big5Label: { color: '#94a3b8', width: 55, fontSize: 14 },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(148, 163, 184, 0.2)', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#00e5ff', borderRadius: 4 },
  mbtiValue: { color: '#ffffff', width: 40, textAlign: 'right', fontSize: 12 },
});
