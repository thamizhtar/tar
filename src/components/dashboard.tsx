import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from './ui/Card';
import MetricCard from './ui/metric';
import Button from './ui/Button';
import SimpleChart from './ui/chart';
import { db, formatCurrency } from '../lib/instant';
import { useStore } from '../lib/store-context';

interface DashboardScreenProps {
  onOpenMenu?: () => void;
}

export default function DashboardScreen({ onOpenMenu }: DashboardScreenProps) {
  const { currentStore } = useStore();

  // Query products for metrics filtered by current store
  const { data } = db.useQuery(
    currentStore?.id ? {
      products: {
        $: {
          where: {
            storeId: currentStore.id
          }
        }
      },
      collections: {
        $: {
          where: {
            storeId: currentStore.id
          }
        }
      }
    } : { products: {}, collections: {} }
  );

  const products = data?.products || [];
  const collections = data?.collections || [];
  const totalProducts = products.length;
  const totalCollections = collections.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

  // Mock sales data for demo (in real app, this would come from sales transactions)
  const salesData = {
    grossSales: 26281.34,
    netSales: 22384.13,
    totalSales: 26281.34,
    transactions: 383,
    averageSale: 68.23,
    balance: 3158.47
  };

  // Mock chart data for the week
  const chartData = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 180 },
    { label: 'Wed', value: 90 },
    { label: 'Thu', value: 160 },
    { label: 'Fri', value: 220 },
    { label: 'Sat', value: 280 },
    { label: 'Sun', value: 190 },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Dashboard Overview Header */}
        <View className="px-4 pt-6 pb-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Dashboard Overview</Text>
          <Text className="text-sm text-gray-600">Today's performance</Text>
        </View>
        {/* Gross Sales Section */}
        <View className="px-4 pt-6">
          <Text className="text-sm text-gray-600 mb-2">Gross sales</Text>
          <Text className="text-3xl font-bold text-gray-900 mb-6">
            {formatCurrency(salesData.grossSales)}
          </Text>

          {/* Sales Chart */}
          <Card padding="medium" className="mb-6">
            <SimpleChart
              data={chartData}
              height={120}
              color="#3B82F6"
              showLabels={true}
            />
          </Card>

          {/* Metrics Grid */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Metrics</Text>
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 mr-2">
                <MetricCard
                  title="Net sales"
                  value={formatCurrency(salesData.netSales)}
                  change={{ value: "2.41%", type: "increase" }}
                  size="small"
                />
              </View>
              <View className="flex-1 ml-2">
                <MetricCard
                  title="Total sales"
                  value={formatCurrency(salesData.totalSales)}
                  change={{ value: "0.60%", type: "increase" }}
                  size="small"
                />
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <MetricCard
                  title="Transactions"
                  value={salesData.transactions}
                  change={{ value: "1.82%", type: "increase" }}
                  size="small"
                />
              </View>
              <View className="flex-1 ml-2">
                <MetricCard
                  title="Average sale"
                  value={formatCurrency(salesData.averageSale)}
                  change={{ value: "1.36%", type: "decrease" }}
                  size="small"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
