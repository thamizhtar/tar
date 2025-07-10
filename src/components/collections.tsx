import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { id } from '@instantdb/react-native';
import { db, getCurrentTimestamp } from '../lib/instant';
import R2Image from './ui/r2-image';

interface CollectionsScreenProps {
  isGridView?: boolean;
  onOpenForm?: (collection?: any) => void;
}

export default function CollectionsScreen({ isGridView = false, onOpenForm }: CollectionsScreenProps) {
  const insets = useSafeAreaInsets();
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
    onOpenForm?.();
  };

  const handleEdit = (collection: any) => {
    onOpenForm?.(collection);
    setShowActionDrawer(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Search Bar with Safe Area - Clean minimal design */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingTop: insets.top
      }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
            {/* Search Icon */}
            <Feather name="search" size={20} color="#6B7280" />

            {/* Search Input */}
            <TextInput
              placeholder="Search collections"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 16,
                color: '#111827',
                marginLeft: 12,
                marginRight: 12,
              }}
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
      <View style={{ flex: 1 }}>
        {filteredCollections.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#E5E7EB',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 24 }}>📚</Text>
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 8
              }}>
                No collections found
              </Text>
              <Text style={{
                color: '#6B7280',
                textAlign: 'center'
              }}>
                {searchQuery ? 'Try adjusting your search' : 'Create your first collection to organize products'}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredCollections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item: collection }) => (
              <TouchableOpacity
                onPress={() => handleEdit(collection)}
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Collection Image */}
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    backgroundColor: '#F3F4F6',
                    marginRight: 12,
                    overflow: 'hidden',
                  }}>
                    {collection.image ? (
                      <R2Image
                        url={collection.image}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <MaterialIcons name="collections" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {/* Collection Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '500',
                        color: '#111827',
                        flex: 1,
                      }} numberOfLines={1}>
                        {collection.name}
                      </Text>

                      {/* Status indicators */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                        {collection.storefront && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#10B981',
                            marginRight: 4,
                          }} />
                        )}
                        {collection.pos && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#3B82F6',
                            marginRight: 4,
                          }} />
                        )}
                        {!collection.isActive && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#EF4444',
                          }} />
                        )}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        {collection.description && (
                          <Text style={{
                            color: '#6B7280',
                            fontSize: 14,
                            marginBottom: 2,
                          }} numberOfLines={1}>
                            {collection.description}
                          </Text>
                        )}
                        <Text style={{
                          color: '#9CA3AF',
                          fontSize: 12,
                        }}>
                          {collection.products?.length || 0} product{(collection.products?.length || 0) !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Three dots menu */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleThreeDotsPress(collection);
                    }}
                    style={{
                      padding: 8,
                      marginLeft: 8,
                    }}
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
