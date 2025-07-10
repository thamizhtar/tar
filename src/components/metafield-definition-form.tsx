import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, StatusBar, BackHandler } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetafieldSet, MetafieldEntityType } from './metafields-system';

// Metafield types (matching Shopify)
const METAFIELD_TYPES = [
  { value: 'single_line_text', label: 'Single line text', description: 'Short text up to 255 characters' },
  { value: 'multi_line_text', label: 'Multi-line text', description: 'Long text up to 65,535 characters' },
  { value: 'rich_text', label: 'Rich text', description: 'Formatted text with HTML' },
  { value: 'number', label: 'Number', description: 'Integer or decimal number' },
  { value: 'boolean', label: 'Boolean', description: 'True or false value' },
  { value: 'date', label: 'Date', description: 'Date value' },
  { value: 'date_time', label: 'Date and time', description: 'Date and time value' },
  { value: 'url', label: 'URL', description: 'Web address' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'color', label: 'Color', description: 'Color value' },
  { value: 'weight', label: 'Weight', description: 'Weight measurement' },
  { value: 'dimension', label: 'Dimension', description: 'Length, width, or height' },
  { value: 'volume', label: 'Volume', description: 'Volume measurement' },
  { value: 'rating', label: 'Rating', description: 'Rating scale (1-5)' },
  { value: 'json', label: 'JSON', description: 'Structured data in JSON format' },
  { value: 'file_reference', label: 'File', description: 'File upload' },
  { value: 'product_reference', label: 'Product reference', description: 'Reference to a product' },
  { value: 'variant_reference', label: 'Variant reference', description: 'Reference to a product variant' },
  { value: 'page_reference', label: 'Page reference', description: 'Reference to a page' },
  { value: 'list.single_line_text', label: 'List of single line text', description: 'List of text values' },
  { value: 'list.color', label: 'List of colors', description: 'List of color values' },
] as const;



interface MetafieldDefinitionFormProps {
  entityType: MetafieldEntityType;
  groupName?: string;
  definition?: MetafieldSet | null;
  onSave: (definition: Partial<MetafieldSet>) => void;
  onClose: () => void;
}

export default function MetafieldDefinitionForm({
  entityType,
  groupName,
  definition,
  onSave,
  onClose
}: MetafieldDefinitionFormProps) {
  const insets = useSafeAreaInsets();
  const isEditing = !!definition;

  const [formData, setFormData] = useState({
    name: definition?.name || '',
    type: definition?.type || 'single_line_text',
    description: definition?.description || '',
    required: definition?.required || false,
    inputConfig: definition?.inputConfig || {},
  });

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onClose]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      type: formData.type as any,
      description: formData.description,
      required: formData.required,
      inputConfig: formData.inputConfig,
    });
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSave = formData.name.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1C1C1E',
          flex: 1,
        }}>
          {isEditing ? 'Edit Definition' : 'Add Definition'}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: canSave ? '#007AFF' : '#E5E5EA',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={canSave ? '#fff' : '#C7C7CC'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Title */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Name
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
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
          placeholder="Enter metafield name"
          autoFocus={!isEditing}
        />

        {/* Description */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Description (Optional)
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
            minHeight: 80,
          }}
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          placeholder="Describe what this metafield is for"
          multiline
          textAlignVertical="top"
        />



        {/* Type Selector */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1C1C1E' }}>
          Content type
        </Text>
        <View style={{ marginBottom: 20 }}>
          {METAFIELD_TYPES.map((type) => (
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
              onPress={() => updateFormData('type', type.value)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  color: '#1C1C1E',
                  marginBottom: 2,
                }}>
                  {type.label}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#8E8E93',
                }}>
                  {type.description}
                </Text>
              </View>
              {formData.type === type.value && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Options */}
        <View style={{ marginBottom: 20 }}>
          {/* Required Toggle */}
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
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1C1C1E', marginBottom: 2 }}>
                Required
              </Text>
              <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                This metafield must have a value
              </Text>
            </View>
            <Switch
              value={formData.required}
              onValueChange={(value) => updateFormData('required', value)}
              trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
              thumbColor={formData.required ? '#fff' : '#f4f3f4'}
            />
          </View>


        </View>


      </ScrollView>
    </View>
  );
}
