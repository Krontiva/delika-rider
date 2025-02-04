import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  const handleDayPress = (day: any) => {
    onDateChange(new Date(day.timestamp));
    setIsModalVisible(false);
  };

  const handleToday = () => {
    onDateChange(new Date());
    setIsModalVisible(false);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <View style={styles.calendarIcon}>
            <Text>📅</Text>
          </View>
          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={styles.label}>Choose Date</Text>
            <View style={styles.dateContainer}>
              <View style={styles.checkmarkContainer}>
                {isToday(selectedDate) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.dateText}>
                {isToday(selectedDate) ? 'Today, ' : ''}{format(selectedDate, 'd MMM')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.gridButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.gridIcon}>⊞</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity 
                    style={styles.todayButton}
                    onPress={handleToday}
                  >
                    <Text style={styles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                </View>
                <Calendar
                  current={format(selectedDate, 'yyyy-MM-dd')}
                  onDayPress={handleDayPress}
                  markedDates={{
                    [format(selectedDate, 'yyyy-MM-dd')]: {
                      selected: true,
                      selectedColor: '#FF5722',
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#FF5722',
                    todayTextColor: '#FF5722',
                    arrowColor: '#FF5722',
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 12,
    fontSize: 24,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginRight: 8,
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  gridButton: {
    backgroundColor: '#FF5722',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIcon: {
    color: 'white',
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 