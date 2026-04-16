import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { useRobots } from '@/context/RobotContext';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchApi } from '@/utils/api';

type MessageItem = {
  messageID: string;
  createdAt: number;
  content: string;
  belong: string;
};

type AbstractItem = {
  abstractID: string;
  createdAt: number;
  content: string;
};

export default function MemoryScreen() {
  const { targetRobot } = useLocalSearchParams();
  const { robots } = useRobots();
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'DIALOGUE'>('SUMMARY');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [abstracts, setAbstracts] = useState<AbstractItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetRobot) {
      setSelectedRobotId(targetRobot as string);
    } else if (robots.length > 0 && !selectedRobotId) {
      setSelectedRobotId(robots[0].robotCode);
    }
  }, [targetRobot, robots, selectedRobotId]);

  useEffect(() => {
    if (!selectedRobotId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const endpoint =
          activeTab === 'SUMMARY'
            ? `/api/robot/${selectedRobotId}/abstract/0/20`
            : `/api/robot/${selectedRobotId}/message/0/20`;
        const result = await fetchApi(endpoint);
        if ((result.code === 0 || result.code === 200) && result.data) {
          if (activeTab === 'SUMMARY') {
            setAbstracts(result.data.abstractList || []);
          } else {
            setMessages(result.data.messageList || []);
          }
        }
      } catch (e) {
        console.error('Failed to load memory data', e);
        if (activeTab === 'SUMMARY') {
          setAbstracts([]);
        } else {
          setMessages([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedRobotId, activeTab]);

  const currentRobot = robots.find(r => r.robotCode === selectedRobotId);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="server" size={60} color="rgba(0, 229, 255, 0.2)" />
      <Text style={styles.emptyText}>暂无机器人</Text>
    </View>
  );

  const renderSummary = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {loading && <Text style={styles.emptyText}>加载中...</Text>}
      {!loading && abstracts.length === 0 && <Text style={styles.emptyText}>暂无摘要</Text>}
      {abstracts.map(item => (
        <View key={item.abstractID} style={styles.abstractCard}>
          <View style={styles.timelineDot} />
          <View style={styles.abstractContentWrapper}>
            <Text style={styles.abstractTime}>{new Date(item.createdAt).toLocaleString()}</Text>
            <LinearGradient colors={['#003d79', '#011e41']} style={styles.abstractBody}>
              <Text style={styles.abstractText}>{item.content}</Text>
            </LinearGradient>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderDialogue = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {loading && <Text style={styles.emptyText}>加载中...</Text>}
      {!loading && messages.length === 0 && <Text style={styles.emptyText}>暂无消息</Text>}
      {messages.map(msg => {
        const isUser = msg.belong !== selectedRobotId;
        return (
          <View key={msg.messageID} style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
            {!isUser && <FontAwesome name="android" size={24} color="#00e5ff" style={styles.msgAvatar} />}
            <View style={[styles.bubbleWrapper, isUser ? styles.bubbleUserWrapper : styles.bubbleRobotWrapper]}>
              <LinearGradient
                colors={isUser ? ['rgba(0, 61, 121, 0.4)', 'rgba(1, 30, 65, 0.4)'] : ['#003d79', '#011e41']}
                style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleRobot]}
              >
                <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{msg.content}</Text>
              </LinearGradient>
            </View>
            {isUser && <FontAwesome name="user-o" size={20} color="#94a3b8" style={styles.msgAvatarM} />}
          </View>
        );
      })}
    </ScrollView>
  );

  if (robots.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.selectorBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.selectorText} numberOfLines={1}>{currentRobot?.robotName || '选择机器人'}</Text>
          <FontAwesome name="caret-down" size={16} color="#00e5ff" />
        </Pressable>

        <View style={styles.tabSwitcher}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'SUMMARY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('SUMMARY')}
          >
            <Text style={[styles.tabText, activeTab === 'SUMMARY' && styles.tabTextActive]}>摘要</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'DIALOGUE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('DIALOGUE')}
          >
            <Text style={[styles.tabText, activeTab === 'DIALOGUE' && styles.tabTextActive]}>消息</Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'SUMMARY' ? renderSummary() : renderDialogue()}

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择机器人</Text>
            {robots.map(r => (
              <Pressable
                key={r.robotCode}
                style={[styles.pickerItem, selectedRobotId === r.robotCode && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedRobotId(r.robotCode);
                  setPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerItemText, selectedRobotId === r.robotCode && styles.pickerItemTextActive]}>
                  {r.robotName}
                </Text>
              </Pressable>
            ))}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxWidth: 150,
  },
  selectorText: {
    color: '#00e5ff',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(1, 30, 65, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a5c9e',
    overflow: 'hidden',
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#00e5ff',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#011e41',
    fontWeight: 'bold',
  },
  scrollContent: { padding: 20, paddingBottom: 100 },
  abstractCard: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00e5ff',
    marginTop: 5,
    marginRight: 15,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  abstractContentWrapper: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 229, 255, 0.3)',
    paddingLeft: 15,
    marginLeft: -21,
  },
  abstractTime: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 15,
  },
  abstractBody: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginLeft: 15,
  },
  abstractText: { color: '#ffffff', fontSize: 14, lineHeight: 22 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { marginRight: 10, marginTop: 4 },
  msgAvatarM: { marginLeft: 10, marginTop: 4 },
  bubbleWrapper: { maxWidth: '75%' },
  bubbleUserWrapper: { alignItems: 'flex-end' },
  bubbleRobotWrapper: { alignItems: 'flex-start' },
  bubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  bubbleRobot: {
    borderColor: '#00e5ff',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    borderColor: '#1a5c9e',
    borderBottomRightRadius: 4,
  },
  msgText: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  msgTextUser: { color: '#e2e8f0' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 30, 65, 0.85)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#011e41',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00e5ff',
  },
  modalTitle: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 92, 158, 0.5)',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  pickerItemText: { color: '#94a3b8', textAlign: 'center', fontSize: 16 },
  pickerItemTextActive: { color: '#00e5ff', fontWeight: 'bold' },
});
