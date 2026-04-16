import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Alert, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchApi } from '@/utils/api';
import { useUser } from '@/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [phonenumber, setPhonenumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loadUserInfo } = useUser();

  const handleLogin = async () => {
    if (!phonenumber || code.length !== 6) {
      const msg = '请输入手机号以及6位数校验码。';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('效验失败', msg);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchApi('/api/user/token', {
        method: 'POST',
        bodyData: { phonenumber, code }
      });
      
      if ((result.code === 0 || result.code === 200) && result.data?.token) {
        // 保存 Token 和 userID
        await AsyncStorage.setItem('ACCESS_TOKEN', result.data.token);
        await AsyncStorage.setItem('USER_ID', result.data.userID);
        
        // Context 加载用户身份，并跳转回主页面
        await loadUserInfo();
        router.replace('/(tabs)');
      } else {
        const errStr = result.msg || '节点访问遭拒。';
        Platform.OS === 'web' ? window.alert(errStr) : Alert.alert('登入失败', errStr);
      }
    } catch (err) {
      const failMsg = '网关通讯丢失，请检查端口环境！';
      Platform.OS === 'web' ? window.alert(failMsg) : Alert.alert('网络异常', failMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#011e41']} style={styles.background} />
      <View style={styles.content}>
        <FontAwesome name="superpowers" size={80} color="#00e5ff" style={styles.heroLogo} />
        <Text style={styles.title}>TERMINAL SYNC</Text>
        <Text style={styles.subtitle}>终端通讯序列化校验系统</Text>

        <View style={styles.inputGroup}>
          <FontAwesome name="phone" size={18} color="#00e5ff" />
          <TextInput 
            style={styles.input} 
            placeholder="通讯频谱编号 (Phone)"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            value={phonenumber}
            onChangeText={setPhonenumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <FontAwesome name="lock" size={18} color="#00e5ff" />
          <TextInput 
            style={styles.input} 
            placeholder="执行脉冲码 (6位验证码)"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            secureTextEntry
            value={code}
            onChangeText={setCode}
          />
        </View>

        <Pressable onPress={handleLogin} disabled={loading} style={({pressed}) => pressed ? {opacity: 0.8} : {}}>
          <LinearGradient colors={['#00e5ff', '#00b4ff']} style={styles.authBtn}>
            <Text style={styles.authBtnText}>{loading ? '建立接驳中...' : '授权访问'}</Text>
          </LinearGradient>
        </Pressable>
        {/* Helper Note */}
        <Text style={styles.helperText}>* 无账号则自建识别档。使用测试服务器时输入任意6位数字均可通过防御协定。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center' },
  background: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 30, backgroundColor: 'transparent' },
  heroLogo: { alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: '#00e5ff', textAlign: 'center', marginBottom: 40, letterSpacing: 2 },
  
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#00e5ff',
    paddingVertical: 10,
    marginBottom: 20,
    backgroundColor: 'transparent'
  },
  input: {
    flex: 1,
    marginLeft: 15,
    color: '#ffffff',
    fontSize: 16,
  },
  
  authBtn: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6
  },
  authBtnText: { color: '#011e41', fontSize: 16, fontWeight: 'bold', letterSpacing: 4 },
  helperText: { marginTop: 30, color: '#475569', fontSize: 12, textAlign: 'center', lineHeight: 20 }
});
