import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Order } from '../types/order';

interface BatchedOrders {
  [batchId: string]: Order[];
}

export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { order } = route.params as { order: Order };
  const [isLoading, setIsLoading] = useState(false);
  const [batchedOrders, setBatchedOrders] = useState<BatchedOrders>({});

  useEffect(() => {
    if (order.batchID) {
      // Fetch all orders with the same batch ID
      fetchBatchedOrders();
    }
  }, [order.batchID]);

  const fetchBatchedOrders = async () => {
    try {
      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table?batchID=${order.batchID}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch batched orders');
      
      const orders: Order[] = await response.json();
      // Filter orders to only include those with matching batchID
      const filteredOrders = orders.filter(o => o.batchID === order.batchID);
      setBatchedOrders({
        [order.batchID!]: filteredOrders
      });
    } catch (error) {
      console.error('Error fetching batched orders:', error);
    }
  };

  const handlePickup = async () => {
    setIsLoading(true);
    try {
      if (order.batchID) {
        // Handle batched orders
        const batchOrders = batchedOrders[order.batchID] || [];
        await Promise.all(
          batchOrders.map(async (batchOrder) => {
            await fetch(
              `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${batchOrder.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderStatus: 'Pickup',
                  orderPickedUpTime: new Date().toISOString(),
                }),
              }
            );
          })
        );

        // Navigate with the first order of the batch
        navigation.navigate('OrderStartScreen', {
          order: { ...batchOrders[0], orderStatus: 'Pickup' },
          batchedOrders: batchOrders, // Pass all batched orders to next screen
        });
      } else {
        // Handle single order (existing logic)
        const response = await fetch(
          `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderStatus: 'Pickup',
              orderPickedUpTime: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        navigation.navigate('OrderStartScreen', {
          order: { ...order, orderStatus: 'Pickup' },
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = Platform.select({
      ios: `telprompt:${phoneNumber}`,
      android: `tel:${phoneNumber}`
    });

    if (phoneUrl) {
      Linking.canOpenURL(phoneUrl)
        .then(supported => {
          if (!supported) {
            Alert.alert('Error', 'Phone dialer is not available');
          } else {
            return Linking.openURL(phoneUrl);
          }
        })
        .catch(err => {
          console.error('Error opening phone dialer:', err);
          Alert.alert('Error', 'Could not open phone dialer');
        });
    }
  };

  const renderBatchedOrders = () => {
    const batchOrders = batchedOrders[order.batchID!] || [];
    
    const totalAmount = batchOrders.reduce((sum, order) => {
      const price = Number(order.deliveryPrice) || 0;
      return sum + price;
    }, 0);

    return (
      <>
        <Text style={styles.batchTitle}>Batch #{order.batchID}</Text>
        {batchOrders.map((batchOrder, index) => (
          <View key={batchOrder.id} style={styles.batchOrderItem}>
            <Text style={styles.batchOrderNumber}>Order #{batchOrder.orderNumber}</Text>

            {/* Delivery Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Details</Text>
              <View style={styles.locationItem}>
                <Text style={styles.locationName}>{batchOrder.pickup[0].fromAddress}</Text>
                <TouchableOpacity onPress={() => handleCall(batchOrder.customerPhoneNumber)}>
                  <Icon name="call-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.locationItem}>
                <Text style={styles.locationName}>{batchOrder.dropOff[0].toAddress}</Text>
                <TouchableOpacity onPress={() => handleCall(batchOrder.customerPhoneNumber)}>
                  <Icon name="call-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Individual Order Amount */}
            <View style={styles.orderAmountContainer}>
              <Text style={styles.orderAmountLabel}>Delivery Fee</Text>
              <Text style={styles.orderAmount}>
                {Number(batchOrder.deliveryPrice).toFixed(2)} GH₵
              </Text>
            </View>

            {index < batchOrders.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
        
        {/* Total Amount for Batch */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{totalAmount.toFixed(2)} GH₵</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FF5722" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {order.batchID ? 'Batch Orders' : order.customerName}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          {order.batchID ? (
            renderBatchedOrders()
          ) : (
            <>
              {/* Date and Status */}
              <View style={styles.dateContainer}>
                <Icon name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString('en-GB')}</Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{order.orderStatus}</Text>
                <Text style={styles.orderNumber}>
                  <Text>#</Text>
                  {order.orderNumber}
                </Text>
              </View>

              {/* Order Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                {order.products && order.products.map((item: any, index: number) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.quantity}>{item.quantity}x</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.price}>{item.price} GH₵</Text>
                  </View>
                ))}
              </View>

              {/* Delivery Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Details</Text>
                <View style={styles.locationItem}>
                  <Text style={styles.locationName}>{order.pickup[0].fromAddress}</Text>
                  <TouchableOpacity onPress={() => handleCall(order.customerPhoneNumber)}>
                    <Icon name="call-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationName}>{order.dropOff[0].toAddress}</Text>
                  <TouchableOpacity onPress={() => handleCall(order.customerPhoneNumber)}>
                    <Icon name="call-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total Amount */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalAmount}>{order.deliveryPrice} GH₵</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            onPress={handlePickup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Pick Up</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#FF5722',
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateText: {
    marginLeft: 8,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  orderNumber: {
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginRight: 8,
    color: '#666',
  },
  itemName: {
    fontSize: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationName: {
    fontSize: 16,
  },
  totalContainer: {
    padding: 16,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  batchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  batchOrderItem: {
    padding: 16,
    backgroundColor: 'white',
  },
  batchOrderNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FF5722',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  orderAmountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginTop: 8,
    borderRadius: 8,
  },
  orderAmountLabel: {
    fontSize: 16,
    color: '#666',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5722',
  },
}); 