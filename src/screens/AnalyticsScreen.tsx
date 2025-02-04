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
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
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
      if (order.createdAt && order.orderCompletedTime) {
        const duration = new Date(order.orderCompletedTime).getTime() - 
                        new Date(order.createdAt).getTime();
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
            filteredOrders = fetchedOrders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'monthly':
          if (dateRange) {
            filteredOrders = fetchedOrders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'range':
          if (dateRange) {
            filteredOrders = fetchedOrders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= dateRange.start && 
                     orderDate <= dateRange.end;
            });
          }
          break;

        case 'daily':
        default:
          filteredOrders = fetchedOrders.filter(order => 
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  const analytics = calculateAnalytics(orders);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Delivery Status</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={getChartData(orders)}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={false}
            segments={4}
            verticalLabelRotation={0}
            horizontalLabelRotation={0}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Total Earnings</Text>
          <Text style={styles.amount}>₵{analytics.totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Total Orders</Text>
          <Text style={styles.number}>{analytics.totalOrders}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Hours Worked</Text>
          <Text style={styles.number}>{analytics.totalHours}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Avg Delivery Time</Text>
          <Text style={styles.number}>
            {analytics.averageDeliveryTime.toFixed(1)}h
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
    paddingRight: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  halfCard: {
    flex: 1,
    margin: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
}); 