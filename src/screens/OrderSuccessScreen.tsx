import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Order } from '../types/order';
import Icon from 'react-native-vector-icons/Ionicons';
import { OrderStatusService } from '../services/OrderStatusService';

interface OrderSuccessScreenProps {
  route: {
    params: {
      order: Order;
    };
  };
}

export const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ route }) => {
  const { order } = route.params;
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleReturnHome = async () => {
    setIsLoading(true);
    try {
      const result = await OrderStatusService.updateOrderStatus(order.id, 'OnTheWay', {
        orderCompletedTime: new Date().toISOString(),
      });

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to start delivery');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Order</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.successCircle}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <View style={styles.sparkles}>
              <Text style={styles.sparkle}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleTop]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleBottom]}>✦</Text>
            </View>
          </View>

          <Text style={styles.successTitle}>Order completed successfully!</Text>
        </View>

        <TouchableOpacity style={styles.returnButton} onPress={handleReturnHome}>
          <Text style={styles.returnButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 48,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    color: '#FFC107',
    fontSize: 24,
  },
  sparkleTop: {
    top: 0,
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  sparkleRight: {
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  sparkleBottom: {
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  returnButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  returnButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 