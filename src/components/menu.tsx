import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
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
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showStoreManagement, setShowStoreManagement] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
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

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '🎈',
    },
    {
      id: 'sales',
      title: 'Sales',
      icon: '💰',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: '📈',
    },
    {
      id: 'products',
      title: 'Product Management',
      icon: '📦',
      hasSubmenu: true,
      submenu: [
        {
          id: 'products',
          title: 'Products',
        },
        {
          id: 'options',
          title: 'Options',
        }
      ]
    },
    {
      id: 'collections',
      title: 'Collections',
      icon: '🏷️',
    },
  ];

  const handleItemPress = (item: any) => {
    if (item.hasSubmenu) {
      toggleSubmenu(item.id);
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-8">
          {/* Store Selector */}
          <StoreSelector
            onCreateStore={() => setShowStoreForm(true)}
            onEditStores={() => setShowStoreManagement(true)}
          />
          {/* Menu Items */}
          <View className="mb-8">
            {menuItems.map((item) => (
              <View key={item.id}>
                <TouchableOpacity
                  onPress={() => handleItemPress(item)}
                  className="flex-row items-center py-4 border-b border-gray-100"
                >
                  <Text className="text-2xl mr-4">{item.icon}</Text>
                  <Text className="flex-1 text-lg font-medium text-gray-900">
                    {item.title}
                  </Text>
                  {item.hasSubmenu ? (
                    <MaterialIcons
                      name={expandedMenus.has(item.id) ? "keyboard-arrow-down" : "keyboard-arrow-right"}
                      size={24}
                      color="#9CA3AF"
                    />
                  ) : (
                    <Text className="text-gray-400 text-xl">›</Text>
                  )}
                </TouchableOpacity>

                {/* Submenu Items */}
                {item.hasSubmenu && expandedMenus.has(item.id) && item.submenu && (
                  <View>
                    {item.submenu.map((subItem: any) => (
                      <TouchableOpacity
                        key={subItem.id}
                        onPress={() => onNavigate(subItem.id as Screen)}
                        className="flex-row items-center py-4 border-b border-gray-100 bg-gray-50"
                      >
                        <Text className="text-2xl mr-4">{subItem.icon}</Text>
                        <Text className="flex-1 text-lg font-medium text-gray-900">
                          {subItem.title}
                        </Text>
                        <Text className="text-gray-400 text-xl">›</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
