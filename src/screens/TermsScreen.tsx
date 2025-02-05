import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const termsData = [
  {
    icon: 'description',
    title: 'Agreement',
    summary: 'Terms of Use & Service Agreement',
    description: 'By using Delika, you agree to be bound by these terms. The platform is operated by Krontiva Africa Ltd, registered in Ghana.',
    details: [
      'Platform is operated by Krontiva Africa Ltd',
      'Users must comply with all terms and conditions',
      'Service available to users 18 years and above',
      'Registration requires accurate information'
    ]
  },
  {
    icon: 'gavel',
    title: 'Services',
    summary: 'Platform Services & Features',
    description: 'Delika is a technology platform for restaurants to manage delivery services, connecting businesses with delivery riders.',
    details: [
      'Restaurant management system',
      'Delivery service integration',
      'Real-time order tracking',
      'Inventory management tools'
    ]
  },
  {
    icon: 'verified-user',
    title: 'User Rights',
    summary: 'Your Rights & Responsibilities',
    description: 'Users must be 18+ and provide accurate information. We protect your rights while using our platform.',
    details: [
      'Right to access services',
      'Data protection & privacy',
      'Account security',
      'Service accessibility'
    ]
  },
  {
    icon: 'security',
    title: 'Security',
    summary: 'Data & Payment Security',
    description: 'We implement robust security measures to protect your data and transactions.',
    details: [
      'Encrypted transactions',
      'Secure data storage',
      'Privacy protection',
      'Regular security audits'
    ]
  },
  {
    icon: 'payment',
    title: 'Payments',
    summary: 'Payment Terms & Conditions',
    description: 'All transactions are in Ghanaian Cedis with clear subscription and fee structures.',
    details: [
      'Transparent pricing',
      'Secure payment processing',
      'Refund policies',
      'Transaction records'
    ]
  }
];

interface ExpandableTermProps {
  section: typeof termsData[0];
  isExpanded: boolean;
  onPress: () => void;
}

const ExpandableTerm: React.FC<ExpandableTermProps> = ({ 
  section, 
  isExpanded, 
  onPress 
}) => {
  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Icon name={section.icon} size={24} color="#FF5722" />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Icon 
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
          size={24} 
          color="#666"
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.summary}>{section.summary}</Text>
          <Text style={styles.description}>{section.description}</Text>
          <View style={styles.detailsList}>
            {section.details.map((detail, idx) => (
              <View key={idx} style={styles.detailItem}>
                <Icon name="check-circle" size={16} color="#FF5722" />
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setUserProfile } = useApp();
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be scheduled for deletion in 30 days. During this period, you can log in to cancel the deletion. Are you sure you want to proceed?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set deletion date 30 days from now
              const deletionDate = new Date();
              deletionDate.setDate(deletionDate.getDate() + 30);
              
              await AsyncStorage.setItem('accountDeletionDate', deletionDate.toISOString());
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userProfile');
              
              setUserProfile(null);
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            } catch (error) {
              console.error('Error scheduling account deletion:', error);
              Alert.alert('Error', 'Failed to schedule account deletion. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.header}>Terms and Conditions</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {termsData.map((section, index) => (
            <ExpandableTerm
              key={index}
              section={section}
              isExpanded={expandedSections.includes(index)}
              onPress={() => toggleSection(index)}
            />
          ))}

          <View style={styles.deletionSection}>
            <Text style={styles.deletionTitle}>Account Deletion</Text>
            <Text style={styles.deletionDescription}>
              You can request to delete your account at any time. The deletion process will be initiated 
              and completed after 30 days. During this period, you can log in to cancel the deletion process.
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Icon name="delete-forever" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    height: Platform.OS === 'android' ? 56 + (StatusBar.currentHeight || 0) : 56,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 20 : 0,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#000',
    flex: 1,
  },
  summary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsList: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  deletionSection: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    margin: 16,
    borderRadius: 12,
  },
  deletionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  deletionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandedContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
}); 