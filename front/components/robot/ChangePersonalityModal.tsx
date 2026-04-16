import React, { useEffect, useState } from 'react';
import { StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { fetchApi } from '@/utils/api';

type PersonalityItem = {
  personalityID: number;
  personalityName: string;
};

type ChangePersonalityModalProps = {
  visible: boolean;
  robotID?: string;
  currentPersonalityID: number | null;
  onClose: () => void;
  onSelect: (id: number, name: string) => void;
};

export default function ChangePersonalityModal({
  visible,
  robotID,
  currentPersonalityID,
  onClose,
  onSelect,
}: ChangePersonalityModalProps) {
  const [personalities, setPersonalities] = useState<PersonalityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const loadPersonalities = async () => {
      setLoading(true);
      try {
        const result = await fetchApi(`/api/robot/${robotID || 'options'}/initPersonality`);
        if ((result.code === 0 || result.code === 200) && result.data?.personalityList) {
          setPersonalities(result.data.personalityList);
        } else {
          setPersonalities([]);
        }
      } catch (e) {
        console.error('Failed to load personalities', e);
        setPersonalities([]);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalities();
  }, [visible, robotID]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>选择初始人格</Text>
            <Pressable onPress={onClose}>
              <FontAwesome name="times" size={24} color="#00e5ff" />
            </Pressable>
          </View>

          <ScrollView style={styles.listContainer}>
            {loading && <Text style={styles.emptyText}>加载中...</Text>}
            {!loading && personalities.length === 0 && <Text style={styles.emptyText}>暂无可用人格</Text>}
            {personalities.map(item => {
              const isActive = currentPersonalityID === item.personalityID;
              return (
                <Pressable
                  key={item.personalityID}
                  style={[styles.itemRef, isActive && styles.itemActive]}
                  onPress={() => onSelect(item.personalityID, item.personalityName)}
                >
                  <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
                    {item.personalityName}
                  </Text>
                  {isActive && <FontAwesome name="check" size={16} color="#011e41" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 30, 65, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#011e41',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderTopColor: '#00e5ff',
    borderLeftColor: '#00e5ff',
    borderRightColor: '#00e5ff',
    borderBottomWidth: 0,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    maxHeight: '60%',
    paddingBottom: 30,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00e5ff',
  },
  listContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  itemRef: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#00e5ff',
  },
  itemText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  itemTextActive: {
    color: '#011e41',
    fontWeight: 'bold',
  },
});
