import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { updateOption } from '../lib/crud';

interface IdentifierDrawerProps {
  visible: boolean;
  optionId: string;
  currentIdentifier: string;
  onClose: () => void;
  onSave: (identifier: string) => void;
}

export default function IdentifierDrawer({ 
  visible, 
  optionId, 
  currentIdentifier, 
  onClose, 
  onSave 
}: IdentifierDrawerProps) {
  const [selectedType, setSelectedType] = useState<'image' | 'color' | 'label'>('label');
  const [tileLabel, setTileLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tileLabel.trim()) {
      Alert.alert('Error', 'Please enter a tile label');
      return;
    }

    try {
      setSaving(true);
      
      // Create identifier string based on type
      let identifier = '';
      switch (selectedType) {
        case 'image':
          identifier = `image:${tileLabel.trim()}`;
          break;
        case 'color':
          identifier = `color:${tileLabel.trim()}`;
          break;
        case 'label':
          identifier = `label:${tileLabel.trim()}`;
          break;
      }

      const result = await updateOption(optionId, { identifier });
      
      if (result.success) {
        onSave(identifier);
        onClose();
      } else {
        Alert.alert('Error', 'Failed to save identifier');
      }
    } catch (error) {
      console.error('Error saving identifier:', error);
      Alert.alert('Error', 'Failed to save identifier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={{
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            minHeight: 300,
          }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Close</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
              Edit Option
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#3B82F6',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>



          {/* Tile Label Input */}
          <TextInput
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#111827',
              marginBottom: 24,
            }}
            placeholder="Value"
            placeholderTextColor="#9CA3AF"
            value={tileLabel}
            onChangeText={setTileLabel}
          />

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
