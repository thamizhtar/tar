import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { id } from '@instantdb/react-native';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      onSave?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-600 text-base font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center">
              <Text className="text-base font-medium text-gray-900 mr-3">
                {formData.isActive ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity
                onPress={() => updateField('isActive', !formData.isActive)}
                className={`w-12 h-6 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <View className={`w-5 h-5 bg-white rounded-full mt-0.5 ${formData.isActive ? 'ml-6' : 'ml-0.5'}`} />
              </TouchableOpacity>
            </View>
            
            <Button
              title="Save"
              onPress={handleSave}
              loading={loading}
              size="small"
            />
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 24) }}
      >
        <View className="px-4 pt-6">
          {/* Image Upload Area */}
          <Card padding="large" className="mb-6">
            <TouchableOpacity className="items-center py-8">
              <View className="w-16 h-16 bg-green-100 rounded-lg items-center justify-center mb-3">
                <Text className="text-2xl">📁</Text>
              </View>
              <Text className="text-green-600 text-base font-medium">
                Add collection image
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Collection Name */}
          <Card padding="medium" className="mb-6">
            <Input
              placeholder="Collection name"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              variant="filled"
              size="large"
            />
          </Card>

          {/* Description */}
          <Card padding="medium" className="mb-6">
            <Input
              label="Description"
              placeholder="Enter collection description"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              variant="filled"
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Visibility */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Visibility</Text>
            <Card padding="medium">
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                <Text className="text-base text-gray-900 flex-1">Online Store</Text>
              </View>
            </Card>
          </View>

          {/* Products */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Products</Text>
            <Card padding="medium">
              <TouchableOpacity className="flex-row items-center justify-between py-2">
                <Text className="text-green-600 text-base">+ Add products</Text>
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* SEO */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Search engine listing</Text>
            <Card padding="medium">
              <TouchableOpacity className="flex-row items-center justify-between py-2">
                <Text className="text-base text-gray-900">Edit SEO settings</Text>
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Collection Type */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Collection type</Text>
            <Card padding="medium">
              <TouchableOpacity className="flex-row items-center justify-between py-2">
                <View>
                  <Text className="text-base text-gray-900">Manual</Text>
                  <Text className="text-sm text-gray-500">Add products individually</Text>
                </View>
                <Text className="text-gray-400 text-xl">›</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
