import React, { useState, useCallback } from 'react';
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
import { useRobotConnection } from '@/utils/robotSocket';
import { discoverByIpHint } from '@/utils/robotDiscovery';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const GESTURES = [
  { key: 'open', label: '张开', icon: 'hand-paper-o' },
  { key: 'close', label: '握拳', icon: 'hand-rock-o' },
  { key: 'thumbup', label: '点赞', icon: 'thumbs-up' },
  { key: 'peace', label: '剪刀手', icon: 'hand-peace-o' },
  { key: 'point', label: '指向', icon: 'hand-pointer-o' },
  { key: 'ok', label: 'OK', icon: 'circle-o' },
] as const;

// PLACEHOLDER_COMPONENT

export default function RemoteControlScreen() {
  const [ip, setIp] = useState('192.168.');
  const [log, setLog] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const { state, robotInfo, connect, disconnect, sendCommand } = useRobotConnection(ip);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const handleConnect = () => {
    if (!ip.trim()) {
      Alert.alert('请输入机器人 IP 地址');
      return;
    }
    addLog(`连接中... ${ip}:8765`);
    connect();
  };

  const handleScan = async () => {
    setScanning(true);
    addLog('正在搜索局域网内的机器人...');
    try {
      const robots = await discoverByIpHint(ip, 2000);
      if (robots.length > 0) {
        const robot = robots[0];
        setIp(robot.ip);
        addLog(`发现: ${robot.name} (${robot.ip}:${robot.ws_port})`);
      } else {
        addLog('未发现机器人，请确认在同一局域网');
      }
    } catch (e: any) {
      addLog(`搜索失败: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCommand = async (action: string, params: Record<string, any> = {}) => {
    try {
      addLog(`发送: ${action}`);
      const result = await sendCommand(action, params);
      if (result.ok) {
        addLog(`成功: ${action} → ${JSON.stringify(result.data).slice(0, 80)}`);
      } else {
        addLog(`失败: ${action} → ${result.error}`);
      }
    } catch (e: any) {
      addLog(`错误: ${e.message}`);
    }
  };

  const stateColor = state === 'connected' ? '#4caf50' : state === 'connecting' ? '#ff9800' : '#f44336';

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
          placeholder="机器人 IP"
          placeholderTextColor="#666"
          keyboardType="numeric"
          editable={state === 'disconnected'}
        />
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#6c47e8', marginRight: 4 }]}
          onPress={handleScan}
          disabled={scanning || state !== 'disconnected'}
        >
          {scanning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.btnText}>搜索</Text>
          )}
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
        <Text style={s.robotName}>{robotInfo.robot_name}</Text>
      )}

      {/* 控制面板 */}
      {state === 'connected' && (
        <ScrollView style={s.panel} contentContainerStyle={s.panelContent}>
          {/* 唤醒/休眠 */}
          <Text style={s.sectionTitle}>状态控制</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('wake')}>
              <FontAwesome name="sun-o" size={24} color="#fff" />
              <Text style={s.actionLabel}>唤醒</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('sleep')}>
              <FontAwesome name="moon-o" size={24} color="#fff" />
              <Text style={s.actionLabel}>休眠</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('get_status')}>
              <FontAwesome name="info-circle" size={24} color="#fff" />
              <Text style={s.actionLabel}>状态</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('reset_arms')}>
              <FontAwesome name="refresh" size={24} color="#fff" />
              <Text style={s.actionLabel}>复位</Text>
            </TouchableOpacity>
          </View>

          {/* 手势控制 */}
          <Text style={s.sectionTitle}>手势控制（右手）</Text>
          <View style={s.row}>
            {GESTURES.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={s.actionBtn}
                onPress={() => handleCommand('control_hand', { side: 'right', gesture: g.key })}
              >
                <FontAwesome name={g.icon as any} size={24} color="#fff" />
                <Text style={s.actionLabel}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 语音 */}
          <Text style={s.sectionTitle}>语音</Text>
          <SaySection onSay={(text) => handleCommand('say', { text })} />

          {/* 机械臂 */}
          <Text style={s.sectionTitle}>机械臂预设</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('move_arm', { side: 'left', positions: [0.5, 0.0, 0.0, 0.8, 0.0, 0.0, 0.0] })}>
              <FontAwesome name="arrow-up" size={24} color="#fff" />
              <Text style={s.actionLabel}>左臂抬起</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('move_arm', { side: 'right', positions: [0.5, 0.0, 0.0, 0.8, 0.0, 0.0, 0.0] })}>
              <FontAwesome name="arrow-up" size={24} color="#fff" />
              <Text style={s.actionLabel}>右臂抬起</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('move_arm', { side: 'both', positions: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] })}>
              <FontAwesome name="arrows" size={24} color="#fff" />
              <Text style={s.actionLabel}>双臂垂下</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleCommand('get_arm_status')}>
              <FontAwesome name="eye" size={24} color="#fff" />
              <Text style={s.actionLabel}>查看关节</Text>
            </TouchableOpacity>
          </View>
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
  connectRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  ipInput: { flex: 1, backgroundColor: '#0a2a52', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  robotName: { color: '#8ab4f8', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  panel: { flex: 1 },
  panelContent: { padding: 12 },
  sectionTitle: { color: '#8ab4f8', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { backgroundColor: '#0a2a52', borderRadius: 12, width: 72, height: 72, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionLabel: { color: '#ccc', fontSize: 11 },
  sayRow: { flexDirection: 'row', alignItems: 'center' },
  sayInput: { flex: 1, backgroundColor: '#0a2a52', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  logBox: { height: 140, borderTopWidth: 1, borderTopColor: '#1a5c9e', padding: 8 },
  logTitle: { color: '#8ab4f8', fontSize: 12, marginBottom: 4 },
  logScroll: { flex: 1 },
  logLine: { color: '#aaa', fontSize: 11, lineHeight: 16 },
});
