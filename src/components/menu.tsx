import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../lib/store-context';
import StoreSelector from './store-selector';
import StoreForm from './store-form';
import StoreManagement from './store-mgmt';

type Screen = 'dashboard' | 'sales' | 'reports' | 'products' | 'collections' | 'options' | 'menu';

interface FullScreenMenuProps {
  onNavigate: (screen: Screen) => void;
  onClose: () => void;
}

export default function FullScreenMenu({ onNavigate, onClose }: FullScreenMenuProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showStoreManagement, setShowStoreManagement] = useState(false);


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

  const cardMenuItems = [
    // Top row
    { id: 'dashboard', title: 'Dashboard', position: 'top-left' },
    { id: 'reports', title: 'Reports', position: 'top-center' },
    { id: 'sales', title: 'Sales', position: 'top-right' },

    // Middle section
    { id: 'inventory', title: 'Inventory', position: 'middle-left', hasQR: true },
    { id: 'store', title: 'Store A', position: 'middle-right', isStore: true },

    // Bottom row
    { id: 'products', title: 'Products', position: 'bottom-left' },
    { id: 'collections', title: 'Collections', position: 'bottom-right' },
  ];

  const additionalMenuItems = [
    { id: 'options', title: 'Options' },
    { id: 'metafields', title: 'Metafields' },
  ];

  const handleItemPress = (item: any) => {
    // Handle special cases
    if (item.id === 'inventory') {
      // Navigate to products screen for inventory
      onNavigate('products' as Screen);
    } else if (item.id === 'store') {
      // Handle store selection/management
      setShowStoreManagement(true);
    } else if (item.id === 'metafields') {
      // Handle metafields navigation (placeholder for now)
      console.log('Metafields navigation not implemented yet');
    } else {
      onNavigate(item.id as Screen);
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

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Menu</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-2">
              <Text className="text-lg font-medium text-gray-600">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-8">
          {/* Main Menu Card - Clean & Aligned */}
          <View className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
            {/* Top Row: Dashboard, Reports, Sales */}
            <View className="flex-row border-b border-gray-200">
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'dashboard' })}
                className="flex-1 py-5 border-r border-gray-200 items-center justify-center"
              >
                <Text className="text-gray-900 text-base font-medium">Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'reports' })}
                className="flex-1 py-5 border-r border-gray-200 items-center justify-center"
              >
                <Text className="text-gray-900 text-base font-medium">Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'sales' })}
                className="flex-1 py-5 items-center justify-center"
              >
                <Text className="text-gray-900 text-base font-medium">Sales</Text>
              </TouchableOpacity>
            </View>

            {/* Middle Section: Inventory with QR + Store */}
            <View className="flex-row border-b border-gray-200">
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'inventory' })}
                className="flex-1 px-5 py-5 border-r border-gray-200 flex-row items-center justify-between"
              >
                <Text className="text-gray-900 text-base font-medium">Inventory</Text>
                <View className="w-7 h-7 bg-gray-900 rounded items-center justify-center">
                  <Text className="text-white text-xs font-medium">QR</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowStoreManagement(true)}
                className="flex-1 px-5 py-5 items-center justify-center"
              >
                <Text className="text-blue-600 text-base font-semibold">
                  {currentStore?.name || 'Store'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Products, Collections */}
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'products' })}
                className="flex-1 py-5 border-r border-gray-200 items-center justify-center"
              >
                <Text className="text-gray-900 text-base font-medium">Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleItemPress({ id: 'collections' })}
                className="flex-1 py-5 items-center justify-center"
              >
                <Text className="text-gray-900 text-base font-medium">Collections</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Menu Items */}
          <View className="mb-8">
            {additionalMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemPress(item)}
                className="py-4"
              >
                <Text className="text-gray-900 text-base font-medium">{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-4 pt-6 border-t border-gray-200" style={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
        <View className="flex-row justify-between items-center">
          {/* Left side: Profile/Signout and Settings */}
          <View className="flex-row items-center">
            <TouchableOpacity className="p-2 mr-4">
              <Text className="text-2xl">👋</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-2">
              <Text className="text-2xl">🎮</Text>
            </TouchableOpacity>
          </View>

          {/* Right side: Agents */}
          <TouchableOpacity className="p-2">
            <Text className="text-2xl">🕹️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
