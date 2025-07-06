import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, KeyboardAvoidingView, Platform, BackHandler, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { db } from '../lib/instant';
import { id } from '@instantdb/react-native';
import { useStore } from '../lib/store-context';

interface OptionValue {
  id: string;
  value: string;
  identifier: string;
  order: number;
  group?: string;
  type?: 'value';
}

interface SetScreenProps {
  setId: string;
  setName: string;
  onClose: () => void;
  onSave: () => void;
}

interface QuickEntryRowProps {
  groupName: string;
  onSubmit: (value: string) => void;
}

const QuickEntryRow: React.FC<QuickEntryRowProps> = ({ groupName, onSubmit }) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 16,
      paddingVertical: 11,
      backgroundColor: 'white',
      borderBottomWidth: 0.5,
      borderBottomColor: '#F0F0F0',
    }}>
      {/* Empty identifier space */}
      <View style={{
        width: 44,
        height: 44,
        marginRight: 16,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#C6C6C8',
        borderStyle: 'dashed',
      }} />

      <TextInput
        style={{
          flex: 1,
          fontSize: 17,
          color: '#000000',
          paddingVertical: 0,
        }}
        value={value}
        onChangeText={setValue}
        placeholder="Add new value..."
        placeholderTextColor="#8E8E93"
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        underlineColorAndroid="transparent"
      />
    </View>
  );
};

