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

const FINGERS = ['小指', '无名指', '中指', '食指', '拇指弯曲', '拇指旋转'];

type ArmPose = { id: string; name: string; left: number[]; right: number[] };

type TrajectoryItem = {
  id: string;
  name: string;
  duration: number;
  frame_count: number;
};

// PLACEHOLDER_REST

export default function RemoteControlScreen() {
  const [ip, setIp] = useState('192.168.');
  const [log, setLog] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [armSide, setArmSide] = useState<'left' | 'right' | 'both'>('left');
  const [handSide, setHandSide] = useState<'left' | 'right' | 'both'>('right');
  const [leftJoints, setLeftJoints] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [rightJoints, setRightJoints] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [leftFingers, setLeftFingers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [rightFingers, setRightFingers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [poseName, setPoseName] = useState('新动作');
  const [poses, setPoses] = useState<ArmPose[]>([]);
  const [trajectoryName, setTrajectoryName] = useState('新轨迹');
  const [trajectoryMode, setTrajectoryMode] = useState<'idle' | 'recording' | 'replaying'>('idle');
  const [trajectories, setTrajectories] = useState<TrajectoryItem[]>([]);
  const [selectedTrajectory, setSelectedTrajectory] = useState<string | null>(null);
  const [trajectoryBusy, setTrajectoryBusy] = useState(false);
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
      if (result.ok && result.data?.ok !== false) {
        addLog(`✓ ${action}`);
      } else {
        addLog(`✗ ${action}: ${result.error || result.data?.error || '执行失败'}`);
      }
    } catch (e: any) {
      addLog(`✗ ${e.message}`);
    }
  };

  const trajectoryCommand = async (action: string, params: Record<string, any> = {}) => {
    const result = await sendCommand(action, params);
    if (!result.ok || result.data?.ok === false) {
      throw new Error(result.error || result.data?.error || `${action} 失败`);
    }
    return result.data;
  };

  const refreshTrajectories = async () => {
    try {
      const [status, list] = await Promise.all([
        trajectoryCommand('trajectory_status'),
        trajectoryCommand('trajectory_list'),
      ]);
      setTrajectoryMode(status.mode || 'idle');
      const items = list.trajectories || [];
      setTrajectories(items);
      if (!selectedTrajectory && items.length) setSelectedTrajectory(items[0].id);
      addLog(`已刷新轨迹：${items.length} 条`);
    } catch (e: any) {
      addLog(`✗ 刷新轨迹：${e.message}`);
      Alert.alert('轨迹操作失败', e.message);
    }
  };

  const toggleRecording = async () => {
    setTrajectoryBusy(true);
    try {
      if (trajectoryMode === 'recording') {
        const status = await trajectoryCommand('trajectory_record_stop');
        setTrajectoryMode(status.mode || 'idle');
        addLog('✓ 轨迹已停止并保存');
        await refreshTrajectories();
      } else {
        const status = await trajectoryCommand('trajectory_record_start', {
          name: trajectoryName.trim() || '新轨迹',
          sample_interval: 0.01,
          max_duration: 120,
        });
        setTrajectoryMode(status.mode || 'recording');
        addLog('● 开始轨迹录制，可手动拖动双臂');
      }
    } catch (e: any) {
      addLog(`✗ 轨迹录制：${e.message}`);
      Alert.alert('录制失败', e.message);
    } finally {
      setTrajectoryBusy(false);
    }
  };

  const toggleReplay = async () => {
    if (trajectoryMode === 'replaying') {
      try {
        const status = await trajectoryCommand('trajectory_replay_stop');
        setTrajectoryMode(status.mode || 'idle');
        addLog('■ 已停止轨迹复刻');
      } catch (e: any) { Alert.alert('停止失败', e.message); }
      return;
    }
    if (!selectedTrajectory) {
      Alert.alert('请选择轨迹', '先点击刷新，再选择一条已保存轨迹。');
      return;
    }
    Alert.alert('确认安全', '机器人双臂将立即运动，请清空周围人员和障碍物。', [
      { text: '取消', style: 'cancel' },
      { text: '开始复刻', style: 'destructive', onPress: async () => {
        setTrajectoryBusy(true);
        try {
          const status = await trajectoryCommand('trajectory_replay_start', {
            trajectory_id: selectedTrajectory,
            speed_scale: 1,
            smoothing: 0.15,
            repeat_count: 1,
            safety_confirmed: true,
          });
          setTrajectoryMode(status.mode || 'replaying');
          addLog('▶ 开始轨迹复刻');
        } catch (e: any) {
          addLog(`✗ 轨迹复刻：${e.message}`);
          Alert.alert('复刻失败', e.message);
        } finally { setTrajectoryBusy(false); }
      } },
    ]);
  };

  const deleteTrajectory = () => {
    if (!selectedTrajectory) return;
    Alert.alert('删除轨迹', '删除后无法恢复，确定删除所选轨迹吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        setTrajectoryBusy(true);
        try {
          await trajectoryCommand('trajectory_delete', { trajectory_id: selectedTrajectory });
          setSelectedTrajectory(null);
          addLog('✓ 所选轨迹已删除');
          await refreshTrajectories();
        } catch (e: any) {
          addLog(`✗ 删除轨迹：${e.message}`);
          Alert.alert('删除失败', e.message);
        } finally { setTrajectoryBusy(false); }
      } },
    ]);
  };

  const handleJointChange = (index: number, value: number) => {
    const current = armSide === 'right' ? rightJoints : leftJoints;
    const newJoints = [...current];
    newJoints[index] = Math.round(value * 100) / 100;
    if (armSide === 'right') setRightJoints(newJoints); else setLeftJoints(newJoints);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (armSide === 'both') handleCommand('move_both_arms', { left_positions: newJoints, right_positions: rightJoints });
      else handleCommand('move_arm', { side: armSide, positions: newJoints });
    }, 150);
  };

  const changeRightJoint = (index: number, value: number) => {
    const next = [...rightJoints]; next[index] = Math.round(value * 100) / 100; setRightJoints(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleCommand('move_both_arms', { left_positions: leftJoints, right_positions: next }), 150);
  };

  const changeFinger = (side: 'left' | 'right', index: number, value: number) => {
    const source = side === 'left' ? leftFingers : rightFingers;
    const next = [...source]; next[index] = Math.round(value * 100) / 100;
    if (side === 'left') setLeftFingers(next); else setRightFingers(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (handSide === 'both') handleCommand('control_both_hands', { left_angles: side === 'left' ? next : leftFingers, right_angles: side === 'right' ? next : rightFingers });
      else handleCommand('control_hand', { side, gesture: 'custom', angles: next });
    }, 120);
  };

  const refreshPoses = async () => {
    const result = await trajectoryCommand('arm_pose_list');
    setPoses(result.poses || []);
  };

  const savePose = async () => {
    await trajectoryCommand('arm_pose_save', { name: poseName, left_positions: leftJoints, right_positions: rightJoints });
    addLog('✓ 固定动作已保存'); await refreshPoses();
  };

  const executePose = (pose: ArmPose) => Alert.alert('确认执行', `将执行固定动作“${pose.name}”`, [
    { text: '取消', style: 'cancel' },
    { text: '执行', style: 'destructive', onPress: () => handleCommand('arm_pose_execute', { pose_id: pose.id, safety_confirmed: true }) },
  ]);

  const deletePose = async (pose: ArmPose) => {
    await trajectoryCommand('arm_pose_delete', { pose_id: pose.id }); await refreshPoses();
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
              <TouchableOpacity style={[s.tab, armSide === 'both' && s.tabActive]} onPress={() => setArmSide('both')}>
                <Text style={[s.tabText, armSide === 'both' && s.tabTextActive]}>双臂</Text>
              </TouchableOpacity>
            </View>
          </View>

          {armSide === 'both' && <Text style={s.subTitle}>左臂</Text>}
          {JOINTS.map((joint, i) => (
            <View key={i} style={s.sliderRow}>
              <Text style={s.jointName}>{joint.name}</Text>
              <Slider
                style={s.slider}
                minimumValue={joint.min}
                maximumValue={joint.max}
                value={armSide === 'right' ? rightJoints[i] : leftJoints[i]}
                onValueChange={(v) => handleJointChange(i, v)}
                minimumTrackTintColor="#1a73e8"
                maximumTrackTintColor="#333"
                thumbTintColor="#1a73e8"
              />
              <Text style={s.jointValue}>{(armSide === 'right' ? rightJoints[i] : leftJoints[i]).toFixed(2)}</Text>
            </View>
          ))}
          {armSide === 'both' && <><Text style={s.subTitle}>右臂</Text>{JOINTS.map((joint, i) => <View key={`r${i}`} style={s.sliderRow}><Text style={s.jointName}>{joint.name}</Text><Slider style={s.slider} minimumValue={joint.min} maximumValue={joint.max} value={rightJoints[i]} onValueChange={(v) => changeRightJoint(i, v)} minimumTrackTintColor="#1a73e8" maximumTrackTintColor="#333" thumbTintColor="#1a73e8"/><Text style={s.jointValue}>{rightJoints[i].toFixed(2)}</Text></View>)}</>}

          <Text style={s.sectionTitle}>固定动作</Text>
          <View style={s.sayRow}><TextInput style={s.sayInput} value={poseName} onChangeText={setPoseName} placeholder="动作名称" placeholderTextColor="#666"/><TouchableOpacity style={[s.btn,{marginLeft:8}]} onPress={savePose}><Text style={s.btnText}>保存当前双臂</Text></TouchableOpacity><TouchableOpacity style={[s.btn,{marginLeft:8}]} onPress={refreshPoses}><Text style={s.btnText}>刷新</Text></TouchableOpacity></View>
          {poses.map(pose => <View key={pose.id} style={s.poseRow}><Text style={s.poseText}>{pose.name}</Text><TouchableOpacity style={s.smallBtn} onPress={() => executePose(pose)}><Text style={s.btnText}>执行</Text></TouchableOpacity><TouchableOpacity style={[s.smallBtn,{backgroundColor:'#7f1d1d'}]} onPress={() => deletePose(pose)}><Text style={s.btnText}>删除</Text></TouchableOpacity></View>)}

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
              <TouchableOpacity style={[s.tab, handSide === 'both' && s.tabActive]} onPress={() => setHandSide('both')}><Text style={[s.tabText, handSide === 'both' && s.tabTextActive]}>双手</Text></TouchableOpacity>
            </View>
          </View>
          {(handSide === 'left' || handSide === 'both') && <><Text style={s.subTitle}>左手</Text>{FINGERS.map((name,i)=><View key={`lf${i}`} style={s.sliderRow}><Text style={s.jointName}>{name}</Text><Slider style={s.slider} minimumValue={0} maximumValue={1} value={leftFingers[i]} onValueChange={v=>changeFinger('left',i,v)} minimumTrackTintColor="#1a73e8" maximumTrackTintColor="#333" thumbTintColor="#1a73e8"/><Text style={s.jointValue}>{leftFingers[i].toFixed(2)}</Text></View>)}</>}
          {(handSide === 'right' || handSide === 'both') && <><Text style={s.subTitle}>右手</Text>{FINGERS.map((name,i)=><View key={`rf${i}`} style={s.sliderRow}><Text style={s.jointName}>{name}</Text><Slider style={s.slider} minimumValue={0} maximumValue={1} value={rightFingers[i]} onValueChange={v=>changeFinger('right',i,v)} minimumTrackTintColor="#1a73e8" maximumTrackTintColor="#333" thumbTintColor="#1a73e8"/><Text style={s.jointValue}>{rightFingers[i].toFixed(2)}</Text></View>)}</>}

          {/* 语音 */}
          <Text style={s.sectionTitle}>语音</Text>
          <SaySection onSay={(text) => handleCommand('say', { text })} />

          {/* 轨迹录制与复刻：复用当前 WebSocket 连接 */}
          <View style={s.trajectoryHeader}>
            <Text style={s.sectionTitle}>轨迹录制与复刻</Text>
            <Text style={s.trajectoryState}>{trajectoryMode === 'recording' ? '● 录制中' : trajectoryMode === 'replaying' ? '▶ 复刻中' : '空闲'}</Text>
          </View>
          <TextInput
            style={s.trajectoryInput}
            value={trajectoryName}
            onChangeText={setTrajectoryName}
            placeholder="轨迹名称"
            placeholderTextColor="#666"
            editable={trajectoryMode === 'idle'}
          />
          <View style={s.trajectoryActions}>
            <TouchableOpacity style={[s.wideBtn, { backgroundColor: trajectoryMode === 'recording' ? '#f44336' : '#be2948' }]} onPress={toggleRecording} disabled={trajectoryBusy || trajectoryMode === 'replaying'}>
              <Text style={s.btnText}>{trajectoryMode === 'recording' ? '停止并保存' : '开始录制'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.wideBtn} onPress={toggleReplay} disabled={trajectoryBusy || trajectoryMode === 'recording'}>
              <Text style={s.btnText}>{trajectoryMode === 'replaying' ? '停止复刻' : '复刻所选轨迹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.wideBtn, { backgroundColor: '#6c47e8' }]} onPress={refreshTrajectories} disabled={trajectoryBusy}>
              <Text style={s.btnText}>刷新轨迹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.wideBtn, { backgroundColor: '#7f1d1d' }]} onPress={deleteTrajectory} disabled={trajectoryBusy || trajectoryMode !== 'idle' || !selectedTrajectory}>
              <Text style={s.btnText}>删除所选轨迹</Text>
            </TouchableOpacity>
          </View>
          {trajectories.map((item) => (
            <TouchableOpacity key={item.id} style={[s.trajectoryItem, selectedTrajectory === item.id && s.trajectorySelected]} onPress={() => trajectoryMode === 'idle' && setSelectedTrajectory(item.id)}>
              <Text style={s.trajectoryName}>{selectedTrajectory === item.id ? '◉ ' : '○ '}{item.name}</Text>
              <Text style={s.trajectoryMeta}>{item.duration.toFixed(1)} 秒 · {item.frame_count} 帧</Text>
            </TouchableOpacity>
          ))}
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
  subTitle: { color: '#00e5ff', fontSize: 12, fontWeight: '600', marginTop: 8 },
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
  poseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a2a52', borderRadius: 8, padding: 8, marginTop: 6 },
  poseText: { flex: 1, color: '#fff' },
  smallBtn: { backgroundColor: '#1a73e8', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  trajectoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  trajectoryState: { color: '#00e5ff', fontSize: 12 },
  trajectoryInput: { backgroundColor: '#0a2a52', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 },
  trajectoryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  wideBtn: { backgroundColor: '#1a73e8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11 },
  trajectoryItem: { backgroundColor: '#0a2a52', borderWidth: 1, borderColor: '#1a5c9e', borderRadius: 8, padding: 10, marginBottom: 6 },
  trajectorySelected: { borderColor: '#00e5ff' },
  trajectoryName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  trajectoryMeta: { color: '#8ab4f8', fontSize: 11, marginTop: 3 },
  logBox: { height: 160, borderTopWidth: 1, borderTopColor: '#1a5c9e', padding: 8 },
  logTitle: { color: '#8ab4f8', fontSize: 12, marginBottom: 4 },
  logScroll: { flex: 1 },
  logLine: { color: '#aaa', fontSize: 11, lineHeight: 16 },
});
