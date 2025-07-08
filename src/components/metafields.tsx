import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StatusBar, BackHandler, TextInput, Alert, Modal, Switch, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';
import { useStore } from '../lib/store-context';
import { id } from '@instantdb/react-native';

interface MetafieldDefinition {
  id: string;
  title: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'weight' | 'dimension' | 'volume' | 'rating' | 'color' | 'json';
  group: string;
  order: number;
  filter: boolean;
  config?: {
    min?: number;
    max?: number;
    unit?: string;
    options?: string[];
    placeholder?: string;
    required?: boolean;
  };
  value?: string; // Default value
}

interface MetafieldsProps {
  productId?: string;
  onClose?: () => void;
}

export default function Metafields({ productId, onClose }: MetafieldsProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [definitions, setDefinitions] = useState<MetafieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedField, setSelectedField] = useState<MetafieldDefinition | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [newFieldData, setNewFieldData] = useState({
    title: '',
    type: 'text' as MetafieldDefinition['type'],
    group: '',
    filter: false,
    config: {} as MetafieldDefinition['config'],
    value: ''
  });

  // State for managing groups
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Debug current store
  console.log('Current store in metafields:', currentStore);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (onClose) onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onClose]);

  // Query metafield definitions for this store (using special parentid for definitions)
  const { data: metafieldsData } = db.useQuery(
    currentStore?.id ? {
      metafields: {
        $: {
          where: {
            storeId: currentStore.id,
            parentid: 'metafield-definitions' // Special parentid for definitions
          }
        }
      }
    } : {}
  );

  // Query metafield values for this product
  const { data: valuesData } = db.useQuery(
    productId && currentStore?.id ? {
      metafields: {
        $: {
          where: {
            storeId: currentStore.id,
            parentid: productId
          }
        }
      }
    } : {}
  );

  // Load definitions and values
  useEffect(() => {
    console.log('Metafields data changed:', metafieldsData);
    if (metafieldsData?.metafields) {
      const defs = metafieldsData.metafields.map(field => ({
        id: field.id,
        title: field.title || '',
        type: field.type || 'text',
        group: field.group || 'General',
        order: field.order || 0,
        filter: field.filter || false,
        config: field.config || {},
        value: field.value || ''
      })).sort((a, b) => a.order - b.order);
      console.log('Processed definitions:', defs);
      console.log('Available groups after processing:', [...new Set(defs.map(d => d.group))]);
      setDefinitions(defs);
    } else {
      console.log('No metafields data or empty');
      setDefinitions([]);
    }
  }, [metafieldsData]);

  useEffect(() => {
    if (valuesData?.metafields) {
      const vals: Record<string, any> = {};
      valuesData.metafields.forEach(field => {
        if (field?.title && field?.value !== undefined) {
          vals[field.title] = field.value;
        }
      });
      setValues(vals);
    }
  }, [valuesData]);

  const addGroup = async () => {
    if (!newGroupName.trim() || !currentStore?.id) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    // Check if group already exists
    const existingGroups = getAllGroups();
    if (existingGroups.includes(newGroupName.trim())) {
      Alert.alert('Error', 'A group with this name already exists');
      return;
    }

    try {
      // Create a group placeholder metafield to establish the group
      const groupId = id();
      await db.transact(
        db.tx.metafields[groupId].update({
          title: '__GROUP_PLACEHOLDER__',
          type: '__GROUP__',
          group: newGroupName.trim(),
          order: 0,
          filter: false,
          config: {},
          value: '',
          storeId: currentStore.id,
          parentid: 'metafield-definitions'
        })
      );

      console.log('Group created:', newGroupName.trim());
      setNewGroupName('');
      setShowAddGroupModal(false);
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'Failed to add group');
    }
  };

  const addDefinition = async () => {
    console.log('Adding metafield with data:', newFieldData);
    console.log('Current store:', currentStore?.id);

    if (!newFieldData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the metafield');
      return;
    }

    if (!selectedGroup) {
      Alert.alert('Error', 'No group selected');
      return;
    }

    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }

    try {
      const definitionId = id();
      const maxOrder = definitions
        .filter(def => def.group === selectedGroup)
        .reduce((max, def) => Math.max(max, def.order), -1);

      console.log('Creating metafield with ID:', definitionId);

      await db.transact(
        db.tx.metafields[definitionId].update({
          title: newFieldData.title.trim(),
          type: newFieldData.type, // Use the actual field type
          group: selectedGroup,
          order: maxOrder + 1,
          filter: newFieldData.filter,
          config: newFieldData.config,
          value: newFieldData.value,
          storeId: currentStore.id,
          parentid: 'metafield-definitions'
        })
      );

      console.log('Metafield created successfully');

      setNewFieldData({
        title: '',
        type: 'text',
        group: '',
        filter: false,
        config: {},
        value: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding metafield:', error);
      Alert.alert('Error', `Failed to add metafield: ${error.message || 'Unknown error'}`);
    }
  };

  // Get all groups including those with only placeholders
  const getAllGroups = () => {
    const groups = [...new Set(definitions.map(def => def.group))];
    console.log('All groups (including placeholders):', groups);
    console.log('Current definitions:', definitions);
    return groups.sort();
  };

  // Get groups that have actual metafields (not just placeholders)
  const getGroups = () => {
    const groups = [...new Set(definitions
      .filter(def => def.title !== '__GROUP_PLACEHOLDER__')
      .map(def => def.group))];
    console.log('Groups with metafields:', groups);
    return groups.sort();
  };

  // Get groups for display (all groups, including empty ones)
  const getDisplayGroups = () => {
    const displayGroups = getAllGroups();
    console.log('Display groups:', displayGroups);
    return displayGroups;
  };

  // Get field type options
  const getFieldTypes = () => [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'weight', label: 'Weight' },
    { value: 'dimension', label: 'Dimension' },
    { value: 'volume', label: 'Volume' },
    { value: 'rating', label: 'Rating' },
    { value: 'color', label: 'Color' },
    { value: 'json', label: 'JSON' }
  ];

  const updateValue = async (fieldName: string, value: any) => {
    if (!productId || !currentStore?.id) return;

    try {
      // Find existing value or create new
      const existingField = valuesData?.metafields?.find(f => f && f.title === fieldName);

      if (existingField) {
        await db.transact(
          db.tx.metafields[existingField.id].update({ value: value.toString() })
        );
      } else {
        const valueId = id();
        await db.transact(
          db.tx.metafields[valueId].update({
            title: fieldName,
            value: value.toString(),
            storeId: currentStore.id,
            parentid: productId
          })
        );
      }

      setValues(prev => ({ ...prev, [fieldName]: value }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update metafield value');
    }
  };

  const renderMetafield = ({ item }: { item: MetafieldDefinition }) => {
    const currentValue = values[item.title] || item.value || '';

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F2F2F7',
        }}
        onPress={() => {
          // Handle edit value if productId exists
          if (productId) {
            setSelectedField(item);
            setShowValueModal(true);
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '400',
            color: '#1C1C1E',
            marginBottom: 2,
          }}>
            {item.title}
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#8E8E93',
          }}>
            {item.group} • {getFieldTypes().find(t => t.value === item.type)?.label || item.type}
            {item.filter && ' • Filterable'}
          </Text>
          {productId && currentValue && (
            <Text style={{
              fontSize: 13,
              color: '#007AFF',
              marginTop: 2,
            }}>
              Value: {currentValue.toString()}
            </Text>
          )}
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#C7C7CC"
        />
      </TouchableOpacity>
    );
  };

  // Show groups or fields based on selection
  const showingGroup = selectedGroup !== '';
  const currentGroupFields = showingGroup
    ? definitions
        .filter(def => def.group === selectedGroup && def.title !== '__GROUP_PLACEHOLDER__')
        .sort((a, b) => a.order - b.order)
    : [];

  const renderGroupItem = ({ item }: { item: string }) => {
    const fieldCount = definitions.filter(def => def.group === item && def.title !== '__GROUP_PLACEHOLDER__').length;

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F2F2F7',
        }}
        onPress={() => setSelectedGroup(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '400',
            color: '#1C1C1E',
            marginBottom: 2,
          }}>
            {item}
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#8E8E93',
          }}>
            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#C7C7CC"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity onPress={showingGroup ? () => setSelectedGroup('') : onClose}>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#1C1C1E',
          }}>
            {showingGroup ? selectedGroup : 'Metafields'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          if (showingGroup) {
            // Add metafield to current group
            setShowAddModal(true);
          } else {
            // Add new group
            setShowAddGroupModal(true);
          }
        }}>
          <Feather name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {showingGroup ? (
        // Show fields in selected group
        <FlatList
          data={currentGroupFields}
          keyExtractor={(item) => item.id}
          renderItem={renderMetafield}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 100,
            }}>
              <Text style={{
                fontSize: 17,
                color: '#8E8E93',
                textAlign: 'center',
              }}>
                No fields in {selectedGroup}
              </Text>
              <Text style={{
                fontSize: 15,
                color: '#8E8E93',
                textAlign: 'center',
                marginTop: 8,
              }}>
                Tap + to add a field to this group
              </Text>
            </View>
          }
        />
      ) : (
        // Show groups
        <FlatList
          data={getDisplayGroups()}
          keyExtractor={(item) => item}
          renderItem={renderGroupItem}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 100,
            }}>
              <Text style={{
                fontSize: 17,
                color: '#8E8E93',
                textAlign: 'center',
              }}>
                No metafields yet
              </Text>
              <Text style={{
                fontSize: 15,
                color: '#8E8E93',
                textAlign: 'center',
                marginTop: 8,
              }}>
                Tap + to create your first metafield
              </Text>
            </View>
          }

        />
      )}
      {/* Add Group Modal */}
      <Modal
        visible={showAddGroupModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAddGroupModal(false)}
      >
        <AddGroupScreen
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          onSave={addGroup}
          onClose={() => setShowAddGroupModal(false)}
        />
      </Modal>

      {/* Add Metafield Full Screen Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddMetafieldScreen
          newFieldData={newFieldData}
          setNewFieldData={setNewFieldData}
          onSave={addDefinition}
          onClose={() => setShowAddModal(false)}
          getFieldTypes={getFieldTypes}
          groupName={selectedGroup}
        />
      </Modal>

      {/* Edit Value Full Screen Modal */}
      <Modal
        visible={showValueModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowValueModal(false)}
      >
        {selectedField && (
          <EditValueScreen
            field={selectedField}
            currentValue={values[selectedField.title] || selectedField.value || ''}
            onSave={(value) => updateValue(selectedField.title, value)}
            onClose={() => setShowValueModal(false)}
            getFieldTypes={getFieldTypes}
          />
        )}
      </Modal>
    </View>
  );
}

