import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ScrollView, StatusBar, Alert, KeyboardAvoidingView, Platform, BackHandler, StyleSheet, Animated, PanResponder } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
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
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

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
      console.log('📋 Actual groups from data:', actualGroups);

      const newGroupNames = { ...groupNames };

      // Map groups to keys more intelligently
      actualGroups.forEach((groupName: string) => {
        // First, check if this group name already exists in our mapping
        const existingKey = Object.keys(newGroupNames).find(key => newGroupNames[key] === groupName);

        if (existingKey) {
          // Group already mapped correctly, keep it
          console.log(`📋 Group "${groupName}" already mapped to key ${existingKey}`);
        } else {
          // Find the first available key for this new group
          const availableKey = ['1', '2', '3'].find(key =>
            !actualGroups.includes(newGroupNames[key]) || newGroupNames[key] === groupName
          );

          if (availableKey) {
            newGroupNames[availableKey] = groupName;
            console.log(`📋 Mapped group "${groupName}" to key ${availableKey}`);
          }
        }
      });

      console.log('📋 Final group names after update:', newGroupNames);
      setGroupNames(newGroupNames);
    }
  }, [data?.options, isNewSet, currentValues.length]);

  // Handle system back button
  useEffect(() => {
    const backAction = () => {
      console.log('🔙 Back button pressed, closing screen');
      onClose();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    console.log('📱 BackHandler registered');

    return () => {
      console.log('📱 BackHandler removed');
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
          console.log('📝 Creating option:', optionData);
          return db.tx.options[optionId].update(optionData);
        });

        await db.transact(transactions);
        console.log('✅ New option set created successfully');
      } else if (!isNewSet) {
        console.log('📝 Updating existing option set with', currentValues.length, 'values');
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
          console.log('📝 Updating option:', value.id, optionData);
          return db.tx.options[value.id].update(optionData);
        });

        await db.transact(transactions);
        console.log('✅ Option set updated successfully');
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



  const updateRowValue = (groupKey: string, rowIndex: number, value: string) => {
    setGroupInputRows(prev => ({
      ...prev,
      [groupKey]: prev[groupKey].map((row, index) =>
        index === rowIndex ? value : row
      )
    }));
  };

  const submitRowValue = async (groupKey: string, rowIndex: number) => {
    const trimmedValue = groupInputRows[groupKey][rowIndex]?.trim();

    // Validation
    if (!trimmedValue) {
      Alert.alert('Validation Error', 'Value name cannot be empty');
      return;
    }

    if (trimmedValue.length > 50) {
      Alert.alert('Validation Error', 'Value name cannot exceed 50 characters');
      return;
    }

    // Check for duplicates
    const isDuplicate = currentValues.some(v =>
      v.value.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (isDuplicate) {
      Alert.alert('Validation Error', 'A value with this name already exists');
      return;
    }

    const newValue: OptionValue = {
      id: isNewSet ? `temp_${Date.now()}` : id(),
      value: trimmedValue,
      identifier: `text:${trimmedValue.substring(0, 2).toUpperCase()}`,
      order: currentValues.length,
      group: groupNames[groupKey] || groupKey
    };

    // Add to current working values (will be saved when Save button is pressed)
    setCurrentValues([...currentValues, newValue]);

    // Clear the input for this row
    updateRowValue(groupKey, rowIndex, '');
  };

  const updateGroupName = (groupKey: string, newName: string) => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== groupNames[groupKey]) {
      const oldGroupName = groupNames[groupKey];
      console.log(`🔄 Updating group ${groupKey} locally: "${oldGroupName}" → "${trimmedName}"`);

      // Update values in local state only - will be saved when Save button is pressed
      setCurrentValues(prevValues => {
        const updatedValues = prevValues.map(value =>
          value.group === oldGroupName
            ? { ...value, group: trimmedName }
            : value
        );
        console.log(`📝 Updated ${updatedValues.filter(v => v.group === trimmedName).length} values to group "${trimmedName}" (local state only)`);
        return updatedValues;
      });

      // Update group names in local state only
      setGroupNames(prevNames => {
        const newNames = { ...prevNames, [groupKey]: trimmedName };
        console.log('📝 New group names (local state only):', newNames);
        return newNames;
      });

      console.log('✅ Group name update completed (will save to database on Save button press)');
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



  const moveValueUp = (value: OptionValue) => {
    const groupValues = currentValues.filter(v => v.group === value.group).sort((a, b) => a.order - b.order);
    const currentIndex = groupValues.findIndex(v => v.id === value.id);

    if (currentIndex > 0) {
      const otherValues = currentValues.filter(v => v.group !== value.group);
      const reorderedGroup = [...groupValues];
      [reorderedGroup[currentIndex], reorderedGroup[currentIndex - 1]] = [reorderedGroup[currentIndex - 1], reorderedGroup[currentIndex]];

      const updatedGroup = reorderedGroup.map((v, index) => ({ ...v, order: index }));
      const allValues = [...otherValues, ...updatedGroup].sort((a, b) => a.order - b.order).map((v, index) => ({ ...v, order: index }));

      setCurrentValues(allValues);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const moveValueDown = (value: OptionValue) => {
    const groupValues = currentValues.filter(v => v.group === value.group).sort((a, b) => a.order - b.order);
    const currentIndex = groupValues.findIndex(v => v.id === value.id);

    if (currentIndex < groupValues.length - 1) {
      const otherValues = currentValues.filter(v => v.group !== value.group);
      const reorderedGroup = [...groupValues];
      [reorderedGroup[currentIndex], reorderedGroup[currentIndex + 1]] = [reorderedGroup[currentIndex + 1], reorderedGroup[currentIndex]];

      const updatedGroup = reorderedGroup.map((v, index) => ({ ...v, order: index }));
      const allValues = [...otherValues, ...updatedGroup].sort((a, b) => a.order - b.order).map((v, index) => ({ ...v, order: index }));

      setCurrentValues(allValues);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const DraggableValueItem = ({ item, index, groupValues }: { item: OptionValue, index: number, groupValues: OptionValue[] }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handlePressIn = () => {
      const timer = setTimeout(() => {
        setIsDragging(true);
        setDraggedItem(item.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    };

    const handlePressOut = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      if (isDragging) {
        setIsDragging(false);
        setDraggedItem(null);
      }
    };

    const moveUp = () => {
      if (index > 0) {
        reorderItems(index, index - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    const moveDown = () => {
      if (index < groupValues.length - 1) {
        reorderItems(index, index + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    const reorderItems = (fromIndex: number, toIndex: number) => {
      const currentGroupName = groupValues[0]?.group;
      if (!currentGroupName) return;

      // Get all values not in current group
      const otherValues = currentValues.filter(v => v.group !== currentGroupName);

      // Create new ordered array for current group
      const reorderedGroup = [...groupValues];
      const [movedItem] = reorderedGroup.splice(fromIndex, 1);
      reorderedGroup.splice(toIndex, 0, movedItem);

      // Update order values for the group
      const updatedGroup = reorderedGroup.map((v, i) => ({ ...v, order: i }));

      // Combine with other groups
      const allValues = [...otherValues, ...updatedGroup];

      setCurrentValues(allValues);
      console.log(`🔄 Reordered: ${fromIndex} → ${toIndex}`);
    };

    return (
      <View
        style={{
          backgroundColor: isDragging ? '#F8F9FA' : 'white',
          elevation: isDragging ? 3 : 0,
          shadowColor: isDragging ? '#000' : 'transparent',
          shadowOffset: isDragging ? { width: 0, height: 2 } : { width: 0, height: 0 },
          shadowOpacity: isDragging ? 0.1 : 0,
          shadowRadius: isDragging ? 4 : 0,
        }}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 16,
            paddingVertical: 11,
            backgroundColor: 'transparent',
            borderBottomWidth: 0.5,
            borderBottomColor: '#F0F0F0',
          }}
        >
          {/* Identifier Tile - Large iOS style */}
          <TouchableOpacity
            style={{
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
            }}
          >
            {item.identifier.startsWith('text:') && (
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1C1C1E',
              }}>
                {item.identifier.replace('text:', '')}
              </Text>
            )}
            {item.identifier.startsWith('image:') && (
              <View style={{
                width: 28,
                height: 28,
                backgroundColor: '#8E8E93',
                borderRadius: 4,
              }} />
            )}
          </TouchableOpacity>

          {/* Value Name - iOS style */}
          <Text style={{
            flex: 1,
            fontSize: 17,
            color: '#000000',
            fontWeight: '400',
          }}>
            {item.value}
          </Text>

          {/* Reorder buttons when dragging */}
          {isDragging ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity
                onPress={moveUp}
                disabled={index === 0}
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: index === 0 ? '#F2F2F7' : '#007AFF',
                  borderRadius: 16,
                  marginRight: 8,
                }}
              >
                <Text style={{
                  color: index === 0 ? '#C6C6C8' : 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>↑</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={moveDown}
                disabled={index === groupValues.length - 1}
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: index === groupValues.length - 1 ? '#F2F2F7' : '#007AFF',
                  borderRadius: 16,
                }}
              >
                <Text style={{
                  color: index === groupValues.length - 1 ? '#C6C6C8' : 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>↓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Delete button - Red D with circle */
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
              <Text style={{
                color: '#FF3B30',
                fontSize: 14,
                fontWeight: '600',
              }}>D</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderValueItem = (item: OptionValue, index: number, groupValues: OptionValue[]) => {
    return <DraggableValueItem item={item} index={index} groupValues={groupValues} />;
  };

  return (
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
            <View style={{ flex: 1 }}>


              {/* Values List */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {groupValues.map((value, index) => (
                  <View key={value.id}>
                    {renderValueItem(value, index, groupValues)}
                  </View>
                ))}

                {/* Quick Entry Row - Always visible */}
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


              </ScrollView>
            </View>
          );
        })()}
      </View>


    </KeyboardAvoidingView>
  );
}
