import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MainScreen } from '../nav';

interface PeopleContentProps {
  currentScreen: MainScreen;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  permissions: string[];
  lastActive?: string;
}

export default function PeopleContent({ currentScreen }: PeopleContentProps) {
  const [teamMembers] = useState<TeamMember[]>(getContextualTeamMembers());
  const [searchQuery, setSearchQuery] = useState('');

  function getContextualTeamMembers(): TeamMember[] {
    const allMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Store Manager',
        email: 'sarah@leaflemon.com',
        phone: '+1 (555) 123-4567',
        avatar: '👩‍💼',
        status: 'online',
        permissions: ['dashboard', 'products', 'collections', 'sales', 'reports'],
        lastActive: 'Now',
      },
      {
        id: '2',
        name: 'Mike Chen',
        role: 'Sales Associate',
        email: 'mike@leaflemon.com',
        phone: '+1 (555) 234-5678',
        avatar: '👨‍💻',
        status: 'online',
        permissions: ['dashboard', 'products'],
        lastActive: '5 min ago',
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        role: 'Inventory Manager',
        email: 'emily@leaflemon.com',
        phone: '+1 (555) 345-6789',
        avatar: '👩‍🔬',
        status: 'busy',
        permissions: ['products', 'collections', 'reports'],
        lastActive: '15 min ago',
      },
      {
        id: '4',
        name: 'David Kim',
        role: 'Financial Analyst',
        email: 'david@leaflemon.com',
        avatar: '👨‍💼',
        status: 'offline',
        permissions: ['sales', 'reports', 'dashboard'],
        lastActive: '2 hours ago',
      },
      {
        id: '5',
        name: 'Lisa Wang',
        role: 'Marketing Coordinator',
        email: 'lisa@leaflemon.com',
        avatar: '👩‍🎨',
        status: 'online',
        permissions: ['products', 'collections'],
        lastActive: '30 min ago',
      },
    ];

    // Filter members based on current screen context
    return allMembers.filter(member => 
      member.permissions.includes(currentScreen)
    );
  }

  const getContextualDescription = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'Team members with dashboard access and analytics responsibilities';
      case 'products':
        return 'Team members responsible for product management and inventory';
      case 'collections':
        return 'Team members who can organize and manage product collections';
      case 'sales':
        return 'Team members with sales access and revenue tracking permissions';
      case 'reports':
        return 'Team members who can view and generate business reports';
      default:
        return 'All team members';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactMember = (member: TeamMember) => {
    Alert.alert(
      `Contact ${member.name}`,
      'Choose how to contact this team member:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log(`Calling ${member.phone}`) },
        { text: 'Email', onPress: () => console.log(`Emailing ${member.email}`) },
        { text: 'Message', onPress: () => console.log(`Messaging ${member.name}`) },
      ]
    );
  };

  const onlineMembers = filteredMembers.filter(m => m.status === 'online');
  const busyMembers = filteredMembers.filter(m => m.status === 'busy');
  const offlineMembers = filteredMembers.filter(m => m.status === 'offline');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-xl font-bold text-gray-900 mb-1">Team</Text>
        <Text className="text-gray-600 text-sm mb-3">{getContextualDescription()}</Text>
        
        {/* Search */}
        <View className="bg-gray-100 rounded-lg px-4 py-3">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search team members..."
            className="text-gray-900"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mt-3">
          <View className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
            <Text className="text-green-600 font-medium">{onlineMembers.length}</Text>
            <Text className="text-green-500 text-sm">Online</Text>
          </View>
          <View className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <Text className="text-yellow-600 font-medium">{busyMembers.length}</Text>
            <Text className="text-yellow-500 text-sm">Busy</Text>
          </View>
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <Text className="text-gray-600 font-medium">{offlineMembers.length}</Text>
            <Text className="text-gray-500 text-sm">Offline</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {filteredMembers.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">👥</Text>
              </View>
              <Text className="text-lg font-medium text-gray-900 mb-2">No team members found</Text>
              <Text className="text-gray-500 text-center">
                {searchQuery ? 'Try adjusting your search' : `No team members have access to ${currentScreen}`}
              </Text>
            </View>
          </View>
        ) : (
          <View className="p-4">
            {/* Online Members */}
            {onlineMembers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Online ({onlineMembers.length})
                </Text>
                <View className="gap-3">
                  {onlineMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleContactMember(member)}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <View className="flex-row items-center">
                        <View className="relative mr-4">
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                            <Text className="text-xl">{member.avatar}</Text>
                          </View>
                          <View className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">{member.name}</Text>
                          <Text className="text-gray-600 text-sm">{member.role}</Text>
                          <Text className="text-gray-500 text-xs">{member.email}</Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center mb-1">
                            <View className={`w-2 h-2 ${getStatusColor(member.status)} rounded-full mr-2`} />
                            <Text className="text-green-600 text-sm font-medium">{getStatusText(member.status)}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs">{member.lastActive}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Busy Members */}
            {busyMembers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Busy ({busyMembers.length})
                </Text>
                <View className="gap-3">
                  {busyMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleContactMember(member)}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <View className="flex-row items-center">
                        <View className="relative mr-4">
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                            <Text className="text-xl">{member.avatar}</Text>
                          </View>
                          <View className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">{member.name}</Text>
                          <Text className="text-gray-600 text-sm">{member.role}</Text>
                          <Text className="text-gray-500 text-xs">{member.email}</Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center mb-1">
                            <View className={`w-2 h-2 ${getStatusColor(member.status)} rounded-full mr-2`} />
                            <Text className="text-yellow-600 text-sm font-medium">{getStatusText(member.status)}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs">{member.lastActive}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Offline Members */}
            {offlineMembers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Offline ({offlineMembers.length})
                </Text>
                <View className="gap-3">
                  {offlineMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleContactMember(member)}
                      className="bg-white border border-gray-200 rounded-lg p-4 opacity-75"
                    >
                      <View className="flex-row items-center">
                        <View className="relative mr-4">
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                            <Text className="text-xl">{member.avatar}</Text>
                          </View>
                          <View className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">{member.name}</Text>
                          <Text className="text-gray-600 text-sm">{member.role}</Text>
                          <Text className="text-gray-500 text-xs">{member.email}</Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center mb-1">
                            <View className={`w-2 h-2 ${getStatusColor(member.status)} rounded-full mr-2`} />
                            <Text className="text-gray-500 text-sm font-medium">{getStatusText(member.status)}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs">{member.lastActive}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
