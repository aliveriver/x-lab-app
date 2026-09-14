import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ChangeToneModal from '@/components/robot/ChangeToneModal';
import MbtiOpposingBar from '@/components/robot/MbtiOpposingBar';
import Big5RadarChart from '@/components/robot/Big5RadarChart';
import { useRobots } from '@/context/RobotContext';
import { fetchApi } from '@/utils/api';

type PersonalityData = {
  mbti: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number };
  big5: {
    neuroticism: number;
    extraversion: number;
    openness: number;
    agreeableness: number;
    conscientiousness: number;
  };
};

const EMPTY_PERSONALITY: PersonalityData = {
  mbti: { E: 50, I: 50, S: 50, N: 50, T: 50, F: 50, J: 50, P: 50 },
  big5: {
    neuroticism: 0,
    extraversion: 0,
    openness: 0,
    agreeableness: 0,
    conscientiousness: 0,
  },
};

export default function RobotDetailScreen() {
  const { id } = useLocalSearchParams();
  const robotID = String(id || '');
  const router = useRouter();
  const { robots, updateRobotName } = useRobots();
  const currentRobot = robots.find(r => r.robotCode === robotID);

  const [toneID, setToneID] = useState<number | null>(null);
  const [toneName, setToneName] = useState('请选择音色');
  const [personalityID, setPersonalityID] = useState<number | null>(null);
  const [personalityName, setPersonalityName] = useState('请选择初始人格');
  const [personality, setPersonality] = useState<PersonalityData>(EMPTY_PERSONALITY);
  const [robotName, setRobotName] = useState<string>(currentRobot?.robotName || '机器人');
  const [isEditingName, setIsEditingName] = useState(false);
  const [toneModalVisible, setToneModalVisible] = useState(false);

  useEffect(() => {
    if (currentRobot?.robotName) {
      setRobotName(currentRobot.robotName);
    }
    if (currentRobot?.toneID) setToneID(currentRobot.toneID);
    if (currentRobot?.personalityID) setPersonalityID(currentRobot.personalityID);
  }, [currentRobot?.robotName, currentRobot?.toneID, currentRobot?.personalityID]);

  useEffect(() => {
    if (!robotID) return;

    const loadNames = async () => {
      try {
        if (currentRobot?.toneID) {
          const toneRes = await fetchApi(`/api/robot/${robotID}/tone`);
          if ((toneRes.code === 0 || toneRes.code === 200) && toneRes.data?.toneList) {
            const tone = toneRes.data.toneList.find((t: any) => t.toneID === currentRobot.toneID);
            if (tone) setToneName(tone.toneName);
          }
        }
        if (currentRobot?.personalityID) {
          const pRes = await fetchApi(`/api/robot/${robotID}/initPersonality`);
          if ((pRes.code === 0 || pRes.code === 200) && pRes.data?.personalityList) {
            const p = pRes.data.personalityList.find((p: any) => p.personalityID === currentRobot.personalityID);
            if (p) setPersonalityName(p.personalityName);
          }
        }
      } catch (e) {
        console.error('Failed to load names', e);
      }
    };

    loadNames();
  }, [robotID, currentRobot?.toneID, currentRobot?.personalityID]);

  useEffect(() => {
    if (!robotID) return;

    const loadPersonality = async () => {
      try {
        const result = await fetchApi(`/api/robot/${robotID}/personality`);
        if ((result.code === 0 || result.code === 200) && result.data) {
          setPersonality(result.data);
        } else {
          setPersonality(EMPTY_PERSONALITY);
        }
      } catch (e) {
        console.error('Failed to load robot personality', e);
        setPersonality(EMPTY_PERSONALITY);
      }
    };

    loadPersonality();
  }, [robotID]);

  const handleSaveName = () => {
    if (robotID) {
      updateRobotName(robotID, robotName);
    }
    setIsEditingName(false);
  };

  const handleToneSelect = async (nextToneID: number, nextToneName: string) => {
    setToneID(nextToneID);
    setToneName(nextToneName);
    setToneModalVisible(false);

    try {
      await fetchApi(`/api/robot/${robotID}/tone/change`, {
        method: 'PUT',
        bodyData: { robotID, toneID: nextToneID },
      });
    } catch (e) {
      console.error('Failed to change tone', e);
    }
  };

  const { mbti, big5 } = personality;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '机器人详情', headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#ffffff' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <FontAwesome name="android" size={50} color="#00e5ff" style={styles.avatar} />

          {isEditingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={robotName}
                onChangeText={setRobotName}
                autoFocus
              />
              <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                <Text style={styles.saveNameText}>保存</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.nameDisplayRow}>
              <Text style={styles.nameText}>{robotName}</Text>
              <Pressable onPress={() => setIsEditingName(true)} style={styles.editIcon}>
                <FontAwesome name="pencil" size={16} color="#00e5ff" />
              </Pressable>
            </View>
          )}

          <Text style={styles.idText}>Robot Code: {robotID}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <Pressable onPress={() => router.push({ pathname: '/robot/[id]/trajectory', params: { id: robotID } })}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="road" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>运动轨迹</Text>
                <Text style={styles.actionValue}>录制、管理并复刻动作</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => setToneModalVisible(true)}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="headphones" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>音色</Text>
                <Text style={styles.actionValue}>{toneName}</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <View>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="user-secret" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>初始人格</Text>
                <Text style={styles.actionValue}>{personalityName}</Text>
              </View>
              <FontAwesome name="lock" size={18} color="#475569" />
            </LinearGradient>
          </View>

          <Pressable onPress={() => router.push({ pathname: '/(tabs)/memory', params: { targetRobot: robotID } })}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="database" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>记忆</Text>
                <Text style={styles.actionValue}>查看消息和摘要</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push({ pathname: '/(tabs)/portrait', params: { targetRobot: robotID } })}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="address-card" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>画像</Text>
                <Text style={styles.actionValue}>查看用户画像和家庭画像</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>
        </View>

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

      <ChangeToneModal
        visible={toneModalVisible}
        robotID={robotID}
        currentToneID={toneID}
        onClose={() => setToneModalVisible(false)}
        onSelect={handleToneSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
  avatar: {
    marginBottom: 10,
    textShadowColor: 'rgba(0, 229, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editIcon: {
    marginLeft: 10,
    padding: 5,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#00e5ff',
    color: '#ffffff',
    fontSize: 20,
    paddingVertical: 2,
    minWidth: 120,
    textAlign: 'center',
  },
  saveNameBtn: {
    marginLeft: 10,
    backgroundColor: '#00e5ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveNameText: {
    color: '#011e41',
    fontWeight: 'bold',
    fontSize: 12,
  },
  idText: {
    fontSize: 14,
    color: '#c2d2e4',
    letterSpacing: 1,
  },
  controlsContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  actionLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actionValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00e5ff',
    marginBottom: 15,
  },
});
