import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRobots } from '@/context/RobotContext';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchApi } from '@/utils/api';

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
        const userResult = await fetchApi(`/api/robot/${selectedRobotId}/userportrait`);
        if ((userResult.code === 0 || userResult.code === 200) && userResult.data?.userPortraitList) {
          setUserPortraits(userResult.data.userPortraitList);
        } else {
          setUserPortraits([]);
        }
      } catch (e) {
        console.error('Failed to load portraits', e);
        setUserPortraits([]);
      }
    };

    loadPortraits();
  }, [selectedRobotId]);

  // Provide a demo list if fetch returned nothing / since this is a pure UI mock
  const displayPortraits = userPortraits.length > 0 ? userPortraits : [{ portraitID: '长城体验车主', avatar: 'default' }];

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
        
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>副驾记忆画像概览</Text>
        </View>

        {/* 驾驶偏好 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="car" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>驾驶偏好与底盘</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>空调 24°C</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>座椅微躺 (舒适模式)</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>轻揉转向</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>动能回收 (弱)</Text></View>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>防碰撞预警 (灵敏)</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>底盘悬架偏软</Text></View>
          </View>
        </View>

        {/* 常去地图 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="map-marker" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>常去地点</Text>
          </View>
          <View style={styles.cardList}>
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.locationCard}>
               <FontAwesome name="building" size={24} color="#94a3b8" />
               <View style={styles.locationInfo}>
                 <Text style={styles.locationName}>长城汽车哈弗技术中心</Text>
                 <Text style={styles.locationDesc}>工作日 08:30 / 19:00 常去</Text>
               </View>
            </LinearGradient>
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.locationCard}>
               <FontAwesome name="home" size={24} color="#94a3b8" />
               <View style={styles.locationInfo}>
                 <Text style={styles.locationName}>星河湾小区 (家里)</Text>
                 <Text style={styles.locationDesc}>每日 19:30 常去</Text>
               </View>
            </LinearGradient>
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.locationCard}>
               <FontAwesome name="coffee" size={24} color="#94a3b8" />
               <View style={styles.locationInfo}>
                 <Text style={styles.locationName}>瑞幸咖啡 (光束汽车店)</Text>
                 <Text style={styles.locationDesc}>周末 14:00 常去</Text>
               </View>
            </LinearGradient>
          </View>
        </View>

        {/* 舱内设定 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="sliders" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>智能座舱设定</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>极光蓝氛围灯</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>香氛：早晨提神木香</Text></View>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>车机深色模式随动</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>主驾靠近自动解锁</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>后排儿童锁常开</Text></View>
          </View>
        </View>

        {/* 餐饮偏好 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="cutlery" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>餐饮偏好</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>无辣不欢</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>火锅 / 川菜</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>不加香菜</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>咖啡：标准美式 (少冰)</Text></View>
          </View>
        </View>

        {/* 健康与监测 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="heartbeat" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>状态监测与提醒</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>连续驾驶2h自动开启按摩</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>下雨天自动关窗</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>易疲劳时段(14点)增强冷风</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>监控微表情(打哈欠检测)</Text></View>
          </View>
        </View>

        {/* 工作与日程 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="calendar" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>工作日志 & 联系人</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>上车主动播报今日日程</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>频繁联系：妻子 (晚上)</Text></View>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>下班路况提前避堵</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>工作群静音免打扰</Text></View>
          </View>
        </View>

        {/* 娱乐视听 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <FontAwesome name="music" size={20} color="#00e5ff" style={styles.profileIcon} />
            <Text style={styles.profileTitle}>娱乐视听</Text>
          </View>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>流行金曲 / 摇滚</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>爱听播客 (科技评论)</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>长途喜欢听有声书</Text></View>
            <View style={styles.tagHighlight}><Text style={styles.tagTextHighlight}>下雨天爱听周杰伦</Text></View>
          </View>
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>基础用户数据</Text>
        </View>

        {displayPortraits.map((u, i) => (
          <Pressable
            key={u.portraitID + i}
            onPress={() => router.push({ pathname: '/portrait/user/[id]', params: { id: u.portraitID, robotID: selectedRobotId || '' } })}
          >
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.userCard}>
              <View style={styles.userCardLeft}>
                <View style={styles.avatarCircle}>
                  <FontAwesome name="user-secret" size={28} color="#011e41" />
                </View>
              </View>
              <View style={styles.userCardBody}>
                <Text style={styles.uName}>主驾驶员画像</Text>
                <Text style={styles.uDetail}>点击进入数据详情面板 ({u.portraitID})</Text>
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
  sectionDivider: { marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#00e5ff', paddingLeft: 10, backgroundColor: 'transparent', marginTop: 10 },
  sectionTitle: { color: '#00e5ff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
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
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileIcon: { marginRight: 10 },
  profileTitle: { color: '#00e5ff', fontSize: 16, fontWeight: 'bold' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: 'rgba(5, 11, 20, 0.4)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 5 },
  tagText: { color: '#94a3b8', fontSize: 14 },
  tagHighlight: { backgroundColor: 'rgba(0, 229, 255, 0.15)', borderWidth: 1, borderColor: '#00e5ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 5 },
  tagTextHighlight: { color: '#00e5ff', fontSize: 14, fontWeight: 'bold' },
  cardList: { gap: 12 },
  locationCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)', marginBottom: 10 },
  locationInfo: { marginLeft: 15, flex: 1 },
  locationName: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  locationDesc: { color: '#94a3b8', fontSize: 12 },
});
