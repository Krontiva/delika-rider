import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { DatePicker } from '../components/DatePicker';
import { fetchOrders } from '../services/api';
import { Order } from '../types/order';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.6,
  propsForLabels: {
    fontSize: 12,
    textAlign: 'center',
  },
  propsForVerticalLabels: {
    fontSize: 10,
    rotation: 0,
  },
};

const RangePicker: React.FC<{
  dateRange: { start: Date; end: Date } | null;
  onDateChange: (range: { start: Date; end: Date }) => void;
}> = ({ dateRange, onDateChange }) => {
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

  const handleStartDateConfirm = (date: Date) => {
    onDateChange({
      start: date,
      end: dateRange?.end || date,
    });
    setStartDatePickerVisible(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    onDateChange({
      start: dateRange?.start || date,
      end: date,
    });
    setEndDatePickerVisible(false);
  };

  return (
    <View style={styles.rangePicker}>
      <TouchableOpacity 
        style={styles.rangeButton}
        onPress={() => setStartDatePickerVisible(true)}
      >
        <Text style={styles.rangeLabel}>From</Text>
        <Text style={styles.rangeDate}>
          {dateRange?.start ? format(dateRange.start, 'MMM dd, yyyy') : 'Select date'}
        </Text>
      </TouchableOpacity>

      <View style={styles.rangeDivider}>
        <Text style={styles.rangeDividerText}>-</Text>
      </View>

      <TouchableOpacity 
        style={styles.rangeButton}
        onPress={() => setEndDatePickerVisible(true)}
      >
        <Text style={styles.rangeLabel}>To</Text>
        <Text style={styles.rangeDate}>
          {dateRange?.end ? format(dateRange.end, 'MMM dd, yyyy') : 'Select date'}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={() => setStartDatePickerVisible(false)}
        maximumDate={dateRange?.end || new Date()}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={() => setEndDatePickerVisible(false)}
        minimumDate={dateRange?.start}
        maximumDate={new Date()}
      />
    </View>
  );
};

export const AnalyticsScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly' | 'range'>('daily');
  const [dateRange, setDateRange] = useState<{start: Date; end: Date} | null>(null);
  const COURIER_NAME = 'Judas'; // Replace with actual courier name

  const calculateAnalytics = (filteredOrders: Order[]) => {
    const totalEarnings = filteredOrders
      .filter(order => order.orderStatus === 'Delivered')
      .reduce((sum, order) => sum + Number(order.deliveryPrice || 0), 0);

    const totalOrders = filteredOrders.length;

    const completedOrders = filteredOrders.filter(
      order => order.orderStatus === 'Delivered'
    );

    const totalHours = completedOrders.reduce((sum, order) => {
      if (order.created_at && order.orderCompletedTime) {
        const duration = new Date(order.orderCompletedTime).getTime() - 
                        new Date(order.created_at).getTime();
        return sum + (duration / (1000 * 60 * 60)); // Convert to hours
      }
      return sum;
    }, 0);

    return {
      totalEarnings,
      totalOrders,
      totalHours: Math.round(totalHours),
      averageDeliveryTime: totalOrders ? (totalHours / totalOrders) : 0,
    };
  };

  const getChartData = (filteredOrders: Order[]) => {
    const pending = filteredOrders.filter(
      order => order.orderStatus === 'ReadyForPickup'
    ).length;

    const active = filteredOrders.filter(
      order => ['Assigned', 'Picked Up', 'OnTheWay'].includes(order.orderStatus)
    ).length;

    const complete = filteredOrders.filter(
      order => order.orderStatus === 'Delivered'
    ).length;

    const failed = filteredOrders.filter(
      order => ['Cancelled', 'DeliveryFailed'].includes(order.orderStatus)
    ).length;

    return {
      labels: ['Pending', 'Active', 'Complete', 'Failed'],
      datasets: [
        {
          data: [pending, active, complete, failed],
          colors: [
            (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Orange for pending
            (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for active
            (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for complete
            (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for failed
          ],
        },
      ],
    };
  };

  const loadOrders = async () => {
    try {
      const fetchedOrders = await fetchOrders(COURIER_NAME);
      
      let filteredOrders;
      switch (filterType) {
        case 'weekly':
          if (dateRange) {
            filteredOrders = fetchedOrders.filter((order: Order) => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'monthly':
          if (dateRange) {
            filteredOrders = fetchedOrders.filter((order: Order) => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'range':
          if (dateRange) {
            filteredOrders = fetchedOrders.filter((order: Order) => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'daily':
        default:
          filteredOrders = fetchedOrders.filter((order: Order) => 
            isSameDay(new Date(order.created_at), selectedDate)
          );
          break;
      }

      setOrders(filteredOrders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedDate, filterType, dateRange]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const handleFilterChange = (type: 'daily' | 'weekly' | 'monthly' | 'range') => {
    setFilterType(type);
    const now = new Date();
    
    switch (type) {
      case 'weekly':
        setDateRange({
          start: startOfWeek(now),
          end: endOfWeek(now)
        });
        break;
      case 'monthly':
        setDateRange({
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
        break;
      case 'daily':
        setDateRange(null);
        setSelectedDate(now);
        break;
      case 'range':
        // Range will be handled by date picker
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      </SafeAreaView>
    );
  }

  const analytics = calculateAnalytics(orders);

  const chartData = getChartData(orders);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'daily' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('daily')}
            >
              <Text style={[styles.filterText, filterType === 'daily' && styles.filterTextActive]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'weekly' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('weekly')}
            >
              <Text style={[styles.filterText, filterType === 'weekly' && styles.filterTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'monthly' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('monthly')}
            >
              <Text style={[styles.filterText, filterType === 'monthly' && styles.filterTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'range' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('range')}
            >
              <Text style={[styles.filterText, filterType === 'range' && styles.filterTextActive]}>
                Range
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {filterType === 'daily' && (
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
        {filterType === 'range' && (
          <RangePicker 
            dateRange={dateRange}
            onDateChange={setDateRange}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders Overview</Text>
          <View style={styles.card}>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 40}
              height={220}
              yAxisLabel="₵"
              yAxisSuffix=" "
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
              }}
              style={styles.chart}
              showValuesOnTopOfBars={true}
            />
          </View>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₵2.4k</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Add padding for Android
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  lastSection: {
    marginBottom: 40, // Extra margin for last section
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF5722',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  rangePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rangeButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rangeDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rangeDivider: {
    paddingHorizontal: 12,
  },
  rangeDividerText: {
    color: '#666',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 