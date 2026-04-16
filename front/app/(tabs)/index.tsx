import React, { useState } from 'react';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import { View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import EmptyRobotView from '@/components/robot/EmptyRobotView';
import RobotListItem from '@/components/robot/RobotListItem';
import AddRobotModal from '@/components/robot/AddRobotModal';
import { useRobots } from '@/context/RobotContext';

export default function RobotScreen() {
  const { robots, addRobot } = useRobots();
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // Simulates API call to /api/user/robot/bind
  const handleAddRobot = async (robotData: any) => {
    try {
      await addRobot(robotData.robotCode, robotData.personalityID, robotData.toneID);
    } catch (e: any) {
      alert('绑定失败: ' + (e.message || '网络异常'));
    }
    setAddModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {robots.length === 0 ? (
        <EmptyRobotView onAddPress={() => setAddModalVisible(true)} />
      ) : (
        <>
          <FlatList
            data={robots}
            keyExtractor={(item) => item.robotCode}
            renderItem={({ item }) => (
              <RobotListItem robotCode={item.robotCode} robotName={item.robotName} />
            )}
            contentContainerStyle={styles.listContainer}
          />
          <Pressable style={styles.fab} onPress={() => setAddModalVisible(true)}>
            <FontAwesome name="plus" size={24} color="#011e41" />
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
    paddingTop: 20,
    paddingBottom: 100, // Make room for FAB
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
  }
});
