import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';
import { useStore } from '../lib/store-context';
import { id } from '@instantdb/react-native';

interface OptionValuesSelector {
  visible: boolean;
  optionSet: {
    id: string;
    name: string;
    values: any[];
  } | null;
  onClose: () => void;
  onGenerate: (selectedValues: any[], optionSetData: any) => void;
}

export default function OptionValuesSelector({ 
  visible, 
  optionSet, 
  onClose, 
  onGenerate 
}: OptionValuesSelector) {
  const { currentStore } = useStore();
  const insets = useSafeAreaInsets();
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Handle native back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Reset selection when option set changes
  useEffect(() => {
    if (optionSet) {
      setSelectedValues([]);
    }
  }, [optionSet]);

  // Query option values for the current option set
  const { data: optionValuesData } = db.useQuery(
    optionSet?.id && currentStore?.id ? {
      optionValues: {
        $: { where: { setId: optionSet.id, storeId: currentStore.id } }
      }
    } : {}
  );

  const optionValues = optionValuesData?.optionValues || [];

  const handleValueToggle = (valueId: string) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(id => id !== valueId);
      } else {
        return [...prev, valueId];
      }
    });
  };

  const handleGenerate = () => {
    if (selectedValues.length === 0) {
      Alert.alert('Error', 'Please select at least one option value');
      return;
    }

    const selectedValueObjects = optionValues.filter(value => 
      selectedValues.includes(value.id)
    );

    // Create option set data for storage in products.options
    const optionSetData = {
      id: optionSet?.id,
      name: optionSet?.name,
      values: selectedValueObjects.map(value => ({
        id: value.id,
        name: value.name,
        group: value.group,
        identifierType: value.identifierType,
        identifierValue: value.identifierValue,
        order: value.order
      }))
    };

    onGenerate(selectedValueObjects, optionSetData);
  };

  if (!visible || !optionSet) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 16,
          }}>
            {optionSet.name}
          </Text>

          <TouchableOpacity
            onPress={handleGenerate}
            style={{
              backgroundColor: selectedValues.length > 0 ? '#007AFF' : '#F3F4F6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
            disabled={selectedValues.length === 0}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: selectedValues.length > 0 ? '#fff' : '#9CA3AF',
            }}>
              Generate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {optionValues.length === 0 ? (
            <View style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
              paddingHorizontal: 20,
            }}>
              <MaterialIcons name="tune" size={48} color="#9CA3AF" />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#6B7280',
                marginTop: 16,
                textAlign: 'center'
              }}>
                No Option Values Found
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#9CA3AF',
                marginTop: 8,
                textAlign: 'center'
              }}>
                Add option values to this set first
              </Text>
            </View>
          ) : (
            optionValues
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((value: any) => {
                const isSelected = selectedValues.includes(value.id);
                
                return (
                  <TouchableOpacity
                    key={value.id}
                    style={{
                      backgroundColor: '#fff',
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3F4F6',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onPress={() => handleValueToggle(value.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '500', 
                        color: '#111827' 
                      }}>
                        {value.name}
                      </Text>
                      {value.group && (
                        <Text style={{ 
                          fontSize: 14, 
                          color: '#6B7280', 
                          marginTop: 2 
                        }}>
                          {value.group}
                        </Text>
                      )}
                    </View>
                    
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#007AFF' : '#D1D5DB',
                      backgroundColor: isSelected ? '#007AFF' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isSelected && (
                        <MaterialIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
