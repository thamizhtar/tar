# Instant DB - Complete Guide and Rules

## Overview
Instant DB is a modern Firebase alternative that provides real-time, collaborative database functionality with a declarative query language (InstaQL) and mutation system (InstaML). It's designed for building real-time and collaborative apps like Notion or Figma.

## Core Concepts

### 1. Initialization
```typescript
import { init, i } from '@instantdb/react';

// Basic initialization
const db = init({ appId: 'YOUR_APP_ID' });

// With schema for type safety
const db = init({ 
  appId: 'YOUR_APP_ID', 
  schema: yourSchema 
});
```

### 2. Schema Definition
Schemas are defined using three building blocks:

#### Namespaces (Entities)
- Equivalent to "tables" in SQL or "collections" in NoSQL
- Defined in the `entities` section

#### Attributes
- Properties of entities (like columns in SQL)
- Types: `i.string()`, `i.number()`, `i.boolean()`, `i.date()`, `i.json()`, `i.any()`
- Constraints: `.unique()`, `.indexed()`, `.optional()`, `.clientRequired()`

#### Links
- Relationships between entities
- Defined bidirectionally with forward and reverse directions
- Types: one-to-one, one-to-many, many-to-many

### 3. Schema Example
```typescript
const schema = i.schema({
  entities: {
    products: i.entity({
      name: i.string(),
      description: i.string().optional(),
      price: i.number(),
      category: i.string().indexed(),
      createdAt: i.date(),
      isActive: i.boolean(),
    }),
    collections: i.entity({
      name: i.string().unique(),
      description: i.string().optional(),
      createdAt: i.date(),
    }),
  },
  links: {
    productCollection: {
      forward: { on: 'products', has: 'one', label: 'collection' },
      reverse: { on: 'collections', has: 'many', label: 'products' },
    },
  },
});
```

## Data Operations (InstaML)

### Writing Data

#### Create/Update
```typescript
import { id } from '@instantdb/react';

// Create new entity
db.transact(
  db.tx.products[id()].update({
    name: 'Product Name',
    price: 99.99,
    createdAt: Date.now(),
  })
);

// Update existing entity
db.transact(
  db.tx.products[productId].update({
    price: 149.99,
  })
);
```

#### Merge (for nested objects)
```typescript
// Merge instead of overwrite
db.transact(
  db.tx.products[productId].merge({
    metadata: { tags: ['new-tag'] }
  })
);
```

#### Delete
```typescript
db.transact(db.tx.products[productId].delete());
```

#### Link/Unlink
```typescript
// Create relationship
db.transact(
  db.tx.products[productId].link({ collection: collectionId })
);

// Remove relationship
db.transact(
  db.tx.products[productId].unlink({ collection: collectionId })
);
```

#### Lookup by Unique Attribute
```typescript
import { lookup } from '@instantdb/react';

db.transact(
  db.tx.collections[lookup('name', 'Electronics')].update({
    description: 'Updated description'
  })
);
```

### Reading Data (InstaQL)

#### Basic Queries
```typescript
// Fetch all products
const { isLoading, error, data } = db.useQuery({ products: {} });

// Fetch multiple namespaces
const { isLoading, error, data } = db.useQuery({ 
  products: {}, 
  collections: {} 
});

// Fetch with relationships
const { isLoading, error, data } = db.useQuery({
  products: {
    collection: {}
  }
});
```

#### Filtering
```typescript
// Basic where clause
const query = {
  products: {
    $: {
      where: {
        isActive: true,
        price: { $gt: 50 }
      }
    }
  }
};

// Advanced filtering
const query = {
  products: {
    $: {
      where: {
        or: [
          { category: 'Electronics' },
          { category: 'Books' }
        ]
      }
    }
  }
};
```

#### Pagination
```typescript
// Offset-based
const query = {
  products: {
    $: {
      limit: 10,
      offset: 20,
      order: { createdAt: 'desc' }
    }
  }
};

// Cursor-based
const query = {
  products: {
    $: {
      first: 10,
      after: pageInfo?.products?.endCursor
    }
  }
};
```

## Best Practices

### 1. Schema Design
- Use meaningful entity names
- Add indexes to frequently queried attributes
- Use unique constraints where appropriate
- Define relationships clearly with descriptive labels

### 2. Query Optimization
- Use `fields` parameter to select only needed data
- Add indexes to attributes used in where clauses
- Use pagination for large datasets
- Defer queries until necessary data is available

### 3. Transaction Patterns
- Batch related operations in single transactions
- Use atomic transactions for data consistency
- Handle errors appropriately
- Use lookup for unique attribute operations

### 4. Type Safety
- Always define schemas for production apps
- Use TypeScript utility types: `InstaQLParams`, `InstaQLResult`, `InstaQLEntity`
- Leverage intellisense and type checking

### 5. Performance
- Use `queryOnce` for one-time data fetching
- Implement proper loading states
- Handle offline scenarios
- Use comparison operators only on indexed attributes

## CLI Commands

### Setup
```bash
# Initialize project
npx instant-cli@latest init

# Push schema to production
npx instant-cli@latest push schema

# Push permissions
npx instant-cli@latest push perms

# Pull latest from production
npx instant-cli@latest pull
```

### Environment Variables
```bash
# App ID (choose one)
INSTANT_APP_ID=your_app_id
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id
PUBLIC_INSTANT_APP_ID=your_app_id
VITE_INSTANT_APP_ID=your_app_id
EXPO_PUBLIC_INSTANT_APP_ID=your_app_id
```

## Error Handling

### Query Errors
```typescript
const { isLoading, error, data } = db.useQuery(query);

if (error) {
  console.error('Query failed:', error.message);
  // Handle error appropriately
}
```

### Transaction Errors
```typescript
try {
  await db.transact(transactions);
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle error appropriately
}
```

## Security and Permissions

### Schema Security
```typescript
// instant.perms.ts
const rules = {
  attrs: {
    allow: {
      $default: 'false', // Prevent schema changes from client
    },
  },
} satisfies InstantRules;
```

### Data Permissions
- Use permissions to control data access
- Implement user-based access controls
- Validate data on the backend when needed

## Common Patterns

### 1. Real-time Updates
```typescript
// Data automatically updates across all connected clients
const { data } = db.useQuery({ products: {} });
// Any changes to products will trigger re-renders
```

### 2. Optimistic Updates
```typescript
// Transactions are optimistic by default
db.transact(db.tx.products[id()].update({ name: 'New Product' }));
// UI updates immediately, syncs with server
```

### 3. Conditional Queries
```typescript
const { user } = db.useAuth();
const { data } = db.useQuery(
  user ? { products: { $: { where: { userId: user.id } } } } : null
);
```

This documentation covers the essential concepts and patterns for working with Instant DB effectively.
