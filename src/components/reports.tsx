import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from './ui/Card';
import { formatCurrency } from '../lib/instant';

interface ReportsScreenProps {
  onOpenMenu?: () => void;
}

export default function ReportsScreen({ onOpenMenu }: ReportsScreenProps) {
  const { top } = useSafeAreaInsets();

  const reportData = {
    businessName: 'Three Birch Trees',
    paid: {
      period: 'Last 30 days',
      amount: 1900.00
    },
    outstanding: {
      period: 'Invoices',
      amount: 845.00
    },
    pending: {
      period: 'Estimates',
      amount: 50.00
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ paddingTop: top }} className="bg-white border-b border-gray-200">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="items-center flex-1">
              <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mb-3">
                <Text className="text-2xl">📊</Text>
              </View>
              <Text className="text-xl font-semibold text-gray-900">Real-time reports</Text>
            </View>
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
        <View className="px-4 pt-6">
          {/* Business Card */}
          <Card padding="large" className="mb-6 bg-gray-900">
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-white">
                  Hello,
                </Text>
                <TouchableOpacity className="w-8 h-8 bg-blue-600 rounded items-center justify-center">
                  <Text className="text-white text-xs">?</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xl font-bold text-white mb-6">
                {reportData.businessName}
              </Text>

              {/* Paid Section */}
              <View className="mb-4">
                <Text className="text-sm text-gray-300 mb-1">
                  Paid — {reportData.paid.period}
                </Text>
                <Text className="text-3xl font-bold text-white">
                  {formatCurrency(reportData.paid.amount)}
                </Text>
              </View>

              {/* Outstanding Section */}
              <View className="mb-4">
                <Text className="text-sm text-gray-300 mb-1">
                  Outstanding — {reportData.outstanding.period}
                </Text>
                <Text className="text-2xl font-bold text-white">
                  {formatCurrency(reportData.outstanding.amount)}
                </Text>
              </View>

              {/* Pending Section */}
              <View>
                <Text className="text-sm text-gray-300 mb-1">
                  Pending — {reportData.pending.period}
                </Text>
                <Text className="text-2xl font-bold text-white">
                  {formatCurrency(reportData.pending.amount)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Additional Report Cards */}
          <View className="gap-4 mb-6">
            <TouchableOpacity>
              <Card padding="medium">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Sales Summary
                    </Text>
                    <Text className="text-sm text-gray-600">
                      View detailed sales breakdown
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity>
              <Card padding="medium">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Product Performance
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Top selling products and trends
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity>
              <Card padding="medium">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Customer Insights
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Customer behavior and analytics
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