// Add Group Screen Component
function AddGroupScreen({ newGroupName, setNewGroupName, onSave, onClose }: {
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{
            fontSize: 17,
            fontWeight: '400',
            color: '#007AFF',
          }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        }}>
          Add Group
        </Text>

        <TouchableOpacity
          onPress={onSave}
          disabled={!newGroupName.trim()}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: !newGroupName.trim() ? '#C7C7CC' : '#007AFF',
          }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Group Name
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
          }}
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="Enter group name (e.g., Specifications, Dimensions)"
          autoFocus
        />
      </View>
    </View>
  );
}

// Add Metafield Screen Component
function AddMetafieldScreen({ newFieldData, setNewFieldData, onSave, onClose, getFieldTypes, groupName }: {
  newFieldData: any;
  setNewFieldData: (data: any) => void;
  onSave: () => void;
  onClose: () => void;
  getFieldTypes: () => any[];
  groupName: string;
}) {
  const insets = useSafeAreaInsets();

  // Predefined groups to avoid typing errors
  const predefinedGroups = [
    'General',
    'Specifications',
    'Dimensions',
    'Materials',
    'Care Instructions',
    'Shipping',
    'SEO',
    'Custom'
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{
            fontSize: 17,
            fontWeight: '400',
            color: '#007AFF',
          }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        }}>
          Add Metafield
        </Text>

        <TouchableOpacity
          onPress={onSave}
          disabled={!newFieldData.title.trim()}
        >
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: !newFieldData.title.trim() ? '#C7C7CC' : '#007AFF',
          }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Field Title */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Title
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            marginBottom: 20,
          }}
          value={newFieldData.title}
          onChangeText={(value) => setNewFieldData(prev => ({ ...prev, title: value }))}
          placeholder="Field title"
        />

        {/* Group Display */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Group
        </Text>
        <View style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 20,
          backgroundColor: '#F9FAFB',
        }}>
          <Text style={{
            fontSize: 16,
            color: '#6B7280',
          }}>
            {groupName}
          </Text>
        </View>

        {/* Type Selector */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Type
        </Text>
        <View style={{ marginBottom: 20 }}>
          {getFieldTypes().map((type) => (
            <TouchableOpacity
              key={type.value}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: 'white',
                borderBottomWidth: 1,
                borderBottomColor: '#F2F2F7',
              }}
              onPress={() => setNewFieldData(prev => ({ ...prev, type: type.value }))}
            >
              <Text style={{
                fontSize: 16,
                color: '#1C1C1E',
              }}>
                {type.label}
              </Text>
              {newFieldData.type === type.value && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Filterable Toggle */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#F2F2F7',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#1C1C1E' }}>
            Filterable
          </Text>
          <Switch
            value={newFieldData.filter}
            onValueChange={(value) => setNewFieldData(prev => ({ ...prev, filter: value }))}
            trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
            thumbColor={newFieldData.filter ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Default Value */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Default Value (Optional)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            marginBottom: 20,
          }}
          value={newFieldData.value}
          onChangeText={(value) => setNewFieldData(prev => ({ ...prev, value }))}
          placeholder="Default value"
        />
      </ScrollView>
    </View>
  );
}

