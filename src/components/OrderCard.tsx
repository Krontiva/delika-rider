import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Order, OrderStatus } from '../types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance } from '../utils/distance';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

interface OrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  currentLocation: { latitude: number; longitude: number };
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  onPress: () => void;
}

const STATUS_COLORS = {
  ReadyForPickup: {
    background: '#DEE9FF',
    text: '#4A6FA5'
  },
  Assigned: {
    background: '#FFFCAD',
    text: '#8B8654'
  },
  'Pickup': {
    background: '#EDEDED',
    text: '#666666'
  },
  OnTheWay: {
    background: '#FFD9AD',
    text: '#A67B4D'
  },
  Delivered: {
    background: '#D2FFAD',
    text: '#5C8C3E'
  },
  Cancelled: {
    background: '#FFBDAD',
    text: '#A65D45'
  },
  DeliveryFailed: {
    background: '#000000',
    text: '#FFFFFF'
  },
  Completed: {
    background: '#D2FFAD',
    text: '#5C8C3E'
  }
} as const;

const getStatusColors = (status: OrderStatus | undefined) => {
  if (!status || !(status in STATUS_COLORS)) {
    return STATUS_COLORS.ReadyForPickup; // fallback to default
  }
  return STATUS_COLORS[status];
};

// Add a helper function to truncate address
const truncateAddress = (address: string) => {
  // Get first line by splitting on newline or comma
  const firstLine = address.split(/[\n,]/)[0];
  // Truncate if longer than 30 characters
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
};

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onAccept,
  onDecline,
  currentLocation,
  isModalVisible,
  setIsModalVisible,
  onPress
}) => {
  const navigation = useNavigation();

  const handleAcceptPress = () => {
    onAccept(order.id);
    setIsModalVisible(false);
  };

  const handleDeclinePress = () => {
    onDecline(order.id);
    setIsModalVisible(false);
  };

  const handleViewDetailsPress = () => {
    switch (order.orderStatus) {
      case 'ReadyForPickup':
        setIsModalVisible(true);  // Show accept/decline modal
        break;
      case 'Assigned':
        navigation.navigate('OrderDetailsScreen', { order });
        break;
      case 'Pickup':
        navigation.navigate('OrderStartScreen', { order });
        break;
      case 'OnTheWay':
        navigation.navigate('OrderDropoffScreen', { order });
        break;
      case 'Delivered':
        navigation.navigate('OrderSuccess', { order });
        break;
      case 'Completed':
        navigation.navigate('OrderReceipt', { order });
        break;
      default:
        navigation.navigate('OrderDetailsScreen', { order });
        break;
    }
  };

  const shouldShowDistance = 
    order.orderStatus === 'ReadyForPickup' || 
    ['Assigned', 'Picked Up', 'OnTheWay'].includes(order.orderStatus);

  const getDistance = () => {
    if (!shouldShowDistance || !order.pickup?.[0]?.fromLatitude || !order.pickup?.[0]?.fromLongitude) {
      return null;
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      order.pickup[0].fromLatitude,
      order.pickup[0].fromLongitude
    );

    return `${distance} km away`;
  };

  const handleBackdropPress = () => {
    setIsModalVisible(false);
  };

  const handlePress = () => {
    if (order.orderStatus === 'ReadyForPickup') {
      setIsModalVisible(true);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.orderId}>#{String(order.orderNumber).padStart(3, '0')}</Text>
          {shouldShowDistance && (
            <Text style={styles.distance}>{getDistance()}</Text>
          )}
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColors(order.orderStatus).background }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: getStatusColors(order.orderStatus).text }
          ]}>
            {order.orderStatus || 'ReadyForPickup'}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <Text style={styles.locationLabel}>Pickup</Text>
          <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            {truncateAddress(order.pickup[0].fromAddress)}
          </Text>
        </View>
        <View style={styles.locationItem}>
          <Text style={styles.locationLabel}>Dropoff</Text>
          <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            {truncateAddress(order.dropOff[0].toAddress)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>{order.deliveryPrice} GH₵</Text>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={handleViewDetailsPress}
        >
          <Text style={styles.detailsText}>
            {order.orderStatus === 'ReadyForPickup' ? 'Accept/Decline' : 'View Details'}
          </Text>
        </TouchableOpacity>
      </View>

      {order.orderStatus === 'ReadyForPickup' && (
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={handleBackdropPress}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={e => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Accept this order?</Text>
              <Text style={styles.modalText}>Order #{order.orderNumber} from {order.customerName}</Text>
              <Text style={styles.modalAddress}>Pickup is at: {truncateAddress(order.pickup[0].fromAddress)}</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.declineButton]}
                  onPress={handleDeclinePress}
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.acceptButton]}
                  onPress={handleAcceptPress}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  orderId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    marginVertical: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  detailsButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#FF5722',
  },
  declineButton: {
    backgroundColor: '#000000',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 4,
    fontWeight: '500',
  },
  modalCustomer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  }, 
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 