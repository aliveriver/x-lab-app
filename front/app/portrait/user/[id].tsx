import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MbtiOpposingBar from '@/components/robot/MbtiOpposingBar';
import Big5RadarChart from '@/components/robot/Big5RadarChart';
import { fetchApi } from '@/utils/api';

type UserPortrait = {
  portraitID: string;
  avatar: string;
  createdAt: number;
  updatedAt: number;
  userName: string;
  age?: number | null;
  profession: string;
  familyTies: string;
  mbti: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number };
  big5: {
    neuroticism: number;
    extraversion: number;
    openness: number;
    agreeableness: number;
    conscientiousness: number;
  };
};

const EMPTY_PORTRAIT: UserPortrait = {
  portraitID: '',
  avatar: '',
  createdAt: 0,
  updatedAt: 0,
  userName: '暂无画像',
  age: null,
  profession: '',
  familyTies: '',
  mbti: { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 },
  big5: {
    neuroticism: 0,
    extraversion: 0,
    openness: 0,
    agreeableness: 0,
    conscientiousness: 0,
  },
};

export default function UserPortraitDetail() {
  const { id, robotID } = useLocalSearchParams();
  const portraitID = String(id || '');
  const currentRobotID = String(robotID || '');
  const [portrait, setPortrait] = useState<UserPortrait>(EMPTY_PORTRAIT);

  useEffect(() => {
    if (!currentRobotID || !portraitID) return;

    const loadPortrait = async () => {
      try {
        const result = await fetchApi(`/api/robot/${currentRobotID}/userportrait/${portraitID}`);
        if ((result.code === 0 || result.code === 200) && result.data?.userPortrait) {
          setPortrait(result.data.userPortrait);
        } else {
          setPortrait(EMPTY_PORTRAIT);
        }
      } catch (e) {
        console.error('Failed to load user portrait', e);
        setPortrait(EMPTY_PORTRAIT);
      }
    };

    loadPortrait();
  }, [currentRobotID, portraitID]);

  const { mbti, big5 } = portrait;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '用户画像详情', headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#ffffff' }} />

      <ScrollView contentContainerStyle={styles.scrollArea}>
        <LinearGradient colors={['#003d79', '#011e41']} style={styles.heroCard}>
          <FontAwesome name="user-circle" size={60} color="#00e5ff" style={styles.heroIcon} />
          <Text style={styles.heroName}>{portrait.userName}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>职业: {portrait.profession || '-'}</Text>
            <Text style={styles.tag}>年龄: {portrait.age ?? '-'}</Text>
            <Text style={styles.tag}>关系: {portrait.familyTies || '-'}</Text>
          </View>
        </LinearGradient>

        <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.statsCard}>
          <Text style={styles.sectionTitle}>MBTI</Text>
          <MbtiOpposingBar leftLabel="外向" leftCode="E" leftValue={mbti.E} rightLabel="内向" rightCode="I" rightValue={mbti.I} />
          <MbtiOpposingBar leftLabel="感觉" leftCode="S" leftValue={mbti.S} rightLabel="直觉" rightCode="N" rightValue={mbti.N} />
          <MbtiOpposingBar leftLabel="思考" leftCode="T" leftValue={mbti.T} rightLabel="情感" rightCode="F" rightValue={mbti.F} />
          <MbtiOpposingBar leftLabel="判断" leftCode="J" leftValue={mbti.J} rightLabel="知觉" rightCode="P" rightValue={mbti.P} />
        </LinearGradient>

        <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Big 5</Text>
          <Big5RadarChart data={big5} />
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
});
