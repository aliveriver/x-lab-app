import React from 'react';
import { StyleSheet, Modal, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type AppInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AppInfoModal({ visible, onClose }: AppInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient colors={['#003d79', '#011e41']} style={styles.gradientBg}>
            <View style={styles.header}>
              <FontAwesome name="cube" size={50} color="#00e5ff" style={styles.appIcon} />
              <Text style={styles.appName}>Neural Terminal App</Text>
              <Text style={styles.versionText}>Version 1.0.0-BetaCore</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>开发者</Text>
              <Text style={styles.infoValue}>DUT Tech Initiative</Text>
              
              <Text style={styles.infoLabel}>版权声明</Text>
              <Text style={styles.infoValue}>X-Lab 所有权保留。本系统专为高级人机连接构建，未经授权禁止逆向工程。</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>返回终端</Text>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  gradientBg: {
    padding: 30,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  appIcon: {
    marginBottom: 15,
    textShadowColor: 'rgba(0, 229, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 14,
    color: '#00e5ff',
    letterSpacing: 2,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    marginVertical: 20,
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 15,
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#00e5ff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  closeBtnText: {
    color: '#011e41',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
