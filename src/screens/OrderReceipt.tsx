import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export const OrderReceipt: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { order } = route.params as { order: any };
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
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
        <TouchableOpacity style={styles.locationItem}>
          <Text style={styles.locationName}>{order.pickup[0].fromAddress}</Text>
          <Icon name="call-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationItem}>
          <Text style={styles.locationName}>{order.dropOff[0].toAddress}</Text>
          <Icon name="call-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalAmount}>{order.deliveryPrice} GH₵</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>Go To Order Screen</Text>
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