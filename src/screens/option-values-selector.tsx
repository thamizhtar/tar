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
  onGenerate: (selectedValues: any[], optionSetData: any) => Promise<void>;
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
  const [activeGroup, setActiveGroup] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

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
      setActiveGroup('');
    }
  }, [optionSet]);

  // Auto-hide notification
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Query option values for the current option set
  const { data: optionValuesData } = db.useQuery(
    optionSet?.id && currentStore?.id ? {
      optionValues: {
        $: { where: { setId: optionSet.id, storeId: currentStore.id } }
      }
    } : {}
  );

  const optionValues = optionValuesData?.optionValues || [];

  // Group values by their group field
  const groupedValues = React.useMemo(() => {
    const groups = new Map<string, any[]>();
    optionValues.forEach((value: any) => {
      const group = value.group || 'Group 1';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(value);
    });
    return groups;
  }, [optionValues]);

  // Set initial active group
  useEffect(() => {
    if (groupedValues.size > 0 && !activeGroup) {
      setActiveGroup(Array.from(groupedValues.keys())[0]);
    }
  }, [groupedValues, activeGroup]);

  const handleValueToggle = (valueId: string) => {
    setSelectedValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(id => id !== valueId);
      } else {
        return [...prev, valueId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedValues.length === optionValues.length) {
      // Deselect all
      setSelectedValues([]);
    } else {
      // Select all
      setSelectedValues(optionValues.map(value => value.id));
    }
  };

  const handleGenerate = async () => {
    if (selectedValues.length === 0) {
      setNotificationMessage('Please select at least one option value');
      setShowNotification(true);
      return;
    }

    try {
      // Show progress notification
      setNotificationMessage('Generating items...');
      setShowNotification(true);

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

      await onGenerate(selectedValueObjects, optionSetData);

      // Show success notification
      const combinations = selectedValueObjects.length; // This is simplified, actual combinations would be calculated
      setNotificationMessage(`Generated ${combinations} item variants successfully`);

      // Auto-close after showing success
      setTimeout(() => {
        setShowNotification(false);
        onClose();
      }, 2000);

    } catch (error) {
      setNotificationMessage('Failed to generate items. Please try again.');
      setShowNotification(true);
    }
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
        {/* Notification Bar */}
        {showNotification && (
          <View style={{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            backgroundColor: '#111827',
            paddingVertical: 12,
            paddingHorizontal: 20,
            zIndex: 1000,
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
            }}>
              {notificationMessage}
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            textAlign: 'left',
            flex: 1,
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
        <View style={{ flex: 1 }}>
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
            <>
              {/* Select All Card */}
              <TouchableOpacity
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
                onPress={handleSelectAll}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {selectedValues.length === optionValues.length ? 'Deselect All' : 'Select All'}
                </Text>

                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedValues.length === optionValues.length ? '#007AFF' : '#D1D5DB',
                  backgroundColor: selectedValues.length === optionValues.length ? '#007AFF' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {selectedValues.length === optionValues.length && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Group Tabs */}
              {groupedValues.size > 1 && (
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#F9FAFB',
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}>
                  {Array.from(groupedValues.keys()).map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: activeGroup === group ? '#fff' : 'transparent',
                        borderBottomWidth: activeGroup === group ? 2 : 0,
                        borderBottomColor: '#007AFF',
                      }}
                      onPress={() => setActiveGroup(group)}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: activeGroup === group ? '#007AFF' : '#6B7280',
                        textAlign: 'center',
                      }}>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Values List */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {(groupedValues.get(activeGroup) || [])
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
                          <Text style={{
                            fontSize: 14,
                            color: '#6B7280',
                            marginTop: 2
                          }}>
                            {value.group}
                          </Text>
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
                  })}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
