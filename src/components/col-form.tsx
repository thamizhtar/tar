import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, BackHandler, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { id } from '@instantdb/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getCurrentTimestamp } from '../lib/instant';

interface CollectionFormScreenProps {
  collection?: any;
  onClose: () => void;
  onSave?: () => void;
}

export default function CollectionFormScreen({ collection, onClose, onSave }: CollectionFormScreenProps) {
  const insets = useSafeAreaInsets();
  const isEditing = !!collection;

  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    isActive: collection?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        setShowUnsavedChangesModal(true);
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [hasChanges, onClose]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Collection name is required');
      return;
    }

    setLoading(true);
    try {
      const timestamp = getCurrentTimestamp();
      const collectionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        updatedAt: timestamp,
        ...(isEditing ? {} : { createdAt: timestamp }),
      };

      if (isEditing) {
        await db.transact(db.tx.collections[collection.id].update(collectionData));
      } else {
        await db.transact(db.tx.collections[id()].update(collectionData));
      }

      setHasChanges(false);
      onSave?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header - Clean minimal design */}
      <View style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
          }}>
            {isEditing ? 'Edit Collection' : 'New Collection'}
          </Text>

          {/* Save Button - Only show when changes exist */}
          {hasChanges && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="check" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {!hasChanges && <View style={{ width: 32 }} />}
        </View>
      </View>

      {/* Form Content - Following prod-form design pattern */}
      <View style={{ flex: 1, padding: 16 }}>
        {/* Main Container with Border */}
        <View style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          backgroundColor: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Collection Name */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
            <TextInput
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#000',
                paddingVertical: 12,
                paddingHorizontal: 0,
                borderWidth: 0,
                backgroundColor: 'transparent',
              }}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="COLLECTION NAME"
              placeholderTextColor="#999"
            />

            {/* Description field */}
            <TextInput
              style={{
                fontSize: 16,
                color: '#6B7280',
                paddingVertical: 8,
                paddingHorizontal: 0,
                borderWidth: 0,
                backgroundColor: 'transparent',
                marginTop: 4,
                marginBottom: 16,
              }}
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="description"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          {/* Status Toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#fff',
            paddingHorizontal: 16,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
              Active Status
            </Text>
            <TouchableOpacity
              onPress={() => updateField('isActive', !formData.isActive)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: formData.isActive ? '#10B981' : '#D1D5DB',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#fff',
                alignSelf: formData.isActive ? 'flex-end' : 'flex-start',
              }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedChangesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnsavedChangesModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#fff',
            paddingTop: 20,
            paddingBottom: 20 + insets.bottom,
            paddingHorizontal: 20,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#111827',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Unsaved Changes
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 24,
              textAlign: 'center',
            }}>
              You have unsaved changes. What would you like to do?
            </Text>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  backgroundColor: '#3B82F6',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowUnsavedChangesModal(false);
                  onClose();
                }}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#111827', fontSize: 16, fontWeight: '500' }}>
                  Discard Changes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowUnsavedChangesModal(false)}
                style={{
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 16 }}>
                  Continue Editing
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
