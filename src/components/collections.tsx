import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
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
  const [showActionDrawer, setShowActionDrawer] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

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
    setShowActionDrawer(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCollection(null);
  };

  const handleFormSave = () => {
    // Refresh will happen automatically via InstantDB reactivity
  };

  const handleThreeDotsPress = (collection: any) => {
    setSelectedCollection(collection);
    setShowActionDrawer(true);
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
          onPress: () => {
            db.transact(db.tx.collections[collection.id].delete());
            setShowActionDrawer(false);
          },
        },
      ]
    );
  };

  const toggleStatus = (collection: any) => {
    db.transact(db.tx.collections[collection.id].update({
      isActive: !collection.isActive,
      updatedAt: getCurrentTimestamp(),
    }));
    setShowActionDrawer(false);
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
    <View className="flex-1 bg-white">
      {/* Search Bar - Clean minimal design */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 pt-4 pb-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            {/* Search Icon */}
            <Feather name="search" size={20} color="#6B7280" />

            {/* Search Input */}
            <TextInput
              placeholder="Search collections"
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

      {/* Collections List - Minimal clean design */}
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
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: collection }) => (
              <TouchableOpacity
                onPress={() => handleEdit(collection)}
                className="bg-white border-b border-gray-100 px-4 py-4"
              >
                <View className="flex-row items-center">
                  {/* Collection Info */}
                  <View className="flex-1">
                    <Text className="text-lg font-medium text-gray-900 mb-1" numberOfLines={1}>
                      {collection.name}
                    </Text>
                    {collection.description && (
                      <Text className="text-gray-600 text-sm" numberOfLines={1}>
                        {collection.description}
                      </Text>
                    )}
                  </View>

                  {/* Three dots menu */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleThreeDotsPress(collection);
                    }}
                    className="p-2 ml-2"
                  >
                    <Feather name="more-horizontal" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Bottom Action Drawer */}
      <Modal
        visible={showActionDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionDrawer(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setShowActionDrawer(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              width: '100%',
              paddingBottom: insets.bottom,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
            activeOpacity={1}
          >
            {/* Action Options */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* Disable/Enable Option */}
              <TouchableOpacity
                onPress={() => selectedCollection && toggleStatus(selectedCollection)}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 16, color: '#111827' }}>
                  {selectedCollection?.isActive ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>

              {/* Edit Option */}
              <TouchableOpacity
                onPress={() => selectedCollection && handleEdit(selectedCollection)}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 16, color: '#3B82F6' }}>Edit</Text>
              </TouchableOpacity>

              {/* Delete Option */}
              <TouchableOpacity
                onPress={() => selectedCollection && handleDelete(selectedCollection)}
                style={{
                  paddingVertical: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, color: '#EF4444' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
