import React, { useState } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { View } from '@/components/Themed';
import EmptyRobotView from '@/components/robot/EmptyRobotView';
import RobotListItem from '@/components/robot/RobotListItem';
import AddRobotModal from '@/components/robot/AddRobotModal';
import { useRobots } from '@/context/RobotContext';

export default function RobotScreen() {
  const { robots, addRobot } = useRobots();
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // Simulates API call to /api/user/robot/bind
  const handleAddRobot = (robotData: any) => {
    addRobot(robotData);
    setAddModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {robots.length === 0 ? (
        <EmptyRobotView onAddPress={() => setAddModalVisible(true)} />
      ) : (
        <FlatList
          data={robots}
          keyExtractor={(item) => item.robotCode}
          renderItem={({ item }) => (
            <RobotListItem robotCode={item.robotCode} robotName={item.robotName} />
          )}
          contentContainerStyle={styles.listContainer}
        />
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
    paddingBottom: 40,
  }
});
