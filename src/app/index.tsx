import React, { useState, useEffect, useCallback, useRef } from "react";
import { Text, View, TouchableOpacity, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from '@expo/vector-icons';
import ProductsScreen from "../components/products";
import CollectionsScreen from "../components/collections";
import ProductsManagementScreen from "../components/prod-mgmt";
import CollectionsManagementScreen from "../components/col-mgmt";
import DashboardScreen from "../components/dashboard";
import SalesScreen from "../components/sales";
import ReportsScreen from "../components/reports";
import FullScreenMenu from "../components/menu";
import Options from "../components/options";

import BottomNavigation, { BottomTab, MainScreen } from "../components/nav";
import BottomTabContent from "../components/tabs";
import { runMigrationIfNeeded } from "../lib/migrate-products";
import { completeMigrationProcess } from "../lib/cleanup-legacy";
import { StoreProvider } from "../lib/store-context";
import { log, trackError } from "../lib/logger";
import ErrorBoundary from "../components/ui/error-boundary";

type Screen = 'dashboard' | 'sales' | 'reports' | 'products' | 'collections' | 'options' | 'menu' | 'option-create' | 'option-edit';

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('workspace');
  const [showBottomTabs, setShowBottomTabs] = useState(true); // Start untoggled (bottom tabs shown, square icon not highlighted)
  const [isGridView, setIsGridView] = useState(false); // false = list view (default), true = grid view
  const [showManagement, setShowManagement] = useState(false); // false = product/collection list (default), true = management screen
  const [productFormProduct, setProductFormProduct] = useState<any>(null); // Track product being edited in form
  const [isProductFormOpen, setIsProductFormOpen] = useState(false); // Track if product form is open
  const [optionSetData, setOptionSetData] = useState<{id?: string, name?: string}>({});

  // Run complete migration process on app startup
  useEffect(() => {
    const runCompleteMigration = async () => {
      try {
        console.log('🚀 Starting complete migration process...');
        const result = await completeMigrationProcess();

        if (result.success) {
          console.log('✅ Complete migration process finished successfully');
        } else {
          console.error('❌ Complete migration process failed:', result.error);
          // Fallback to old migration if complete process fails
          await runMigrationIfNeeded();
        }
      } catch (error) {
        console.error('❌ Migration error:', error);
        // Fallback to old migration if complete process fails
        await runMigrationIfNeeded();
      }
    };

    runCompleteMigration();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If product form is open, let the product form handle the back button
      if (isProductFormOpen) {
        return false; // Let the product form's back handler take over
      }

      // If in management view, go back to list view
      if (showManagement && (currentScreen === 'products' || currentScreen === 'collections')) {
        setShowManagement(false);
        return true;
      }

      // If bottom tabs are toggled (hidden), show them
      if (!showBottomTabs && currentScreen !== 'menu') {
        setShowBottomTabs(true);
        return true;
      }

      // If in option create/edit screens, go back to options
      if (currentScreen === 'option-create' || currentScreen === 'option-edit') {
        setCurrentScreen('options');
        return true;
      }

      // If in menu, go back to dashboard
      if (currentScreen === 'menu') {
        setCurrentScreen('dashboard');
        return true;
      }

      // If not on dashboard, go to dashboard
      if (currentScreen !== 'dashboard') {
        setCurrentScreen('dashboard');
        setShowBottomTabs(true);
        setActiveBottomTab('workspace');
        setShowManagement(false);
        return true;
      }

      // If on dashboard, allow default back behavior (exit app)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen, showManagement, showBottomTabs, isProductFormOpen]);

  const handleNavigate = useCallback((screen: Screen, data?: any) => {
    log.info(`Navigating to screen: ${screen}`, 'Navigation', { data });
    setCurrentScreen(screen);
    // All screens except menu show bottom tabs by default (untoggled state)
    if (screen !== 'menu' && screen !== 'option-create' && screen !== 'option-edit') {
      setShowBottomTabs(true); // Dashboard, sales, reports, products, collections start untoggled (tabs shown)
    }
    // Reset to workspace tab when changing main screens
    if (screen !== 'menu' && screen !== 'option-create' && screen !== 'option-edit') {
      setActiveBottomTab('workspace');
    }
    // Reset management view when navigating to products/collections
    if (screen === 'products' || screen === 'collections') {
      setShowManagement(false);
    }
    // Handle option screen data
    if (screen === 'option-create' || screen === 'option-edit') {
      setOptionSetData(data || {});
    }
  }, []);

  const handleBottomTabPress = useCallback((tab: BottomTab) => {
    log.info(`Bottom tab pressed: ${tab}`, 'Navigation');
    setActiveBottomTab(tab);
  }, []);

  const renderMainContent = () => {
    // For products and collections screens, check if we should show management view
    if (currentScreen === 'products' && showManagement) {
      return <ProductsManagementScreen />;
    }

    if (currentScreen === 'collections' && showManagement) {
      return <CollectionsManagementScreen />;
    }

    // If bottom tabs are toggled (showBottomTabs = false), render the bottom tab content
    if (!showBottomTabs) {
      return (
        <BottomTabContent
          activeTab={activeBottomTab}
          currentScreen={currentScreen as MainScreen}
        />
      );
    }

    // Otherwise render the main screens (default untoggled state)
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onOpenMenu={() => handleNavigate('menu')} />;
      case 'sales':
        return <SalesScreen onOpenMenu={() => handleNavigate('menu')} />;
      case 'reports':
        return <ReportsScreen onOpenMenu={() => handleNavigate('menu')} />;
      case 'products':
        return <ProductsScreen
          isGridView={isGridView}
          onProductFormOpen={(product) => {
            setProductFormProduct(product);
            setIsProductFormOpen(true);
          }}
          onProductFormClose={() => {
            setProductFormProduct(null);
            setIsProductFormOpen(false);
          }}
        />;
      case 'collections':
        return <CollectionsScreen isGridView={isGridView} />;
      case 'options':
        return <Options
          onClose={() => handleNavigate('dashboard')}
          onOpenMenu={() => handleNavigate('menu')}
        />;

      case 'menu':
        return <FullScreenMenu
          onNavigate={handleNavigate}
          onClose={() => handleNavigate('dashboard')}
        />;
      default:
        return <DashboardScreen onOpenMenu={() => handleNavigate('menu')} />;
    }
  };

  return (
    <StoreProvider>
      <ErrorBoundary>
        <View className="flex flex-1">
          {currentScreen === 'menu' || currentScreen === 'options' ? (
            // Full screen screens without header or bottom navigation
            <ErrorBoundary>
              {renderMainContent()}
            </ErrorBoundary>
          ) : (
            // All other screens with header and bottom navigation
            <>
              <Header
                currentScreen={currentScreen}
                onNavigate={handleNavigate}
                showBottomTabs={showBottomTabs}
                setShowBottomTabs={setShowBottomTabs}
                isGridView={isGridView}
                setIsGridView={setIsGridView}
                showManagement={showManagement}
                setShowManagement={setShowManagement}
                productFormProduct={productFormProduct}
                isProductFormOpen={isProductFormOpen}
              />
              <ErrorBoundary>
                {renderMainContent()}
              </ErrorBoundary>
              <BottomNavigation
                activeTab={activeBottomTab}
                onTabPress={handleBottomTabPress}
                currentScreen={currentScreen as MainScreen}
              />
            </>
          )}
        </View>
      </ErrorBoundary>
    </StoreProvider>
  );
}

function MenuScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Section - Square POS Style */}
      <View className="bg-white px-6 pt-8 pb-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Square POS
        </Text>
        <Text className="text-lg text-gray-600">
          Manage your business inventory
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 pt-8">
        {/* Quick Stats Cards */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">0</Text>
            <Text className="text-sm text-gray-600">Total Products</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">0</Text>
            <Text className="text-sm text-gray-600">Collections</Text>
          </View>
        </View>

        {/* Main Navigation Cards */}
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => onNavigate('dashboard')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">🎈</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Dashboard
                </Text>
                <Text className="text-gray-600">
                  Sales metrics and analytics
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('sales')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">💰</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Sales
                </Text>
                <Text className="text-gray-600">
                  Track sales performance
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('reports')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">📈</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Reports
                </Text>
                <Text className="text-gray-600">
                  Real-time business reports
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('products')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">📦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Products
                </Text>
                <Text className="text-gray-600">
                  Manage your product inventory
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('collections')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">🏷️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Collections
                </Text>
                <Text className="text-gray-600">
                  Organize products into groups
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        <View className="mt-auto mb-8">
          <View className="bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-sm text-gray-600 text-center">
              Powered by Instant DB • Real-time sync
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Header({ currentScreen, onNavigate, showBottomTabs, setShowBottomTabs, isGridView, setIsGridView, showManagement, setShowManagement, productFormProduct, isProductFormOpen }: {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  showBottomTabs: boolean;
  setShowBottomTabs: (show: boolean) => void;
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
  showManagement: boolean;
  setShowManagement: (show: boolean) => void;
  productFormProduct?: any;
  isProductFormOpen?: boolean;
}) {
  const insets = useSafeAreaInsets();

  const getScreenInfo = (screen: Screen) => {
    // If product form is open, show product title
    if (screen === 'products' && isProductFormOpen) {
      const productTitle = productFormProduct?.title || '';
      return {
        title: `Products : ${productTitle}`,
        icon: '📦'
      };
    }

    switch (screen) {
      case 'dashboard':
        return { title: 'Dashboard', icon: '🎈' };
      case 'products':
        return { title: 'Products', icon: '📦' };
      case 'collections':
        return { title: 'Collections', icon: '🏷️' };
      case 'options':
        return { title: 'Options', icon: 'O' };

      case 'sales':
        return { title: 'Sales', icon: '💰' };
      case 'reports':
        return { title: 'Reports', icon: '📈' };
      default:
        return { title: 'Square POS', icon: '☰' };
    }
  };

  const screenInfo = getScreenInfo(currentScreen);

  return (
    <View style={{ paddingTop: insets.top }}>
      <View className="px-4 h-16 flex items-center flex-row justify-between bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => onNavigate('menu')}
          className="flex-row items-center"
        >
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">{screenInfo.icon}</Text>
            <Text className="text-xl font-semibold text-gray-900">{screenInfo.title}</Text>
          </View>
        </TouchableOpacity>

        {currentScreen !== 'menu' && (
          <View className="flex flex-row items-center">
            {/* Square icon replaces toggle button on all screens */}
            {(currentScreen === 'products' || currentScreen === 'collections') ? (
              /* Square icon for management screen toggle on products/collections */
              <TouchableOpacity
                onPress={() => setShowManagement(!showManagement)}
                className={`px-3 py-2 rounded-lg ${
                  showManagement ? 'bg-blue-100' : ''
                }`}
              >
                <Feather name="square" size={24} color={showManagement ? "#2563eb" : "black"} />
              </TouchableOpacity>
            ) : (
              /* Square icon for bottom tabs toggle on other screens */
              <TouchableOpacity
                onPress={() => setShowBottomTabs(!showBottomTabs)}
                className={`px-3 py-2 rounded-lg ${
                  !showBottomTabs ? 'bg-blue-100' : ''
                }`}
              >
                <Feather name="square" size={24} color={!showBottomTabs ? "#2563eb" : "black"} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
