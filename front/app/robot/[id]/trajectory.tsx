import { FontAwesome } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import TrajectoryParameters from '@/components/robot/TrajectoryParameters';
import { useRobotRemote } from '@/context/RobotRemoteContext';
import { Trajectory, TrajectoryStatus } from '@/types/trajectory';

const IDLE_STATUS: TrajectoryStatus = {
  mode: 'idle', active_name: null, active_id: null, elapsed: 0, progress: 0, last_error: null,
};

export default function TrajectoryScreen() {
  const { id } = useLocalSearchParams();
  const remote = useRobotRemote();
  const [status, setStatus] = useState<TrajectoryStatus>(IDLE_STATUS);
  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('新轨迹');
  const [sampleInterval, setSampleInterval] = useState('0.1');
  const [maxDuration, setMaxDuration] = useState('60');
  const [speedScale, setSpeedScale] = useState('1.0');
  const [smoothing, setSmoothing] = useState('0.15');
  const [repeatCount, setRepeatCount] = useState('1');

  const showError = (error: unknown) => {
    Alert.alert('操作失败', error instanceof Error ? error.message : '未知错误');
  };

  const refresh = useCallback(async () => {
    if (remote.connectionState !== 'connected') return;
    try {
      const [nextStatus, list] = await Promise.all([
        remote.command<TrajectoryStatus>('trajectory_status'),
        remote.command<{ trajectories: Trajectory[] }>('trajectory_list'),
      ]);
      setStatus(nextStatus);
      setTrajectories(list.trajectories);
      if (!selectedId && list.trajectories.length) setSelectedId(list.trajectories[0].id);
    } catch (error) {
      showError(error);
    }
  }, [remote.connectionState, remote.command, selectedId]);

  useEffect(() => {
    if (remote.connectionState !== 'connected') return;
    refresh();
    const timer = setInterval(async () => {
      try {
        setStatus(await remote.command<TrajectoryStatus>('trajectory_status'));
      } catch {
        // Connection context reports disconnects; avoid repeated alerts while polling.
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [remote.connectionState, remote.command, refresh]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try { await task(); } catch (error) { showError(error); } finally { setBusy(false); }
  };

  const startRecording = () => run(async () => {
    const next = await remote.command<TrajectoryStatus>('trajectory_record_start', {
      name,
      sample_interval: Number(sampleInterval),
      max_duration: Number(maxDuration),
    });
    setStatus(next);
  });

  const stopRecording = () => run(async () => {
    setStatus(await remote.command<TrajectoryStatus>('trajectory_record_stop'));
    await refresh();
  });

  const startReplay = () => {
    if (!selectedId) return Alert.alert('请选择轨迹', '请先从列表中选择要复刻的轨迹。');
    Alert.alert(
      '确认安全后回放',
      '机器人双臂和手指将立即运动。请清空周围人员与障碍物，并准备随时点击停止。',
      [
        { text: '取消', style: 'cancel' },
        { text: '环境安全，开始', style: 'destructive', onPress: () => run(async () => {
          const next = await remote.command<TrajectoryStatus>('trajectory_replay_start', {
            trajectory_id: selectedId,
            speed_scale: Number(speedScale),
            smoothing: Number(smoothing),
            repeat_count: Number(repeatCount),
            safety_confirmed: true,
          });
          setStatus(next);
        }) },
      ],
    );
  };

  const stopReplay = () => run(async () => {
    setStatus(await remote.command<TrajectoryStatus>('trajectory_replay_stop'));
  });

  const connected = remote.connectionState === 'connected';
  const active = status.mode !== 'idle';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '轨迹录制与复刻', headerStyle: { backgroundColor: '#003d79' }, headerTintColor: '#fff' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.robotId}>机器人：{String(id || '')}</Text>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <FontAwesome name={connected ? 'wifi' : 'chain-broken'} color={connected ? '#36e39a' : '#f59e0b'} size={18} />
            <Text style={styles.connectionText}>{connected ? '机器人已连接' : remote.connectionState === 'connecting' ? '正在连接…' : '机器人未连接'}</Text>
          </View>
          <TextInput
            editable={!connected && !busy}
            value={remote.endpoint}
            onChangeText={remote.setEndpoint}
            autoCapitalize="none"
            placeholder="192.168.41.2:8765"
            placeholderTextColor="#64748b"
            style={styles.endpointInput}
          />
          {remote.error ? <Text style={styles.error}>{remote.error}</Text> : null}
          <Pressable style={[styles.button, connected ? styles.secondaryButton : styles.primaryButton]} onPress={connected ? remote.disconnect : () => run(remote.connect)} disabled={busy}>
            <Text style={styles.buttonText}>{connected ? '断开连接' : '连接机器人'}</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>{status.mode === 'recording' ? '● 正在录制' : status.mode === 'replaying' ? '▶ 正在回放' : '当前空闲'}</Text>
          <Text style={styles.statusDetail}>{status.active_name || '没有运行中的轨迹'} · {status.elapsed.toFixed(1)} 秒 · {Math.round(status.progress * 100)}%</Text>
          {status.last_error ? <Text style={styles.error}>{status.last_error}</Text> : null}
        </View>

        <TrajectoryParameters
          name={name} onNameChange={setName}
          sampleInterval={sampleInterval} onSampleIntervalChange={setSampleInterval}
          maxDuration={maxDuration} onMaxDurationChange={setMaxDuration}
          speedScale={speedScale} onSpeedScaleChange={setSpeedScale}
          smoothing={smoothing} onSmoothingChange={setSmoothing}
          repeatCount={repeatCount} onRepeatCountChange={setRepeatCount}
          disabled={!connected || active || busy}
        />

        <View style={styles.actionRow}>
          <Pressable style={[styles.button, styles.recordButton, (!connected || status.mode === 'replaying') && styles.disabled]} onPress={status.mode === 'recording' ? stopRecording : startRecording} disabled={!connected || busy || status.mode === 'replaying'}>
            <Text style={styles.buttonText}>{status.mode === 'recording' ? '停止并保存' : '开始录制'}</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.primaryButton, (!connected || status.mode === 'recording') && styles.disabled]} onPress={status.mode === 'replaying' ? stopReplay : startReplay} disabled={!connected || busy || status.mode === 'recording'}>
            <Text style={styles.buttonText}>{status.mode === 'replaying' ? '立即停止回放' : '复刻所选轨迹'}</Text>
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>机器人中的轨迹</Text>
          <Pressable onPress={refresh} disabled={!connected}><Text style={styles.refresh}>刷新</Text></Pressable>
        </View>
        {trajectories.length === 0 ? <Text style={styles.empty}>暂无轨迹。连接后录制的内容会保存在机器人中。</Text> : trajectories.map(item => (
          <Pressable key={item.id} style={[styles.item, selectedId === item.id && styles.selectedItem]} onPress={() => !active && setSelectedId(item.id)}>
            <View style={styles.itemText}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.duration.toFixed(1)} 秒 · {item.frame_count} 帧 · {new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <FontAwesome name={selectedId === item.id ? 'check-circle' : 'circle-o'} size={20} color="#00e5ff" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 48 },
  robotId: { color: '#94a3b8', marginBottom: 10 },
  connectionCard: { backgroundColor: '#003d79', borderRadius: 12, padding: 16, marginBottom: 14 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent', marginBottom: 10 },
  connectionText: { fontSize: 16, fontWeight: '700' },
  endpointInput: { backgroundColor: '#011e41', borderRadius: 8, borderWidth: 1, borderColor: '#1a5c9e', color: '#fff', padding: 10, marginBottom: 10 },
  error: { color: '#fca5a5', marginBottom: 8 },
  statusCard: { backgroundColor: '#062b52', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1a5c9e' },
  statusTitle: { color: '#00e5ff', fontSize: 16, fontWeight: '700' }, statusDetail: { color: '#c2d2e4', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, backgroundColor: 'transparent', marginBottom: 18 },
  button: { borderRadius: 9, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', flex: 1 },
  primaryButton: { backgroundColor: '#087fb8' }, secondaryButton: { backgroundColor: '#475569' }, recordButton: { backgroundColor: '#be2948' }, disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#00e5ff' }, refresh: { color: '#00e5ff' },
  empty: { color: '#94a3b8', textAlign: 'center', padding: 24 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#003d79', borderRadius: 10, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: 'transparent' },
  selectedItem: { borderColor: '#00e5ff' }, itemText: { flex: 1, backgroundColor: 'transparent' }, itemName: { fontSize: 16, fontWeight: '700' }, itemMeta: { color: '#94a3b8', fontSize: 12, marginTop: 5 },
});
