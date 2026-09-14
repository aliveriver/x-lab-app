import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  sampleInterval: string;
  onSampleIntervalChange: (value: string) => void;
  maxDuration: string;
  onMaxDurationChange: (value: string) => void;
  speedScale: string;
  onSpeedScaleChange: (value: string) => void;
  smoothing: string;
  onSmoothingChange: (value: string) => void;
  repeatCount: string;
  onRepeatCountChange: (value: string) => void;
  disabled: boolean;
};

const NumericField = ({ label, value, onChangeText, disabled }: {
  label: string; value: string; onChangeText: (value: string) => void; disabled: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      editable={!disabled}
      keyboardType="decimal-pad"
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, disabled && styles.disabled]}
      placeholderTextColor="#64748b"
    />
  </View>
);

export default function TrajectoryParameters(props: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>录制参数</Text>
      <Text style={styles.label}>轨迹名称</Text>
      <TextInput
        editable={!props.disabled}
        value={props.name}
        onChangeText={props.onNameChange}
        maxLength={80}
        style={[styles.input, props.disabled && styles.disabled]}
        placeholder="例如：挥手动作"
        placeholderTextColor="#64748b"
      />
      <View style={styles.row}>
        <NumericField label="采样周期（秒）" value={props.sampleInterval} onChangeText={props.onSampleIntervalChange} disabled={props.disabled} />
        <NumericField label="最大时长（秒）" value={props.maxDuration} onChangeText={props.onMaxDurationChange} disabled={props.disabled} />
      </View>
      <Text style={styles.title}>回放参数</Text>
      <View style={styles.row}>
        <NumericField label="速度 0.1–2.0" value={props.speedScale} onChangeText={props.onSpeedScaleChange} disabled={props.disabled} />
        <NumericField label="平滑 0–0.95" value={props.smoothing} onChangeText={props.onSmoothingChange} disabled={props.disabled} />
        <NumericField label="次数 1–10" value={props.repeatCount} onChangeText={props.onRepeatCountChange} disabled={props.disabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#003d79', borderRadius: 12, padding: 16, marginBottom: 14 },
  title: { color: '#00e5ff', fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, backgroundColor: 'transparent' },
  field: { flex: 1, backgroundColor: 'transparent' },
  label: { color: '#c2d2e4', fontSize: 12, marginBottom: 5 },
  input: { backgroundColor: '#011e41', borderColor: '#1a5c9e', borderWidth: 1, borderRadius: 8, color: '#fff', paddingHorizontal: 10, paddingVertical: 9, marginBottom: 12 },
  disabled: { opacity: 0.55 },
});
