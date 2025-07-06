import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';
import ProductFormScreen from './prod-form';
import InventoryAdjustmentScreen from './inventory';
import { useStore } from '../lib/store-context';
import { log, trackError } from '../lib/logger';
import { LoadingError, EmptyState } from './ui/error-boundary';

import R2Image from './ui/r2-image';

interface ProductsScreenProps {
  isGridView?: boolean;
  onProductFormOpen?: (product?: any) => void;
  onProductFormClose?: () => void;
}

type FilterStatus = 'All' | 'Active' | 'Draft' | 'Archived';

// Memoized product item component for better performance
const ProductItem = React.memo(({
  product,
  isSelected,
  isMultiSelectMode,
  onPress,
  onLongPress
}: {
  product: any;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const getProductStatus = (product: any) => {
    if (product.pos === true || product.isActive === true) return 'Active';
    if (product.publish === false) return 'Draft';
    return 'Archived';
  };

  const getVariantCount = (product: any) => {
    return product.variants?.length || 5;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className={`border-b border-gray-100 px-4 py-4 ${
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
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            }`}>
              {isSelected && (
                <Feather name="check" size={14} color="white" />
              )}
            </View>
          </View>
        )}

        {/* Product Image */}
        <View className="w-12 h-12 bg-gray-200 mr-3 overflow-hidden">
          {product.image ? (
            <R2Image
              url={product.image}
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

        {/* Product Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900 mb-1">
            {product.title || 'Untitled Product'}
          </Text>
          <Text className="text-sm text-gray-500">
            {getVariantCount(product)} variants • {getProductStatus(product)}
          </Text>
        </View>

        {/* Price */}
        <View className="items-end">
          <Text className="text-base font-semibold text-gray-900">
            {product.price ? formatCurrency(product.price) : '$0.00'}
          </Text>
          {product.saleprice && product.saleprice < product.price && (
            <Text className="text-sm text-red-600 line-through">
              {formatCurrency(product.saleprice)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ProductsScreen({ isGridView = false, onProductFormOpen, onProductFormClose }: ProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showInventoryAdjustment, setShowInventoryAdjustment] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Query products filtered by current store
  const { isLoading, error, data } = db.useQuery(
    currentStore?.id ? {
      products: {
        $: {
          where: {
            storeId: currentStore.id
          }
        }
      }
    } : null // Don't query if no store selected
  );

  const products = data?.products || [];

  // Log query errors
  if (error) {
    trackError(new Error(`Products query failed: ${error}`), 'ProductsScreen');
  }

  // Filter products based on search and status - memoized for performance
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const title = product.title || '';
      const category = product.category || '';
      const brand = product.brand || '';
      const tags = product.tags || '';
      const searchTerm = searchQuery.toLowerCase();

      // Search filter
      const matchesSearch = title?.toLowerCase().includes(searchTerm) ||
             category?.toLowerCase().includes(searchTerm) ||
             brand?.toLowerCase().includes(searchTerm) ||
             tags?.toLowerCase().includes(searchTerm);

      // Status filter
      let matchesStatus = true;
      if (activeFilter === 'Active') {
        matchesStatus = product.pos === true || product.isActive === true;
      } else if (activeFilter === 'Draft') {
        matchesStatus = product.publish === false;
      } else if (activeFilter === 'Archived') {
        matchesStatus = product.pos === false && product.isActive === false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, activeFilter]);

  // Get product status for display
  const getProductStatus = (product: any) => {
    if (product.pos === true || product.isActive === true) return 'Active';
    if (product.publish === false) return 'Draft';
    if (product.pos === false && product.isActive === false) return 'Archived';
    return 'Active'; // Default
  };

  // Get variant count (mock data for now)
  const getVariantCount = (product: any) => {
    return product.variants?.length || 5; // Default to 5 variants as shown in image
  };

  const handleEdit = useCallback((product: any) => {
    setEditingProduct(product);
    setShowForm(true);
    onProductFormOpen?.(product);
  }, [onProductFormOpen]);

  const handleInventoryAdjustment = useCallback((product: any) => {
    setEditingProduct(product);
    setShowInventoryAdjustment(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingProduct(null);
    setShowForm(true);
    onProductFormOpen?.(null);
  }, [onProductFormOpen]);

  const handleLongPress = (product: any) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setSelectedProducts(new Set([product.id]));
      setShowBottomDrawer(true);
    }
  };

  const handleProductSelect = (product: any) => {
    if (isMultiSelectMode) {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }
      setSelectedProducts(newSelected);

      if (newSelected.size === 0) {
        setIsMultiSelectMode(false);
        setShowBottomDrawer(false);
      }
    } else {
      handleEdit(product);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Products',
      `Delete ${selectedProducts.size} selected product(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = Array.from(selectedProducts).map(id =>
                db.transact(db.tx.products[id].delete())
              );
              await Promise.all(deletePromises);
              setSelectedProducts(new Set());
              setIsMultiSelectMode(false);
              setShowBottomDrawer(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete products');
            }
          },
        },
      ]
    );
  };

  const handleCancelMultiSelect = () => {
    setSelectedProducts(new Set());
    setIsMultiSelectMode(false);
    setShowBottomDrawer(false);
  };



  const handleDelete = (product: any) => {
    const productName = product.title || 'this product';
    Alert.alert(
      'Confirm Delete',
      `Delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => db.transact(db.tx.products[product.id].delete()),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Error: {error.message}</Text>
      </View>
    );
  }

  // Show full-screen forms
  if (showForm) {
    return (
      <ProductFormScreen
        product={editingProduct}
        onClose={() => {
          setShowForm(false);
          onProductFormClose?.();
        }}
        onSave={() => {
          // Refresh will happen automatically due to real-time updates
        }}
      />
    );
  }

  if (showInventoryAdjustment) {
    return (
      <InventoryAdjustmentScreen
        product={editingProduct}
        onClose={() => setShowInventoryAdjustment(false)}
        onSave={() => {
          // Refresh will happen automatically due to real-time updates
        }}
      />
    );
  }

  // Filter Modal - Full screen with no spacing above
  if (showFilterModal) {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white border-b border-gray-200">
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color="#374151" />
              </TouchableOpacity>

              <Text className="text-lg font-semibold text-gray-900">Filter by</Text>

              <TouchableOpacity>
                <Feather name="rotate-ccw" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Options */}
        <View className="flex-1">
          {[
            'Product vendor',
            'Tag',
            'Status',
            'Category',
            'Sales channel',
            'Market',
            'Product type',
            'Collection',
            'Publishing error',
            'Gift cards',
            'Combined listings'
          ].map((filterOption, index) => (
            <TouchableOpacity
              key={index}
              className="px-4 py-4 border-b border-gray-100"
            >
              <Text className="text-base text-gray-700">{filterOption}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Handle loading and error states
  if (error) {
    return (
      <LoadingError
        error={error.toString()}
        onRetry={() => {
          log.info('Retrying products query', 'ProductsScreen');
          // The query will automatically retry when component re-renders
        }}
      />
    );
  }

  if (!currentStore) {
    return (
      <EmptyState
        icon="store"
        title="No Store Selected"
        description="Please select a store to view products"
      />
    );
  }

  if (!isLoading && filteredProducts.length === 0 && searchQuery === '') {
    return (
      <View className="flex-1 bg-white">
        {/* Search Bar */}
        <View className="border-t border-b border-gray-200 bg-white px-4 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleAddNew}>
              <Feather name="plus" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TextInput
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-900 ml-3 mr-3"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <MaterialCommunityIcons name="sort-ascending" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <EmptyState
          icon="inventory"
          title="No Products Yet"
          description="Start by adding your first product to the inventory"
          action={{
            label: "Add Product",
            onPress: handleAddNew
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar with top and bottom borders - NO spacing above */}
      <View className="border-t border-b border-gray-200 bg-white px-4 py-3">
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

          {/* Filter Icon - Only one icon needed */}
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="sort-ascending" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row">
          {(['All', 'Active', 'Draft', 'Archived'] as FilterStatus[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`mr-6 pb-2 ${
                activeFilter === filter ? 'border-b-2 border-gray-900' : ''
              }`}
            >
              <Text className={`text-base font-medium ${
                activeFilter === filter ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      {/* Products List - Exact match to image design */}
      <View className="flex-1">
        {filteredProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">📦</Text>
              </View>
              <Text className="text-lg font-medium text-gray-900 mb-2">No products found</Text>
              <Text className="text-gray-500 text-center">
                {searchQuery ? 'Try adjusting your search' : 'Add your first product to get started'}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
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
            renderItem={({ item: product }) => (
              <ProductItem
                product={product}
                isSelected={selectedProducts.has(product.id)}
                isMultiSelectMode={isMultiSelectMode}
                onPress={() => handleProductSelect(product)}
                onLongPress={() => handleLongPress(product)}
              />
            )}
          />
        )}
      </View>

      {/* Bottom Drawer for Multi-select Actions - Fixed overlay issue */}
      {showBottomDrawer && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-4 py-4 border-t border-gray-200 shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-medium text-gray-900">
              {selectedProducts.size} selected
            </Text>
            <TouchableOpacity onPress={handleCancelMultiSelect}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleDeleteSelected}
              className="flex-row items-center justify-center bg-red-50 py-3 rounded-lg"
            >
              <Feather name="trash-2" size={18} color="#DC2626" />
              <Text className="text-red-600 font-medium ml-2 text-base">
                Delete Selected
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelMultiSelect}
              className="flex-row items-center justify-center bg-gray-100 py-3 rounded-lg"
            >
              <Text className="text-gray-700 font-medium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
