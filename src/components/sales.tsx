import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Card from './ui/Card';
import Button from './ui/Button';
import TopBar from './ui/TopBar';
import { db, formatCurrency } from '../lib/instant';
import { useStore } from '../lib/store-context';
import { hapticFeedback, withHapticFeedback } from '../lib/haptics';
import OrdersScreen from './orders';
import OrderCreate from './order-create';
import OrderDetails from './order-details';

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  total: number;
  createdat: Date;
  customer?: Array<{
    id: string;
    name: string;
  }>;
}

interface SalesScreenProps {
  onOpenMenu?: () => void;
}

export default function SalesScreen({ onOpenMenu }: SalesScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'create-order' | 'order-details'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Handle back button for sub-screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentView !== 'dashboard') {
        setCurrentView('dashboard');
        setSelectedOrder(null);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentView]);

  // Query orders from InstantDB
  const { data, isLoading, error } = db.useQuery({
    orders: {
      customer: {},
      orderitems: {},
      $: {
        where: {
          storeId: currentStore?.id || '',
        },
        order: {
          serverCreatedAt: 'desc'
        }
      }
    }
  });

  const orders = data?.orders || [];

  // Helper function to format order dates
  const formatOrderDate = (date: Date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return orderDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate sales metrics
  const salesMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order: Order) => {
      const orderDate = new Date(order.createdat);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const totalSales = orders.reduce((sum: number, order: Order) => sum + order.total, 0);
    const todaySales = todayOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const todayOrders_count = todayOrders.length;

    return {
      totalSales,
      todaySales,
      totalOrders,
      todayOrders: todayOrders_count
    };
  }, [orders]);

  // Get recent orders for display
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5).map((order: Order) => ({
      id: order.id,
      title: order.customerName || order.customer?.[0]?.name || `Order ${order.orderNumber}`,
      amount: order.total,
      type: 'credit' as const,
      date: formatOrderDate(order.createdat),
      orderNumber: order.orderNumber,
      status: order.status
    }));
  }, [orders]);



  const handleCreateOrder = () => {
    setCurrentView('create-order');
  };

  const handleViewOrders = () => {
    setCurrentView('orders');
  };

  const handleOrderCreated = (orderId: string) => {
    setCurrentView('dashboard');
    // Optionally show success message or navigate to order details
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-details');
  };

  // Render different views based on current state
  if (currentView === 'orders') {
    return (
      <OrdersScreen
        onCreateOrder={handleCreateOrder}
        onOrderSelect={handleOrderSelect}
        onClose={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'create-order') {
    return (
      <OrderCreate
        onClose={() => setCurrentView('dashboard')}
        onOrderCreated={handleOrderCreated}
      />
    );
  }

  if (currentView === 'order-details' && selectedOrder) {
    return (
      <OrderDetails
        order={selectedOrder}
        onClose={() => {
          setCurrentView('dashboard');
          setSelectedOrder(null);
        }}
      />
    );
  }

  // Main sales dashboard
  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Modern Sales Overview */}
        <View className="px-6 pt-8">
          {/* Total Sales - Large, Center Focus */}
          <View className="items-center mb-8">
            <Text className="text-sm font-medium text-gray-500 mb-2">Total Sales</Text>
            <Text className="text-5xl font-bold text-gray-900 mb-6">
              {formatCurrency(salesMetrics.totalSales)}
            </Text>

            {/* Primary Action - Large Touch Target */}
            <TouchableOpacity
              onPress={withHapticFeedback(handleCreateOrder, 'medium')}
              className="bg-blue-600 w-full py-4 rounded-2xl mb-6"
              style={{ minHeight: 56 }} // 56px minimum touch target
            >
              <View className="flex-row items-center justify-center">
                <Feather name="plus" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-2">New Sale</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row mb-8">
            <View className="flex-1 bg-white rounded-2xl p-4 mr-3">
              <Text className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.todaySales)}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">Today's Sales</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 ml-3">
              <Text className="text-2xl font-bold text-gray-900">
                {salesMetrics.todayOrders}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">Today's Orders</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row mb-8">
            <TouchableOpacity
              onPress={withHapticFeedback(handleViewOrders, 'light')}
              className="flex-1 bg-white rounded-2xl p-4 mr-3"
              style={{ minHeight: 72 }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-3">
                  <Feather name="list" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Orders</Text>
                  <Text className="text-sm text-gray-500">View all orders</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 ml-3"
              style={{ minHeight: 72 }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-3">
                  <Feather name="bar-chart-2" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Reports</Text>
                  <Text className="text-sm text-gray-500">View analytics</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Sales */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Recent Sales</Text>
              <TouchableOpacity onPress={handleViewOrders}>
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View className="bg-white rounded-2xl p-6">
                <Text className="text-center text-gray-500">Loading orders...</Text>
              </View>
            ) : recentOrders.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Feather name="shopping-bag" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-2">No sales yet</Text>
                <Text className="text-gray-500 text-center mb-6">
                  Create your first order to start tracking sales
                </Text>
                <TouchableOpacity
                  onPress={handleCreateOrder}
                  className="bg-blue-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Create First Order</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-white rounded-2xl overflow-hidden">
                {recentOrders.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    className={`p-4 ${index < recentOrders.length - 1 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => handleOrderSelect(item as any)}
                    style={{ minHeight: 72 }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                        <Feather name="check-circle" size={24} color="#10B981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 mb-1">
                          {item.title}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {item.date} • {item.orderNumber}
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-green-600">
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
