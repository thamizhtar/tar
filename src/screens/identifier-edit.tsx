import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StatusBar, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IdentifierEditScreenProps {
  currentType: 'text' | 'color' | 'image';
  currentValue: string;
  onClose: () => void;
  onSave: (type: 'text' | 'color' | 'image', value: string) => void;
}

export default function IdentifierEditScreen({ 
  currentType, 
  currentValue, 
  onClose, 
  onSave 
}: IdentifierEditScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'text' | 'color' | 'image'>(currentType);
  const [value, setValue] = useState(currentValue);

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

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(selectedType, value.trim());
  };

  const renderTypeButton = (type: 'text' | 'color' | 'image', icon: string, label: string) => {
    const isSelected = selectedType === type;
    return (
      <TouchableOpacity
        onPress={() => setSelectedType(type)}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          backgroundColor: isSelected ? '#007AFF' : 'white',
          borderWidth: 1,
          borderColor: isSelected ? '#007AFF' : '#E5E5EA',
          borderRadius: 8,
          marginHorizontal: 4,
        }}
      >
        <MaterialIcons 
          name={icon as any} 
          size={24} 
          color={isSelected ? 'white' : '#8E8E93'} 
        />
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: isSelected ? 'white' : '#8E8E93',
          marginTop: 4,
        }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPreview = () => {
    if (!value.trim()) return null;

    return (
      <View style={{
        alignItems: 'center',
        marginVertical: 24,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1C1C1E',
          marginBottom: 12,
        }}>
          Preview
        </Text>
        
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selectedType === 'color' ? (value.trim() || '#E5E5EA') : '#E5E5EA',
          borderWidth: selectedType === 'color' ? 0 : 1,
          borderColor: '#C6C6C8',
        }}>
          {selectedType === 'text' && (
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '600', 
              color: '#1C1C1E' 
            }}>
              {value.trim().substring(0, 2).toUpperCase()}
            </Text>
          )}
          {selectedType === 'image' && (
            <MaterialIcons name="image" size={32} color="#8E8E93" />
          )}
          {selectedType === 'color' && !value.trim() && (
            <MaterialIcons name="palette" size={32} color="#8E8E93" />
          )}
        </View>
      </View>
    );
  };

  const renderColorPresets = () => {
    if (selectedType !== 'color') return null;

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

    return (
      <View style={{ marginTop: 16 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#8E8E93',
          marginBottom: 8,
        }}>
          Quick Colors
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setValue(color)}
              style={{
                width: 32,
                height: 32,
                backgroundColor: color,
                borderRadius: 6,
                borderWidth: value === color ? 2 : 1,
                borderColor: value === color ? '#007AFF' : '#E5E5EA',
              }}
            />
          ))}
        </View>
      </View>
    );
  };

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
            Edit Identifier
          </Text>
          
          <TouchableOpacity
            onPress={handleSave}
            disabled={!value.trim()}
          >
            <Text style={{
              fontSize: 17,
              color: !value.trim() ? '#C7C7CC' : '#007AFF',
              fontWeight: '600',
            }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        {/* Type Selection */}
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1C1C1E',
          marginBottom: 12,
        }}>
          Identifier Type
        </Text>
        
        <View style={{
          flexDirection: 'row',
          marginBottom: 24,
          marginHorizontal: -4,
        }}>
          {renderTypeButton('text', 'text-fields', 'Text')}
          {renderTypeButton('color', 'palette', 'Color')}
          {renderTypeButton('image', 'image', 'Image')}
        </View>

        {/* Value Input */}
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1C1C1E',
          marginBottom: 12,
        }}>
          {selectedType === 'text' ? 'Text Value' : 
           selectedType === 'color' ? 'Color Value' : 'Image URL'}
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
          }}
          placeholder={
            selectedType === 'text' ? 'Enter text (e.g., XL, Red)' :
            selectedType === 'color' ? 'Enter color (e.g., #FF0000, red)' :
            'Enter image URL'
          }
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={setValue}
          autoCapitalize={selectedType === 'text' ? 'characters' : 'none'}
          autoCorrect={false}
        />

        {/* Color Presets */}
        {renderColorPresets()}

        {/* Preview */}
        {renderPreview()}
      </View>
    </View>
  );
}
