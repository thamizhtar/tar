import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from './ui/Card';

interface SpaceScreenProps {
  onOpenMenu?: () => void;
}

export default function SpaceScreen({ onOpenMenu }: SpaceScreenProps) {
  // Marketplace categories data
  const marketplaceCategories = [
    {
      id: 'products',
      title: 'Products',
      emoji: '🛍️',
      description: 'Browse and manage products',
      color: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'food',
      title: 'Food & Dining',
      emoji: '🍕',
      description: 'Restaurant and food services',
      color: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      id: 'cars',
      title: 'Car Rentals',
      emoji: '🚗',
      description: 'Vehicle booking and rentals',
      color: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      id: 'bookings',
      title: 'Bookings',
      emoji: '📅',
      description: 'Appointments and reservations',
      color: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'services',
      title: 'Services',
      emoji: '🔧',
      description: 'Professional services',
      color: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      id: 'events',
      title: 'Events',
      emoji: '🎉',
      description: 'Event planning and tickets',
      color: 'bg-pink-50',
      textColor: 'text-pink-600'
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Categories Grid */}
        <View className="px-4 pt-6">
          <View className="flex-row flex-wrap justify-between mb-6">
            {marketplaceCategories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                className={`w-[48%] mb-4 ${category.color} rounded-2xl p-4`}
              >
                <Text className="text-3xl mb-3">{category.emoji}</Text>
                <Text className={`text-lg font-semibold ${category.textColor} mb-1`}>
                  {category.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
