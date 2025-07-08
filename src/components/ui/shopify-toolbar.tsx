import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, Keyboard, Platform, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EditorBridge } from '@10play/tentap-editor';

interface ShopifyToolbarProps {
  editor: EditorBridge;
}

export default function ShopifyToolbar({ editor }: ShopifyToolbarProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!isKeyboardVisible || !editor) {
    return null;
  }

  const toolbarButtons = [
    {
      icon: 'format-bold',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleBold === 'function') {
            editor.toggleBold();
          }
        } catch (error) {
          console.log('Bold toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('bold') : false,
    },
    {
      icon: 'format-italic',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleItalic === 'function') {
            editor.toggleItalic();
          }
        } catch (error) {
          console.log('Italic toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('italic') : false,
    },
    {
      icon: 'format-underlined',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleUnderline === 'function') {
            editor.toggleUnderline();
          }
        } catch (error) {
          console.log('Underline toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('underline') : false,
    },
    {
      icon: 'format-list-bulleted',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleBulletList === 'function') {
            editor.toggleBulletList();
          }
        } catch (error) {
          console.log('Bullet list error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('bulletList') : false,
    },
    {
      icon: 'format-list-numbered',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleOrderedList === 'function') {
            editor.toggleOrderedList();
          }
        } catch (error) {
          console.log('Ordered list error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('orderedList') : false,
    },
  ];

  const headingButtons = [
    {
      label: 'H1',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleHeading === 'function') {
            editor.toggleHeading({ level: 1 });
          }
        } catch (error) {
          console.log('H1 toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('heading', { level: 1 }) : false,
    },
    {
      label: 'H2',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleHeading === 'function') {
            editor.toggleHeading({ level: 2 });
          }
        } catch (error) {
          console.log('H2 toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('heading', { level: 2 }) : false,
    },
    {
      label: 'H3',
      onPress: () => {
        try {
          if (editor && typeof editor.toggleHeading === 'function') {
            editor.toggleHeading({ level: 3 });
          }
        } catch (error) {
          console.log('H3 toggle error:', error);
        }
      },
      isActive: editor && typeof editor.isActive === 'function' ? editor.isActive('heading', { level: 3 }) : false,
    },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? keyboardHeight : 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#E1E1E1',
        paddingVertical: 8,
        paddingHorizontal: 0,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Scrollable toolbar buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
        style={{ flex: 1 }}
      >
        {/* Heading buttons */}
        {headingButtons.map((button, index) => (
          <TouchableOpacity
            key={`heading-${index}`}
            onPress={button.onPress}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              backgroundColor: button.isActive ? '#F0F9FF' : 'transparent',
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: button.isActive ? '#3B82F6' : '#000'
            }}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Regular toolbar buttons */}
        {toolbarButtons.map((button, index) => (
          <TouchableOpacity
            key={`tool-${index}`}
            onPress={button.onPress}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              backgroundColor: button.isActive ? '#F0F9FF' : 'transparent',
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons
              name={button.icon as any}
              size={18}
              color={button.isActive ? '#3B82F6' : '#000'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fixed undo/redo buttons on the right */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderLeftWidth: 0.5,
        borderLeftColor: '#E1E1E1',
      }}>
        <TouchableOpacity
          onPress={() => {
            try {
              if (editor && typeof editor.undo === 'function') {
                editor.undo();
              }
            } catch (error) {
              console.log('Undo error:', error);
            }
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="undo" size={18} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            try {
              if (editor && typeof editor.redo === 'function') {
                editor.redo();
              }
            } catch (error) {
              console.log('Redo error:', error);
            }
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="redo" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
