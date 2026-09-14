import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useRobotConnection } from '@/utils/robotSocket';
import { discoverByIpHint } from '@/utils/robotDiscovery';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const JOINTS = [
  { name: 'J1 肩俯仰', min: -1.57, max: 1.57 },
  { name: 'J2 肩侧摇', min: -1.57, max: 1.57 },
  { name: 'J3 肩旋转', min: -1.57, max: 1.57 },
  { name: 'J4 肘弯曲', min: 0.0, max: 2.36 },
  { name: 'J5 腕旋转', min: -1.57, max: 1.57 },
  { name: 'J6 腕俯仰', min: -1.04, max: 1.04 },
  { name: 'J7 腕偏转', min: -0.79, max: 0.79 },
];

const GESTURES = [
  { key: 'open', label: '张开', icon: 'hand-paper-o' },
  { key: 'close', label: '握拳', icon: 'hand-rock-o' },
  { key: 'thumbup', label: '点赞', icon: 'thumbs-up' },
  { key: 'peace', label: '剪刀手', icon: 'hand-peace-o' },
  { key: 'point', label: '指向', icon: 'hand-pointer-o' },
  { key: 'ok', label: 'OK', icon: 'circle-o' },
] as const;

// PLACEHOLDER_REST

export default function RemoteControlScreen() {
  const [ip, setIp] = useState('192.168.');
  const [log, setLog] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [armSide, setArmSide] = useState<'left' | 'right'>('left');
  const [handSide, setHandSide] = useState<'left' | 'right'>('right');
  const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const { state, robotInfo, connect, disconnect, sendCommand } = useRobotConnection(ip);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
  }, []);

  const handleConnect = () => {
    if (!ip.trim() || ip.split('.').filter(Boolean).length < 4) {
      Alert.alert('请输入完整的机器人 IP 地址', '例如 192.168.242.186');
      return;
    }
    addLog(`连接中... ${ip}:8765`);
    connect();
  };

  const handleScan = async () => {
    const parts = ip.replace(/\.$/, '').split('.').filter(Boolean);
    if (parts.length < 3) {
      Alert.alert('请先输入子网前缀', '至少输入前三段，例如 192.168.242');
      return;
    }
    setScanning(true);
    addLog('正在搜索局域网内的机器人...');
    try {
      const robots = await discoverByIpHint(ip, 3000);
      if (robots.length > 0) {
        const robot = robots[0];
        setIp(robot.ip);
        addLog(`发现: ${robot.name} (${robot.ip}:${robot.ws_port})`);
      } else {
        addLog('未发现机器人，请确认在同一局域网且机器人已启动');
      }
    } catch (e: any) {
      addLog(`搜索失败: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCommand = async (action: string, params: Record<string, any> = {}) => {
    try {
      addLog(`→ ${action}`);
      const result = await sendCommand(action, params);
      if (result.ok) {
        addLog(`✓ ${action}`);
      } else {
        addLog(`✗ ${action}: ${result.error}`);
      }
    } catch (e: any) {
      addLog(`✗ ${e.message}`);
    }
  };

  const handleJointChange = (index: number, value: number) => {
    const newJoints = [...joints];
    newJoints[index] = Math.round(value * 100) / 100;
    setJoints(newJoints);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleCommand('move_arm', { side: armSide, positions: newJoints });
    }, 150);
  };

  const stateColor = state === 'connected' ? '#4caf50' : state === 'connecting' ? '#ff9800' : '#f44336';

  // PLACEHOLDER_RENDER

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ title: '遥控机器人', headerStyle: { backgroundColor: '#011e41' }, headerTintColor: '#fff' }} />

      {/* 连接区域 */}
      <View style={s.connectRow}>
        <View style={[s.dot, { backgroundColor: stateColor }]} />
        <TextInput
          style={s.ipInput}
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.x.x"
          placeholderTextColor="#666"
          keyboardType="numeric"
          editable={state === 'disconnected'}
        />
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#6c47e8' }]}
          onPress={handleScan}
          disabled={scanning || state !== 'disconnected'}
        >
          {scanning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnText}>搜索</Text>}
        </TouchableOpacity>
        {state === 'disconnected' ? (
          <TouchableOpacity style={s.btn} onPress={handleConnect}>
            <Text style={s.btnText}>连接</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#f44336' }]} onPress={disconnect}>
            <Text style={s.btnText}>断开</Text>
          </TouchableOpacity>
        )}
      </View>

      {state === 'connected' && robotInfo && (
        <Text style={s.robotName}>{robotInfo.robot_name} 已连接</Text>
      )}

      {/* 控制面板 */}
      {state === 'connected' && (
        <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
          {/* 状态控制 */}
          <Text style={s.sectionTitle}>状态控制</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('wake')}>
              <FontAwesome name="sun-o" size={22} color="#fff" />
              <Text style={s.actionLabel}>唤醒</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('sleep')}>
              <FontAwesome name="moon-o" size={22} color="#fff" />
              <Text style={s.actionLabel}>休眠</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('get_status')}>
              <FontAwesome name="info-circle" size={22} color="#fff" />
              <Text style={s.actionLabel}>状态</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('reset_arms')}>
              <FontAwesome name="refresh" size={22} color="#fff" />
              <Text style={s.actionLabel}>复位</Text>
            </TouchableOpacity>
          </View>

          {/* 关节控制 */}
          <View style={s.tabRow}>
            <Text style={s.sectionTitle}>关节控制</Text>
            <View style={s.tabGroup}>
              <TouchableOpacity style={[s.tab, armSide === 'left' && s.tabActive]} onPress={() => setArmSide('left')}>
                <Text style={[s.tabText, armSide === 'left' && s.tabTextActive]}>左臂</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, armSide === 'right' && s.tabActive]} onPress={() => setArmSide('right')}>
                <Text style={[s.tabText, armSide === 'right' && s.tabTextActive]}>右臂</Text>
              </TouchableOpacity>
            </View>
          </View>

          {JOINTS.map((joint, i) => (
            <View key={i} style={s.sliderRow}>
              <Text style={s.jointName}>{joint.name}</Text>
              <Slider
                style={s.slider}
                minimumValue={joint.min}
                maximumValue={joint.max}
                value={joints[i]}
                onValueChange={(v) => handleJointChange(i, v)}
                minimumTrackTintColor="#1a73e8"
                maximumTrackTintColor="#333"
                thumbTintColor="#1a73e8"
              />
              <Text style={s.jointValue}>{joints[i].toFixed(2)}</Text>
            </View>
          ))}

          {/* 预设动作 */}
          <Text style={s.sectionTitle}>预设动作</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionBtn} onPress={() => { setJoints([0, -0.8, 0, 0.8, 0, 0, 0]); handleCommand('move_arm', { side: armSide, positions: [0, -0.8, 0, 0.8, 0, 0, 0] }); }}>
              <FontAwesome name="arrow-up" size={22} color="#fff" />
              <Text style={s.actionLabel}>前举</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => { setJoints([0, 0, 0, 0, 0, 0, 0]); handleCommand('move_arm', { side: armSide, positions: [0, 0, 0, 0, 0, 0, 0] }); }}>
              <FontAwesome name="arrow-down" size={22} color="#fff" />
              <Text style={s.actionLabel}>垂下</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => { setJoints([1.2, 0, 0, 0.5, 0, 0, 0]); handleCommand('move_arm', { side: armSide, positions: [1.2, 0, 0, 0.5, 0, 0, 0] }); }}>
              <FontAwesome name="hand-stop-o" size={22} color="#fff" />
              <Text style={s.actionLabel}>招手</Text>
            </TouchableOpacity>
          </View>

          {/* PLACEHOLDER_GESTURES */}

          {/* 手势控制 */}
          <View style={s.tabRow}>
            <Text style={s.sectionTitle}>手势控制</Text>
            <View style={s.tabGroup}>
              <TouchableOpacity style={[s.tab, handSide === 'left' && s.tabActive]} onPress={() => setHandSide('left')}>
                <Text style={[s.tabText, handSide === 'left' && s.tabTextActive]}>左手</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, handSide === 'right' && s.tabActive]} onPress={() => setHandSide('right')}>
                <Text style={[s.tabText, handSide === 'right' && s.tabTextActive]}>右手</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.row}>
            {GESTURES.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={s.actionBtn}
                onPress={() => handleCommand('control_hand', { side: handSide, gesture: g.key })}
              >
                <FontAwesome name={g.icon as any} size={22} color="#fff" />
                <Text style={s.actionLabel}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 语音 */}
          <Text style={s.sectionTitle}>语音</Text>
          <SaySection onSay={(text) => handleCommand('say', { text })} />
        </ScrollView>
      )}

      {/* 日志 */}
      <View style={s.logBox}>
        <Text style={s.logTitle}>通信日志</Text>
        <ScrollView style={s.logScroll}>
          {log.map((line, i) => (
            <Text key={i} style={s.logLine}>{line}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SaySection({ onSay }: { onSay: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <View style={s.sayRow}>
      <TextInput
        style={s.sayInput}
        value={text}
        onChangeText={setText}
        placeholder="输入让机器人说的话..."
        placeholderTextColor="#666"
      />
      <TouchableOpacity
        style={[s.btn, { marginLeft: 8 }]}
        onPress={() => { if (text.trim()) { onSay(text.trim()); setText(''); } }}
      >
        <Text style={s.btnText}>说</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#011e41' },
  connectRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  ipInput: { flex: 1, backgroundColor: '#0a2a52', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  robotName: { color: '#4caf50', fontSize: 13, textAlign: 'center', marginBottom: 2 },
  panel: { flex: 1 },
  panelContent: { padding: 12, paddingBottom: 20 },
  sectionTitle: { color: '#8ab4f8', fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { backgroundColor: '#0a2a52', borderRadius: 10, width: 68, height: 64, alignItems: 'center', justifyContent: 'center', gap: 3 },
  actionLabel: { color: '#ccc', fontSize: 10 },
  tabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  tabGroup: { flexDirection: 'row', gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#0a2a52' },
  tabActive: { backgroundColor: '#1a73e8' },
  tabText: { color: '#888', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  jointName: { color: '#aaa', fontSize: 11, width: 72 },
  slider: { flex: 1, height: 36 },
  jointValue: { color: '#8ab4f8', fontSize: 11, width: 40, textAlign: 'right' },
  sayRow: { flexDirection: 'row', alignItems: 'center' },
  sayInput: { flex: 1, backgroundColor: '#0a2a52', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  logBox: { height: 160, borderTopWidth: 1, borderTopColor: '#1a5c9e', padding: 8 },
  logTitle: { color: '#8ab4f8', fontSize: 12, marginBottom: 4 },
  logScroll: { flex: 1 },
  logLine: { color: '#aaa', fontSize: 11, lineHeight: 16 },
});