// Edit Value Screen Component
function EditValueScreen({ field, currentValue, onSave, onClose, getFieldTypes }: {
  field: MetafieldDefinition;
  currentValue: string;
  onSave: (value: any) => void;
  onClose: () => void;
  getFieldTypes: () => any[];
}) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const renderInput = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#F2F2F7',
          }}>
            <Text style={{ fontSize: 16, color: '#1C1C1E' }}>
              Value
            </Text>
            <Switch
              value={value === 'true' || value === 'True'}
              onValueChange={(val) => setValue(val.toString())}
              trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
              thumbColor={value === 'true' ? '#fff' : '#f4f3f4'}
            />
          </View>
        );
      case 'number':
      case 'weight':
      case 'dimension':
      case 'volume':
      case 'rating':
        return (
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              marginBottom: 20,
            }}
            value={value.toString()}
            onChangeText={setValue}
            placeholder={field.config?.placeholder || `Enter ${field.type} value`}
            keyboardType="numeric"
          />
        );
      default:
        return (
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              marginBottom: 20,
            }}
            value={value.toString()}
            onChangeText={setValue}
            placeholder={field.config?.placeholder || `Enter ${field.type} value`}
            keyboardType={field.type === 'email' ? 'email-address' : field.type === 'url' ? 'url' : 'default'}
            multiline={field.type === 'json'}
            numberOfLines={field.type === 'json' ? 4 : 1}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{
            fontSize: 17,
            fontWeight: '400',
            color: '#007AFF',
          }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        }}>
          {field.title}
        </Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#007AFF',
          }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Value
        </Text>
        {renderInput()}

        {field.config?.unit && (
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            marginTop: 8,
          }}>
            Unit: {field.config.unit}
          </Text>
        )}

        <Text style={{
          fontSize: 14,
          color: '#8E8E93',
          marginTop: 16,
        }}>
          Type: {getFieldTypes().find(t => t.value === field.type)?.label || field.type}
        </Text>

        <Text style={{
          fontSize: 14,
          color: '#8E8E93',
          marginTop: 4,
        }}>
          Group: {field.group}
        </Text>
      </ScrollView>
    </View>
  );
}
