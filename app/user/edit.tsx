import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/context/UserContext';

export default function EditUserScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  
  const [userName, setUserName] = useState(user.userName);
  const [phone, setPhone] = useState(user.phonenumber);
  const [code, setCode] = useState('');
  
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = () => {
    if (phone.length < 11) {
      Alert.alert('提示', '请输入正确的手机号格式');
      return;
    }
    Alert.alert('验证码发送成功', '请查收（Mock：随便填写均可通过）');
    setCountdown(60);
  };

  const handleSave = () => {
    if (!userName.trim() || !phone.trim()) {
      Alert.alert('校验失败', '昵称和手机号不能为空');
      return;
    }
    // Simulate API Call logic
    updateUser({ userName, phonenumber: phone });
    
    if (Platform.OS === 'web') {
      window.alert('系统提示: 用户凭证更新已录入全局网络。');
      router.back();
    } else {
      Alert.alert('系统提示', '用户凭证更新已录入全局区块链网络。', [
        { text: '回退', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: '覆盖终端用户凭证', 
        headerStyle: { backgroundColor: '#003d79' }, 
        headerTintColor: '#ffffff' 
      }} />

      <ScrollView contentContainerStyle={styles.scrollArea} keyboardShouldPersistTaps="handled">
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>通信昵称 (Callsign)</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="user" size={18} color="#00e5ff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="请输入新昵称"
              placeholderTextColor="#475569"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>绑定频率 (Phone Number)</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="phone" size={18} color="#00e5ff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="请输入最新手机号码"
              placeholderTextColor="#475569"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>认证密钥 (Auth Code)</Text>
          <View style={styles.codeRow}>
            <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
              <FontAwesome name="shield" size={18} color="#00e5ff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="6位短信密钥"
                placeholderTextColor="#475569"
              />
            </View>
            <Pressable 
              style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]} 
              onPress={handleSendCode}
              disabled={countdown > 0}
            >
              <Text style={styles.codeBtnText}>
                {countdown > 0 ? `${countdown}s 后重新解析` : '请求认证密钥'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleSave}>
            <LinearGradient colors={['#00e5ff', '#00b4ff']} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>保存认证并更新</Text>
              <FontAwesome name="check-circle" size={20} color="#011e41" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#011e41',
  },
  scrollArea: {
    padding: 24,
    paddingTop: 40,
  },
  formGroup: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  codeBtn: {
    marginLeft: 15,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00e5ff',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  codeBtnDisabled: {
    borderColor: '#475569',
  },
  codeBtnText: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 50,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  saveBtnText: {
    color: '#011e41',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});
