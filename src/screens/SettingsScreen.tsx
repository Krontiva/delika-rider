import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const { colors } = useApp();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [userData, setUserData] = React.useState<{
    fullName: string;
    rating?: number;
  } | null>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        if (userProfile) {
          const user = JSON.parse(userProfile);
          setUserData({
            fullName: user.fullName || user.name || 'User',
            rating: user.rating || 4.82,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const renderListItem = (
    icon: string,
    title: string,
    rightText?: string,
    onPress?: () => void,
    destructive?: boolean,
    hideArrow?: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        { borderBottomColor: colors.border }
      ]}
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <Icon 
          name={icon} 
          size={24} 
          color={destructive ? '#FF3B30' : '#FF5722'} 
          style={styles.icon}
        />
        <Text style={[
          styles.listItemText,
          destructive ? styles.destructiveText : { color: colors.text }
        ]}>
          {title}
        </Text>
      </View>
      {rightText && (
        <View style={styles.rightContent}>
          <Text style={[styles.rightText, { color: '#FF5722' }]}>{rightText}</Text>
          {!hideArrow && <Icon name="chevron-forward" size={20} color="#FF5722" />}
        </View>
      )}
      {!rightText && !hideArrow && <Icon name="chevron-forward" size={20} color="#FF5722" />}
    </TouchableOpacity>
  );

  const handlePersonalInfo = () => {
    navigation.navigate('AccountInformation');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const userProfile = await AsyncStorage.getItem('userProfile');
              if (userProfile) {
                const user = JSON.parse(userProfile);
                const userId = user.id;

                // Call logout endpoint
                const response = await fetch(
                  `https://api-server.krontiva.africa/api:uEBBwbSs/logout/${userId}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error('Logout failed');
                }

                // Clear local storage
                await AsyncStorage.clear();
                
                // Navigate to SignIn screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                });
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCustomerSupport = () => {
    const phoneNumber = '0256899200';
    const phoneUrl = Platform.select({
      ios: `telprompt:${phoneNumber}`,
      android: `tel:${phoneNumber}`
    });

    if (phoneUrl) {
      Linking.canOpenURL(phoneUrl)
        .then(supported => {
          if (!supported) {
            Alert.alert(
              'Error',
              'Phone dialer is not available'
            );
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={[styles.avatarContainer, { backgroundColor: '#FFF3E0' }]}>
          <Icon name="person-outline" size={40} color="#FF5722" />
        </View>
        <Text style={styles.name}>{userData?.fullName || 'Loading...'}</Text>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderListItem(
          'call-outline',
          'Customer Support',
          '0256899200',
          handleCustomerSupport,
          false,
          true
        )}
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        {renderListItem('person-outline', 'Personal info', undefined, handlePersonalInfo)}
        {renderListItem('globe-outline', 'Language', 'English-GB', () => {}, false, true)}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        {renderListItem('log-out-outline', 'Log out', undefined, handleLogout)}
        {renderListItem('trash-outline', 'Delete account', undefined, () => {}, true)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  updateBanner: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  updateIconContainer: {
    marginRight: 16,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  updateSubtitle: {
    color: '#666',
    marginBottom: 4,
  },
  suggestions: {
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  listItemText: {
    fontSize: 16,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    color: '#8E8E93',
    marginRight: 8,
  },
  destructiveText: {
    color: '#FF3B30',
  },
}); 