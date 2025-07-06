# API Documentation

This document describes the key APIs and services used in the TAR POS application.

## InstantDB Integration

### Database Schema

The application uses InstantDB for real-time data synchronization. The schema is defined in `instant.schema.ts`.

#### Core Entities

##### Products
```typescript
products: {
  id: string;
  title: string;
  image?: string;
  medias?: any[];
  excerpt?: string;
  notes?: string;
  type?: string;
  category?: string;
  unit?: string;
  price?: number;
  saleprice?: number;
  vendor?: string;
  brand?: string;
  options?: any;
  modifiers?: any;
  metafields?: any;
  pos?: boolean;
  website?: boolean;
  status?: boolean;
  stock?: number;
  storeId: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

##### Collections
```typescript
collections: {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

##### Stores
```typescript
store: {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

##### Items (Product Variants)
```typescript
items: {
  id: string;
  productId: string;
  sku?: string;
  price?: number;
  saleprice?: number;
  cost?: number;
  available?: number;
  committed?: number;
  onhand?: number;
  option1?: string;
  option2?: string;
  option3?: string;
  storeId: string;
}
```

### Query Patterns

#### Basic Query
```typescript
const { isLoading, error, data } = db.useQuery({
  products: {
    $: {
      where: {
        storeId: currentStore.id
      }
    }
  }
});
```

#### Query with Relationships
```typescript
const { data } = db.useQuery({
  products: {
    $: {
      where: { storeId: currentStore.id }
    },
    collection: {},
    item: {}
  }
});
```

#### Mutations
```typescript
// Create/Update
await db.transact(db.tx.products[productId].update(productData));

// Link relationships
await db.transact(db.tx.products[productId].link({ 
  collection: collectionId 
}));

// Unlink relationships
await db.transact(db.tx.products[productId].unlink({ 
  collection: collectionId 
}));

// Delete
await db.transact(db.tx.products[productId].delete());
```

## Cloudflare R2 Service

### Configuration

R2 service is configured in `src/lib/r2-config.ts`:

```typescript
export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  endpoint: string;
}
```

### Upload Service

#### File Upload
```typescript
interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const result = await r2Service.uploadFile(file, 'media');
// Returns: { success: boolean, url?: string, key?: string, error?: string }
```

#### Delete File
```typescript
const success = await r2Service.deleteFile(key);
// Returns: boolean
```

#### Generate Signed URL
```typescript
const signedUrl = await r2Service.getSignedUrl(key, 3600); // 1 hour expiry
// Returns: string
```

### R2Image Component

Optimized image component with caching and error handling:

```typescript
<R2Image
  url={imageUrl}
  style={{ width: 200, height: 200 }}
  fallback={<Text>Failed to load</Text>}
  onError={(error) => console.error(error)}
  onLoad={() => console.log('Image loaded')}
/>
```

## Store Context API

### Provider Setup
```typescript
<StoreProvider>
  <App />
</StoreProvider>
```

### Hook Usage
```typescript
const {
  currentStore,
  stores,
  isLoading,
  setCurrentStore,
  createStore,
  updateStore,
  deleteStore,
  refreshStores
} = useStore();
```

### Store Operations

#### Create Store
```typescript
const newStore = await createStore({
  name: 'My Store',
  description: 'Store description',
  email: 'store@example.com'
});
```

#### Update Store
```typescript
await updateStore(storeId, {
  name: 'Updated Store Name',
  description: 'Updated description'
});
```

#### Switch Store
```typescript
await setCurrentStore(store);
```

## Logging Service

### Basic Logging
```typescript
import { log } from '../lib/logger';

log.debug('Debug message', 'ComponentName');
log.info('Info message', 'ComponentName', { data: 'extra' });
log.warn('Warning message', 'ComponentName');
log.error('Error message', 'ComponentName');
```

### Performance Monitoring
```typescript
import { PerformanceMonitor } from '../lib/logger';

// Synchronous
const result = PerformanceMonitor.measure('operation-name', () => {
  // Your operation
  return result;
});

// Asynchronous
const result = await PerformanceMonitor.measureAsync('async-operation', async () => {
  // Your async operation
  return result;
});
```

### Error Tracking
```typescript
import { trackError } from '../lib/logger';

try {
  // Some operation
} catch (error) {
  trackError(error, 'ComponentName', { 
    userId: user.id,
    action: 'save-product'
  });
}
```

## Error Handling

### Error Boundary
```typescript
<ErrorBoundary
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    // Handle error
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Loading Error Component
```typescript
<LoadingError 
  error="Failed to load data"
  onRetry={() => refetch()}
  retryText="Try Again"
/>
```

### Empty State Component
```typescript
<EmptyState
  icon="inbox"
  title="No Products Found"
  description="Start by adding your first product"
  action={{
    label: "Add Product",
    onPress: () => navigate('create-product')
  }}
/>
```

## Navigation

### Screen Navigation
```typescript
const handleNavigate = (screen: Screen, data?: any) => {
  setCurrentScreen(screen);
  // Handle navigation logic
};
```

### Bottom Tab Navigation
```typescript
const handleBottomTabPress = (tab: BottomTab) => {
  setActiveBottomTab(tab);
};
```

## Performance Best Practices

### Component Optimization
```typescript
// Use React.memo for expensive components
const ProductItem = React.memo(({ product, onPress }) => {
  // Component implementation
});

// Use useMemo for expensive calculations
const filteredProducts = useMemo(() => {
  return products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [products, searchQuery]);

// Use useCallback for event handlers
const handleProductSelect = useCallback((product) => {
  // Handle selection
}, []);
```

### FlatList Optimization
```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={15}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  renderItem={({ item }) => <MemoizedItem item={item} />}
/>
```
