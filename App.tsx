import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './src/context/AppContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { AccountInformationScreen } from './src/screens/AccountInformationScreen';
import { OrderSuccessScreen } from './src/screens/OrderSuccessScreen';
import { RootStackParamList } from './src/types/navigation';
import { OrderDetailsScreen } from './src/screens/OrderDetailsScreen';
import { OrderStartScreen } from './src/screens/OrderStartScreen';
import { OrderDropoffScreen } from './src/screens/OrderDropoffScreen';
import { OrderCompleteScreen } from './src/screens/OrderCompleteScreen';
import { OTPLogin } from './src/screens/OTPLogin';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import registerNNPushToken from 'native-notify';
import { registerIndieID } from 'native-notify';
import axios from 'axios';
import { OrderReceipt } from './src/screens/OrderReceipt';
import { TermsScreen } from './src/screens/TermsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const APP_ID = "26729";
const APP_TOKEN = "EcxsXXDddPOcgFcNk198Dp";
// Set up notification handlers
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 5).toUpperCase();
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName || 'help-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
async function registerIndie() {
  const existingDeviceID = await AsyncStorage.getItem('deviceID');
  if (!existingDeviceID) {
    const deviceID = `rider_${generateRandomString()}`;
    await AsyncStorage.setItem('deviceID', deviceID);
    registerIndieID(deviceID, APP_ID, APP_TOKEN);
  }
}

export default function App() {

  registerNNPushToken(APP_ID, APP_TOKEN);
  registerIndie();

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="OTPLogin" component={OTPLogin as React.ComponentType<any>} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="OrderDetailsScreen" 
            component={OrderDetailsScreen as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="OrderSuccess" 
            component={OrderSuccessScreen as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="OrderStartScreen" 
            component={OrderStartScreen as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="OrderDropoffScreen" 
            component={OrderDropoffScreen as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="OrderCompleteScreen" 
            component={OrderCompleteScreen as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="OrderReceipt" 
            component={OrderReceipt as React.ComponentType<any>} 
          />
          <Stack.Screen 
            name="AccountInformation" 
            component={AccountInformationScreen}
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen}
            options={{
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}