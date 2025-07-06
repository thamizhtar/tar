import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { r2Service } from '../../lib/r2-service';
import R2Image from '../ui/r2-image';

export interface MediaItem {
  url: string;
  key?: string;
  name?: string;
  type?: string;
}

interface MediaGalleryProps {
  media: MediaItem[];
  onRemove?: (index: number, item: MediaItem) => void;
  onReorder?: (media: MediaItem[]) => void;
  maxItems?: number;
  editable?: boolean;
  columns?: number;
  showUpload?: boolean;
  onUploadPress?: () => void;
  uploading?: boolean;
}

export default function MediaGallery({
  media,
  onRemove,
  onReorder,
  maxItems,
  editable = true,
  columns = 3,
  showUpload = false,
  onUploadPress,
  uploading = false,
}: MediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<{ item: MediaItem; index: number } | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Rotate animation for loading
  useEffect(() => {
    if (uploading) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [uploading, rotateAnim]);

  const handleItemPress = (item: MediaItem, index: number) => {
    if (!editable) return;
    setSelectedItem({ item, index });
    setShowDrawer(true);
  };

  const handleRemove = async () => {
    if (!selectedItem) return;

    const { item, index } = selectedItem;

    // Try to delete from R2 if we have the key
    if (item.key) {
      await r2Service.deleteFile(item.key);
    } else if (item.url) {
      // Extract key from URL
      const key = r2Service.extractKeyFromUrl(item.url);
      if (key) {
        await r2Service.deleteFile(key);
      }
    }

    onRemove?.(index, item);
    setShowDrawer(false);
    setSelectedItem(null);
  };

  const handleChange = () => {
    // TODO: Implement change functionality
    setShowDrawer(false);
    setSelectedItem(null);
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const isVideo = item.type?.startsWith('video/') || item.url.includes('.mp4');

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleItemPress(item, index)}
        activeOpacity={0.8}
      >
        <View className="aspect-square bg-gray-100 overflow-hidden">
          {isVideo ? (
            <View className="flex-1 items-center justify-center bg-gray-200">
              <MaterialIcons name="play-circle-outline" size={32} color="#6B7280" />
              <Text className="text-xs text-gray-500 mt-1">Video</Text>
            </View>
          ) : (
            <R2Image
              url={item.url}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderUploadTile = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <TouchableOpacity
        onPress={onUploadPress}
        className="aspect-square bg-gray-100 items-center justify-center"
        disabled={uploading}
      >
        {uploading ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: '#E5E7EB',
              borderTopColor: '#9CA3AF',
            }} />
          </Animated.View>
        ) : (
          <MaterialIcons name="add" size={32} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  const allItems = [...media];
  if (showUpload) {
    allItems.push({ url: 'upload', type: 'upload' } as MediaItem);
  }

  if (!media || (media.length === 0 && !showUpload)) {
    return (
      <View className="bg-gray-50 border border-gray-200 p-4 items-center">
        <MaterialIcons name="photo" size={24} color="#9CA3AF" />
        <Text className="text-gray-500 text-sm mt-1">No media uploaded</Text>
      </View>
    );
  }

  return (
    <View className="space-y-2">
      {maxItems && media.length > maxItems && (
        <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Text className="text-amber-800 text-sm">
            Showing {maxItems} of {media.length} media files
          </Text>
        </View>
      )}

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        className="max-h-96"
      >
        <View className="flex-row flex-wrap">
          {allItems.slice(0, maxItems ? maxItems + (showUpload ? 1 : 0) : undefined).map((item, index) => (
            <View key={index} className="w-1/3">
              {item.url === 'upload' ? renderUploadTile() : renderMediaItem(item, index)}
            </View>
          ))}
        </View>
      </ScrollView>
      
      {media.length > 0 && (
        <View className="pt-2">
          <Text className="text-sm text-gray-600">
            {media.length} media file{media.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Bottom Drawer Modal */}
      <Modal
        visible={showDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDrawer(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-medium text-gray-900">Media Options</Text>
            </View>

            <View className="p-4 space-y-4">
              <TouchableOpacity
                onPress={handleChange}
                className="flex-row items-center py-3"
              >
                <MaterialIcons name="edit" size={24} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3">Change</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemove}
                className="flex-row items-center py-3"
              >
                <MaterialIcons name="delete" size={24} color="#EF4444" />
                <Text className="text-base text-red-600 ml-3">Delete</Text>
              </TouchableOpacity>
            </View>

            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setShowDrawer(false)}
                className="py-3 items-center"
              >
                <Text className="text-base text-gray-600">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
