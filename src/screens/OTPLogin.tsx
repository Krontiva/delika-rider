import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type OTPLoginRouteProp = RouteProp<RootStackParamList, 'OTPLogin'>;

export const OTPLogin = () => {
    const [otp, setOtp] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const navigation = useNavigation();
    const route = useRoute<OTPLoginRouteProp>();

    useEffect(() => {
        // Get email from navigation params
        if (route.params?.email) {
            setUserEmail(route.params.email);
            // Send OTP email when component mounts
            sendOTPEmail(route.params.email);
        }
    }, []);
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

    const handleConfirm = async () => {
        try {
            // Step 2: Verify OTP
            const verifyResponse = await fetch(
                'https://api-server.krontiva.africa/api:uEBBwbSs/verify/otp/code',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contact: userEmail,  // Now using userEmail from state
                        type: true,
                        code: otp
                    }),
                }
            );

            if (verifyResponse.ok) {
                navigation.navigate('MainTabs');
            } else {
                Alert.alert('Error', 'Invalid OTP code');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify OTP');
            console.error(error);
        }
    };

    // Add this function to send the initial email (Step 1)
    const sendOTPEmail = async (email: string) => {
        try {
            const response = await fetch(
                'https://api-server.krontiva.africa/api:uEBBwbSs/reset/user/password/email',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to send OTP');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send OTP email');
            console.error(error);
        }
    };

   return(
        <View style={styles.container}>
            <Text style={styles.title}>Please check your email for your OTP</Text>
            <Text style={styles.subtitle}>Enter OTP to proceed to application</Text>

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
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    otpBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    otpBoxFilled: {
        borderColor: '#FF5722',
        backgroundColor: '#fff',
    },
    otpText: {
        fontSize: 24,
        color: '#000',
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
    },
    confirmButton: {
        backgroundColor: '#FF5722',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
    confirmButtonText: {
        color: '#fff',
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
});