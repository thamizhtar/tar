# Development Guide

This guide covers development practices, patterns, and conventions used in the TAR POS application.

## Code Organization

### Component Structure

Components should follow this structure:

```typescript
// 1. Imports (external libraries first, then internal)
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../lib/instant';
import { log, trackError } from '../lib/logger';

// 2. Types and interfaces
interface ComponentProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

// 3. Component implementation
export default function Component({ title, onPress, disabled = false }: ComponentProps) {
  // 4. State declarations
  const [loading, setLoading] = useState(false);
  
  // 5. Memoized values
  const buttonStyle = useMemo(() => ({
    opacity: disabled ? 0.5 : 1
  }), [disabled]);
  
  // 6. Event handlers
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    try {
      setLoading(true);
      onPress?.();
    } catch (error) {
      trackError(error as Error, 'Component');
    } finally {
      setLoading(false);
    }
  }, [disabled, loading, onPress]);
  
  // 7. Render
  return (
    <TouchableOpacity onPress={handlePress} style={buttonStyle}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ProductForm.tsx`)
- **Utilities**: camelCase (e.g., `logger.ts`)
- **Screens**: kebab-case (e.g., `product-detail.tsx`)
- **Tests**: Same as source file with `.test.` or `.spec.` (e.g., `logger.test.ts`)

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   └── feature/         # Feature-specific components
├── screens/             # Full-screen components
├── lib/                 # Utilities, services, and contexts
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── __tests__/          # Test utilities and setup
```

## Development Patterns

### State Management

#### Local State
Use `useState` for component-local state:

```typescript
const [isVisible, setIsVisible] = useState(false);
const [formData, setFormData] = useState({
  title: '',
  price: 0
});
```

#### Global State
Use React Context for global state:

```typescript
// Context definition
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook for consuming context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

#### Database State
Use InstantDB for persistent, real-time state:

```typescript
const { isLoading, error, data } = db.useQuery({
  products: {
    $: { where: { storeId: currentStore.id } }
  }
});
```

### Error Handling

#### Component Level
```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setError(null);
    await performAction();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMessage);
    trackError(err as Error, 'ComponentName');
  }
};

// In render
if (error) {
  return <ErrorMessage message={error} onRetry={handleAction} />;
}
```

#### Global Level
Use Error Boundaries for unhandled errors:

```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Performance Optimization

#### Memoization
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Event handlers
const handlePress = useCallback((id: string) => {
  onItemPress(id);
}, [onItemPress]);

// Components
const MemoizedComponent = React.memo(({ data }) => {
  return <ExpensiveComponent data={data} />;
});
```

#### List Optimization
```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  getItemLayout={getItemLayout}
  renderItem={renderMemoizedItem}
/>
```

## Testing Patterns

### Unit Tests
```typescript
describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Component title="Test" />
    );
    
    expect(getByText('Test')).toBeTruthy();
  });
  
  it('should handle press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Component title="Test" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
describe('ProductForm Integration', () => {
  it('should save product successfully', async () => {
    const { getByTestId, getByText } = render(
      <StoreProvider>
        <ProductForm />
      </StoreProvider>
    );
    
    fireEvent.changeText(getByTestId('title-input'), 'Test Product');
    fireEvent.press(getByText('Save'));
    
    await waitFor(() => {
      expect(mockDb.transact).toHaveBeenCalled();
    });
  });
});
```

### Mock Patterns
```typescript
// Mock external dependencies
jest.mock('../lib/instant', () => ({
  db: {
    useQuery: jest.fn(),
    transact: jest.fn()
  }
}));

// Mock with implementation
const mockUseQuery = jest.fn().mockReturnValue({
  isLoading: false,
  error: null,
  data: { products: [] }
});
```

## Styling Guidelines

### NativeWind Usage
```typescript
// Preferred: Use Tailwind classes
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-semibold text-gray-900">
    Title
  </Text>
</View>

// Avoid: Inline styles (except for dynamic values)
<View style={{ backgroundColor: dynamicColor }}>
  <Text className="text-base">Content</Text>
</View>
```

### Responsive Design
```typescript
// Use responsive classes
<View className="w-full md:w-1/2 lg:w-1/3">
  <Text className="text-sm md:text-base lg:text-lg">
    Responsive text
  </Text>
</View>
```

### Color System
```typescript
// Use semantic color classes
<View className="bg-white border border-gray-200">
  <Text className="text-gray-900">Primary text</Text>
  <Text className="text-gray-600">Secondary text</Text>
  <Text className="text-red-600">Error text</Text>
  <Text className="text-green-600">Success text</Text>
</View>
```

## API Integration

### InstantDB Patterns
```typescript
// Query with error handling
const { isLoading, error, data } = db.useQuery(
  currentStore?.id ? {
    products: {
      $: { where: { storeId: currentStore.id } }
    }
  } : null // Don't query if no store
);

// Mutation with error handling
const saveProduct = async (productData: ProductData) => {
  try {
    await db.transact(db.tx.products[productId].update(productData));
    log.info('Product saved successfully', 'ProductForm');
  } catch (error) {
    trackError(error as Error, 'ProductForm', { productId });
    throw error;
  }
};
```

### R2 Integration
```typescript
// File upload with progress
const uploadImage = async (file: MediaFile) => {
  try {
    setUploading(true);
    const result = await r2Service.uploadFile(file, 'products');
    
    if (result.success) {
      setImageUrl(result.url);
      log.info('Image uploaded successfully', 'ImageUpload');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    trackError(error as Error, 'ImageUpload');
    setError('Failed to upload image');
  } finally {
    setUploading(false);
  }
};
```

## Debugging

### Logging
```typescript
// Use structured logging
log.debug('Component mounted', 'ComponentName');
log.info('User action', 'ComponentName', { action: 'button-press', userId });
log.warn('Deprecated feature used', 'ComponentName');
log.error('Operation failed', 'ComponentName', { error: error.message });
```

### Performance Monitoring
```typescript
// Monitor expensive operations
const result = await PerformanceMonitor.measureAsync('data-fetch', async () => {
  return await fetchData();
});
```

### React DevTools
- Use React DevTools for component inspection
- Use Flipper for network debugging
- Use Expo DevTools for bundle analysis

## Code Quality

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all props and data structures
- Avoid `any` type (use `unknown` if necessary)
- Use type guards for runtime type checking

### ESLint Rules
- Follow the configured ESLint rules
- Use `npm run lint:fix` to auto-fix issues
- Add custom rules for project-specific patterns

### Git Workflow
1. Create feature branches from `main`
2. Write tests for new features
3. Ensure all tests pass
4. Run linting and type checking
5. Create pull request with descriptive title
6. Code review before merging

## Common Patterns

### Loading States
```typescript
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}

if (!data || data.length === 0) {
  return <EmptyState title="No data found" />;
}

return <DataComponent data={data} />;
```

### Form Handling
```typescript
const [formData, setFormData] = useState(initialData);
const [errors, setErrors] = useState<Record<string, string>>({});

const updateField = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error when user starts typing
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};

const validate = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.title.trim()) {
    newErrors.title = 'Title is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Navigation
```typescript
const handleNavigate = useCallback((screen: Screen, params?: any) => {
  log.info('Navigation', 'App', { from: currentScreen, to: screen });
  setCurrentScreen(screen);
  if (params) {
    setScreenParams(params);
  }
}, [currentScreen]);
```
