import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Order } from '../types/order';
import Icon from 'react-native-vector-icons/Ionicons';

interface OrderDropoffScreenProps {
  route: {
    params: {
      order: Order;
    };
  };
}

export const OrderDropoffScreen: React.FC<OrderDropoffScreenProps> = ({ route }) => {
  const { order } = route.params;
  const navigation = useNavigation();
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number; longitude: number}>>([]);

  useEffect(() => {
    fetchRoute();
  }, []);

  const fetchRoute = async () => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${order.pickup[0].fromLongitude},${order.pickup[0].fromLatitude};` +
        `${order.dropOff[0].toLongitude},${order.dropOff[0].toLatitude}` +
        `?overview=full&geometries=geojson`
      );

      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        // Convert coordinates from [longitude, latitude] to {latitude, longitude}
        const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const handleDropoff = async () => {
    try {
      // Navigate directly to complete screen without OTP
      navigation.navigate('OrderCompleteScreen', { order });
    } catch (error) {
      console.error('Error handling dropoff:', error);
    }
  };

  const handleBackPress = () => {
    // Navigate to Orders screen and reset the stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleCall = () => {
    const phoneNumber = order.customerPhoneNumber;
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

  const openGoogleMaps = () => {
    const destination = `${order.dropOff[0].toLatitude},${order.dropOff[0].toLongitude}`;
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
      android: `google.navigation:q=${destination}&mode=d`
    });
    
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    Linking.canOpenURL(url!)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url!);
        } else {
          // If Google Maps app is not installed, open in browser
          return Linking.openURL(webUrl);
        }
      })
      .catch(err => {
        console.error('Error opening Google Maps:', err);
        Alert.alert('Error', 'Could not open Google Maps');
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
      >
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.callButton} 
        onPress={handleCall}
      >
        <Icon name="call" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navigationButton} 
        onPress={openGoogleMaps}
      >
        <Icon name="navigate" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: Number(order.dropOff[0].toLatitude),
            longitude: Number(order.dropOff[0].toLongitude),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
        >
          <Marker
            coordinate={{
              latitude: Number(order.pickup[0].fromLatitude),
              longitude: Number(order.pickup[0].fromLongitude),
            }}
            title="Pickup Location"
            description={order.pickup[0].fromAddress}
          />
          <Marker
            coordinate={{
              latitude: Number(order.dropOff[0].toLatitude),
              longitude: Number(order.dropOff[0].toLongitude),
            }}
            title="Dropoff Location"
            description={order.dropOff[0].toAddress}
          />
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#FF5722"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.deliveryStatus}>Delivery in progress</Text>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <TouchableOpacity style={styles.dropoffButton} onPress={handleDropoff}>
          <Text style={styles.dropoffButtonText}>Drop Off</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  deliveryStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  dropoffButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dropoffButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 1,
    backgroundColor: '#FF5722',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationButton: {
    position: 'absolute',
    top: 48,
    right: 68, // Position it next to the call button
    zIndex: 1,
    backgroundColor: '#4285F4', // Google Maps blue
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 