import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { OrderCard } from '../components/OrderCard';
import { Order, OrderStatus } from '../types/order';
import { fetchOrders } from '../services/api';
import MapView, { Marker, Callout, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LocationService } from '../services/LocationService';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

// Add filter type
type FilterType = 'Pending' | 'Active' | 'Complete' | 'Other';

// Add this interface for location state
interface CurrentLocation {
  latitude: number;
  longitude: number;
}

// Add status color constants at the top of the file
const STATUS_COLORS = {
  ReadyForPickup: '#DEE9FF',
  Assigned: '#FFFCAD',
  'Pickup': '#EDEDED',
  OnTheWay: '#FFD9AD',
  Delivered: '#D2FFAD',
  Cancelled: '#FFBDAD',
  DeliveryFailed: '#000000',
  Completed: '#D2FFAD'
} as const;

interface GroupedOrders {
  [batchId: string]: Order[];
}

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const COURIER_NAME = userProfile?.fullName; // This could come from user context/state
  const [activeFilter, setActiveFilter] = useState<FilterType>('Pending');
  // Add state for current location
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>({
    latitude: 5.6037,  // Default to Accra
    longitude: -0.1870,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Add refresh interval reference
  const refreshInterval = React.useRef<NodeJS.Timeout>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadOrders = async () => {
    try {
      const fetchedOrders = await fetchOrders(COURIER_NAME || 'Unknown Courier');
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    // Initial load
    loadOrders();

    // Set up interval for refresh
    refreshInterval.current = setInterval(() => {
      loadOrders();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [COURIER_NAME]); // Add COURIER_NAME as dependency

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderStatus: 'Assigned',
            assignedTime: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, orderStatus: 'Assigned' }
            : order
        ));
        
        // Navigate to order details
        navigation.navigate('OrderDetailsScreen', { 
          order: { ...orderToUpdate, orderStatus: 'Assigned' } 
        });
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order. Please try again.');
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderStatus: 'ReadyForPickup',
            cancelledTime: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, orderStatus: 'Cancelled' }
            : order
        ));
      }
    } catch (error) {
      console.error('Error declining order:', error);
      Alert.alert('Error', 'Failed to decline order. Please try again.');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Call your API to update order status
      // await api.updateOrderStatus(orderId, newStatus);
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const groupOrdersByBatch = (orders: Order[]): Order[] => {
    // First, separate batched and non-batched orders
    const batchedOrders: GroupedOrders = {};
    const nonBatchedOrders: Order[] = [];

    orders.forEach(order => {
      if (order.batchID) {
        if (!batchedOrders[order.batchID]) {
          batchedOrders[order.batchID] = [];
        }
        batchedOrders[order.batchID].push(order);
      } else {
        nonBatchedOrders.push(order);
      }
    });

    // For each batch, only take the first order and attach all order numbers
    const processedBatchOrders = Object.entries(batchedOrders).map(([batchId, orders]) => ({
      ...orders[0],
      batchedOrderNumbers: orders.map(o => o.orderNumber),
    }));

    // Combine non-batched orders with one representative from each batch
    return [...nonBatchedOrders, ...processedBatchOrders];
  };

  // Update getFilteredOrders function to match the count logic
  const getFilteredOrders = () => {
    let filteredOrders = orders;
    
    switch (activeFilter) {
      case 'Pending':
        filteredOrders = orders.filter(order => order.orderStatus === 'Assigned'); // Changed from 'Assigned'
        break;
      case 'Active':
        filteredOrders = orders.filter(order => 
          ['Delivered', 'Pickup', 'OnTheWay'].includes(order.orderStatus)
        );
        break;
      case 'Complete':
        filteredOrders = orders.filter(order => order.orderStatus === 'Completed');
        break;
      case 'Other':
        filteredOrders = orders.filter(order => 
          ['Cancelled', 'DeliveryFailed'].includes(order.orderStatus)
        );
        break;
    }

    // Group orders by batch after filtering
    return groupOrdersByBatch(filteredOrders);
  };

  // getFilterCount stays the same since it's already correct
  const getFilterCount = (filter: FilterType) => {
    switch (filter) {
      case 'Pending':
        return orders.filter(order => order.orderStatus === 'Assigned').length;
      case 'Active':
        return orders.filter(order => 
          ['Delivered', 'Pickup', 'OnTheWay'].includes(order.orderStatus)
        ).length;
      case 'Complete':
        return orders.filter(order => order.orderStatus === 'Completed').length;
      case 'Other':
        return orders.filter(order => 
          ['Cancelled', 'DeliveryFailed'].includes(order.orderStatus)
        ).length;
      default:
        return 0;
    }
  };

  // Add useCallback for filter tabs to prevent unnecessary re-renders
  const renderFilterTabs = React.useCallback(() => (
    <View style={styles.filterContainer}>
      {[
        { id: 'Pending', count: getFilterCount('Pending') },
        { id: 'Active', count: getFilterCount('Active') },
        { id: 'Complete', count: getFilterCount('Complete') },
      ].map(({ id, count }) => (
        <TouchableOpacity
          key={id}
          style={[
            styles.filterTab,
            activeFilter === id && styles.activeFilterTab
          ]}
          onPress={() => setActiveFilter(id as FilterType)}
        >
          <Text style={[
            styles.filterLabel,
            activeFilter === id && { color: '#FF5722' }
          ]}>
            {id}
          </Text>
          <View style={[
            styles.countBadge,
            activeFilter === id && styles.activeCountBadge
          ]}>
            <Text style={[
              styles.countText,
              activeFilter === id && styles.activeCountText
            ]}>
              {count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  ), [orders, activeFilter]); // Add dependencies

  // Add function to get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: Number(location.coords.latitude),
        longitude: Number(location.coords.longitude),
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Add useEffect for location
  useEffect(() => {
    getCurrentLocation();
    // Set up location updates
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation({
          latitude: Number(location.coords.latitude),
          longitude: Number(location.coords.longitude),
        });
      }
    );

    return () => {
      // Cleanup subscription
      locationSubscription.then(sub => sub.remove());
    };
  }, []);

  useEffect(() => {
    // Start location tracking when component mounts
    LocationService.startLocationTracking();

    return () => {
      // Stop tracking when component unmounts
      LocationService.stopLocationTracking();
    };
  }, []);

  const handleMarkerPress = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  // Add function to render order markers
  const renderOrderMarkers = () => {
    const filteredOrders = getFilteredOrders();
    
    return filteredOrders.map(order => {
      // For pickup location marker
      const pickupCoords = {
        latitude: Number(order.pickup[0].fromLatitude),
        longitude: Number(order.pickup[0].fromLongitude),
      };

      // For dropoff location marker
      const dropoffCoords = ['Assigned', 'Pickup', 'OnTheWay', 'Delivered', 'DeliveryFailed', 'Completed'].includes(order.orderStatus) ? {
        latitude: Number(order.dropOff[0].toLatitude),
        longitude: Number(order.dropOff[0].toLongitude),
      } : null;

      return (
        <React.Fragment key={order.id}>
          <Marker
            coordinate={pickupCoords}
            pinColor={STATUS_COLORS[order.orderStatus]}
            onPress={() => {
              if (order.orderStatus === 'ReadyForPickup') {
                setSelectedOrderId(order.id);
              }
            }}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Order #{order.orderNumber}</Text>
                <Text style={styles.calloutText}>{order.pickup[0].fromAddress}</Text>
                <Text style={styles.calloutStatus}>{order.orderStatus}</Text>
              </View>
            </Callout>
          </Marker>

          {dropoffCoords && (
            <React.Fragment>
              <Marker
                coordinate={dropoffCoords}
                pinColor={STATUS_COLORS[order.orderStatus]}
              >
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>Dropoff #{order.orderNumber}</Text>
                    <Text style={styles.calloutText}>{order.dropOff[0].toAddress}</Text>
                  </View>
                </Callout>
              </Marker>
            </React.Fragment>
          )}
        </React.Fragment>
      );
    });
  };

  const navigateBasedOnStatus = (order: Order) => {
    console.log('Navigating with status:', order.orderStatus); // Add logging

    switch (order.orderStatus) {
      case 'ReadyForPickup':
        // Show accept/decline modal
        setSelectedOrderId(order.id);
        break;
        
      case 'Assigned':
        navigation.navigate('OrderDetailsScreen', { order });
        break;
        
      case 'Pickup': // Changed from 'Picked Up'
        navigation.navigate('OrderStartScreen', { order });
        break;
        
      case 'OnTheWay':
        navigation.navigate('OrderDropoffScreen', { order });
        break;
        
      case 'Delivered':
        navigation.navigate('OrderCompleteScreen', { order });
        break;

      case 'Completed':
        navigation.navigate('OrderReceipt', { order });
        break;
        
      default:
        // For any other status, go to details
        navigation.navigate('OrderDetailsScreen', { order });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            ...currentLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
          showsCompass={true}
          showsScale={true}
        >
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor="#000"
          />
          {renderOrderMarkers()}
        </MapView>
      </View>
      
      {renderFilterTabs()}
      <FlatList
        data={getFilteredOrders()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAccept={handleAcceptOrder}
            onDecline={handleDeclineOrder}
            onUpdateStatus={handleUpdateStatus}
            currentLocation={currentLocation}
            isModalVisible={selectedOrderId === item.id}
            setIsModalVisible={(visible) => {
              if (visible) {
                setSelectedOrderId(item.id);
              } else {
                setSelectedOrderId(null);
              }
            }}
            onPress={() => navigateBasedOnStatus(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: '#FF5722',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#FF5722',
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeCountText: {
    color: 'white',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.50, // Increased from 0.3 to 0.4
    width: '100%',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '500',
  },
}); 