import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Order } from '../types/order';
import { OrderStatusService } from '../services/OrderStatusService';

interface OrderSuccessScreenProps {
  route: {
    params: {
      order: Order;
    };
  };
}

export const OTPScreen: React.FC<OrderSuccessScreenProps> = ({ route }) => {
  const { order } = route.params;
  const navigation = useNavigation();
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const validateResult = await OrderStatusService.validateOTP(order.id, otp);
      
      if (!validateResult.success) {
        Alert.alert('Error', validateResult.error || 'Invalid OTP');
        return;
      }

      const updateResult = await OrderStatusService.updateOrderStatus(order.id, 'Delivered', {
        deliveryTime: new Date().toISOString(),
      });

      if (updateResult.success) {
        navigation.navigate('OrderSuccess', { 
          order: { ...order, orderStatus: 'Delivered' } 
        });
      } else {
        Alert.alert('Error', updateResult.error || 'Failed to complete delivery');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberPress = (num: string) => {
    if (otp.length < 4) {
      setOtp(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setOtp(prev => prev.slice(0, -1));
  };

  const renderOTPDigits = () => {
    const digits = ['', '', '', ''];
    const otpArray = otp.split('');

    return (
      <View style={styles.otpContainer}>
        {digits.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.otpDigit,
              otpArray[index] ? styles.otpDigitFilled : null,
              index === otpArray.length ? styles.otpDigitActive : null
            ]}
          >
            <Text style={styles.otpText}>
              {otpArray[index] || ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '←'],
    ];

    return (
      <View style={styles.keypadContainer}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((num, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.keypadButton,
                  !num && styles.keypadButtonEmpty
                ]}
                onPress={() => num === '←' ? handleBackspace() : num && handleNumberPress(num)}
                disabled={!num}
              >
                <Text style={styles.keypadButtonText}>
                  {num === '←' ? '⌫' : num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Order</Text>
      </View>

      <Text style={styles.instruction}>
        Ask customer for 4-digit code set via SMS.
      </Text>

      {renderOTPDigits()}
      {renderKeypad()}

      <TouchableOpacity 
        style={[styles.confirmButton, otp.length !== 4 && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={otp.length !== 4}
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  otpDigit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigitFilled: {
    borderColor: '#FF5722',
    backgroundColor: '#FFF',
  },
  otpDigitActive: {
    borderColor: '#FF5722',
    borderWidth: 2,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ddd',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  keypadContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 12,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
}); 