export default function SetScreen({ setId, setName, onClose, onSave }: SetScreenProps) {
  const { currentStore } = useStore();
  const isNewSet = setId === 'new';
  const [currentSetName, setCurrentSetName] = useState(isNewSet ? '' : setName);
  const [groupNames, setGroupNames] = useState<{[key: string]: string}>({
    '1': 'Group 1',
    '2': 'Group 2',
    '3': 'Group 3'
  });
  const [activeTab, setActiveTab] = useState<string>('1');
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>('');

  // Current working values (local state that gets saved on button press)
  const [currentValues, setCurrentValues] = useState<OptionValue[]>([]);

  // Track values to delete from database
  const [valuesToDelete, setValuesToDelete] = useState<string[]>([]);
  
  // Ref for option set name input to control its focus
  const setNameInputRef = useRef<TextInput>(null);

  // Use real-time data only to get initial snapshot, then work with local state
  const { data } = db.useQuery(
    !isNewSet && currentStore?.id ? {
      options: {
        $: { where: { set: setId, storeId: currentStore.id } }
      }
    } : {}
  );

  // Load initial data once from real-time query
  React.useEffect(() => {
    if (!isNewSet && data?.options && currentValues.length === 0) {
      const loadedValues = data.options
        .map((option: any) => ({
          id: option.id,
          value: option.value,
          identifier: option.identifier || `text:${option.value.substring(0, 2).toUpperCase()}`,
          order: option.order || 0,
          group: option.group || 'Group 1'
        }))
        .sort((a: any, b: any) => a.order - b.order);

      setCurrentValues(loadedValues);

      // Extract unique groups and update group names
      const actualGroups = [...new Set(loadedValues.map((v: any) => v.group))];

      const newGroupNames = { ...groupNames };

      // Map groups to keys more intelligently
      actualGroups.forEach((groupName: string) => {
        // First, check if this group name already exists in our mapping
        const existingKey = Object.keys(newGroupNames).find(key => newGroupNames[key] === groupName);

        if (existingKey) {
          // Group already mapped correctly, keep it
        } else {
          // Find the first available key for this new group
          const availableKey = ['1', '2', '3'].find(key =>
            !actualGroups.includes(newGroupNames[key]) || newGroupNames[key] === groupName
          );

          if (availableKey) {
            newGroupNames[availableKey] = groupName;
          }
        }
      });

      setGroupNames(newGroupNames);
    }
  }, [data?.options, isNewSet, currentValues.length]);

  // Handle system back button
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
    };
  }, [onClose]);

  const handleSave = async () => {
    const trimmedSetName = currentSetName.trim();
    
    // Validation
    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }
    
    if (!trimmedSetName) {
      Alert.alert('Validation Error', 'Option set name cannot be empty');
      return;
    }
    
    if (trimmedSetName.length > 30) {
      Alert.alert('Validation Error', 'Option set name cannot exceed 30 characters');
      return;
    }
    
    if (isNewSet && currentValues.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one value to the option set');
      return;
    }

    try {
      console.log('💾 Saving option set:', trimmedSetName, 'with values:', currentValues);
      
      // If it's a new set, create it first
      if (isNewSet && currentValues.length > 0) {
        console.log('🆕 Creating new option set with', currentValues.length, 'values');
        const transactions = currentValues.map((value) => {
          const optionId = id();
          const optionData = {
            set: trimmedSetName,
            value: value.value,
            identifier: value.identifier,
            order: value.order, // Use the actual order from the value
            group: value.group,
            storeId: currentStore.id
          };
          return db.tx.options[optionId].update(optionData);
        });

        await db.transact(transactions);
      } else if (!isNewSet) {
        // Update existing set - preserve the order values from the state
        const transactions = currentValues.map((value) => {
          const optionData = {
            set: trimmedSetName,
            value: value.value,
            identifier: value.identifier,
            order: value.order, // Use the actual order from the value, not the index
            group: value.group,
            storeId: currentStore.id // Add missing storeId for updates
          };
          return db.tx.options[value.id].update(optionData);
        });

        await db.transact(transactions);
      }

      // Delete any values that were marked for deletion
      if (valuesToDelete.length > 0) {
        console.log('🗑️ Deleting', valuesToDelete.length, 'values:', valuesToDelete);
        const deleteTransactions = valuesToDelete.map(valueId =>
          db.tx.options[valueId].delete()
        );
        await db.transact(deleteTransactions);
        console.log('✅ Values deleted successfully');
        setValuesToDelete([]); // Clear the deletion list
      }

      onSave();
    } catch (error) {
      console.error('❌ Error saving option set:', error);
      Alert.alert('Error', 'Failed to save option set');
    }
  };





  const updateGroupName = (groupKey: string, newName: string) => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== groupNames[groupKey]) {
      const oldGroupName = groupNames[groupKey];
      // Update values in local state only - will be saved when Save button is pressed
      setCurrentValues(prevValues => {
        const updatedValues = prevValues.map(value =>
          value.group === oldGroupName
            ? { ...value, group: trimmedName }
            : value
        );
        return updatedValues;
      });

      // Update group names in local state only
      setGroupNames(prevNames => {
        const newNames = { ...prevNames, [groupKey]: trimmedName };
        return newNames;
      });


    }
    // Clear tab editing state
    setEditingTab(null);
    setEditingTabName('');
  };

  const removeValue = (valueId: string) => {
    // Remove from current working values (will be saved when Save button is pressed)
    setCurrentValues(currentValues.filter(v => v.id !== valueId));

    // Track for deletion from database on save
    if (!valuesToDelete.includes(valueId)) {
      setValuesToDelete([...valuesToDelete, valueId]);
    }

    console.log('✅ Value marked for deletion:', valueId);
  };

  const renderValueItem = ({ item, drag, isActive }: RenderItemParams<OptionValue>) => {
    return (
      <View style={{
        backgroundColor: isActive ? '#F8F9FA' : 'white',
        elevation: isActive ? 3 : 0,
        shadowColor: isActive ? '#000' : 'transparent',
        shadowOffset: isActive ? { width: 0, height: 2 } : { width: 0, height: 0 },
        shadowOpacity: isActive ? 0.1 : 0,
        shadowRadius: isActive ? 4 : 0,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 16,
          paddingVertical: 11,
          backgroundColor: 'transparent',
          borderBottomWidth: 0.5,
          borderBottomColor: '#F0F0F0',
        }}>
          {/* Identifier Tile */}
          <TouchableOpacity style={{
            width: 44,
            height: 44,
            marginRight: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.identifier.startsWith('color:')
              ? item.identifier.replace('color:', '')
              : '#E5E5EA',
            borderWidth: item.identifier.startsWith('color:') ? 0 : StyleSheet.hairlineWidth,
            borderColor: '#C6C6C8',
          }}>
            {item.identifier.startsWith('text:') && (
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>
                {item.identifier.replace('text:', '')}
              </Text>
            )}
            {item.identifier.startsWith('image:') && (
              <View style={{ width: 28, height: 28, backgroundColor: '#8E8E93', borderRadius: 4 }} />
            )}
          </TouchableOpacity>

          {/* Value Name */}
          <Text style={{ flex: 1, fontSize: 17, color: '#000000', fontWeight: '400' }}>
            {item.value}
          </Text>

          {/* Delete button */}
          <TouchableOpacity
            onPress={() => removeValue(item.id)}
            style={{
              width: 28,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: '#F2F2F7',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: '#E5E5EA',
            }}
          >
            <Text style={{ color: '#FF3B30', fontSize: 14, fontWeight: '600' }}>D</Text>
          </TouchableOpacity>

          {/* Drag Handle */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={100}
            style={{ paddingHorizontal: 8, paddingVertical: 10, marginLeft: 4 }}
          >
            <MaterialCommunityIcons name="drag-vertical" size={24} color="#C6C6C8" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'white' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        {/* iOS Navigation Bar */}
        <View style={{
          backgroundColor: '#F8F9FA',
          paddingTop: Platform.OS === 'ios' ? 44 : 24,
          borderBottomWidth: 0.5,
          borderBottomColor: '#F0F0F0',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 11,
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{
                fontSize: 17,
                color: '#007AFF',
                fontWeight: '400',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000000',
            }}>
              {isNewSet ? 'New Option Set' : 'Edit Option Set'}
            </Text>

            <TouchableOpacity onPress={handleSave}>
              <Text style={{
                fontSize: 17,
                color: '#007AFF',
                fontWeight: '600',
              }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Option Set Name Input */}
        <View style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 11,
          borderBottomWidth: 0.5,
          borderBottomColor: '#F0F0F0',
        }}>
          <TextInput
            ref={setNameInputRef}
            style={{
              fontSize: 17,
              color: '#000000',
              paddingVertical: 0,
            }}
            value={currentSetName}
            onChangeText={setCurrentSetName}
            placeholder="Option set name"
            placeholderTextColor="#8E8E93"
            autoFocus={false}
          />
        </View>

        {/* iOS Segmented Control */}
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          backgroundColor: 'white',
        }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#F2F2F7',
            borderRadius: 8,
            padding: 2,
          }}>
            {['1', '2', '3'].map((groupKey) => {
              const currentGroupName = groupNames[groupKey];
              const isActive = activeTab === groupKey;
              const isEditing = editingTab === groupKey;

              return (
                <TouchableOpacity
                  key={groupKey}
                  onPress={() => {
                    if (isEditing) {
                      // If editing, save and exit edit mode
                      updateGroupName(groupKey, editingTabName);
                    } else {
                      setActiveTab(groupKey);
                    }
                  }}
                  onLongPress={() => {
                    if (!isEditing) {
                      setEditingTab(groupKey);
                      setEditingTabName(currentGroupName);
                    }
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    backgroundColor: isActive ? 'white' : 'transparent',
                    borderRadius: 6,
                    shadowColor: isActive ? '#000' : 'transparent',
                    shadowOffset: isActive ? { width: 0, height: 1 } : { width: 0, height: 0 },
                    shadowOpacity: isActive ? 0.1 : 0,
                    shadowRadius: isActive ? 2 : 0,
                    elevation: isActive ? 2 : 0,
                  }}
                >
                  {isEditing ? (
                    <TextInput
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: isActive ? '#1C1C1E' : '#8E8E93',
                        textAlign: 'center',
                        minWidth: 60,
                        paddingVertical: 0,
                      }}
                      value={editingTabName}
                      onChangeText={setEditingTabName}
                      onSubmitEditing={() => updateGroupName(groupKey, editingTabName)}
                      onBlur={() => updateGroupName(groupKey, editingTabName)}
                      autoFocus={true}
                      selectTextOnFocus={true}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: isActive ? '#1C1C1E' : '#8E8E93',
                    }}>
                      {currentGroupName}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Tab Content */}
        <View style={{ flex: 1 }}>
          {(() => {
            const currentGroupName = groupNames[activeTab];
            const groupValues = currentValues
              .filter(value => value.group === currentGroupName)
              .sort((a, b) => a.order - b.order);

            return (
              <DraggableFlatList
                data={groupValues}
                onDragEnd={({ data: reorderedGroupData }) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const otherValues = currentValues.filter(v => v.group !== currentGroupName);
                  const updatedGroupValues = reorderedGroupData.map((item, index) => ({
                    ...item,
                    order: index,
                  }));
                  setCurrentValues([...otherValues, ...updatedGroupValues]);

                }}
                keyExtractor={(item) => item.id}
                renderItem={renderValueItem}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  <QuickEntryRow
                    groupName={currentGroupName}
                    onSubmit={(value) => {
                      if (value.trim()) {
                        const newValue: OptionValue = {
                          id: id(),
                          value: value.trim(),
                          identifier: `text:${value.trim().substring(0, 2).toUpperCase()}`,
                          order: currentValues.length,
                          group: currentGroupName
                        };
                        setCurrentValues([...currentValues, newValue]);
                      }
                    }}
                  />
                }
              />
            );
          })()}
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}
