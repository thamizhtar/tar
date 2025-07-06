import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { id } from '@instantdb/react-native';
import { db, getCurrentTimestamp } from '../lib/instant';
import CollectionFormScreen from './col-form';

interface CollectionsScreenProps {
  isGridView?: boolean;
}

export default function CollectionsScreen({ isGridView = false }: CollectionsScreenProps) {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Query collections with their products
  const { isLoading, error, data } = db.useQuery({
    collections: {
      products: {}
    }
  });

  const collections = data?.collections || [];
  const filteredCollections = collections.filter((collection: any) =>
    collection.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingCollection(null);
    setShowForm(true);
  };

  const handleEdit = (collection: any) => {
    setEditingCollection(collection);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCollection(null);
  };

  const handleFormSave = () => {
    // Refresh will happen automatically via InstantDB reactivity
  };

  const handleDelete = (collection: any) => {
    if (collection.products && collection.products.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This collection has ${collection.products.length} products. Remove them first.`
      );
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Delete "${collection.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => db.transact(db.tx.collections[collection.id].delete()),
        },
      ]
    );
  };

  const toggleStatus = (collection: any) => {
    db.transact(db.tx.collections[collection.id].update({
      isActive: !collection.isActive,
      updatedAt: getCurrentTimestamp(),
    }));
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

  // Show form screen if showForm is true
  if (showForm) {
    return (
      <CollectionFormScreen
        collection={editingCollection}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar - Exact match to image design */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 pt-4 pb-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            {/* Search Icon */}
            <Feather name="search" size={20} color="#6B7280" />

            {/* Search Input */}
            <TextInput
              placeholder="Search all items"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-900 ml-3 mr-3"
              placeholderTextColor="#9CA3AF"
            />

            {/* Add Icon */}
            <TouchableOpacity onPress={handleAdd}>
              <Feather name="plus" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Collections List - Square POS Style */}
      <View className="flex-1">
        {filteredCollections.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">📚</Text>
              </View>
              <Text className="text-lg font-medium text-gray-900 mb-2">No collections found</Text>
              <Text className="text-gray-500 text-center">
                {searchQuery ? 'Try adjusting your search' : 'Create your first collection to organize products'}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredCollections}
            numColumns={isGridView ? 2 : 1}
            key={isGridView ? 'grid' : 'list'} // Force re-render when layout changes
            contentContainerStyle={{ padding: 16 }}
            columnWrapperStyle={isGridView ? { justifyContent: 'space-between' } : undefined}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: collection }) => (
              <TouchableOpacity
                onPress={() => handleEdit(collection)}
                className={`bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 ${
                  isGridView ? '' : 'mx-0'
                }`}
                style={isGridView ? { width: '48%' } : { width: '100%' }}
              >
                {isGridView ? (
                  // Grid View Layout
                  <>
                    {/* Collection Icon */}
                    <View className="w-full h-20 bg-gray-100 rounded-lg mb-3 items-center justify-center">
                      <Text className="text-2xl">📚</Text>
                    </View>

                    {/* Collection Info */}
                    <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {collection.name}
                    </Text>

                    <View className={`px-2 py-1 rounded-full mb-2 self-start ${
                      collection.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        collection.isActive ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {collection.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>

                    <View className="bg-blue-50 px-2 py-1 rounded-lg mb-3 self-start">
                      <Text className="text-blue-700 font-medium text-xs">
                        {collection.products?.length || 0} Products
                      </Text>
                    </View>
                  </>
                ) : (
                  // List View Layout
                  <View className="flex-row items-center">
                    {/* Collection Icon */}
                    <View className="w-16 h-16 bg-gray-100 rounded-lg mr-4 items-center justify-center">
                      <Text className="text-xl">📚</Text>
                    </View>

                    {/* Collection Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
                          {collection.name}
                        </Text>
                        <View className={`px-2 py-1 rounded-full ml-2 ${
                          collection.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            collection.isActive ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            {collection.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>

                      {collection.description && (
                        <Text className="text-gray-600 mb-1 text-sm" numberOfLines={1}>
                          {collection.description}
                        </Text>
                      )}

                      <View className="bg-blue-50 px-2 py-1 rounded-lg self-start">
                        <Text className="text-blue-700 font-medium text-xs">
                          {collection.products?.length || 0} Products
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {isGridView ? (
                  // Grid View Action Buttons (vertical)
                  <View className="gap-2 pt-3 border-t border-gray-100">
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleStatus(collection);
                        }}
                        className={`flex-1 py-2 rounded-lg items-center ${
                          collection.isActive ? 'bg-orange-50' : 'bg-green-50'
                        }`}
                      >
                        <Text className={`font-medium text-sm ${
                          collection.isActive ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {collection.isActive ? 'Disable' : 'Enable'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEdit(collection);
                        }}
                        className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
                      >
                        <Text className="text-blue-600 font-medium text-sm">Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(collection);
                      }}
                      className="bg-red-50 py-2 rounded-lg items-center"
                    >
                      <Text className="text-red-600 font-medium text-sm">Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // List View Action Buttons (horizontal)
                  <View className="flex-row gap-2 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleStatus(collection);
                      }}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        collection.isActive ? 'bg-orange-50' : 'bg-green-50'
                      }`}
                    >
                      <Text className={`font-medium text-sm ${
                        collection.isActive ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {collection.isActive ? 'Disable' : 'Enable'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEdit(collection);
                      }}
                      className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
                    >
                      <Text className="text-blue-600 font-medium text-sm">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(collection);
                      }}
                      className="flex-1 bg-red-50 py-2 rounded-lg items-center"
                    >
                      <Text className="text-red-600 font-medium text-sm">Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
