import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';

export type BottomTab = 'workspace' | 'ai' | 'tasks' | 'people';
export type MainScreen = 'dashboard' | 'sales' | 'reports' | 'products' | 'collections';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onTabPress: (tab: BottomTab) => void;
  currentScreen: MainScreen;
}

interface TabItem {
  id: BottomTab;
  label: string;
  iconLibrary: 'MaterialIcons' | 'AntDesign' | 'Ionicons';
  iconName: string;
  activeColor: string;
  inactiveColor: string;
}

const tabs: TabItem[] = [
  {
    id: 'workspace',
    label: '',
    iconLibrary: 'MaterialIcons',
    iconName: 'workspaces-outline',
    activeColor: 'text-blue-600',
    inactiveColor: 'text-gray-500',
  },
  {
    id: 'ai',
    label: '',
    iconLibrary: 'AntDesign',
    iconName: 'codesquareo',
    activeColor: 'text-purple-600',
    inactiveColor: 'text-gray-500',
  },
  {
    id: 'tasks',
    label: '',
    iconLibrary: 'Ionicons',
    iconName: 'play-outline',
    activeColor: 'text-green-600',
    inactiveColor: 'text-gray-500',
  },
  {
    id: 'people',
    label: '',
    iconLibrary: 'MaterialIcons',
    iconName: 'alternate-email',
    activeColor: 'text-orange-600',
    inactiveColor: 'text-gray-500',
  },
];

export default function BottomNavigation({ activeTab, onTabPress, currentScreen }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  const renderIcon = (tab: TabItem, isActive: boolean) => {
    const iconSize = 24;

    // Map colors based on tab and active state
    const getIconColor = () => {
      if (!isActive) return '#6b7280'; // gray-500 for inactive

      switch (tab.id) {
        case 'workspace': return '#2563eb'; // blue-600
        case 'ai': return '#9333ea'; // purple-600
        case 'tasks': return '#16a34a'; // green-600
        case 'people': return '#ea580c'; // orange-600
        default: return '#2563eb';
      }
    };

    const iconColor = getIconColor();

    switch (tab.iconLibrary) {
      case 'MaterialIcons':
        return (
          <MaterialIcons
            name={tab.iconName as any}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'AntDesign':
        return (
          <AntDesign
            name={tab.iconName as any}
            size={iconSize}
            color={iconColor}
          />
        );
      case 'Ionicons':
        return (
          <Ionicons
            name={tab.iconName as any}
            size={iconSize}
            color={iconColor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      className="bg-white border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              className="flex-1 items-center py-3"
              activeOpacity={0.7}
            >
              <View className="items-center">
                {renderIcon(tab, isActive)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
