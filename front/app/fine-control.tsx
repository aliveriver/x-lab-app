import FontAwesome from '@expo/vector-icons/FontAwesome';
import Slider from '@react-native-community/slider';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRobotConnection } from '@/utils/robotSocket';

const JOINTS = [
  ['J1 肩俯仰', -1.57, 1.57], ['J2 肩侧摇', -1.57, 1.57],
  ['J3 肩旋转', -1.57, 1.57], ['J4 肘弯曲', 0, 2.36],
  ['J5 腕旋转', -1.57, 1.57], ['J6 腕俯仰', -1.04, 1.04],
  ['J7 腕偏转', -0.79, 0.79],
] as const;
const FINGERS = ['小指', '无名指', '中指', '食指', '拇指弯曲', '拇指旋转'];
type Pose = { id: string; name: string; left: number[]; right: number[]; left_hand?: number[]; right_hand?: number[] };

export default function FineControlScreen() {
  const { ip = '192.168.209.186' } = useLocalSearchParams<{ ip?: string }>();
  const { state, connect, sendCommand } = useRobotConnection(String(ip));
  const [left, setLeft] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [right, setRight] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [leftHand, setLeftHand] = useState([0, 0, 0, 0, 0, 0]);
  const [rightHand, setRightHand] = useState([0, 0, 0, 0, 0, 0]);
  const [poseName, setPoseName] = useState('新动作');
  const [poses, setPoses] = useState<Pose[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (state === 'disconnected') connect(); }, [state, connect]);

  const command = async (action: string, params: Record<string, any> = {}) => {
    const result = await sendCommand(action, params);
    if (!result.ok || result.data?.ok === false) throw new Error(result.error || result.data?.error || '操作失败');
    return result.data;
  };
  const delayed = (fn: () => void) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(fn, 120); };
  const armChange = (side: 'left' | 'right', index: number, value: number) => {
    const source = side === 'left' ? left : right; const next = [...source]; next[index] = Math.round(value * 100) / 100;
    side === 'left' ? setLeft(next) : setRight(next);
    delayed(() => command('move_both_arms', { left_positions: side === 'left' ? next : left, right_positions: side === 'right' ? next : right }).catch(e => Alert.alert('控制失败', e.message)));
  };
  const fingerChange = (side: 'left' | 'right', index: number, value: number) => {
    const source = side === 'left' ? leftHand : rightHand; const next = [...source]; next[index] = Math.round(value * 100) / 100;
    side === 'left' ? setLeftHand(next) : setRightHand(next);
    delayed(() => command('control_both_hands', { left_angles: side === 'left' ? next : leftHand, right_angles: side === 'right' ? next : rightHand }).catch(e => Alert.alert('手指控制失败', e.message)));
  };
  const refresh = async () => { try { setPoses((await command('arm_pose_list')).poses || []); } catch (e: any) { Alert.alert('刷新失败', e.message); } };
  const readJointState = async () => { try { const data = await command('joint_state_read'); setLeft(data.left); setRight(data.right); setLeftHand(data.left_hand); setRightHand(data.right_hand); } catch (e: any) { Alert.alert('读取失败', e.message); } };
  const save = async () => { try { await command('arm_pose_save', { name: poseName }); await refresh(); } catch (e: any) { Alert.alert('保存失败', e.message); } };
  const execute = (pose: Pose) => Alert.alert('确认执行', `双臂和双手将执行“${pose.name}”`, [{ text: '取消' }, { text: '执行', style: 'destructive', onPress: () => command('arm_pose_execute', { pose_id: pose.id, safety_confirmed: true }).catch(e => Alert.alert('执行失败', e.message)) }]);
  const remove = async (pose: Pose) => { try { await command('arm_pose_delete', { pose_id: pose.id }); await refresh(); } catch (e: any) { Alert.alert('删除失败', e.message); } };

  const sliders = (title: string, values: number[], hand: boolean, side: 'left' | 'right') => <View style={s.card}><Text style={s.title}>{title}</Text>{(hand ? FINGERS : JOINTS.map(x => x[0])).map((name, i) => { const min = hand ? 0 : Number(JOINTS[i][1]); const max = hand ? 1 : Number(JOINTS[i][2]); return <View key={name} style={s.sliderRow}><Text style={s.label}>{name}</Text><Slider style={s.slider} minimumValue={min} maximumValue={max} value={values[i]} onValueChange={v => hand ? fingerChange(side, i, v) : armChange(side, i, v)} minimumTrackTintColor="#00b4ff" maximumTrackTintColor="#24476c" thumbTintColor="#00e5ff"/><Text style={s.value}>{values[i].toFixed(2)}</Text></View>;})}</View>;

  return <SafeAreaView style={s.container}><Stack.Screen options={{ title: '双臂与手指精细控制', headerStyle: { backgroundColor: '#011e41' }, headerTintColor: '#fff' }}/><View style={s.status}><View style={[s.dot,{backgroundColor:state==='connected'?'#36e39a':'#f59e0b'}]}/><Text style={s.statusText}>{state === 'connected' ? `${ip} 已连接` : '正在连接机器人…'}</Text></View><ScrollView contentContainerStyle={s.content}><TouchableOpacity style={s.readBtn} onPress={readJointState}><FontAwesome name="refresh" size={17} color="#fff"/><Text style={s.btnText}>读取机器人关节状态并刷新进度条</Text></TouchableOpacity>{sliders('左臂·7关节',left,false,'left')}{sliders('右臂·7关节',right,false,'right')}{sliders('左手·6手指',leftHand,true,'left')}{sliders('右手·6手指',rightHand,true,'right')}<View style={s.card}><Text style={s.title}>固定动作（双臂+双手）</Text><View style={s.row}><TextInput style={s.input} value={poseName} onChangeText={setPoseName}/><TouchableOpacity style={s.btn} onPress={save}><Text style={s.btnText}>读取并保存</Text></TouchableOpacity><TouchableOpacity style={s.btn} onPress={refresh}><Text style={s.btnText}>刷新</Text></TouchableOpacity></View>{poses.map(p => <View key={p.id} style={s.pose}><Text style={s.poseName}>{p.name}</Text><TouchableOpacity style={s.smallBtn} onPress={() => execute(p)}><Text style={s.btnText}>执行</Text></TouchableOpacity><TouchableOpacity style={[s.smallBtn,{backgroundColor:'#7f1d1d'}]} onPress={() => remove(p)}><Text style={s.btnText}>删除</Text></TouchableOpacity></View>)}</View></ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({container:{flex:1,backgroundColor:'#011e41'},status:{flexDirection:'row',alignItems:'center',padding:12,gap:8},dot:{width:10,height:10,borderRadius:5},statusText:{color:'#c2d2e4'},content:{padding:12,paddingBottom:40,gap:12},readBtn:{backgroundColor:'#087fb8',borderRadius:10,padding:12,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8},card:{backgroundColor:'#062b52',borderRadius:12,padding:12,borderWidth:1,borderColor:'#1a5c9e'},title:{color:'#00e5ff',fontSize:16,fontWeight:'700',marginBottom:8},sliderRow:{flexDirection:'row',alignItems:'center'},label:{color:'#c2d2e4',fontSize:12,width:78},slider:{flex:1,height:38},value:{color:'#8ab4f8',width:42,textAlign:'right'},row:{flexDirection:'row',gap:8},input:{flex:1,backgroundColor:'#011e41',color:'#fff',borderRadius:8,paddingHorizontal:10},btn:{backgroundColor:'#087fb8',padding:10,borderRadius:8},btnText:{color:'#fff',fontWeight:'700'},pose:{flexDirection:'row',alignItems:'center',gap:8,marginTop:8,backgroundColor:'#011e41',padding:8,borderRadius:8},poseName:{flex:1,color:'#fff'},smallBtn:{backgroundColor:'#087fb8',paddingHorizontal:10,paddingVertical:7,borderRadius:6}});
