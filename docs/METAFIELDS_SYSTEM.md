# Metafields System Documentation

## Overview

The metafields system provides a comprehensive solution for managing custom data across all entity types in the TAR POS application, similar to Shopify's metafields functionality. This system allows users to create custom fields for products, variants, collections, customers, orders, and more.

## Architecture

### Database Schema

The metafields system uses two separate entities for maximum efficiency and clarity:

#### Metafield Definitions
```typescript
metafieldDefinitions: {
  id: string;
  key: string; // Unique key: namespace.entityType.fieldName
  name: string; // Display name
  type: string; // Field type (text, number, boolean, etc.)
  entityType: string; // Target entity type
  namespace: string; // Organization namespace (custom, app, system)
  group?: string; // Display group
  description?: string; // Field description
  required?: boolean; // Required field
  config?: any; // Type-specific configuration
  storeId: string; // Store isolation
  createdAt: Date;
  updatedAt: Date;
}
```

#### Metafield Values
```typescript
metafieldValues: {
  id: string;
  definitionKey: string; // Links to metafieldDefinitions.key
  entityId: string; // ID of the entity this value belongs to
  entityType: string; // Type of entity for faster queries
  value: string; // The actual value (stored as string, parsed by type)
  storeId: string; // Store isolation
  createdAt: Date;
  updatedAt: Date;
}
```

#### Key Benefits of This Schema:
1. **Separation of Concerns** - Definitions and values are separate
2. **Efficient Queries** - No need for complex boolean filters
3. **Unique Keys** - Definitions use namespace.entityType.fieldName format
4. **Simple Relationships** - Values link to definitions via key
5. **Fast Lookups** - Indexed keys for performance
6. **Clean Data** - No mixed-purpose fields

### Supported Entity Types

The system supports metafields for the following entity types (matching Shopify):

- **Products** - Custom product information
- **Variants** - Product variant specific data
- **Collections** - Collection metadata
- **Customers** - Customer custom fields
- **Orders** - Order custom information
- **Draft Orders** - Draft order metadata
- **Locations** - Store location data
- **Pages** - Page custom fields
- **Blogs** - Blog metadata
- **Blog Posts** - Blog post custom fields
- **Markets** - Market-specific data
- **Shop** - Store-wide settings

### Metafield Types

The system supports various field types:

#### Text Types
- `single_line_text` - Short text (up to 255 characters)
- `multi_line_text` - Long text (up to 65,535 characters)
- `rich_text` - Formatted text with HTML

#### Numeric Types
- `number` - Integer or decimal number
- `weight` - Weight measurement
- `dimension` - Length, width, or height
- `volume` - Volume measurement
- `rating` - Rating scale (1-5)

#### Other Types
- `boolean` - True/false value
- `date` - Date value
- `date_time` - Date and time value
- `url` - Web address
- `email` - Email address
- `color` - Color value
- `json` - Structured data in JSON format
- `file_reference` - File upload
- `product_reference` - Reference to a product
- `variant_reference` - Reference to a product variant
- `page_reference` - Reference to a page
- `list.single_line_text` - List of text values
- `list.color` - List of color values

## Components

### MetafieldsSystem
Main entry point component that shows entity type selection.

**Props:**
- `onClose?: () => void` - Close callback
- `showHeader?: boolean` - Show/hide header
- `entityId?: string` - Specific entity ID for values
- `entityType?: MetafieldEntityType` - Entity type when showing values

### MetafieldDefinitions
Manages metafield definitions for a specific entity type.

**Props:**
- `entityType: MetafieldEntityType` - Target entity type
- `onClose: () => void` - Close callback
- `showHeader?: boolean` - Show/hide header

### MetafieldValues
Manages metafield values for a specific entity instance.

**Props:**
- `entityId: string` - Entity instance ID
- `entityType: MetafieldEntityType` - Entity type
- `onClose: () => void` - Close callback
- `showHeader?: boolean` - Show/hide header

### MetafieldDefinitionForm
Form for creating/editing metafield definitions.

**Props:**
- `entityType: MetafieldEntityType` - Target entity type
- `groupName?: string` - Pre-selected group
- `definition?: MetafieldDefinition | null` - Existing definition for editing
- `onSave: (definition: Partial<MetafieldDefinition>) => void` - Save callback
- `onClose: () => void` - Close callback

### MetafieldValueForm
Form for editing metafield values.

**Props:**
- `definition: MetafieldDefinition` - Field definition
- `value?: MetafieldValue | null` - Existing value for editing
- `onSave: (value: string) => void` - Save callback
- `onDelete?: () => void` - Delete callback (optional)
- `onClose: () => void` - Close callback

### GroupForm
Form for creating/editing metafield groups.

**Props:**
- `groupName?: string` - Existing group name for editing
- `onSave: (groupName: string) => void` - Save callback
- `onClose: () => void` - Close callback

## Usage

### Navigation Integration

The metafields system is integrated into the main navigation:

1. **Main Menu** → **Commerce** → **Metafields**
2. **Product Form** → **Metafields Tab**

### Creating Metafield Definitions

1. Navigate to Metafields from the main menu
2. Select an entity type (e.g., Products)
3. Create groups to organize fields
4. Add field definitions with appropriate types and configurations

### Managing Metafield Values

1. Open an entity form (e.g., Product Form)
2. Go to the Metafields tab
3. Tap "Metafields" to open the values interface
4. Set values for defined metafields

### Data Flow

1. **Definitions** are created with `isDefinition: true` and `parentid: 'metafield-definitions-{entityType}'`
2. **Values** are created with `isDefinition: false` and `parentid: {entityId}`
3. Values reference their definitions via `definitionId`

## Features

### Organization
- **Groups** - Organize related metafields together
- **Namespaces** - Separate custom, app, and system metafields
- **Ordering** - Control display order within groups

### Validation
- **Required Fields** - Mark fields as mandatory
- **Type Validation** - Automatic validation based on field type
- **Custom Validation** - Configurable validation rules

### Filtering
- **Filterable Fields** - Mark fields for use in filtering/search
- **Indexed Queries** - Efficient database queries for filters

### User Experience
- **Clean Interface** - Shopify-inspired design
- **Full-Screen Forms** - Dedicated editing interfaces
- **Real-time Updates** - InstantDB real-time synchronization
- **Error Handling** - Comprehensive error messages and validation

## Integration Points

### Product Form
- Metafields tab provides direct access to product metafields
- Values are managed through the new metafields system
- Legacy metafields code has been replaced

### Future Integrations
- Collection forms
- Customer management
- Order processing
- Inventory management

## Best Practices

### Definition Management
1. Use descriptive names for metafields
2. Group related fields together
3. Set appropriate types for data validation
4. Use namespaces to organize different sources

### Value Management
1. Validate data before saving
2. Use default values where appropriate
3. Handle required fields properly
4. Provide clear error messages

### Performance
1. Use indexed fields for filtering
2. Limit the number of metafields per entity
3. Use appropriate data types
4. Consider data size for large text fields

## Migration

The system is designed to work alongside existing metafields implementations and can be gradually adopted across the application. Legacy metafields data can be migrated to the new system as needed.
