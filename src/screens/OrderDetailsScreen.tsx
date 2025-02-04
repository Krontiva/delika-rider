import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { order } = route.params as { order: any };
  const [isLoading, setIsLoading] = useState(false);

  const handlePickup = async () => {
    setIsLoading(true);
    try {
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

      // Navigate to next screen with updated order
      navigation.navigate('OrderStartScreen', {
        order: { ...order, orderStatus: 'Pickup' },
      });
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
        <Text style={styles.dateText}>{order.createdAt}</Text>
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

      {/* Action Button */}
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
    margin: 16,
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
}); 