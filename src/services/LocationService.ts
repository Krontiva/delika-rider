import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { updateRiderLocation } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TRACKING = 'location-tracking';

// Define the background task
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error('Location Task Error:', error);
    return;
  }
  if (data) {
    try {
      const { locations } = data as { locations: Location.LocationObject[] };
      const location = locations[0];
      
      if (!location) return;

      // Send location update to your backend
      await updateRiderLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }
});

export const LocationService = {
  async startLocationTracking() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.error('Background permission denied');
        return false;
      }

      // Check if the task is already running
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }

      // Start the location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Tracking your delivery location",
          notificationColor: "#FF5722",
        },
        // Add these for better battery performance
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
      });

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  },

  async stopLocationTracking() {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  },
}; 