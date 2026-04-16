import React, { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_ROBOT_DETAILS, MOCK_TONES, MOCK_PERSONALITIES } from '@/constants/MockData';
import ChangeToneModal from '@/components/robot/ChangeToneModal';
import ChangePersonalityModal from '@/components/robot/ChangePersonalityModal';
import { useRobots } from '@/context/RobotContext';

export default function RobotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { robots, updateRobotName } = useRobots();
  
  const currentRobot = robots.find(r => r.robotCode === id);
  
  // States representing selected properties (Assume 1 as default mock load)
  const [toneID, setToneID] = useState<number>(1);
  const [personalityID, setPersonalityID] = useState<number>(1);
  
  // Nickname State
  const [robotName, setRobotName] = useState<string>(currentRobot?.robotName || '默认终端');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveName = () => {
    if(id) {
      updateRobotName(id as string, robotName);
    }
    setIsEditingName(false);
  };
  
  // Modals visibility
  const [toneModalVisible, setToneModalVisible] = useState(false);
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);

  // Resolving names from IDs
  const toneName = MOCK_TONES.find(t => t.toneID === toneID)?.toneName || '未知音色';
  const personalityName = MOCK_PERSONALITIES.find(p => p.personalityID === personalityID)?.personalityName || '未知人格';

  const { mbti, big5 } = MOCK_ROBOT_DETAILS;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `终端详情`, headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#ffffff' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Header */}
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

          <Text style={styles.idText}>Robot Code: {id}</Text>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsContainer}>
          <Pressable onPress={() => setToneModalVisible(true)}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="headphones" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>当前音色</Text>
                <Text style={styles.actionValue}>{toneName}</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => setPersonalityModalVisible(true)}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="user-secret" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>初始人格</Text>
                <Text style={styles.actionValue}>{personalityName}</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push({ pathname: '/(tabs)/memory', params: { targetRobot: id } })}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="database" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>云端档案</Text>
                <Text style={styles.actionValue}>检索终端记忆记录</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push({ pathname: '/(tabs)/portrait', params: { targetRobot: id } })}>
            <LinearGradient colors={['#003d79', '#011e41']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
              <FontAwesome name="address-card" size={20} color="#00e5ff" />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>神经画像矩阵</Text>
                <Text style={styles.actionValue}>锁定该终端画像</Text>
              </View>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Stats Panel */}
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
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>外倾性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.extraversion}%`}]}/></View><Text style={styles.mbtiValue}>{big5.extraversion}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>开放性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.openness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.openness}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>宜人性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.agreeableness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.agreeableness}%</Text></View>
            <View style={styles.mbtiRow}><Text style={styles.big5Label}>尽责性</Text><View style={styles.barBg}><View style={[styles.barFill, {width: `${big5.conscientiousness}%`}]}/></View><Text style={styles.mbtiValue}>{big5.conscientiousness}%</Text></View>
          </View>
        </LinearGradient>

      </ScrollView>

      <ChangeToneModal
        visible={toneModalVisible}
        currentToneID={toneID}
        onClose={() => setToneModalVisible(false)}
        onSelect={(id) => { setToneID(id); setToneModalVisible(false); }}
      />
      <ChangePersonalityModal
        visible={personalityModalVisible}
        currentPersonalityID={personalityID}
        onClose={() => setPersonalityModalVisible(false)}
        onSelect={(id) => { setPersonalityID(id); setPersonalityModalVisible(false); }}
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
  mbtiGrid: {
    backgroundColor: 'transparent',
  },
  mbtiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  mbtiLabel: {
    width: 20,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  big5Label: {
    width: 60,
    color: '#94a3b8',
    fontSize: 12,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
    borderRadius: 3,
  },
  mbtiValue: {
    width: 35,
    textAlign: 'right',
    color: '#ffffff',
    fontSize: 12,
  }
});
