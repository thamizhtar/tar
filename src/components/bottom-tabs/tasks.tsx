import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MainScreen } from '../nav';
import { db } from '../../lib/instant';

interface TasksContentProps {
  currentScreen: MainScreen;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  category: string;
}

export default function TasksContent({ currentScreen }: TasksContentProps) {
  const [tasks, setTasks] = useState<Task[]>(getContextualTasks(currentScreen));
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  function getContextualTasks(screen: MainScreen): Task[] {
    const baseTasks = {
      dashboard: [
        {
          id: '1',
          title: 'Review daily sales report',
          description: 'Analyze today\'s performance and identify trends',
          priority: 'high' as const,
          completed: false,
          category: 'Analytics',
          dueDate: 'Today',
        },
        {
          id: '2',
          title: 'Update sales targets',
          description: 'Set monthly goals based on current performance',
          priority: 'medium' as const,
          completed: false,
          category: 'Planning',
          dueDate: 'This week',
        },
        {
          id: '3',
          title: 'Check payment processing',
          description: 'Ensure all transactions are processing correctly',
          priority: 'high' as const,
          completed: true,
          category: 'Operations',
        },
      ],
      products: [
        {
          id: '4',
          title: 'Restock low inventory items',
          description: 'Order products with less than 10 units in stock',
          priority: 'high' as const,
          completed: false,
          category: 'Inventory',
          dueDate: 'Tomorrow',
        },
        {
          id: '5',
          title: 'Update product descriptions',
          description: 'Improve SEO and customer understanding',
          priority: 'medium' as const,
          completed: false,
          category: 'Content',
          dueDate: 'Next week',
        },
        {
          id: '6',
          title: 'Review pricing strategy',
          description: 'Analyze competitor prices and adjust accordingly',
          priority: 'medium' as const,
          completed: false,
          category: 'Pricing',
          dueDate: 'This week',
        },
      ],
      collections: [
        {
          id: '7',
          title: 'Create seasonal collections',
          description: 'Organize products for upcoming season',
          priority: 'medium' as const,
          completed: false,
          category: 'Organization',
          dueDate: 'Next week',
        },
        {
          id: '8',
          title: 'Assign unorganized products',
          description: 'Move products without collections to appropriate groups',
          priority: 'low' as const,
          completed: false,
          category: 'Organization',
        },
      ],
      sales: [
        {
          id: '9',
          title: 'Follow up on large orders',
          description: 'Contact Tulum Contractors about repeat business',
          priority: 'medium' as const,
          completed: false,
          category: 'Sales',
          dueDate: 'Today',
        },
        {
          id: '10',
          title: 'Analyze sales performance',
          description: 'Review today\'s sales metrics and trends',
          priority: 'high' as const,
          completed: false,
          category: 'Analytics',
          dueDate: 'Tomorrow',
        },
      ],
      reports: [
        {
          id: '11',
          title: 'Generate monthly report',
          description: 'Create comprehensive business performance report',
          priority: 'high' as const,
          completed: false,
          category: 'Reporting',
          dueDate: 'End of month',
        },
        {
          id: '12',
          title: 'Analyze customer trends',
          description: 'Study purchasing patterns and preferences',
          priority: 'medium' as const,
          completed: false,
          category: 'Analytics',
          dueDate: 'This week',
        },
      ],
    };

    return baseTasks[screen] || [];
  }

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      completed: false,
      category: getContextualCategory(currentScreen),
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowAddTask(false);
  };

  const getContextualCategory = (screen: MainScreen): string => {
    const categories = {
      dashboard: 'Analytics',
      products: 'Inventory',
      collections: 'Organization',
      sales: 'Sales',
      reports: 'Reporting',
    };
    return categories[screen] || 'General';
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setTasks(prev => prev.filter(task => task.id !== taskId)),
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xl font-bold text-gray-900">Tasks</Text>
          <TouchableOpacity
            onPress={() => setShowAddTask(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">+ Add</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-600 capitalize">{currentScreen} Context</Text>
        
        {/* Stats */}
        <View className="flex-row gap-4 mt-3">
          <View className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Text className="text-blue-600 font-medium">{pendingTasks.length}</Text>
            <Text className="text-blue-500 text-sm">Pending</Text>
          </View>
          <View className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
            <Text className="text-green-600 font-medium">{completedTasks.length}</Text>
            <Text className="text-green-500 text-sm">Completed</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Add Task Form */}
        {showAddTask && (
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Add New Task</Text>
            
            <TextInput
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Task title"
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-gray-900"
              placeholderTextColor="#6B7280"
            />
            
            <TextInput
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              placeholder="Description (optional)"
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-gray-900"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={2}
            />
            
            <View className="flex-row gap-2 mb-3">
              {(['high', 'medium', 'low'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  onPress={() => setNewTaskPriority(priority)}
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    newTaskPriority === priority
                      ? getPriorityColor(priority)
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className={`text-center font-medium capitalize ${
                    newTaskPriority === priority ? '' : 'text-gray-600'
                  }`}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddTask(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-gray-700 font-medium text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addTask}
                className="flex-1 bg-blue-500 py-3 rounded-lg"
              >
                <Text className="text-white font-medium text-center">Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Pending Tasks</Text>
            <View className="gap-3">
              {pendingTasks.map((task) => (
                <View key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium mb-1">{task.title}</Text>
                      {task.description && (
                        <Text className="text-gray-600 text-sm mb-2">{task.description}</Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                          <Text className="text-xs font-medium capitalize">{task.priority}</Text>
                        </View>
                        <Text className="text-gray-500 text-xs">{task.category}</Text>
                        {task.dueDate && (
                          <Text className="text-blue-600 text-xs">Due: {task.dueDate}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => toggleTask(task.id)}
                      className="flex-1 bg-green-50 border border-green-200 py-2 rounded-lg"
                    >
                      <Text className="text-green-600 font-medium text-center">Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteTask(task.id)}
                      className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-red-600 font-medium">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Completed Tasks</Text>
            <View className="gap-3">
              {completedTasks.map((task) => (
                <View key={task.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium line-through mb-1">{task.title}</Text>
                      {task.description && (
                        <Text className="text-gray-500 text-sm mb-2">{task.description}</Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-green-600 text-xs font-medium">✓ Completed</Text>
                        <Text className="text-gray-500 text-xs">{task.category}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleTask(task.id)}
                      className="bg-gray-100 border border-gray-200 px-3 py-1 rounded"
                    >
                      <Text className="text-gray-600 text-sm">Undo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <View className="flex-1 justify-center items-center p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">✅</Text>
              </View>
              <Text className="text-lg font-medium text-gray-900 mb-2">No tasks yet</Text>
              <Text className="text-gray-500 text-center mb-4">
                Add tasks to keep track of your {currentScreen} activities
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddTask(true)}
                className="bg-blue-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-medium">Add First Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
