import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, BackHandler, Modal, Animated, ScrollView, Keyboard, Platform } from 'react-native';
import { id } from '@instantdb/react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import Input from './ui/Input';
import QuantitySelector from './ui/qty';

import R2Image from './ui/r2-image';
import { db, getCurrentTimestamp } from '../lib/instant';
import { MediaManager, MediaItem } from './media';
import { useStore } from '../lib/store-context';

// Simple replacement components for removed vtabs
const TabContent = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Initialize 10tap editor
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: formData.notes || '',
    theme: {
      toolbar: {
        toolbarBody: {
          backgroundColor: Platform.OS === 'ios' ? '#D1D5DB' : '#404040',
          borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
          borderTopColor: Platform.OS === 'ios' ? '#9CA3AF' : 'transparent',
          borderBottomWidth: 0,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: Platform.OS === 'ios' ? 44 : 48,
        },
        toolbarItem: {
          color: Platform.OS === 'ios' ? '#000000' : '#FFFFFF',
          backgroundColor: 'transparent',
        },
        toolbarItemActive: {
          color: Platform.OS === 'ios' ? '#007AFF' : '#4A9EFF',
          backgroundColor: 'transparent',
        },
      },
    },
  });

  // Handle editor content changes
  useEffect(() => {
    if (editor) {
      const unsubscribe = editor._subscribeToEditorStateUpdate(() => {
        const content = editor.getHTML();
        updateField('notes', content);
      });
      return unsubscribe;
    }
  }, [editor]);

  // Rotation animation for loading
  useEffect(() => {
    if (imageUploading) {
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
  }, [imageUploading, rotateAnim]);

  // Update selectedCollectionId when productCollection changes
  useEffect(() => {
    setSelectedCollectionId(productCollection?.id || null);
    setSelectedCollectionName(productCollection?.name || null);
  }, [productCollection?.id, productCollection?.name]);

  // Track collection changes for hasChanges detection
  useEffect(() => {
    if (isEditing && productCollection) {
      // If we're editing and the selected collection differs from the original
      if (selectedCollectionId !== productCollection?.id) {
        setHasChanges(true);
      }
    } else if (!isEditing && selectedCollectionId) {
      // If we're creating new product and collection is selected
      setHasChanges(true);
    }
  }, [selectedCollectionId, productCollection?.id, isEditing]);

  // Handle keyboard events for notes toolbar positioning
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        if (activeTab === 'notes') {
          setKeyboardHeight(e.endCoordinates.height);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [activeTab]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: onClose }
          ]
        );
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [hasChanges, onClose]);

  const updateField = (field: string, value: any) => {
    if (field === 'image') {
      setImageError(false); // Reset image error when image URL changes
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true); // Mark that changes have been made
  };

  const handleMediaChange = useCallback((media: MediaItem[]) => {
    setImageError(false); // Reset image error when media changes
    setFormData(prev => ({
      ...prev,
      medias: media,
      // Update primary image URL for backward compatibility
      image: media.length > 0 ? media[0].url : '',
    }));
    setHasChanges(true); // Mark that changes have been made
  }, []);

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
                onPress={() => setShowImageUpload(true)}
              >
                {imageUploading ? (
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
                onChangeText={(value) => {
                  updateField('title', value);
                  updateField('name', value); // Keep both in sync
                }}
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
                placeholder="expert"
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
      id: 'media',
      label: 'Media',
      icon: <Ionicons name="image-outline" size={20} color="#6B7280" />,
      content: (
        <TabContent title="">
          <MediaManager
            initialMedia={formData.medias}
            onMediaChange={handleMediaChange}
            maxItems={10}
            allowMultiple={true}
            prefix="products"
            title=""
            description=""
            useCustomUpload={true}
            onCustomUpload={() => setShowImageUpload(true)}
            customUploading={imageUploading}
          />
        </TabContent>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>n</Text>,
      content: (
        <TabContent title="">
          <View style={{ flex: 1, height: 400 }}>
            {/* 10tap Rich Text Editor */}
            <RichText
              editor={editor}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                backgroundColor: '#fff',
              }}
            />
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
          {/* Empty content */}
        </TabContent>
      ),
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
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
        bottom: 20,
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
                {React.cloneElement(tab.icon as React.ReactElement, {
                  style: {
                    ...((tab.icon as React.ReactElement).props.style || {}),
                    color: isActive ? '#3B82F6' : '#6B7280'
                  }
                })}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Save Button - Check Icon on Blue Circle */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
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
            backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons
              name="check"
              size={22}
              color="#fff"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Notes Toolbar - Attached to Keyboard */}
      {activeTab === 'notes' && keyboardHeight > 0 && (
        <View style={{
          position: 'absolute',
          bottom: keyboardHeight,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}>
          <Toolbar editor={editor} />
        </View>
      )}



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

      {/* Image Upload Bottom Drawer */}
      <Modal
        visible={showImageUpload}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImageUpload(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowImageUpload(false)}
          />

          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingTop: 8,
            paddingBottom: 34,
            maxHeight: '80%'
          }}>
            {/* Handle */}
            <View style={{
              width: 36,
              height: 4,
              backgroundColor: '#E5E7EB',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16
            }} />

            {/* Header */}
            <View style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6'
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
                Add Photo
              </Text>
            </View>

            {/* Options */}
            <View style={{ paddingTop: 8 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={async () => {
                  // Take photo
                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
                    return;
                  }

                  try {
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: 'Images' as any,
                      quality: 0.8,
                      exif: false,
                    });

                    if (!result.canceled && result.assets.length > 0) {
                      setShowImageUpload(false);
                      setImageUploading(true);

                      try {
                        // Handle upload
                        const asset = result.assets[0];
                        const mediaFile = {
                          uri: asset.uri,
                          name: asset.fileName || `image_${Date.now()}.jpg`,
                          type: 'image/jpeg',
                          size: asset.fileSize,
                        };

                        const uploadResult = await r2Service.uploadFile(mediaFile, 'products');
                        if (uploadResult.success && uploadResult.url) {
                          // Update image field for Core tab
                          updateField('image', uploadResult.url);

                          // Also add to media array if we're in Media tab
                          if (activeTab === 'media') {
                            const newMediaItem: MediaItem = {
                              url: uploadResult.url,
                              key: uploadResult.key,
                              type: 'image/jpeg',
                            };
                            const currentMedia = formData.medias || [];
                            const newMedia = [...currentMedia, newMediaItem];
                            updateField('medias', newMedia);
                          }
                        } else {
                          Alert.alert('Upload Failed', uploadResult.error || 'Unknown error occurred');
                        }
                      } catch (error) {
                        Alert.alert('Upload Failed', 'An error occurred during upload');
                      } finally {
                        setImageUploading(false);
                      }
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to take photo');
                  }
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16
                }}>
                  <MaterialIcons name="camera-alt" size={20} color="#6B7280" />
                </View>
                <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                }}
                onPress={async () => {
                  // Choose from library
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
                    return;
                  }

                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: 'Images' as any,
                      quality: 0.8,
                      exif: false,
                    });

                    if (!result.canceled && result.assets.length > 0) {
                      setShowImageUpload(false);
                      setImageUploading(true);

                      try {
                        // Handle upload
                        const asset = result.assets[0];
                        const mediaFile = {
                          uri: asset.uri,
                          name: asset.fileName || `image_${Date.now()}.jpg`,
                          type: 'image/jpeg',
                          size: asset.fileSize,
                        };

                        const uploadResult = await r2Service.uploadFile(mediaFile, 'products');
                        if (uploadResult.success && uploadResult.url) {
                          // Update image field for Core tab
                          updateField('image', uploadResult.url);

                          // Also add to media array if we're in Media tab
                          if (activeTab === 'media') {
                            const newMediaItem: MediaItem = {
                              url: uploadResult.url,
                              key: uploadResult.key,
                              type: 'image/jpeg',
                            };
                            const currentMedia = formData.medias || [];
                            const newMedia = [...currentMedia, newMediaItem];
                            updateField('medias', newMedia);
                          }
                        } else {
                          Alert.alert('Upload Failed', uploadResult.error || 'Unknown error occurred');
                        }
                      } catch (error) {
                        Alert.alert('Upload Failed', 'An error occurred during upload');
                      } finally {
                        setImageUploading(false);
                      }
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to pick image');
                  }
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16
                }}>
                  <MaterialIcons name="photo-library" size={20} color="#6B7280" />
                </View>
                <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>
                  Choose from Library
                </Text>
              </TouchableOpacity>

              {formData.image && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                  }}
                  onPress={() => {
                    updateField('image', '');
                    setShowImageUpload(false);
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FEF2F2',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                  </View>
                  <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '500' }}>
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
