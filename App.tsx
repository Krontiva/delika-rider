import React from 'react';
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


const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();


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

export default function App() {
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
            name="AccountInformation" 
            component={AccountInformationScreen}
            options={{
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}