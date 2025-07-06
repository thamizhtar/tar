import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../lib/instant';

interface SalesScreenProps {
  onOpenMenu?: () => void;
}

export default function SalesScreen({ onOpenMenu }: SalesScreenProps) {
  const insets = useSafeAreaInsets();

  const totalSales = 3158.47;
  
  const recentActivity = [
    {
      id: 1,
      title: 'Tulum Contractors',
      amount: 247.00,
      type: 'credit',
      date: 'Today'
    },
    {
      id: 2,
      title: 'Sales',
      amount: 89.50,
      type: 'credit',
      date: 'Today'
    },
    {
      id: 3,
      title: 'Square Payroll',
      amount: 24.87,
      type: 'debit',
      date: 'Yesterday'
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-gray-900">Track your sales performance.</Text>
            <TouchableOpacity
              onPress={onOpenMenu}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Text className="text-gray-600">☰</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Sales Card */}
        <View className="px-4 pt-6">
          <Card padding="large" className="mb-6">
            <View className="items-center">
              <Text className="text-sm text-gray-600 mb-2">Total Sales</Text>
              <View className="flex-row items-center mb-4">
                <Text className="text-4xl font-bold text-gray-900">
                  {formatCurrency(totalSales)}
                </Text>
                <TouchableOpacity className="ml-3 w-6 h-6 bg-gray-100 rounded-full items-center justify-center">
                  <Text className="text-gray-600 text-xs">ℹ️</Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row w-full gap-3">
                <Button
                  title="New Sale"
                  onPress={() => {}}
                  variant="primary"
                  size="medium"
                  fullWidth
                />
                <Button
                  title="View Reports"
                  onPress={() => {}}
                  variant="outline"
                  size="medium"
                  fullWidth
                />
              </View>
            </View>
          </Card>

          {/* Recent Activity */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Recent sales</Text>
            
            {recentActivity.map((item) => (
              <TouchableOpacity key={item.id} className="mb-3">
                <Card padding="medium">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                        <Text className="text-lg">
                          {item.type === 'credit' ? '💰' : '💳'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-gray-900">
                          {item.title}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {item.date}
                        </Text>
                      </View>
                    </View>
                    <Text className={`text-base font-semibold ${
                      item.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
