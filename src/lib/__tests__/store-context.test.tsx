import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { StoreProvider, useStore } from '../store-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the db module
const mockUseQuery = jest.fn();
const mockTransact = jest.fn();

jest.mock('../instant', () => ({
  db: {
    useQuery: mockUseQuery,
    transact: mockTransact,
    tx: {
      store: {}
    }
  }
}));

// Test component that uses the store context
const TestComponent = () => {
  const { currentStore, stores, isLoading } = useStore();
  
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
      <Text testID="current-store">{currentStore?.name || 'no-store'}</Text>
      <Text testID="stores-count">{stores.length}</Text>
    </>
  );
};

describe('StoreProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('should provide initial loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true
    });

    const { getByTestId } = render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    );

    expect(getByTestId('loading')).toHaveTextContent('loading');
    expect(getByTestId('current-store')).toHaveTextContent('no-store');
    expect(getByTestId('stores-count')).toHaveTextContent('0');
  });

  it('should auto-select first store when available', async () => {
    const mockStores = [
      { id: 'store-1', name: 'Test Store 1' },
      { id: 'store-2', name: 'Test Store 2' }
    ];

    mockUseQuery.mockReturnValue({
      data: { store: mockStores },
      isLoading: false
    });

    const { getByTestId } = render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
      expect(getByTestId('stores-count')).toHaveTextContent('2');
    });

    // Should auto-select first store
    await waitFor(() => {
      expect(getByTestId('current-store')).toHaveTextContent('Test Store 1');
    });
  });

  it('should load stored current store from AsyncStorage', async () => {
    const mockStores = [
      { id: 'store-1', name: 'Test Store 1' },
      { id: 'store-2', name: 'Test Store 2' }
    ];

    // Pre-populate AsyncStorage with stored store ID
    await AsyncStorage.setItem('@current_store', 'store-2');

    mockUseQuery.mockReturnValue({
      data: { store: mockStores },
      isLoading: false
    });

    const { getByTestId } = render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
      expect(getByTestId('current-store')).toHaveTextContent('Test Store 2');
    });
  });

  it('should handle empty stores list', async () => {
    mockUseQuery.mockReturnValue({
      data: { store: [] },
      isLoading: false
    });

    const { getByTestId } = render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
      expect(getByTestId('current-store')).toHaveTextContent('no-store');
      expect(getByTestId('stores-count')).toHaveTextContent('0');
    });
  });

  it('should handle invalid stored store ID', async () => {
    const mockStores = [
      { id: 'store-1', name: 'Test Store 1' }
    ];

    // Store an ID that doesn't exist in the stores list
    await AsyncStorage.setItem('@current_store', 'invalid-store-id');

    mockUseQuery.mockReturnValue({
      data: { store: mockStores },
      isLoading: false
    });

    const { getByTestId } = render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('loaded');
      // Should auto-select first store since stored ID is invalid
      expect(getByTestId('current-store')).toHaveTextContent('Test Store 1');
    });

    // Should clear the invalid stored ID
    await waitFor(async () => {
      const storedId = await AsyncStorage.getItem('@current_store');
      expect(storedId).toBe('store-1'); // Should be updated to valid store
    });
  });
});

describe('useStore hook', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useStore must be used within a StoreProvider');
    
    consoleSpy.mockRestore();
  });
});
