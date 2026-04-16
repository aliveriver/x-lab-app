import React, { useState } from 'react';
import { StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import AppInfoModal from '@/components/user/AppInfoModal';
import * as ImagePicker from 'expo-image-picker';

export default function MineScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [appInfoVisible, setAppInfoVisible] = useState(false);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("需要权限", "需要相册权限来更换头像");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      updateUser({ avatar: result.assets[0].uri });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Card 1: User Profile */}
        <LinearGradient colors={['#003d79', '#011e41']} style={styles.card}>
          <Pressable onPress={handlePickAvatar} style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              {user.avatar === 'default' ? (
                <FontAwesome name="user-circle" size={50} color="#00e5ff" />
              ) : (
                <Image source={{ uri: user.avatar }} style={styles.customAvatar} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.userName}</Text>
              <Text style={styles.userId}>ID: {user.userID}</Text>
            </View>
            <View>
              <FontAwesome name="camera" size={20} color="#475569" />
            </View>
          </Pressable>
        </LinearGradient>

        {/* Card 2: Edit User Info Action */}
        <Pressable onPress={() => router.push('/user/edit')}>
          <LinearGradient colors={['#003d79', '#011e41']} style={styles.actionCard}>
            <View style={styles.actionLeft}>
              <FontAwesome name="pencil-square-o" size={24} color="#00e5ff" style={styles.actionIcon} />
              <Text style={styles.actionText}>修改用户信息</Text>
            </View>
            <FontAwesome name="angle-right" size={24} color="#475569" />
          </LinearGradient>
        </Pressable>

        {/* Card 3: Software Info Action */}
        <Pressable onPress={() => setAppInfoVisible(true)}>
          <LinearGradient colors={['#003d79', '#011e41']} style={styles.actionCard}>
            <View style={styles.actionLeft}>
              <FontAwesome name="info-circle" size={24} color="#00e5ff" style={styles.actionIcon} />
              <Text style={styles.actionText}>软件与系统信息</Text>
            </View>
            <FontAwesome name="angle-right" size={24} color="#475569" />
          </LinearGradient>
        </Pressable>

      </ScrollView>

      <AppInfoModal visible={appInfoVisible} onClose={() => setAppInfoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  card: {
    borderRadius: 16,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    marginBottom: 20,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  customAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00e5ff',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    marginRight: 20,
    backgroundColor: 'transparent',
  },
  profileInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  userId: {
    fontSize: 14,
    color: '#00e5ff',
    opacity: 0.8,
    letterSpacing: 1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: 15,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionIcon: {
    width: 30,
    textAlign: 'center',
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  }
});
