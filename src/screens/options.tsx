import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StatusBar, BackHandler } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';
import { useStore } from '../lib/store-context';

interface OptionSet {
  id: string;
  name: string;
  valueCount: number;
}

interface OptionsScreenProps {
  onNavigateToSet: (setId: string, setName: string) => void;
  onClose: () => void;
  onAddSet: () => void;
}

export default function OptionsScreen({ onNavigateToSet, onClose, onAddSet }: OptionsScreenProps) {
  const { currentStore } = useStore();
  const insets = useSafeAreaInsets();

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

  // Use real-time subscription instead of manual loading
  const { data, isLoading, error } = db.useQuery(
    currentStore?.id ? {
      options: {
        $: { where: { storeId: currentStore.id } }
      }
    } : {}
  );

  // Process the real-time data into option sets
  const optionSets: OptionSet[] = React.useMemo(() => {
    // Only process data if we have it and it's not loading
    if (isLoading || !data?.options) return [];

    console.log('📊 Real-time options data:', data.options);

    // Group options by their 'set' field and count values
    const setMap = new Map<string, { id: string; name: string; count: number }>();

    data.options.forEach(option => {
      if (option.set) {
        const existing = setMap.get(option.set);
        if (existing) {
          existing.count++;
        } else {
          setMap.set(option.set, {
            id: option.set,
            name: option.set,
            count: 1
          });
        }
      }
    });

    const sets: OptionSet[] = Array.from(setMap.values()).map(set => ({
      id: set.id,
      name: set.name,
      valueCount: set.count
    }));

    console.log('📋 Processed option sets (real-time):', sets);
    return sets;
  }, [data?.options, isLoading]);



  const renderOptionSet = ({ item }: { item: OptionSet }) => (
    <TouchableOpacity
      onPress={() => onNavigateToSet(item.id, item.name)}
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
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 17,
          fontWeight: '400',
          color: '#1C1C1E',
          marginBottom: 2,
        }}>
          {item.name}
        </Text>
        <Text style={{
          fontSize: 13,
          color: '#8E8E93',
        }}>
          {item.valueCount} {item.valueCount === 1 ? 'value' : 'values'}
        </Text>
      </View>
      
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color="#C7C7CC" 
      />
    </TouchableOpacity>
  );

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
        <TouchableOpacity onPress={() => onClose()}>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#1C1C1E',
          }}>
            Options
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onAddSet}>
          <Feather name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Option Sets List */}
      <FlatList
        data={optionSets}
        renderItem={renderOptionSet}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 100,
          }}>
            {isLoading ? (
              <>
                <Text style={{
                  fontSize: 17,
                  color: '#8E8E93',
                  textAlign: 'center',
                }}>
                  Loading option sets...
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={{
                  fontSize: 17,
                  color: '#FF3B30',
                  textAlign: 'center',
                }}>
                  Error loading option sets
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginTop: 8,
                }}>
                  Please try again
                </Text>
              </>
            ) : (
              <>
                <Text style={{
                  fontSize: 17,
                  color: '#8E8E93',
                  textAlign: 'center',
                }}>
                  No option sets yet
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginTop: 8,
                }}>
                  Tap + to create your first option set
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}
