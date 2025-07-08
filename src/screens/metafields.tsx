import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StatusBar, BackHandler } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';
import { useStore } from '../lib/store-context';

interface MetafieldSet {
  id: string;
  name: string;
  valueCount: number;
}

interface MetafieldsScreenProps {
  onNavigateToSet: (setId: string, setName: string) => void;
  onClose: () => void;
  onAddSet: () => void;
}

export default function MetafieldsScreen({ onNavigateToSet, onClose, onAddSet }: MetafieldsScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onClose]);

  // Query metafields from database
  const { isLoading, error, data } = db.useQuery(
    currentStore?.id ? {
      metafields: {
        $: {
          where: {
            storeId: currentStore.id
          }
        }
      }
    } : null
  );

  // Process the real-time data into metafield sets
  const metafieldSets: MetafieldSet[] = React.useMemo(() => {
    // Only process data if we have it and it's not loading
    if (isLoading || !data?.metafields) return [];

    // Group metafields by their 'group' field and count values
    const setMap = new Map<string, { id: string; name: string; count: number }>();

    data.metafields.forEach(metafield => {
      if (metafield.group) {
        const existing = setMap.get(metafield.group);
        if (existing) {
          existing.count++;
        } else {
          setMap.set(metafield.group, {
            id: metafield.group,
            name: metafield.group,
            count: 1
          });
        }
      }
    });

    const sets: MetafieldSet[] = Array.from(setMap.values()).map(set => ({
      id: set.id,
      name: set.name,
      valueCount: set.count
    }));

    return sets;
  }, [data?.metafields, isLoading]);

  const renderMetafieldSet = ({ item }: { item: MetafieldSet }) => (
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
          {item.valueCount} {item.valueCount === 1 ? 'field' : 'fields'}
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
    <View style={{
      flex: 1,
      backgroundColor: '#F2F2F7',
      paddingTop: insets.top,
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F2F2F7',
      }}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        }}>
          Metafields
        </Text>
        
        <TouchableOpacity onPress={onAddSet}>
          <Feather name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#8E8E93', fontSize: 16 }}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FF3B30', fontSize: 16 }}>Error loading metafields</Text>
        </View>
      ) : metafieldSets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <MaterialCommunityIcons name="tag-outline" size={64} color="#C7C7CC" />
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#1C1C1E',
            marginTop: 16,
            textAlign: 'center',
          }}>
            No Metafield Sets
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#8E8E93',
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            Create metafield sets to add custom fields to your products
          </Text>
          <TouchableOpacity
            onPress={onAddSet}
            style={{
              backgroundColor: '#007AFF',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 24,
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Create Metafield Set
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={metafieldSets}
          keyExtractor={(item) => item.id}
          renderItem={renderMetafieldSet}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
