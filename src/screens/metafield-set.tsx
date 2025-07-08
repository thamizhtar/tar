import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, KeyboardAvoidingView, Platform, BackHandler, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { db } from '../lib/instant';
import { id } from '@instantdb/react-native';
import { useStore } from '../lib/store-context';

interface MetafieldValue {
  id: string;
  title: string;
  type: string;
  value: string;
  order: number;
  filter?: boolean;
}

interface MetafieldSetScreenProps {
  setId: string;
  setName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function MetafieldSetScreen({ setId, setName, onClose, onSave }: MetafieldSetScreenProps) {
  const { currentStore } = useStore();
  const isNewSet = setId === 'new';
  
  const [currentSetName, setCurrentSetName] = useState(setName === 'New Metafield Set' ? '' : setName);
  const [currentValues, setCurrentValues] = useState<MetafieldValue[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: onClose }
          ]
        );
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [hasChanges, onClose]);

  // Use real-time data only to get initial snapshot, then work with local state
  const { data } = db.useQuery(
    !isNewSet && currentStore?.id ? {
      metafields: {
        $: { where: { group: setId, storeId: currentStore.id } }
      }
    } : {}
  );

  // Load initial data once from real-time query
  React.useEffect(() => {
    if (!isNewSet && data?.metafields && currentValues.length === 0) {
      const loadedValues = data.metafields
        .map((metafield: any) => ({
          id: metafield.id,
          title: metafield.title || '',
          type: metafield.type || 'text',
          value: metafield.value || '',
          order: metafield.order || 0,
          filter: metafield.filter || false
        }))
        .sort((a: any, b: any) => a.order - b.order);
      
      setCurrentValues(loadedValues);
    }
  }, [data?.metafields, isNewSet, currentValues.length]);

  // Track changes
  useEffect(() => {
    if (isNewSet) {
      setHasChanges(currentSetName.trim() !== '' || currentValues.length > 0);
    } else {
      const nameChanged = currentSetName.trim() !== setName;
      const valuesChanged = JSON.stringify(currentValues) !== JSON.stringify(data?.metafields || []);
      setHasChanges(nameChanged || valuesChanged);
    }
  }, [currentSetName, currentValues, isNewSet, setName, data?.metafields]);

  const addNewField = () => {
    const newField: MetafieldValue = {
      id: id(),
      title: '',
      type: 'text',
      value: '',
      order: currentValues.length,
      filter: false
    };
    setCurrentValues([...currentValues, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<MetafieldValue>) => {
    setCurrentValues(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setCurrentValues(prev => prev.filter(field => field.id !== fieldId));
  };

  const handleSave = async () => {
    const trimmedSetName = currentSetName.trim();
    
    // Validation
    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }
    
    if (!trimmedSetName) {
      Alert.alert('Validation Error', 'Metafield set name cannot be empty');
      return;
    }
    
    if (trimmedSetName.length > 30) {
      Alert.alert('Validation Error', 'Metafield set name cannot exceed 30 characters');
      return;
    }
    
    if (isNewSet && currentValues.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one field to the metafield set');
      return;
    }

    // Validate that all fields have titles
    const emptyTitleFields = currentValues.filter(field => !field.title.trim());
    if (emptyTitleFields.length > 0) {
      Alert.alert('Validation Error', 'All fields must have a title');
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 Saving metafield set:', trimmedSetName, 'with fields:', currentValues);
      
      // If it's a new set, create it first
      if (isNewSet && currentValues.length > 0) {
        console.log('🆕 Creating new metafield set with', currentValues.length, 'fields');
        const transactions = currentValues.map((field) => {
          const metafieldId = id();
          const metafieldData = {
            group: trimmedSetName,
            title: field.title.trim(),
            type: field.type,
            value: field.value,
            order: field.order,
            filter: field.filter,
            storeId: currentStore.id,
            parentid: '' // Will be set when assigned to products
          };
          return db.tx.metafields[metafieldId].update(metafieldData);
        });

        await db.transact(transactions);
      } else if (!isNewSet) {
        // Update existing set
        const transactions = currentValues.map((field) => {
          const metafieldData = {
            group: trimmedSetName,
            title: field.title.trim(),
            type: field.type,
            value: field.value,
            order: field.order,
            filter: field.filter,
            storeId: currentStore.id
          };
          return db.tx.metafields[field.id].update(metafieldData);
        });

        await db.transact(transactions);
      }

      console.log('✅ Metafield set saved successfully');
      setHasChanges(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('❌ Failed to save metafield set:', error);
      Alert.alert('Error', 'Failed to save metafield set. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldTypes = [
    { id: 'text', label: 'Text' },
    { id: 'number', label: 'Number' },
    { id: 'boolean', label: 'Boolean' },
    { id: 'date', label: 'Date' },
    { id: 'url', label: 'URL' },
    { id: 'email', label: 'Email' }
  ];

  const renderFieldItem = ({ item, drag, isActive }: RenderItemParams<MetafieldValue>) => (
    <View style={{
      backgroundColor: isActive ? '#F3F4F6' : '#fff',
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isActive ? '#D1D5DB' : '#E5E7EB',
      padding: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '500',
            color: '#111827',
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 4,
            backgroundColor: '#fff'
          }}
          placeholder="Field title"
          value={item.title}
          onChangeText={(text) => updateField(item.id, { title: text })}
        />
        <TouchableOpacity
          onPress={() => deleteField(item.id)}
          style={{
            padding: 8,
            marginLeft: 8,
          }}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity
          onLongPress={drag}
          style={{
            padding: 8,
            marginLeft: 4,
          }}
        >
          <MaterialCommunityIcons name="drag" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {fieldTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => updateField(item.id, { type: type.id })}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: item.type === type.id ? '#3B82F6' : '#F3F4F6',
                    borderRadius: 4,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: item.type === type.id ? '#fff' : '#6B7280',
                    fontWeight: '500'
                  }}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        <TouchableOpacity
          onPress={() => updateField(item.id, { filter: !item.filter })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: item.filter ? '#3B82F6' : '#F3F4F6',
            borderRadius: 4,
          }}
        >
          <MaterialCommunityIcons 
            name="filter-outline" 
            size={14} 
            color={item.filter ? '#fff' : '#6B7280'} 
          />
          <Text style={{
            fontSize: 12,
            color: item.filter ? '#fff' : '#6B7280',
            fontWeight: '500'
          }}>
            Filter
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#F9FAFB',
        }}>
          <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
          
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#111827',
            }}>
              {isNewSet ? 'New Metafield Set' : 'Edit Metafield Set'}
            </Text>
            
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isSaving || !hasChanges}
              style={{
                backgroundColor: hasChanges ? '#3B82F6' : '#E5E7EB',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{
                color: hasChanges ? '#fff' : '#9CA3AF',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Set Name Input */}
          <View style={{
            backgroundColor: '#fff',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Set Name</Text>
            <TextInput
              style={{
                fontSize: 16,
                color: '#111827',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 6,
                backgroundColor: '#fff'
              }}
              placeholder="Enter metafield set name"
              value={currentSetName}
              onChangeText={setCurrentSetName}
              maxLength={30}
            />
          </View>

          {/* Fields List */}
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                Fields ({currentValues.length})
              </Text>
              <TouchableOpacity
                onPress={addNewField}
                style={{
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                  Add Field
                </Text>
              </TouchableOpacity>
            </View>

            {currentValues.length === 0 ? (
              <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 40,
              }}>
                <MaterialCommunityIcons name="tag-plus-outline" size={64} color="#D1D5DB" />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#6B7280',
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                  No Fields Yet
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#9CA3AF',
                  marginTop: 8,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                  Add fields to create custom metafields for your products
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                data={currentValues}
                onDragEnd={({ data }) => {
                  const reorderedData = data.map((item, index) => ({
                    ...item,
                    order: index
                  }));
                  setCurrentValues(reorderedData);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                keyExtractor={(item) => item.id}
                renderItem={renderFieldItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}
