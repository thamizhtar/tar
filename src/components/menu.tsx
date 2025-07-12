import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store-context';
import StoreForm from './store-form';
import StoreManagement from './store-mgmt';
import ComList from './comlist';

type Screen = 'space' | 'sales' | 'reports' | 'products' | 'collections' | 'options' | 'metafields' | 'menu' | 'items' | 'locations';

interface FullScreenMenuProps {
  onNavigate: (screen: Screen) => void;
  onClose: () => void;
}

export default function FullScreenMenu({ onNavigate, onClose }: FullScreenMenuProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showStoreManagement, setShowStoreManagement] = useState(false);
  const [showComList, setShowComList] = useState(false);

  // User status and notification data
  const userData = {
    status: 'Work',
    spaceNotifications: [
      { type: 'taxi', message: 'Taxi arriving in 10 minutes', time: '10 mins' },
      { type: 'cab', message: 'Cab booked for 3:30 PM', time: '15 mins' }
    ],
    commerceStats: {
      products: 156,
      inventory: '89%',
      reports: 'Updated'
    }
  };


  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If in store form or management, go back to menu
      if (showStoreForm) {
        setShowStoreForm(false);
        return true;
      }
      if (showStoreManagement) {
        setShowStoreManagement(false);
        return true;
      }
      // Otherwise close menu
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showStoreForm, showStoreManagement, onClose]);



  const handleItemPress = (itemId: string) => {
    // Handle special cases
    if (itemId === 'space') {
      onNavigate('space' as Screen);
    } else if (itemId === 'commerce') {
      onNavigate('sales' as Screen);
    } else if (itemId === 'comlist') {
      setShowComList(true);
    } else if (itemId === 'store') {
      setShowStoreManagement(true);
    } else {
      onNavigate(itemId as Screen);
    }
  };

  // Show store management screens
  if (showStoreForm) {
    return (
      <StoreForm
        onClose={() => setShowStoreForm(false)}
        onSave={() => setShowStoreForm(false)}
      />
    );
  }

  if (showStoreManagement) {
    return (
      <StoreManagement
        onClose={() => setShowStoreManagement(false)}
      />
    );
  }

  if (showComList) {
    return (
      <ComList
        onNavigate={onNavigate}
        onClose={() => setShowComList(false)}
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6" style={{ paddingTop: insets.top + 20 }}>
          {/* User Status Header */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between">
              <View className="w-12 h-12" style={{ borderRadius: 24, overflow: 'hidden' }}>
                <Image
                  source={require('../../assets/raven.png')}
                  style={{ width: 48, height: 48 }}
                  resizeMode="cover"
                />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {(userData.status || '').toLowerCase()}
              </Text>
            </View>
          </View>

          {/* Space Card - White */}
          <TouchableOpacity
            onPress={() => handleItemPress('space')}
            className="bg-white p-6 mb-1"
            style={{ minHeight: 160 }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-black text-2xl font-bold mb-2">Space</Text>
                <Text className="text-gray-500 text-xl font-bold">
                  {userData.spaceNotifications.length > 0
                    ? userData.spaceNotifications[0].message
                    : 'Taxi arriving in 10 minutes'}
                </Text>
              </View>
              <View className="w-10 h-10 bg-gray-100 items-center justify-center" style={{ borderRadius: 20 }}>
                <Text className="text-lg">🌌</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Commerce Card - Green */}
          <TouchableOpacity
            onPress={() => handleItemPress('commerce')}
            className="bg-green-500 p-6"
            style={{ minHeight: 200, borderRadius: 10 }}
          >
            <View className="flex-1">
              {/* Header */}
              <View className="mb-4">
                <Text className="text-black text-2xl font-bold mb-1">Commerce</Text>
                <TouchableOpacity onPress={() => setShowStoreManagement(true)}>
                  <Text className="text-green-800 text-sm">
                    {currentStore?.name || 'Store A'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom row with circles and arrow */}
              <View className="flex-row items-center justify-between mt-auto">
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handleItemPress('products')}
                    className="w-12 h-12 bg-yellow-400 items-center justify-center mr-3"
                    style={{ borderRadius: 24 }}
                  >
                    <Text className="text-black text-xl font-bold">P</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleItemPress('items')}
                    className="w-12 h-12 bg-purple-400 items-center justify-center mr-3"
                    style={{ borderRadius: 24 }}
                  >
                    <Text className="text-black text-xl font-bold">I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleItemPress('reports')}
                    className="w-12 h-12 bg-blue-400 items-center justify-center"
                    style={{ borderRadius: 24 }}
                  >
                    <Text className="text-black text-xl font-bold">R</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => handleItemPress('comlist')}
                  className="w-12 h-12 bg-black items-center justify-center"
                  style={{ borderRadius: 24 }}
                >
                  <Text className="text-white text-xl font-bold">→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>


        </View>
      </ScrollView>


    </View>
  );
}
