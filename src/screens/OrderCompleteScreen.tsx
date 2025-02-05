import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Order } from '../types/order';
import Icon from 'react-native-vector-icons/Ionicons';

interface OrderCompleteScreenProps {
  route: {
    params: {
      order: Order;
      batchedOrders?: Order[];
      currentBatchIndex?: number;
    };
  };
}

export const OrderCompleteScreen: React.FC<OrderCompleteScreenProps> = ({ route }) => {
  const { order, batchedOrders = [], currentBatchIndex = 0 } = route.params;
  const navigation = useNavigation();

  const handleConfirm = async () => {
    try {
      const orderCompletedTime = new Date().toISOString();
      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: true,
            orderCompletedTime: orderCompletedTime,
            orderReceivedTime: order.orderReceivedTime,
            orderPickedupTime: order.orderPickedupTime,
            orderDeliveredTime: order.orderDeliveredTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // If this is a batch order, update all orders with same batchID
      if (order.batchID) {
        await Promise.all(
          batchedOrders.map(async (batchOrder) => {
            if (batchOrder.id !== order.id) { // Skip current order as it's already updated
              await fetch(
                `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${batchOrder.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    completed: true,
                    orderCompletedTime: orderCompletedTime,
                    orderReceivedTime: order.orderReceivedTime,
                    orderPickedupTime: order.orderPickedupTime,
                    orderDeliveredTime: order.orderDeliveredTime,
                  }),
                }
              );
            }
          })
        );
      }

      if (batchedOrders.length > 0 && currentBatchIndex < batchedOrders.length - 1) {
        // Move to next order in batch
        navigation.navigate('OrderStartScreen', {
          order: batchedOrders[currentBatchIndex + 1],
          batchedOrders,
          currentBatchIndex: currentBatchIndex + 1
        });
      } else {
        // All orders completed, move to success screen
        navigation.navigate('OrderSuccess', { 
          order: { 
            ...order, 
            orderCompletedTime,
            orderReceivedTime: order.orderReceivedTime,
            orderPickedupTime: order.orderPickedupTime,
            orderDeliveredTime: order.orderDeliveredTime
          },
          batchedOrders 
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.customerName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Date and Status */}
      <View style={styles.dateContainer}>
        <Icon name="calendar-outline" size={20} color="#666" />
        <Text style={styles.dateText}>
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{order.orderStatus}</Text>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
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
            <Text style={styles.price}>{item.price} GHC</Text>
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

      {batchedOrders.length > 0 && (
        <Text style={styles.batchProgress}>
          Order {currentBatchIndex + 1} of {batchedOrders.length}
        </Text>
      )}

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>
          {currentBatchIndex < batchedOrders.length - 1 
            ? 'Next Order' 
            : 'Confirm Delivery'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
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
  confirmButton: {
    backgroundColor: '#FF5722',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  batchProgress: {
    margin: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
}); 