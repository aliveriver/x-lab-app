import React, { useState } from 'react';
import { StyleSheet, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { MOCK_TONES, MOCK_PERSONALITIES } from '@/constants/MockData';
import ChangeToneModal from '@/components/robot/ChangeToneModal';
import ChangePersonalityModal from '@/components/robot/ChangePersonalityModal';

type AddRobotModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (robotData: any) => void;
};

export default function AddRobotModal({ visible, onClose, onConfirm }: AddRobotModalProps) {
  const [robotCode, setRobotCode] = useState('');
  const [robotName, setRobotName] = useState('');
  const [toneID, setToneID] = useState<number | null>(null);
  const [personalityID, setPersonalityID] = useState<number | null>(null);

  const [toneModalVisible, setToneModalVisible] = useState(false);
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);

  const toneName = MOCK_TONES.find(t => t.toneID === toneID)?.toneName || '点击选择音色模块';
  const personalityName = MOCK_PERSONALITIES.find(p => p.personalityID === personalityID)?.personalityName || '点击选择初始人格';

  const handleConfirm = () => {
    if (!robotCode || !robotName || !toneID || !personalityID) {
      alert('请将所有终端信息填充完整。');
      return;
    }
    onConfirm({
      robotCode,
      robotName,
      toneID,
      personalityID
    });
    // Reset state
    setRobotCode('');
    setRobotName('');
    setToneID(null);
    setPersonalityID(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>接入新机器人终端</Text>
            <Pressable onPress={onClose}>
              <FontAwesome name="times" size={24} color="#00e5ff" />
            </Pressable>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>终端编码 (Robot Code)</Text>
            <TextInput
              style={styles.input}
              placeholder="例如: 123456"
              placeholderTextColor="#475569"
              value={robotCode}
              onChangeText={setRobotCode}
            />

            <Text style={styles.label}>终端昵称 (Name)</Text>
            <TextInput
              style={styles.input}
              placeholder="输入一个专属代号"
              placeholderTextColor="#475569"
              value={robotName}
              onChangeText={setRobotName}
            />

            <Text style={styles.label}>选择音色模块</Text>
            <Pressable style={styles.selectButton} onPress={() => setToneModalVisible(true)}>
              <FontAwesome name="headphones" size={20} color="#00e5ff" style={styles.selectIcon} />
              <Text style={styles.selectButtonText}>{toneName}</Text>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </Pressable>

            <Text style={styles.label}>写入初始人格</Text>
            <Pressable style={styles.selectButton} onPress={() => setPersonalityModalVisible(true)}>
              <FontAwesome name="user-secret" size={20} color="#00e5ff" style={styles.selectIcon} />
              <Text style={styles.selectButtonText}>{personalityName}</Text>
              <FontAwesome name="angle-right" size={24} color="#475569" />
            </Pressable>

            <ChangeToneModal
              visible={toneModalVisible}
              currentToneID={toneID}
              onClose={() => setToneModalVisible(false)}
              onSelect={(id) => { setToneID(id); setToneModalVisible(false); }}
            />
            
            <ChangePersonalityModal
              visible={personalityModalVisible}
              currentPersonalityID={personalityID}
              onClose={() => setPersonalityModalVisible(false)}
              onSelect={(id) => { setPersonalityID(id); setPersonalityModalVisible(false); }}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.submitBtn} onPress={handleConfirm}>
              <Text style={styles.submitBtnText}>确认接入并激活</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 30, 65, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#011e41',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00e5ff',
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  selectIcon: {
    marginRight: 10,
  },
  selectButtonText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitBtn: {
    backgroundColor: '#00e5ff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  submitBtnText: {
    color: '#011e41',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
