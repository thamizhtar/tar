import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, BackHandler, Modal, Animated, ScrollView, Keyboard, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { id } from '@instantdb/react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


import Input from './ui/Input';
import QuantitySelector from './ui/qty';

import R2Image from './ui/r2-image';
import { db, getCurrentTimestamp } from '../lib/instant';
import { MediaManager, MediaItem } from './media';
import { useStore } from '../lib/store-context';

// Simple replacement components for removed vtabs
const TabContent = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <View style={{ flex: 1, padding: 16 }}>
    {children}
  </View>
);

const FieldGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
      {title}
    </Text>
    <View style={{ gap: 12 }}>
      {children}
    </View>
  </View>
);

import TypeSelect from './type-select';
import CategorySelect from './category-select';
import { r2Service } from '../lib/r2-service';
import VendorSelect from './vendor-select';
import BrandSelect from './brand-select';
import CollectionSelect from './collection-select';
import { log, trackError, PerformanceMonitor } from '../lib/logger';
import ErrorBoundary from './ui/error-boundary';

interface ProductFormScreenProps {
  product?: any;
  onClose: () => void;
  onSave?: () => void;
}

export default function ProductFormScreen({ product, onClose, onSave }: ProductFormScreenProps) {
  const { currentStore } = useStore();
  const insets = useSafeAreaInsets();
  const isEditing = !!product;

  // Query product with collection relationship using useQuery
  const { data: productWithCollection } = db.useQuery(
    product?.id ? {
      products: {
        $: {
          where: {
            id: product.id
          }
        },
        collection: {}
      }
    } : null
  );

  const productCollection = productWithCollection?.products?.[0]?.collection;

  // Query option sets for the current store
  const { data: optionSetsData } = db.useQuery(
    currentStore?.id ? {
      options: {
        $: { where: { storeId: currentStore.id } }
      }
    } : {}
  );

  // Query items for the current product
  const { data: productItemsData } = db.useQuery(
    product?.id ? {
      items: {
        $: { where: { productId: product.id } }
      }
    } : {}
  );

  const [formData, setFormData] = useState({
    // Use title as primary field (schema uses title, not name)
    title: product?.title || '',
    image: product?.image || '',
    medias: product?.medias || [],
    excerpt: product?.excerpt || '',
    notes: product?.notes || '',
    type: product?.type || '',
    category: product?.category || '',
    unit: product?.unit || '',
    sku: product?.sku || '',
    price: product?.price?.toString() || '',
    saleprice: product?.saleprice?.toString() || '',
    vendor: product?.vendor || '',
    brand: product?.brand || '',

    options: product?.options || null,
    modifiers: product?.modifiers || null,
    metafields: product?.metafields || null,
    saleinfo: product?.saleinfo || null,
    stores: product?.stores || null,
    pos: product?.pos ?? false,
    website: product?.website ?? false,
    seo: product?.seo || null,
    tags: product?.tags || '',
    cost: product?.cost?.toString() || '',
    qrcode: product?.qrcode || '',
    stock: product?.stock || 0,
    publishAt: product?.publishAt || null,
    promoinfo: product?.promoinfo || null,
    featured: product?.featured ?? false,
    relproducts: product?.relproducts || null,
    sellproducts: product?.sellproducts || null,
    storeId: product?.storeId || currentStore?.id || '', // Use current store ID
    status: product?.status ?? true, // true = Active, false = Draft
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('core');
  const [imageError, setImageError] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showVendorSelect, setShowVendorSelect] = useState(false);
  const [showBrandSelect, setShowBrandSelect] = useState(false);
  const [showCollectionSelect, setShowCollectionSelect] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(productCollection?.id || null);
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | null>(productCollection?.name || null);
  const [showLabelSkuDrawer, setShowLabelSkuDrawer] = useState(false);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [primaryImageUploading, setPrimaryImageUploading] = useState(false);
  const [mediasUploading, setMediasUploading] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [selectedOptionSet, setSelectedOptionSet] = useState<string | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<string[]>([]);

  const [showFullScreenImageDrawer, setShowFullScreenImageDrawer] = useState(false);
  const [showFullScreenNotesEditor, setShowFullScreenNotesEditor] = useState(false);
  const [showOptionSetSelector, setShowOptionSetSelector] = useState(false);
  const [selectedOptionSets, setSelectedOptionSets] = useState<string[]>([]);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showPrimaryImageActions, setShowPrimaryImageActions] = useState(false);

  // Items search and filter states
  const [itemsSearchQuery, setItemsSearchQuery] = useState('');
  const [showItemsFilter, setShowItemsFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);





  // Rotation animation for loading
  useEffect(() => {
    if (primaryImageUploading) {
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
  }, [primaryImageUploading, rotateAnim]);

  // Update selectedCollectionId when productCollection changes
  useEffect(() => {
    setSelectedCollectionId(productCollection?.id || null);
    setSelectedCollectionName(productCollection?.name || null);
  }, [productCollection?.id, productCollection?.name]);

  // Initialize selected options from product data
  useEffect(() => {
    if (product?.options) {
      // Assuming options is stored as { optionSet: string, selectedValues: string[] }
      setSelectedOptionSet(product.options.optionSet || null);
      setSelectedOptionValues(product.options.selectedValues || []);
    }
  }, [product?.options]);

  // Update options in form data when selection changes
  useEffect(() => {
    updateOptions();
  }, [selectedOptionSet, selectedOptionValues]);

  // Track collection changes for hasChanges detection
  useEffect(() => {
    if (isEditing && productCollection) {
      // If we're editing and the selected collection differs from the original
      if (selectedCollectionId !== productCollection?.id) {
        setHasChanges(true);
      }
    }
    // For new products, don't automatically set hasChanges just because a collection is selected
    // Only set hasChanges when user actually makes changes via updateField
  }, [selectedCollectionId, productCollection?.id, isEditing]);



  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        setShowUnsavedChangesModal(true);
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [hasChanges, onClose]);

  // Function to check if there are actual changes
  const checkForChanges = (newFormData: any) => {
    if (!product) {
      // For new products, check if any meaningful fields have been filled
      const hasContent = newFormData.title.trim() ||
                        newFormData.image ||
                        newFormData.excerpt.trim() ||
                        newFormData.notes.trim() ||
                        newFormData.type.trim() ||
                        newFormData.category.trim() ||
                        newFormData.price.trim() ||
                        newFormData.sku.trim();
      return !!hasContent;
    }

    // For existing products, compare with original values
    const originalData = {
      title: product.title || '',
      image: product.image || '',
      excerpt: product.excerpt || '',
      notes: product.notes || '',
      type: product.type || '',
      category: product.category || '',
      unit: product.unit || '',
      sku: product.sku || '',
      price: product.price?.toString() || '',
      saleprice: product.saleprice?.toString() || '',
      vendor: product.vendor || '',
      brand: product.brand || '',
      cost: product.cost?.toString() || '',
      tags: product.tags || '',
      pos: product.pos ?? false,
      website: product.website ?? false,
      status: product.status ?? true,
    };

    // Check if any field has changed
    return Object.keys(originalData).some(key => {
      const original = originalData[key as keyof typeof originalData];
      const current = newFormData[key];
      return original !== current;
    });
  };

  const updateField = (field: string, value: any) => {
    if (field === 'image') {
      setImageError(false); // Reset image error when image URL changes
    }

    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Only set hasChanges if there are actual changes
    setHasChanges(checkForChanges(newFormData));
  };

  const updateOptions = () => {
    const optionsData = selectedOptionSet ? {
      optionSet: selectedOptionSet,
      selectedValues: selectedOptionValues
    } : null;
    updateField('options', optionsData);
  };

  const handleMediaChange = useCallback((media: MediaItem[]) => {
    setImageError(false); // Reset image error when media changes
    const newFormData = { ...formData, medias: media };
    setFormData(newFormData);

    // Only set hasChanges if there are actual changes
    setHasChanges(checkForChanges(newFormData));
  }, [formData, product]);

  const generateItemsFromOptionSets = async (optionSetNames: string[]) => {
    if (!product?.id || !currentStore?.id) {
      Alert.alert('Error', 'Product must be saved before generating items');
      return;
    }

    if (optionSetNames.length === 0) {
      Alert.alert('Error', 'Please select at least one option set');
      return;
    }

    try {
      // First, delete all existing items for this product
      const existingItems = productItemsData?.items || [];
      if (existingItems.length > 0) {
        const deletePromises = existingItems.map((item: any) =>
          db.transact(db.tx.items[item.id].delete())
        );
        await Promise.all(deletePromises);
      }

      // Get options for each selected set and group by their group field
      const optionArrays: any[][] = [];

      for (const setName of optionSetNames.slice(0, 3)) { // Limit to 3 option sets (option1, option2, option3)
        const setOptions = optionSetsData?.options?.filter(
          (option: any) => option.set === setName
        ) || [];

        if (setOptions.length > 0) {
          // Group options by their group field (Color, Size, etc.)
          const groupMap = new Map<string, any[]>();

          setOptions.forEach((option: any) => {
            const group = option.group || 'default';
            if (!groupMap.has(group)) {
              groupMap.set(group, []);
            }
            groupMap.get(group)!.push(option);
          });

          // Sort groups and add each group as a separate dimension
          const sortedGroups = Array.from(groupMap.keys()).sort();
          sortedGroups.forEach(groupName => {
            const groupOptions = groupMap.get(groupName)!;
            optionArrays.push(groupOptions.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          });
        }
      }

      if (optionArrays.length === 0) {
        Alert.alert('Error', 'No option values found for selected sets');
        return;
      }

      // Generate all possible combinations
      const generateCombinations = (arrays: any[][]): any[][] => {
        if (arrays.length === 0) return [[]];
        if (arrays.length === 1) return arrays[0].map(item => [item]);

        const result: any[][] = [];
        const firstArray = arrays[0];
        const restCombinations = generateCombinations(arrays.slice(1));

        firstArray.forEach(firstItem => {
          restCombinations.forEach(restCombination => {
            result.push([firstItem, ...restCombination]);
          });
        });

        return result;
      };

      const combinations = generateCombinations(optionArrays);

      // Generate items for each combination
      const itemPromises = combinations.map(async (combination: any[], index: number) => {
        const itemId = id();

        // Create SKU from combination values
        const skuParts = combination.map(option =>
          option.value?.toUpperCase().replace(/\s+/g, '-') || `OPT${index}`
        );
        const itemSku = `${formData.sku || 'ITEM'}-${skuParts.join('-')}`;

        // Create item data with up to 3 options
        const itemData: any = {
          productId: product.id,
          storeId: currentStore.id,
          sku: itemSku,
          price: formData.price || 0,
          saleprice: formData.saleprice || 0,
          cost: formData.cost || 0,
          available: 0,
          onhand: 0,
          committed: 0,
          unavailable: 0,
          reorderlevel: 0,
        };

        // Assign option values to option1, option2, option3
        if (combination[0]) itemData.option1 = combination[0].value;
        if (combination[1]) itemData.option2 = combination[1].value;
        if (combination[2]) itemData.option3 = combination[2].value;

        return db.transact(db.tx.items[itemId].update(itemData));
      });

      await Promise.all(itemPromises);

      const setNames = optionSetNames.join(', ');
      Alert.alert('Success', `Generated ${combinations.length} item variants from option sets: ${setNames}`);
      setShowOptionSetSelector(false);
      setSelectedOptionSets([]);

    } catch (error) {
      console.error('Failed to generate items:', error);
      Alert.alert('Error', 'Failed to generate items. Please try again.');
    }
  };

  const handlePrimaryImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPrimaryImageUploading(true);
        const asset = result.assets[0];

        try {
          const mediaFile = {
            uri: asset.uri,
            name: asset.fileName || `primary_image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: asset.fileSize,
          };

          const uploadResult = await r2Service.uploadFile(mediaFile, 'products');
          if (uploadResult.success && uploadResult.url) {
            updateField('image', uploadResult.url);
          } else {
            Alert.alert('Error', uploadResult.error || 'Failed to upload image. Please try again.');
          }
        } catch (error) {
          console.error('Failed to upload primary image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setPrimaryImageUploading(false);
        }
      }
    } catch (error) {
      console.error('Failed to pick primary image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleMediasUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images' as any,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setMediasUploading(true);

        try {
          const newMediaItems = [];
          for (const asset of result.assets) {
            const mediaFile = {
              uri: asset.uri,
              name: asset.fileName || `media_${Date.now()}.jpg`,
              type: 'image/jpeg',
              size: asset.fileSize,
            };

            const uploadResult = await r2Service.uploadFile(mediaFile, 'products');
            if (uploadResult.success && uploadResult.url) {
              newMediaItems.push({
                url: uploadResult.url,
                key: uploadResult.key,
                type: 'image/jpeg',
              });
            }
          }

          if (newMediaItems.length > 0) {
            const updatedMedias = [...(formData.medias || []), ...newMediaItems];
            updateField('medias', updatedMedias);
          }
        } catch (error) {
          console.error('Failed to upload medias:', error);
          Alert.alert('Error', 'Failed to upload images. Please try again.');
        } finally {
          setMediasUploading(false);
        }
      }
    } catch (error) {
      console.error('Failed to pick medias:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Product title is required');
      return;
    }

    if (!currentStore?.id) {
      Alert.alert('Error', 'Please select a store first');
      return;
    }

    setLoading(true);
    log.info(`Starting product save: ${isEditing ? 'edit' : 'create'}`, 'ProductForm', {
      productId: product?.id,
      title: formData.title
    });

    try {
      await PerformanceMonitor.measureAsync('product-save', async () => {
      const timestamp = getCurrentTimestamp();
      const productData: any = {
        // Required fields
        storeId: currentStore.id,
        updatedAt: timestamp,
        ...(isEditing ? {} : { createdAt: timestamp }),
      };

      // Add title (primary field in schema)
      productData.title = formData.title.trim();

      // Add optional fields if they have values
      if (formData.image) productData.image = formData.image;
      if (formData.medias && formData.medias.length > 0) productData.medias = formData.medias;
      if (formData.excerpt) productData.excerpt = formData.excerpt.trim();
      if (formData.notes && typeof formData.notes === 'string') productData.notes = formData.notes.trim();
      if (formData.type) productData.type = formData.type.trim();
      if (formData.category) productData.category = formData.category.trim();
      if (formData.unit) productData.unit = formData.unit.trim();
      if (formData.sku) productData.sku = formData.sku.trim();
      if (formData.price) productData.price = parseFloat(formData.price) || 0;
      if (formData.saleprice) productData.saleprice = parseFloat(formData.saleprice) || 0;
      if (formData.vendor) productData.vendor = formData.vendor.trim();
      if (formData.brand) productData.brand = formData.brand.trim();
      if (formData.options) productData.options = formData.options;
      if (formData.modifiers) productData.modifiers = formData.modifiers;
      if (formData.metafields) productData.metafields = formData.metafields;
      if (formData.saleinfo) productData.saleinfo = formData.saleinfo;
      if (formData.stores) productData.stores = formData.stores;

      // Boolean fields
      productData.pos = formData.pos;
      productData.website = formData.website;
      productData.featured = formData.featured;
      productData.status = formData.status;

      if (formData.seo) productData.seo = formData.seo;
      if (formData.tags) productData.tags = formData.tags.trim();
      if (formData.cost) productData.cost = parseFloat(formData.cost) || 0;
      if (formData.qrcode) productData.qrcode = formData.qrcode.trim();
      if (formData.stock !== undefined) productData.stock = formData.stock;
      if (formData.publishAt) productData.publishAt = formData.publishAt;
      if (formData.promoinfo) productData.promoinfo = formData.promoinfo;
      if (formData.relproducts) productData.relproducts = formData.relproducts;
      if (formData.sellproducts) productData.sellproducts = formData.sellproducts;

      let productId: string;

      if (isEditing) {
        productId = product.id;
        await db.transact(db.tx.products[product.id].update(productData));
      } else {
        productId = id();
        await db.transact(db.tx.products[productId].update(productData));
      }

      // Handle collection relationship
      if (selectedCollectionId) {
        await db.transact(db.tx.products[productId].link({ collection: selectedCollectionId }));
      } else if (isEditing && productCollection?.id) {
        // If editing and collection was removed, unlink it
        await db.transact(db.tx.products[productId].unlink({ collection: productCollection.id }));
      }

      log.info(`Product saved successfully: ${productId}`, 'ProductForm');
      onSave?.();
      onClose();
      }); // End performance monitoring
    } catch (error) {
      trackError(error as Error, 'ProductForm', {
        productId: product?.id,
        isEditing,
        formData: { title: formData.title }
      });
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Define tabs with their content
  const tabs = [
    {
      id: 'core',
      label: 'Core',
      icon: <Ionicons name="cube-outline" size={20} color="#6B7280" />,
      content: (
        <TabContent title="">
          {/* Main Container with Border around entire structure */}
          <View style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            backgroundColor: '#fff',
            borderRadius: 8,
            marginHorizontal: 0,
            marginVertical: 0,
            overflow: 'hidden',
          }}>
            {/* First Row: Image Upload and Label/SKU */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
              {/* Image Upload Tile - Square */}
              <TouchableOpacity
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#F9FAFB',
                  borderRightWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setShowFullScreenImageDrawer(true)}
              >
                {primaryImageUploading ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        }],
                      }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#E5E7EB',
                        borderTopColor: '#9CA3AF',
                      }} />
                    </Animated.View>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 4, textAlign: 'center' }}>
                      Uploading...
                    </Text>
                  </View>
                ) : formData.image && !imageError ? (
                  <R2Image
                    url={formData.image}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => {
                      setImageError(true);
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <MaterialIcons name="camera-alt" size={24} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4, textAlign: 'center' }}>
                      Upload
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Label/SKU Tile - Takes remaining space vertically */}
              <View style={{ flex: 1, height: 120 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    position: 'relative',
                  }}
                  onPress={() => setShowLabelSkuDrawer(true)}
                >
                  <Text style={{ fontSize: 48, fontWeight: '700', color: '#111827', position: 'absolute', top: 16, left: 16 }}>
                    P
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', position: 'absolute', bottom: 16, right: 16 }}>
                    SKU
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Product Title */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
              <TextInput
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: '#000',
                  paddingVertical: 12,
                  paddingHorizontal: 0,
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                }}
                value={formData.title}
                onChangeText={(value) => updateField('title', value)}
                placeholder="PRODUCT TITLE"
                placeholderTextColor="#999"
              />

              {/* Excerpt field */}
              <TextInput
                style={{
                  fontSize: 16,
                  color: '#6B7280',
                  paddingVertical: 8,
                  paddingHorizontal: 0,
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  marginTop: 4,
                  marginBottom: 16,
                }}
                value={formData.excerpt}
                onChangeText={(value) => updateField('excerpt', value)}
                placeholder="blurb"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            {/* Units and Price Display */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              paddingVertical: 24,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#fff'
            }}>
              <Text style={{ fontSize: 48, fontWeight: '700', color: '#111827' }}>
                {formData.stock || 0}
              </Text>
              <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 8 }}>
                {formData.unit || 'units'}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827' }}>
                {parseFloat(formData.saleprice || '0').toFixed(2)} $
              </Text>
            </View>

            {/* Notes and Options Row */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              {/* Notes Tile - Square */}
              <TouchableOpacity
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#fff',
                  borderRightWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setShowFullScreenNotesEditor(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>n</Text>
              </TouchableOpacity>

              {/* Options Tile - Rectangle taking remaining space */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 60,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
                onPress={() => setShowOptionSetSelector(true)}
              >
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827' }}>O</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Row: POS, Website, Status */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
            }}>
              {/* POS Tile - Square */}
              <TouchableOpacity
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: formData.pos ? '#F3F4F6' : '#fff',
                  borderRightWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => updateField('pos', !formData.pos)}
              >
                <MaterialIcons name="point-of-sale" size={24} color={formData.pos ? '#111827' : '#9CA3AF'} />
              </TouchableOpacity>

              {/* Website Tile - Square */}
              <TouchableOpacity
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: formData.website ? '#F3F4F6' : '#fff',
                  borderRightWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => updateField('website', !formData.website)}
              >
                <MaterialIcons name="language" size={24} color={formData.website ? '#111827' : '#9CA3AF'} />
              </TouchableOpacity>

              {/* Status Tile - Rectangle taking remaining space */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 60,
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
                onPress={() => setShowStatusDrawer(true)}
              >
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>
                  {formData.status ? 'Active' : 'Draft'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TabContent>
      ),
    },
    {
      id: 'metafields',
      label: 'Metafields',
      icon: <MaterialIcons name="numbers" size={20} color="#6B7280" />,
      content: (
        <TabContent title="">
          <View style={{ margin: -16, padding: 0 }}>
            <View style={{
              marginTop: 0,
              marginBottom: 0,
              paddingTop: 0,
              marginHorizontal: 0,
              borderTopWidth: 0
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderTopWidth: 0,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Metafields</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  Select metafields
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TabContent>
      ),
    },
    {
      id: 'categorization',
      label: 'Categorization',
      icon: <Ionicons name="folder-outline" size={20} color="#6B7280" />,
      content: (
        <TabContent title="">
          <View style={{ margin: -16, padding: 0 }}>
            <View style={{
              marginTop: 0,
              marginBottom: 0,
              paddingTop: 0,
              marginHorizontal: 0,
              borderTopWidth: 0
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderTopWidth: 0,
                }}
                onPress={() => setShowTypeSelect(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Type</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  {formData.type || 'Select type'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={() => setShowCategorySelect(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Category</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  {formData.category || 'Select category'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={() => setShowVendorSelect(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Vendor</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  {formData.vendor || 'Select vendor'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={() => setShowBrandSelect(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Brand</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  {formData.brand || 'Select brand'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={() => setShowCollectionSelect(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Collection</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  {selectedCollectionName || 'Select collection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TabContent>
      ),
    },
    {
      id: 'items',
      label: 'Items',
      icon: <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280' }}>I</Text>,
      content: (
        <TabContent title="">
          <View style={{ margin: -16, padding: 0 }}>
            {(() => {
              const items = productItemsData?.items || [];

              // Get all unique option values for filtering
              const allOptionValues = new Set<string>();
              items.forEach((item: any) => {
                if (item.option1) allOptionValues.add(item.option1);
                if (item.option2) allOptionValues.add(item.option2);
                if (item.option3) allOptionValues.add(item.option3);
              });
              const optionValuesList = Array.from(allOptionValues).sort();

              // Filter items based on search query and selected filters
              const filteredItems = items.filter((item: any) => {
                // Search filter
                const searchMatch = !itemsSearchQuery ||
                  (item.sku && item.sku.toLowerCase().includes(itemsSearchQuery.toLowerCase())) ||
                  (item.option1 && item.option1.toLowerCase().includes(itemsSearchQuery.toLowerCase())) ||
                  (item.option2 && item.option2.toLowerCase().includes(itemsSearchQuery.toLowerCase())) ||
                  (item.option3 && item.option3.toLowerCase().includes(itemsSearchQuery.toLowerCase()));

                // Option value filter
                const filterMatch = selectedFilters.length === 0 ||
                  selectedFilters.some(filter =>
                    item.option1 === filter ||
                    item.option2 === filter ||
                    item.option3 === filter
                  );

                return searchMatch && filterMatch;
              });

              if (items.length === 0) {
                return (
                  <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 20
                  }}>
                    <MaterialIcons name="inventory-2" size={48} color="#9CA3AF" />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#6B7280',
                      marginTop: 16,
                      textAlign: 'center'
                    }}>
                      No Items Yet
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#9CA3AF',
                      marginTop: 8,
                      textAlign: 'center',
                      lineHeight: 20
                    }}>
                      Tap the "O" button to select an option set{'\n'}and generate product variants
                    </Text>
                  </View>
                );
              }

              return (
                <View>
                  {/* Search Bar */}
                  <View style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#F9FAFB',
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                    gap: 8,
                  }}>
                    <View style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}>
                      <MaterialIcons name="search" size={20} color="#9CA3AF" />
                      <TextInput
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          fontSize: 16,
                          color: '#111827',
                        }}
                        placeholder="Search items..."
                        placeholderTextColor="#9CA3AF"
                        value={itemsSearchQuery}
                        onChangeText={setItemsSearchQuery}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => setShowItemsFilter(true)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: selectedFilters.length > 0 ? '#3B82F6' : '#fff',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: selectedFilters.length > 0 ? '#3B82F6' : '#E5E7EB',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons
                        name="filter-list"
                        size={20}
                        color={selectedFilters.length > 0 ? '#fff' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Items List */}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredItems.map((item: any) => (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: '#fff',
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E7EB',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                              {item.sku || 'No SKU'}
                            </Text>
                            {item.option1 && (
                              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                                {item.option1}
                                {item.option2 && ` • ${item.option2}`}
                                {item.option3 && ` • ${item.option3}`}
                              </Text>
                            )}
                            <View style={{ flexDirection: 'row', marginTop: 4 }}>
                              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                                Stock: {item.onhand || 0}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 16 }}>
                                Price: ${(item.price || 0).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <View style={{
                              backgroundColor: item.available > 0 ? '#10B981' : '#EF4444',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}>
                              <Text style={{ fontSize: 12, fontWeight: '500', color: '#fff' }}>
                                {item.available > 0 ? 'Available' : 'Out of Stock'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}

                    {filteredItems.length === 0 && items.length > 0 && (
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 40,
                        paddingHorizontal: 20
                      }}>
                        <MaterialIcons name="search-off" size={48} color="#9CA3AF" />
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: '#6B7280',
                          marginTop: 16,
                          textAlign: 'center'
                        }}>
                          No items match your search
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              );
            })()}
          </View>
        </TabContent>
      ),
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }}>
      {/* Content Area */}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {activeTabData && (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {activeTabData.content}
          </ScrollView>
        )}
      </View>

      {/* Bottom Floating Tab Bar - Modern Android Design */}
      <View style={{
        position: 'absolute',
        bottom: 20 + insets.bottom,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const iconColor = isActive ? '#3B82F6' : '#6B7280';

          // Create icon with proper color
          let tabIcon: React.ReactElement;
          if (tab.id === 'core') {
            tabIcon = <Ionicons name="cube-outline" size={20} color={iconColor} />;
          } else if (tab.id === 'metafields') {
            tabIcon = <MaterialIcons name="numbers" size={20} color={iconColor} />;
          } else if (tab.id === 'categorization') {
            tabIcon = <Ionicons name="folder-outline" size={20} color={iconColor} />;
          } else if (tab.id === 'items') {
            tabIcon = <Text style={{ fontSize: 16, fontWeight: '600', color: iconColor }}>I</Text>;
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: isActive ? '#F0F9FF' : 'transparent',
                minWidth: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <View style={{
                alignItems: 'center',
                opacity: isActive ? 1 : 0.6
              }}>
                {tabIcon}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Save Button - Check Icon on Blue Circle */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !hasChanges}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: loading ? '#9CA3AF' : hasChanges ? '#3B82F6' : '#E5E7EB',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons
              name="check"
              size={22}
              color={hasChanges ? "#fff" : "#9CA3AF"}
            />
          </View>
        </TouchableOpacity>
      </View>





      {/* Type Selection Modal */}
      <Modal
        visible={showTypeSelect}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <TypeSelect
          selectedType={formData.type}
          onSelect={(type) => {
            updateField('type', type);
            setShowTypeSelect(false);
          }}
          onClose={() => setShowTypeSelect(false)}
        />
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategorySelect}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CategorySelect
          selectedCategory={formData.category}
          onSelect={(category) => {
            updateField('category', category);
            setShowCategorySelect(false);
          }}
          onClose={() => setShowCategorySelect(false)}
        />
      </Modal>

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorSelect}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VendorSelect
          selectedVendor={formData.vendor}
          onSelect={(vendor) => {
            updateField('vendor', vendor);
            setShowVendorSelect(false);
          }}
          onClose={() => setShowVendorSelect(false)}
        />
      </Modal>

      {/* Brand Selection Modal */}
      <Modal
        visible={showBrandSelect}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BrandSelect
          selectedBrand={formData.brand}
          onSelect={(brand) => {
            updateField('brand', brand);
            setShowBrandSelect(false);
          }}
          onClose={() => setShowBrandSelect(false)}
        />
      </Modal>

      {/* Collection Selection Modal */}
      <Modal
        visible={showCollectionSelect}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CollectionSelect
          selectedCollection={selectedCollectionId}
          onSelect={(collectionId, collectionName) => {
            setSelectedCollectionId(collectionId || null);
            setSelectedCollectionName(collectionName || null);
            setShowCollectionSelect(false);
          }}
          onClose={() => setShowCollectionSelect(false)}
        />
      </Modal>



      {/* Label/SKU Bottom Drawer */}
      <Modal
        visible={showLabelSkuDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLabelSkuDrawer(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setShowLabelSkuDrawer(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              width: '100%',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
            }}
            activeOpacity={1}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setShowLabelSkuDrawer(false)}>
                <Text style={{ fontSize: 16, color: '#6B7280' }}>Close</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                SKU Details
              </Text>
              <TouchableOpacity onPress={() => setShowLabelSkuDrawer(false)}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#3B82F6' }}>Save</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="SKU"
              placeholder="Enter SKU"
              value={formData.sku}
              onChangeText={(value) => updateField('sku', value)}
              variant="outline"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Status Bottom Drawer */}
      <Modal
        visible={showStatusDrawer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusDrawer(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setShowStatusDrawer(false)}
        >
          <View style={{
            backgroundColor: '#fff',
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: formData.status ? '#F3F4F6' : '#fff',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
              onPress={() => {
                updateField('status', true);
                setShowStatusDrawer(false);
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Active</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                Product is visible and available for sale
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: !formData.status ? '#F3F4F6' : '#fff',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 16,
              }}
              onPress={() => {
                updateField('status', false);
                setShowStatusDrawer(false);
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Draft</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                Product is hidden and not available for sale
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>



      {/* Full-Screen Image Drawer */}
      <Modal
        visible={showFullScreenImageDrawer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullScreenImageDrawer(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 24,
            backgroundColor: '#fff',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#111827',
            }}>
              Medias
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Primary Image Section */}
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity
                style={{
                  width: 140,
                  height: 140,
                  backgroundColor: formData.image && !imageError ? 'transparent' : '#F8F9FA',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={formData.image && !imageError ? () => setShowPrimaryImageActions(true) : handlePrimaryImageUpload}
                activeOpacity={0.8}
              >
                {primaryImageUploading ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        }],
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#E5E7EB',
                        borderTopColor: '#6B7280',
                      }} />
                    </Animated.View>
                  </View>
                ) : formData.image && !imageError ? (
                  <R2Image
                    url={formData.image}
                    style={{ width: 140, height: 140 }}
                    resizeMode="cover"
                    onError={(error) => {
                      setImageError(true);
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <MaterialIcons name="add" size={20} color="#9CA3AF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Medias Section */}
            <View>
              <MediaManager
                initialMedia={formData.medias}
                onMediaChange={handleMediaChange}
                maxItems={10}
                allowMultiple={true}
                prefix="products"
                title=""
                description=""
                useCustomUpload={true}
                onCustomUpload={handleMediasUpload}
                customUploading={mediasUploading}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Primary Image Actions Drawer */}
      <Modal
        visible={showPrimaryImageActions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrimaryImageActions(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowPrimaryImageActions(false)}
          />

          <View style={{ backgroundColor: '#fff' }}>
            <TouchableOpacity
              onPress={() => {
                setShowPrimaryImageActions(false);
                handlePrimaryImageUpload();
              }}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <Text style={{ fontSize: 16, color: '#111827' }}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowPrimaryImageActions(false);
                updateField('image', '');
              }}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <Text style={{ fontSize: 16, color: '#EF4444' }}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPrimaryImageActions(false)}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Notes Editor - Simple TextInput */}
      <Modal
        visible={showFullScreenNotesEditor}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullScreenNotesEditor(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header - Shopify Style */}
          <View style={{
            paddingTop: insets.top,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: '#fff',
            borderBottomWidth: 0.5,
            borderBottomColor: '#E1E1E1',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000',
              textAlign: 'left',
            }}>
              Notes
            </Text>

            <TouchableOpacity
              onPress={async () => {
                // Save notes directly to InstantDB
                if (product?.id) {
                  try {
                    const notesContent = formData.notes || '';
                    const timestamp = getCurrentTimestamp();
                    await db.transact(db.tx.products[product.id].update({
                      notes: notesContent,
                      updatedAt: timestamp,
                    }));
                  } catch (error) {
                    console.error('Failed to save notes:', error);
                    Alert.alert('Error', 'Failed to save notes. Please try again.');
                  }
                }
                setShowFullScreenNotesEditor(false);
              }}
              style={{
                padding: 8,
                marginRight: -8,
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#007AFF',
              }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Simple TextInput for Notes */}
          <View style={{ flex: 1, padding: 16 }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#000',
                textAlignVertical: 'top',
                backgroundColor: '#fff',
                padding: 0,
              }}
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Add product notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
            />
          </View>
        </View>
      </Modal>

      {/* Option Set Selector Modal */}
      <Modal
        visible={showOptionSetSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOptionSetSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          {/* Header */}
          <View style={{
            paddingTop: insets.top,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={() => setShowOptionSetSelector(false)}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>

            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#111827',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16,
            }}>
              Select Option Sets
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (selectedOptionSets.length > 0) {
                  generateItemsFromOptionSets(selectedOptionSets);
                } else {
                  Alert.alert('Error', 'Please select at least one option set');
                }
              }}
              style={{
                padding: 8,
                marginRight: -8,
              }}
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: selectedOptionSets.length > 0 ? '#007AFF' : '#9CA3AF',
              }}>
                Generate
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {(() => {
              // Process option sets from data
              const optionSets = React.useMemo(() => {
                if (!optionSetsData?.options) return [];

                const setMap = new Map<string, { name: string; values: any[] }>();

                optionSetsData.options.forEach((option: any) => {
                  if (option.set) {
                    const existing = setMap.get(option.set);
                    if (existing) {
                      existing.values.push(option);
                    } else {
                      setMap.set(option.set, {
                        name: option.set,
                        values: [option]
                      });
                    }
                  }
                });

                return Array.from(setMap.entries()).map(([setName, data]) => ({
                  name: setName,
                  values: data.values.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                }));
              }, [optionSetsData?.options]);

              if (optionSets.length === 0) {
                return (
                  <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60
                  }}>
                    <MaterialIcons name="tune" size={48} color="#9CA3AF" />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#6B7280',
                      marginTop: 16,
                      textAlign: 'center'
                    }}>
                      No Option Sets Found
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#9CA3AF',
                      marginTop: 8,
                      textAlign: 'center'
                    }}>
                      Create option sets first to generate product variants
                    </Text>
                  </View>
                );
              }

              return optionSets.map((optionSet) => {
                const isSelected = selectedOptionSets.includes(optionSet.name);

                return (
                  <TouchableOpacity
                    key={optionSet.name}
                    style={{
                      backgroundColor: isSelected ? '#F0F9FF' : '#fff',
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                    }}
                    onPress={() => {
                      if (isSelected) {
                        // Remove from selection
                        setSelectedOptionSets(prev => prev.filter(name => name !== optionSet.name));
                      } else {
                        // Add to selection (limit to 3 for option1, option2, option3)
                        if (selectedOptionSets.length < 3) {
                          setSelectedOptionSets(prev => [...prev, optionSet.name]);
                        } else {
                          Alert.alert('Limit Reached', 'You can select up to 3 option sets maximum');
                        }
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                            {optionSet.name}
                          </Text>
                          {isSelected && (
                            <View style={{
                              backgroundColor: '#3B82F6',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: 8,
                            }}>
                              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                                {selectedOptionSets.indexOf(optionSet.name) + 1}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                          {optionSet.values.length} {optionSet.values.length === 1 ? 'variant' : 'variants'}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                          {optionSet.values.slice(0, 3).map((value: any) => (
                            <View
                              key={value.id}
                              style={{
                                backgroundColor: isSelected ? '#DBEAFE' : '#F3F4F6',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginRight: 8,
                                marginBottom: 4,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: isSelected ? '#1E40AF' : '#6B7280' }}>
                                {value.value}
                              </Text>
                            </View>
                          ))}
                          {optionSet.values.length > 3 && (
                            <View style={{
                              backgroundColor: isSelected ? '#DBEAFE' : '#F3F4F6',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}>
                              <Text style={{ fontSize: 12, color: isSelected ? '#1E40AF' : '#6B7280' }}>
                                +{optionSet.values.length - 3} more
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                        backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color="#fff" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Unsaved Changes Bottom Drawer */}
      <Modal
        visible={showUnsavedChangesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnsavedChangesModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#fff',
            paddingTop: 20,
            paddingBottom: 20 + insets.bottom,
            paddingHorizontal: 20,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#111827',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Unsaved Changes
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              <TouchableOpacity
                onPress={() => setShowUnsavedChangesModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#374151',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowUnsavedChangesModal(false);
                  onClose();
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: '#3B82F6',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#fff',
                }}>
                  Discard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Items Filter Full Screen Modal */}
      <Modal
        visible={showItemsFilter}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowItemsFilter(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          {/* Header */}
          <View style={{
            paddingTop: insets.top,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: '#fff',
            borderBottomWidth: 0.5,
            borderBottomColor: '#E1E1E1',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={() => setShowItemsFilter(false)}
              style={{
                padding: 8,
                marginLeft: -8,
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16,
            }}>
              Filter Items
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSelectedFilters([]);
                setShowItemsFilter(false);
              }}
              style={{
                padding: 8,
                marginRight: -8,
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#3B82F6',
              }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Content */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {(() => {
              const items = productItemsData?.items || [];
              const allOptionValues = new Set<string>();
              items.forEach((item: any) => {
                if (item.option1) allOptionValues.add(item.option1);
                if (item.option2) allOptionValues.add(item.option2);
                if (item.option3) allOptionValues.add(item.option3);
              });
              const optionValuesList = Array.from(allOptionValues).sort();

              if (optionValuesList.length === 0) {
                return (
                  <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60,
                  }}>
                    <MaterialIcons name="filter-list-off" size={48} color="#9CA3AF" />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#6B7280',
                      marginTop: 16,
                      textAlign: 'center'
                    }}>
                      No option values to filter by
                    </Text>
                  </View>
                );
              }

              return (
                <View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 16,
                  }}>
                    Option Values
                  </Text>

                  {optionValuesList.map((optionValue) => {
                    const isSelected = selectedFilters.includes(optionValue);
                    return (
                      <TouchableOpacity
                        key={optionValue}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedFilters(prev => prev.filter(f => f !== optionValue));
                          } else {
                            setSelectedFilters(prev => [...prev, optionValue]);
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: '#fff',
                          borderRadius: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                        }}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                          backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          {isSelected && (
                            <MaterialIcons name="check" size={12} color="#fff" />
                          )}
                        </View>

                        <Text style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: isSelected ? '#3B82F6' : '#111827',
                          flex: 1,
                        }}>
                          {optionValue}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
