import React, { useState } from 'react';
import { StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import EmptyRobotView from '@/components/robot/EmptyRobotView';
import RobotListItem from '@/components/robot/RobotListItem';
import AddRobotModal from '@/components/robot/AddRobotModal';
import { useRobots } from '@/context/RobotContext';

export default function RobotScreen() {
  const { robots, addRobot } = useRobots();
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // 过滤逻辑
  const filteredRobots = robots.filter(r => 
    r.robotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.robotCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulates API call to /api/user/robot/bind
  const handleAddRobot = async (robotData: any) => {
    try {
      await addRobot(robotData.robotCode, robotData.robotName, robotData.personalityID, robotData.toneID);
    } catch (e: any) {
      alert('绑定失败: ' + (e.message || '网络异常'));
    }
    setAddModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#00e5ff" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索终端节点别备或UUID..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearIcon}>
            <FontAwesome name="times-circle" size={16} color="#475569" />
          </Pressable>
        )}
      </View>

      {robots.length === 0 ? (
        <EmptyRobotView onAddPress={() => setAddModalVisible(true)} />
      ) : (
        <>
          <FlatList
            data={filteredRobots}
            keyExtractor={(item) => item.robotCode}
            renderItem={({ item }) => (
              <RobotListItem robotCode={item.robotCode} robotName={item.robotName} />
            )}
            contentContainerStyle={styles.listContainer}
          />
          <Pressable style={styles.fab} onPress={() => setAddModalVisible(true)}>
            <FontAwesome name="plus" size={24} color="#011e41" />
          </Pressable>
          <Pressable style={styles.remoteFab} onPress={() => router.push('/remote' as any)}>
            <FontAwesome name="gamepad" size={24} color="#011e41" />
          </Pressable>
        </>
      )}
      
      <AddRobotModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onConfirm={handleAddRobot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 100, // Make room for FAB
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    backgroundColor: 'rgba(5, 11, 20, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a5c9e',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 10,
  },
  clearIcon: {
    padding: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  remoteFab: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  }
});
