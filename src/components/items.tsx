import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal, Animated, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';
import { useStore } from '../lib/store-context';
import { log, trackError } from '../lib/logger';
import { LoadingError, EmptyState } from './ui/error-boundary';

import R2Image from './ui/r2-image';

interface ItemsScreenProps {
  isGridView?: boolean;
  onItemFormOpen?: (item?: any) => void;
  onItemFormClose?: () => void;
  onClose?: () => void;
  productId?: string; // Add productId prop to filter items by product
}

type FilterStatus = 'All' | 'Active' | 'Draft';

// Memoized item component for better performance
const ItemComponent = React.memo(({
  item,
  isSelected,
  isMultiSelectMode,
  onPress,
  onLongPress
}: {
  item: any;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const getItemStatus = (item: any) => {
    // Simple logic: false = Draft, everything else = Active
    return item.trackQty === false ? 'Draft' : 'Active';
  };

  const getOptionDisplay = (item: any) => {
    const options = [];
    if (item.option1) options.push(item.option1);
    if (item.option2) options.push(item.option2);
    if (item.option3) options.push(item.option3);
    return options.length > 0 ? options.join(' / ') : 'No options';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className={`px-4 py-4 ${
        isSelected ? 'bg-blue-50' : 'bg-white'
      }`}
      style={{
        opacity: isMultiSelectMode && !isSelected ? 0.6 : 1
      }}
    >
      <View className="flex-row items-center">
        {/* Multi-select checkbox */}
        {isMultiSelectMode && (
          <View className="mr-3">
            <View className={`w-6 h-6 items-center justify-center ${
              isSelected ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              {isSelected && (
                <Feather name="check" size={14} color="white" />
              )}
            </View>
          </View>
        )}

        {/* Item Image */}
        <View className="w-12 h-12 bg-gray-200 mr-3 overflow-hidden">
          {item.image ? (
            <R2Image
              url={item.image}
              style={{ width: 48, height: 48 }}
              fallback={
                <View className="w-12 h-12 bg-gray-200 items-center justify-center">
                  <Text className="text-lg">📦</Text>
                </View>
              }
            />
          ) : (
            <View className="w-12 h-12 bg-gray-200 items-center justify-center">
              <Text className="text-lg">📦</Text>
            </View>
          )}
        </View>

        {/* Item Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900 mb-1">
            {item.sku || 'Untitled Item'}
          </Text>
          <Text className="text-sm text-gray-500">
            {getOptionDisplay(item)} • {getItemStatus(item)}
          </Text>
        </View>

        {/* Price */}
        <View className="items-end">
          <Text className="text-base font-medium text-gray-900">
            {formatCurrency(item.price || 0)}
          </Text>
          {item.totalOnHand !== undefined && (
            <Text className="text-sm text-gray-500">
              Stock: {item.totalOnHand || 0}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ItemsScreen({ isGridView = false, onItemFormOpen, onItemFormClose, onClose, productId }: ItemsScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);


  // Query items from database - filter by productId if provided
  const { data, isLoading, error } = db.useQuery({
    items: {
      $: {
        where: productId
          ? { storeId: currentStore?.id || '', productId: productId }
          : { storeId: currentStore?.id || '' }
      },
      product: {}
    }
  });

  const items = data?.items || [];

  // Back button handling is now managed by the main app

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.sku || '').toLowerCase().includes(query) ||
        (item.option1 || '').toLowerCase().includes(query) ||
        (item.option2 || '').toLowerCase().includes(query) ||
        (item.option3 || '').toLowerCase().includes(query) ||
        (item.product?.[0]?.title || '').toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter !== 'All') {
      filtered = filtered.filter(item => {
        const status = item.trackQty === false ? 'Draft' : 'Active';
        return status === activeFilter;
      });
    }

    return filtered;
  }, [items, searchQuery, activeFilter]);

  const handleItemSelect = useCallback((item: any) => {
    if (isMultiSelectMode) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Handle single item tap - could open item form
      if (onItemFormOpen) {
        onItemFormOpen(item);
      }
    }
  }, [isMultiSelectMode, onItemFormOpen]);

  const handleLongPress = useCallback((item: any) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setSelectedItems(new Set([item.id]));
      setShowBottomDrawer(true);
    }
  }, [isMultiSelectMode]);

  const handleCancelMultiSelect = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedItems(new Set());
    setShowBottomDrawer(false);
  }, []);

  const handleAddNew = useCallback(() => {
    if (onItemFormOpen) {
      onItemFormOpen();
    }
  }, [onItemFormOpen]);



  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading items...</Text>
      </View>
    );
  }

  if (error) {
    return <LoadingError error={typeof error === 'string' ? error : error.message || 'An error occurred'} onRetry={() => window.location.reload()} />;
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-xl font-semibold text-gray-900">
                {productId ? 'Product Items' : 'Items'}
              </Text>
              {productId && (
                <Text className="text-sm text-gray-500 mt-1">
                  {(() => {
                    const product = items.find(item => item.productId === productId)?.product;
                    return product ? `${product.title}` : 'Product Items';
                  })()}
                </Text>
              )}
            </View>
            <View style={{ width: 24 }} />
          </View>
        </View>
      </View>

      {/* Top Bar like products */}
      <View className="bg-white px-4 py-3">
        <View className="flex-row items-center">
          {/* Add Icon */}
          <TouchableOpacity onPress={handleAddNew}>
            <Feather name="plus" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Search Input */}
          <TextInput
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-gray-900 ml-3 mr-3"
            placeholderTextColor="#9CA3AF"
          />

          {/* Filter Icon */}
          <TouchableOpacity>
            <MaterialCommunityIcons name="sort-ascending" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs - Always visible */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row">
          {(['All', 'Active', 'Draft'] as FilterStatus[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`mr-6 pb-2 ${
                activeFilter === filter ? 'border-b-2 border-blue-600' : ''
              }`}
            >
              <Text className={`text-base font-medium ${
                activeFilter === filter ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Items List */}
      <View className="flex-1">
        {filteredItems.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center">
              <Text className="text-6xl mb-4">📦</Text>
              <Text className="text-xl font-medium text-gray-900 mb-2 text-center">
                {searchQuery ? 'No items found' : 'No items yet'}
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                {searchQuery ? 'Try adjusting your search or filters' :
                 activeFilter === 'Active' ? 'Items will appear here when they are active' :
                 activeFilter === 'Draft' ? 'Items will appear here when they are saved as drafts' :
                 'Start by adding your first item to the inventory'}
              </Text>
              {(items.length === 0 || activeFilter === 'All') && (
                <TouchableOpacity
                  onPress={handleAddNew}
                  className="bg-blue-600 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-medium">Add Item</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height of each item
              offset: 80 * index,
              index,
            })}
            renderItem={({ item }) => (
              <ItemComponent
                item={item}
                isSelected={selectedItems.has(item.id)}
                isMultiSelectMode={isMultiSelectMode}
                onPress={() => handleItemSelect(item)}
                onLongPress={() => handleLongPress(item)}
              />
            )}
          />
        )}
      </View>

      {/* Bottom Drawer for Multi-select Actions */}
      {showBottomDrawer && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-medium text-gray-900">
              {selectedItems.size} selected
            </Text>
            <TouchableOpacity onPress={handleCancelMultiSelect}>
              <Text className="text-blue-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-red-600 py-3 rounded-lg items-center">
              <Text className="text-white font-medium">Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg items-center">
              <Text className="text-white font-medium">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
