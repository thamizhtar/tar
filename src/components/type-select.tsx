import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, FlatList, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { id } from '@instantdb/react-native';
import { db } from '../lib/instant';
import { useStore } from '../lib/store-context';

interface TypeSelectProps {
  selectedType?: string;
  onSelect: (type: string) => void;
  onClose: () => void;
}

interface TypeItem {
  id: string;
  name: string;
  parent?: string;
  storeId: string;
}

export default function TypeSelect({ selectedType, onSelect, onClose }: TypeSelectProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [selectedTypeForAction, setSelectedTypeForAction] = useState<TypeItem | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Query types from database using useQuery hook
  const { isLoading, error, data } = db.useQuery(
    currentStore?.id ? {
      types: {
        $: {
          where: {
            storeId: currentStore.id
          }
        }
      }
    } : null
  );

  const types = data?.types || [];

  // Handle loading and error states
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: '#6B7280' }}>Loading types...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: '#EF4444' }}>Error loading types: {error.message}</Text>
      </View>
    );
  }

  const filteredTypes = types.filter(type =>
    type.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddType = async () => {
    if (!searchQuery.trim()) return;
    if (!currentStore?.id) {
      Alert.alert('Error', 'Please select a store first');
      return;
    }

    // Check if type already exists
    const existingType = types.find(t =>
      t.name?.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (existingType) {
      onSelect(existingType.name);
      onClose();
      return;
    }

    try {
      const newType = {
        name: searchQuery.trim(),
        storeId: currentStore.id,
      };

      await db.transact(db.tx.types[id()].update(newType));
      onSelect(searchQuery.trim());
      onClose();
    } catch (error) {
      console.error('Error adding type:', error);
      Alert.alert('Error', 'Failed to add type');
    }
  };

  const handleSelectType = (type: TypeItem) => {
    onSelect(type.name);
    onClose();
  };

  const handleLongPress = (type: TypeItem) => {
    setSelectedTypeForAction(type);
    setEditingName(type.name);
    setDeleteConfirmText('');
    setShowDeleteConfirm(false);
    setShowBottomDrawer(true);
  };

  const handleEditType = async () => {
    if (!selectedTypeForAction || !editingName.trim()) {
      setShowBottomDrawer(false);
      setSelectedTypeForAction(null);
      return;
    }

    try {
      await db.transact(
        db.tx.types[selectedTypeForAction.id].update({
          name: editingName.trim()
        })
      );
      setShowBottomDrawer(false);
      setSelectedTypeForAction(null);
      setDeleteConfirmText('');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error editing type:', error);
      Alert.alert('Error', 'Failed to edit type');
    }
  };

  const handleDeleteType = async () => {
    if (!selectedTypeForAction || deleteConfirmText !== selectedTypeForAction.name) {
      Alert.alert('Error', `Please type "${selectedTypeForAction?.name}" to confirm deletion`);
      return;
    }

    try {
      await db.transact(db.tx.types[selectedTypeForAction.id].delete());
      setShowBottomDrawer(false);
      setSelectedTypeForAction(null);
      setDeleteConfirmText('');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting type:', error);
      Alert.alert('Error', 'Failed to delete type');
    }
  };

  const handleShowDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
  };

  const renderTypeItem = ({ item }: { item: TypeItem }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}
      onPress={() => handleSelectType(item)}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selectedType === item.name ? '#3B82F6' : '#D1D5DB',
        backgroundColor: selectedType === item.name ? '#3B82F6' : 'transparent',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {selectedType === item.name && (
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#fff',
          }} />
        )}
      </View>
      <Text style={{
        fontSize: 16,
        color: '#111827',
        flex: 1,
      }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: insets.top,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
          Type
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Ionicons name="search" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: '#111827',
            }}
            placeholder="Search or add type"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleAddType}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Types List */}
      <FlatList
        data={filteredTypes}
        keyExtractor={(item) => item.id}
        renderItem={renderTypeItem}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Drawer Modal */}
      <Modal
        visible={showBottomDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBottomDrawer(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setShowBottomDrawer(false)}
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
            onPress={() => {}}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 12,
                }}
                onPress={handleShowDeleteConfirm}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#EF4444',
                  fontWeight: '500',
                }}>
                  D
                </Text>
              </TouchableOpacity>

              <TextInput
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#111827',
                  flex: 1,
                  paddingVertical: 8,
                }}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Type Value"
                autoFocus={!showDeleteConfirm}
                onSubmitEditing={handleEditType}
                returnKeyType="done"
              />

              <TouchableOpacity onPress={handleEditType}>
                <Ionicons name="checkmark" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Delete Confirmation Section */}
            {showDeleteConfirm && (
              <View style={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
                paddingTop: 16,
              }}>
                <Text style={{ fontSize: 14, color: '#EF4444', marginBottom: 8, fontWeight: '500' }}>
                  Type "{selectedTypeForAction?.name}" to confirm deletion
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#EF4444',
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: '#111827',
                    backgroundColor: '#fff',
                  }}
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder={selectedTypeForAction?.name}
                  autoFocus={true}
                  onSubmitEditing={handleDeleteType}
                  returnKeyType="done"
                />

                {/* Delete Action Buttons */}
                <View style={{
                  flexDirection: 'row',
                  marginTop: 12,
                  gap: 8,
                }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      backgroundColor: '#fff',
                      paddingVertical: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: deleteConfirmText === selectedTypeForAction?.name ? '#EF4444' : '#F3F4F6',
                      paddingVertical: 8,
                      alignItems: 'center',
                    }}
                    onPress={handleDeleteType}
                    disabled={deleteConfirmText !== selectedTypeForAction?.name}
                  >
                    <Text style={{
                      color: deleteConfirmText === selectedTypeForAction?.name ? '#fff' : '#9CA3AF',
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
