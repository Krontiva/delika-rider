import { API_CONFIG } from '../config/env';
import { Order } from '../types/order';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchOrders = async (courierName: string) => {
  try {
    const response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table');
    const orders = await response.json();
    return orders.filter((order: any) => order.courierName === courierName);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const updateRiderLocation = async (location: {
  latitude: number;
  longitude: number;
  timestamp: number;
}) => {
  try {
    const userProfile = await AsyncStorage.getItem('userProfile');
    const userId = userProfile ? JSON.parse(userProfile).id : null;
    const authToken = await AsyncStorage.getItem('authToken');

    if (!userId || !authToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `https://api-server.krontiva.africa/api:uEBBwbSs/locationupdate/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          location: {
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
            lastUpdated: new Date(location.timestamp).toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update location');
    }

    const data = await response.json();
    console.log('Location updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}; 