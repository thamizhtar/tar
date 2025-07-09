import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StatusBar, Alert, BackHandler, Modal } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';
import { id } from '@instantdb/react-native';
import { useStore } from '../lib/store-context';
import IdentifierEditScreen from './identifier-edit';
import GroupManager from '../components/group-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OptionValue {
  id: string;
  name: string;
  identifierType: 'text' | 'color' | 'image';
  identifierValue: string;
  group: string;
  order: number;
}

interface OptionSetEditScreenProps {
  setId: string;
  setName: string;
  onClose: () => void;
}

export default function OptionSetEditScreen({ setId, setName, onClose }: OptionSetEditScreenProps) {
  const { currentStore } = useStore();
  const insets = useSafeAreaInsets();
  const isNewSet = setId === 'new';

  const [currentSetName, setCurrentSetName] = useState(setName);
  const [currentGroup, setCurrentGroup] = useState('Group 1');
  const [values, setValues] = useState<OptionValue[]>([]);
  const [newValueName, setNewValueName] = useState('');
  const [showIdentifierEdit, setShowIdentifierEdit] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string>('');

  // Handle native back button
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onClose]);

  // Load existing data
  const { data } = db.useQuery(
    !isNewSet && currentStore?.id && setId ? {
      optionSets: {
        $: { where: { id: setId, storeId: currentStore.id } }
      },
      optionValues: {
        $: { where: { setId: setId } }
      }
    } : {}
  );

  console.log('Option Set Edit - Query params:', { isNewSet, storeId: currentStore?.id, setId });
  console.log('Option Set Edit - Raw data:', data);

  // Handle case where tables don't exist yet
  const safeData = React.useMemo(() => {
    if (!data) return { optionSets: [], optionValues: [] };
    const result = {
      optionSets: data.optionSets || [],
      optionValues: data.optionValues || []
    };
    console.log('SafeData:', result);
    return result;
  }, [data]);

  // Load last selected group from storage or set to first group
  useEffect(() => {
    const loadLastSelectedGroup = async () => {
      if (currentStore?.id) {
        try {
          const key = `last_selected_group_${currentStore.id}`;
          const lastGroup = await AsyncStorage.getItem(key);
          if (lastGroup) {
            setCurrentGroup(lastGroup);
          } else {
            // Default to first group (Group 1)
            setCurrentGroup('Group 1');
          }
        } catch (error) {
          console.error('Error loading last selected group:', error);
          // Fallback to first group
          setCurrentGroup('Group 1');
        }
      } else {
        // If no store, default to first group
        setCurrentGroup('Group 1');
      }
    };
    loadLastSelectedGroup();
  }, [currentStore?.id]);

  useEffect(() => {
    // Load option values when data is available
    if (safeData.optionValues && safeData.optionValues.length > 0) {
      const loadedValues = safeData.optionValues
        .map((value: any) => ({
          id: value.id,
          name: value.name,
          identifierType: value.identifierType || 'text',
          identifierValue: value.identifierValue || value.name.substring(0, 2).toUpperCase(),
          group: value.group || 'Group 1',
          order: value.order || 0,
        }))
        .sort((a: any, b: any) => a.order - b.order);

      setValues(loadedValues);
      console.log('Loaded values:', loadedValues);

      // Set current group to the first group that has values
      if (loadedValues.length > 0) {
        const firstGroupWithValues = loadedValues[0].group;
        setCurrentGroup(firstGroupWithValues);
        console.log('Set current group to:', firstGroupWithValues);
      }
    }
  }, [safeData]);

  // Get unique group names from the loaded values
  const actualGroupNames = React.useMemo(() => {
    if (values.length === 0) return ['Group 1', 'Group 2', 'Group 3'];

    const uniqueGroups = [...new Set(values.map(v => v.group))];
    // Ensure we always have 3 groups, fill with defaults if needed
    while (uniqueGroups.length < 3) {
      const defaultName = `Group ${uniqueGroups.length + 1}`;
      if (!uniqueGroups.includes(defaultName)) {
        uniqueGroups.push(defaultName);
      } else {
        uniqueGroups.push(`Group ${uniqueGroups.length + 1}`);
      }
    }
    return uniqueGroups.slice(0, 3); // Limit to 3 groups
  }, [values]);

  const handleSave = async () => {
    const trimmedSetName = currentSetName.trim();
    
    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }
    
    if (!trimmedSetName) {
      Alert.alert('Error', 'Option set name cannot be empty');
      return;
    }

    try {
      // Update or create the option set
      await db.transact([
        db.tx.optionSets[setId].update({
          name: trimmedSetName,
          storeId: currentStore.id,
        })
      ]);

      // Save all values
      if (values.length > 0) {
        // Group values by their group and assign order within each group
        const groupedValues = values.reduce((acc, value) => {
          if (!acc[value.group]) acc[value.group] = [];
          acc[value.group].push(value);
          return acc;
        }, {} as Record<string, OptionValue[]>);

        const valueTransactions = values.map((value) => {
          const groupValues = groupedValues[value.group];
          const orderInGroup = groupValues.findIndex(v => v.id === value.id);

          return db.tx.optionValues[value.id].update({
            setId: setId,
            name: value.name,
            identifierType: value.identifierType,
            identifierValue: value.identifierValue,
            group: value.group,
            order: orderInGroup,
            storeId: currentStore.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });

        await db.transact(valueTransactions);
      }

      onClose();
    } catch (error) {
      console.error('Error saving option set:', error);
      Alert.alert('Error', 'Failed to save option set');
    }
  };

  const handleAddValue = () => {
    if (!newValueName.trim()) return;

    // Calculate order based on values in current group
    const valuesInCurrentGroup = values.filter(v => v.group === currentGroup);

    const newValue: OptionValue = {
      id: id(),
      name: newValueName.trim(),
      identifierType: 'text',
      identifierValue: newValueName.trim().substring(0, 2).toUpperCase(),
      group: currentGroup,
      order: valuesInCurrentGroup.length,
    };

    setValues([...values, newValue]);
    setNewValueName('');
  };

  const handleDeleteValue = (valueId: string) => {
    setValues(values.filter(v => v.id !== valueId));
  };

  const handleGroupSelect = async (group: string) => {
    setCurrentGroup(group);

    // Save selected group to storage
    if (currentStore?.id) {
      try {
        const key = `last_selected_group_${currentStore.id}`;
        await AsyncStorage.setItem(key, group);
      } catch (error) {
        console.error('Error saving selected group:', error);
      }
    }
  };

  const handleGroupRenamed = (oldName: string, newName: string) => {
    // Update local values to reflect the group name change
    setValues(prevValues =>
      prevValues.map(value =>
        value.group === oldName
          ? { ...value, group: newName }
          : value
      )
    );

    // If the current group was renamed, update the current group
    if (currentGroup === oldName) {
      setCurrentGroup(newName);
    }
  };

  const handleEditIdentifier = (valueId: string) => {
    setEditingValueId(valueId);
    setShowIdentifierEdit(true);
  };

  const handleSaveIdentifier = (type: 'text' | 'color' | 'image', value: string) => {
    setValues(values.map(v => 
      v.id === editingValueId 
        ? { ...v, identifierType: type, identifierValue: value }
        : v
    ));
    setShowIdentifierEdit(false);
  };

  const renderIdentifierTile = (value: OptionValue) => {
    const { identifierType, identifierValue } = value;
    
    return (
      <TouchableOpacity
        onPress={() => handleEditIdentifier(value.id)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: identifierType === 'color' ? identifierValue : '#E5E5EA',
          borderWidth: identifierType === 'color' ? 0 : 1,
          borderColor: '#C6C6C8',
          marginRight: 12,
        }}
      >
        {identifierType === 'text' && (
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>
            {identifierValue.substring(0, 2).toUpperCase()}
          </Text>
        )}
        {identifierType === 'image' && (
          <MaterialIcons name="image" size={24} color="#8E8E93" />
        )}
      </TouchableOpacity>
    );
  };

  const renderValue = ({ item }: { item: OptionValue }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#F2F2F7',
    }}>
      {renderIdentifierTile(item)}
      
      <Text style={{ flex: 1, fontSize: 17, color: '#1C1C1E' }}>
        {item.name}
      </Text>
      
      <TouchableOpacity
        onPress={() => handleDeleteValue(item.id)}
        style={{
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          backgroundColor: '#FF3B30',
        }}
      >
        <MaterialIcons name="close" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  const editingValue = values.find(v => v.id === editingValueId);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 17, color: '#007AFF' }}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#1C1C1E',
          }}>
            {isNewSet ? 'New Option Set' : 'Edit Option Set'}
          </Text>
          
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ fontSize: 17, color: '#007AFF', fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Set Name Input */}
      <View style={{ padding: 20 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1C1C1E',
          marginBottom: 8,
        }}>
          Option Set Name
        </Text>
        <TextInput
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E5E5EA',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: '#1C1C1E',
            marginBottom: 20,
          }}
          placeholder="Enter option set name"
          value={currentSetName}
          onChangeText={setCurrentSetName}
        />

        {/* Group Selection */}
        <GroupManager
          currentGroup={currentGroup}
          onGroupSelect={handleGroupSelect}
          storeId={currentStore?.id || ''}
          onGroupRenamed={handleGroupRenamed}
          initialGroups={actualGroupNames}
        />
      </View>

      {/* Add Value Input */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1C1C1E',
          marginBottom: 8,
        }}>
          Add Value
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: '#E5E5EA',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#1C1C1E',
            }}
            placeholder="Enter value name"
            value={newValueName}
            onChangeText={setNewValueName}
            onSubmitEditing={handleAddValue}
          />
          <TouchableOpacity
            onPress={handleAddValue}
            style={{
              backgroundColor: '#007AFF',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Values List */}
      <FlatList
        data={(() => {
          const filtered = values.filter(value => value.group === currentGroup);
          console.log('Current Group:', currentGroup);
          console.log('All Values:', values);
          console.log('Filtered Values:', filtered);
          return filtered;
        })()}
        renderItem={renderValue}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#8E8E93', fontSize: 16 }}>
              No values in {currentGroup}
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 14, marginTop: 4 }}>
              Add values using the form above
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 12, marginTop: 8 }}>
              Total values: {values.length}
            </Text>
          </View>
        )}
      />

      {/* Identifier Edit Modal */}
      <Modal
        visible={showIdentifierEdit}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowIdentifierEdit(false)}
      >
        {editingValue && (
          <IdentifierEditScreen
            currentType={editingValue.identifierType}
            currentValue={editingValue.identifierValue}
            onClose={() => setShowIdentifierEdit(false)}
            onSave={handleSaveIdentifier}
          />
        )}
      </Modal>
    </View>
  );
}
