import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRobots } from '@/context/RobotContext';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchApi } from '@/utils/api';

type FamilyPortrait = {
  familyID: string;
  createdAt: number;
  updatedAt: number;
  content: string;
};

type UserPortrait = {
  portraitID: string;
  avatar: string;
};

export default function PortraitScreen() {
  const router = useRouter();
  const { targetRobot } = useLocalSearchParams();
  const { robots } = useRobots();
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyPortrait, setFamilyPortrait] = useState<FamilyPortrait | null>(null);
  const [userPortraits, setUserPortraits] = useState<UserPortrait[]>([]);

  useEffect(() => {
    if (targetRobot) {
      setSelectedRobotId(targetRobot as string);
    } else if (robots.length > 0 && !selectedRobotId) {
      setSelectedRobotId(robots[0].robotCode);
    }
  }, [targetRobot, robots, selectedRobotId]);

  useEffect(() => {
    if (!selectedRobotId) return;

    const loadPortraits = async () => {
      try {
        const [familyResult, userResult] = await Promise.all([
          fetchApi(`/api/robot/${selectedRobotId}/familyportrait`),
          fetchApi(`/api/robot/${selectedRobotId}/userportrait`),
        ]);

        if ((familyResult.code === 0 || familyResult.code === 200) && familyResult.data?.familyPortrait) {
          setFamilyPortrait(familyResult.data.familyPortrait);
        } else {
          setFamilyPortrait(null);
        }

        if ((userResult.code === 0 || userResult.code === 200) && userResult.data?.userPortraitList) {
          setUserPortraits(userResult.data.userPortraitList);
        } else {
          setUserPortraits([]);
        }
      } catch (e) {
        console.error('Failed to load portraits', e);
        setFamilyPortrait(null);
        setUserPortraits([]);
      }
    };

    loadPortraits();
  }, [selectedRobotId]);

  const currentRobot = robots.find(r => r.robotCode === selectedRobotId);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="image" size={60} color="rgba(0, 229, 255, 0.2)" />
      <Text style={styles.emptyText}>暂无机器人</Text>
    </View>
  );

  if (robots.length === 0) return renderEmptyState();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.selectorBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.selectorText} numberOfLines={1}>{currentRobot?.robotName || '选择机器人'}</Text>
          <FontAwesome name="caret-down" size={16} color="#00e5ff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          disabled={!familyPortrait || !selectedRobotId}
          onPress={() => router.push(`/portrait/family/${selectedRobotId}`)}
        >
          <LinearGradient colors={['#004e92', '#000428']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.familyCard}>
            <View style={styles.familyHeader}>
              <FontAwesome name="home" size={28} color="#00e5ff" />
              <Text style={styles.familyTitle}>家庭画像</Text>
            </View>
            <Text style={styles.familyText} numberOfLines={3}>
              {familyPortrait?.content || '暂无家庭画像'}
            </Text>
            <View style={styles.familyFooter}>
              <Text style={styles.familyMeta}>{familyPortrait ? 'Active' : 'Empty'}</Text>
              {familyPortrait && <FontAwesome name="arrow-right" size={16} color="#00e5ff" />}
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>用户画像</Text>
        </View>

        {userPortraits.length === 0 && <Text style={styles.emptyText}>暂无用户画像</Text>}
        {userPortraits.map(u => (
          <Pressable
            key={u.portraitID}
            onPress={() => router.push({ pathname: '/portrait/user/[id]', params: { id: u.portraitID, robotID: selectedRobotId || '' } })}
          >
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.userCard}>
              <View style={styles.userCardLeft}>
                <View style={styles.avatarCircle}>
                  <FontAwesome name="user-secret" size={28} color="#011e41" />
                </View>
              </View>
              <View style={styles.userCardBody}>
                <Text style={styles.uName}>画像 {u.portraitID}</Text>
                <Text style={styles.uDetail}>点击查看画像详情</Text>
              </View>
              <View style={styles.userCardRight}>
                <FontAwesome name="angle-right" size={24} color="#475569" />
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>选择机器人</Text>
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color="#00e5ff" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索名称或UUID..."
                placeholderTextColor="#475569"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                  <FontAwesome name="times-circle" size={16} color="#475569" />
                </Pressable>
              )}
            </View>
            <ScrollView style={styles.pickerList}>
              {robots.filter(r => 
                r.robotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.robotCode.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(r => (
                <Pressable
                  key={r.robotCode}
                  style={[styles.pickerItem, selectedRobotId === r.robotCode && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedRobotId(r.robotCode);
                    setPickerVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedRobotId === r.robotCode && styles.pickerItemTextActive]}>
                    {r.robotName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  emptyText: { marginTop: 20, color: '#94a3b8', fontSize: 16, textAlign: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#00e5ff',
    borderRadius: 20,
    backgroundColor: 'rgba(5, 11, 20, 0.4)',
    maxWidth: 200,
  },
  selectorText: { color: '#00e5ff', fontWeight: 'bold', marginRight: 8, fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  familyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    marginBottom: 30,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  familyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent' },
  familyTitle: { color: '#00e5ff', fontSize: 20, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
  familyText: { color: '#ffffff', fontSize: 14, lineHeight: 22, opacity: 0.9, marginBottom: 15 },
  familyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' },
  familyMeta: { color: '#00e5ff', fontSize: 12, opacity: 0.8, fontWeight: 'bold', textTransform: 'uppercase' },
  sectionDivider: { marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#00e5ff', paddingLeft: 10, backgroundColor: 'transparent' },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    marginBottom: 15,
    alignItems: 'center',
  },
  userCardLeft: { backgroundColor: 'transparent' },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00e5ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  userCardBody: { flex: 1, marginLeft: 15, backgroundColor: 'transparent' },
  uName: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  uDetail: { color: '#94a3b8', fontSize: 12 },
  userCardRight: { width: 30, alignItems: 'flex-end', backgroundColor: 'transparent' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(1, 30, 65, 0.85)' },
  modalContent: { width: '80%', backgroundColor: '#011e41', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#00e5ff' },
  modalTitle: { color: '#00e5ff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(26, 92, 158, 0.5)' },
  pickerItemActive: { backgroundColor: 'rgba(0, 229, 255, 0.1)' },
  pickerItemText: { color: '#94a3b8', textAlign: 'center', fontSize: 16 },
  pickerItemTextActive: { color: '#00e5ff', fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(5, 11, 20, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a5c9e',
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 8,
  },
  clearIcon: { padding: 5 },
  pickerList: { maxHeight: 300 },
  profileSection: { marginBottom: 25 },
});
