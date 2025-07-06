import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MainScreen } from '../nav';

interface AIContentProps {
  currentScreen: MainScreen;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIContent({ currentScreen }: AIContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const getContextualGreeting = () => {
    switch (currentScreen) {
      case 'dashboard':
        return "Hi! I'm your AI assistant for dashboard analytics. I can help you understand your sales metrics, identify trends, and provide business insights.";
      case 'products':
        return "Hello! I'm here to help with product management. I can assist with inventory optimization, pricing strategies, and product organization.";
      case 'collections':
        return "Hi there! I can help you organize your products into collections, suggest grouping strategies, and optimize your catalog structure.";
      case 'sales':
        return "Hello! I'm your sales assistant. I can help you track sales performance, analyze revenue trends, and optimize your sales strategy.";
      case 'reports':
        return "Hi! I'm here to help with reports and analytics. I can explain your data, suggest improvements, and help you make data-driven decisions.";
      default:
        return "Hello! I'm your AI assistant. How can I help you today?";
    }
  };

  const getContextualSuggestions = () => {
    switch (currentScreen) {
      case 'dashboard':
        return [
          "Analyze today's sales performance",
          "Show me top-selling products",
          "Explain the sales trend",
          "What's my conversion rate?",
        ];
      case 'products':
        return [
          "Which products need restocking?",
          "Suggest optimal pricing",
          "Find low-performing products",
          "Help organize my inventory",
        ];
      case 'collections':
        return [
          "Suggest collection categories",
          "How to organize products better?",
          "Create seasonal collections",
          "Optimize product grouping",
        ];
      case 'sales':
        return [
          "Show today's sales performance",
          "Analyze revenue trends",
          "Find top-selling products",
          "Optimize sales strategy",
        ];
      case 'reports':
        return [
          "Generate sales report",
          "Compare weekly performance",
          "Identify growth opportunities",
          "Export data insights",
        ];
      default:
        return [
          "How can I improve sales?",
          "Show me business insights",
          "Help with inventory",
          "Analyze performance",
        ];
    }
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getContextualResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getContextualResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    switch (currentScreen) {
      case 'dashboard':
        if (input.includes('sales') || input.includes('revenue')) {
          return "Based on your dashboard data, your sales are performing well with a 12.5% increase today. Your average transaction value is $68.23, which is above the industry average.";
        }
        if (input.includes('trend') || input.includes('performance')) {
          return "Your sales trend shows consistent growth over the past week. Peak hours are between 2-4 PM and 7-9 PM. Consider staffing accordingly.";
        }
        break;
      case 'products':
        if (input.includes('stock') || input.includes('inventory')) {
          return "You have several products running low on stock. I recommend restocking items with less than 10 units. Would you like me to create a restock list?";
        }
        if (input.includes('pricing') || input.includes('price')) {
          return "Your pricing strategy looks competitive. Consider dynamic pricing for seasonal items and bundle deals for slow-moving inventory.";
        }
        break;
      case 'collections':
        if (input.includes('organize') || input.includes('category')) {
          return "I suggest organizing your products by season, price range, or customer type. This will improve browsing and increase sales conversion.";
        }
        break;
      case 'sales':
        if (input.includes('revenue') || input.includes('performance')) {
          return "Your total sales today are $3,158.47 with 47 transactions. This represents a 2.1% increase from yesterday. Peak sales hours are 2-4 PM.";
        }
        break;
      case 'reports':
        if (input.includes('report') || input.includes('data')) {
          return "Your weekly sales report shows 8.7% growth. Top categories are electronics and accessories. Would you like me to generate a detailed analysis?";
        }
        break;
    }
    
    return "I understand you're asking about " + userInput + ". Let me help you with that based on your current " + currentScreen + " context.";
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-xl font-bold text-gray-900 mb-1">AI Assistant</Text>
          <Text className="text-gray-600 capitalize">{currentScreen} Context</Text>
        </View>

        {/* Messages */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View className="flex-1">
              {/* Welcome Message */}
              <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                <View className="flex-row items-start">
                  <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-purple-600 font-bold">AI</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900">{getContextualGreeting()}</Text>
                  </View>
                </View>
              </View>

              {/* Suggestions */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-3">Suggested questions:</Text>
                <View className="gap-2">
                  {getContextualSuggestions().map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSuggestionPress(suggestion)}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <Text className="text-gray-700">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              {messages.map((message) => (
                <View
                  key={message.id}
                  className={`flex-row ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isUser && (
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-purple-600 font-bold text-xs">AI</Text>
                    </View>
                  )}
                  <View
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-500'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Text
                      className={`${
                        message.isUser ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {message.text}
                    </Text>
                  </View>
                  {message.isUser && (
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center ml-3">
                      <Text className="text-blue-600 font-bold text-xs">You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-white border-t border-gray-200 p-4">
          <View className="flex-row items-center gap-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Ask about ${currentScreen}...`}
              className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#6B7280"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              className={`w-12 h-12 rounded-lg items-center justify-center ${
                inputText.trim() ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-bold">→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
