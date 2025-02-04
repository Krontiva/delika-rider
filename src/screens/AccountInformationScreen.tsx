import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  id?: string;
}

export const AccountInformationScreen: React.FC = () => {
  const { colors } = useApp();
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    id: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const user = JSON.parse(userProfile);
        setUserData({
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          id: user.id || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSave = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        const user = JSON.parse(userProfile);
        const userId = user.id;

        // API call to update user profile
        const response = await fetch(
          `https://api-server.krontiva.africa/api:uEBBwbSs/riderupdate/${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fullName: userData.fullName,
              email: userData.email,
              address: userData.address,
              phoneNumber: userData.phone,
              delikaquickshipper_user_table_id: userId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        // Update local storage
        const updatedProfile = {
          ...user,
          ...userData,
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const renderField = (label: string, value: string, key: keyof UserData, icon: string) => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Icon name={icon} size={20} color="#FF5722" style={styles.fieldIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.input, { borderColor: '#FF5722' }]}
          value={value}
          onChangeText={(text) => setUserData({ ...userData, [key]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
        />
      ) : (
        <Text style={styles.value}>{value || `No ${label.toLowerCase()} provided`}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FF5722" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={[styles.editButton, isEditing && styles.saveButton]}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person-outline" size={40} color="#FF5722" />
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formContainer}>
          {renderField('Full Name', userData.fullName, 'fullName', 'person')}
          {renderField('Email', userData.email, 'email', 'mail')}
          {renderField('Phone', userData.phone, 'phone', 'call')}
          {renderField('Address', userData.address, 'address', 'location')}
        </View>
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF5722',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    paddingVertical: 8,
  },
  changePhotoText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#333',
  },
}); 