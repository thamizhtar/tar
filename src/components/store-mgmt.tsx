import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Modal, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useStore } from '../lib/store-context';
import StoreForm from './store-form';

interface StoreManagementProps {
  onClose: () => void;
}

export default function StoreManagement({ onClose }: StoreManagementProps) {
  const insets = useSafeAreaInsets();
  const { stores, currentStore, setCurrentStore, deleteStore } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If store form is open, close it
      if (showForm) {
        setShowForm(false);
        setEditingStore(null);
        return true;
      }
      // If delete modal is open, close it
      if (showDeleteModal) {
        setShowDeleteModal(false);
        setStoreToDelete(null);
        return true;
      }
      // Otherwise close store management
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showForm, showDeleteModal, onClose]);

  const getStoreInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditStore = (store: any) => {
    setEditingStore(store);
    setShowForm(true);
  };

  const handleDeleteStore = (store: any) => {
    if (stores.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one store');
      return;
    }
    setStoreToDelete(store);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    
    try {
      await deleteStore(storeToDelete.id);
      setShowDeleteModal(false);
      setStoreToDelete(null);
      Alert.alert('Success', 'Store deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete store');
    }
  };

  const handleSetActive = async (store: any) => {
    try {
      await setCurrentStore(store);
      Alert.alert('Success', `Switched to ${store.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch store');
    }
  };

  if (showForm) {
    return (
      <StoreForm
        store={editingStore}
        onClose={() => {
          setShowForm(false);
          setEditingStore(null);
        }}
        onSave={() => {
          setShowForm(false);
          setEditingStore(null);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Manage Stores
        </Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Feather name="plus" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Store List */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              {/* Store Avatar */}
              <View className="w-12 h-12 bg-blue-500 rounded-lg items-center justify-center mr-4">
                <Text className="text-white font-semibold">
                  {getStoreInitials(item.name)}
                </Text>
              </View>
              
              {/* Store Info */}
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {item.name}
                  </Text>
                  {item.id === currentStore?.id && (
                    <View className="ml-2 px-2 py-1 bg-green-100 rounded">
                      <Text className="text-xs font-medium text-green-800">
                        Active
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-600 text-sm">
                  {item.website || 'No website set'}
                </Text>
                {item.description && (
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.description}
                  </Text>
                )}
              </View>
              
              {/* Actions */}
              <View className="flex-row items-center space-x-2">
                {item.id !== currentStore?.id && (
                  <TouchableOpacity
                    onPress={() => handleSetActive(item)}
                    className="p-2"
                  >
                    <Text className="text-blue-600 font-medium">Activate</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={() => handleEditStore(item)}
                  className="p-2"
                >
                  <Feather name="edit-2" size={18} color="#6B7280" />
                </TouchableOpacity>
                
                {stores.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteStore(item)}
                    className="p-2"
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-500 text-center">
              No stores found
            </Text>
          </View>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Delete Store
            </Text>
            <Text className="text-gray-600 mb-6">
              Are you sure you want to delete "{storeToDelete?.name}"? This action cannot be undone.
            </Text>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 p-3 border border-gray-300 rounded-lg"
              >
                <Text className="text-center font-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmDelete}
                className="flex-1 p-3 bg-red-600 rounded-lg"
              >
                <Text className="text-center font-medium text-white">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
