# Shopify-Style Inventory Management System
## Multi-Location Stock Tracking & Management

---

## 🎯 **System Overview**

This system provides **Shopify-like inventory management** with multi-location stock tracking, following the exact patterns shown in your reference screenshot. The system focuses on practical inventory operations with clean, efficient mobile interface.

### **Core Features**
- **Multi-Location Inventory**: Track stock across multiple locations
- **Item-Level Management**: Individual SKU and barcode tracking
- **Stock Control Options**: Track quantity and allow overselling settings
- **Adjustment History**: Complete audit trail of stock changes
- **Location-Based Availability**: Real-time stock levels per location
- **Clean Mobile Interface**: Follows your existing design patterns

### **Design Principles**
- **Shopify-Inspired**: Familiar interface patterns for inventory management
- **Location-Centric**: Stock tracking based on physical locations
- **Real-Time Sync**: InstantDB for immediate updates across devices
- **Mobile-First**: Optimized for mobile inventory operations
- **Integration-Ready**: Seamless integration with existing product system

---

## 📊 **Database Schema (InstantDB)**

### **Enhanced Items Entity**
```typescript
// Enhanced items entity (builds on existing)
items: i.entity({
  id: i.string().id(),
  storeId: i.string().indexed(),
  productId: i.string().indexed(),
  
  // Basic Identity (keep existing)
  sku: i.string(),                        // Stock keeping unit
  barcode: i.string().optional(),         // Barcode (ISBN, UPC, etc.)
  option1: i.string().optional(),
  option2: i.string().optional(),
  option3: i.string().optional(),
  image: i.string().optional(),
  path: i.string().optional(),
  
  // Pricing (keep existing)
  cost: i.number().optional(),
  price: i.number().optional(),
  saleprice: i.number().optional(),
  margin: i.number().optional(),
  
  // Inventory Control Settings
  trackQty: i.boolean().default(true),           // Track quantity toggle
  allowPreorder: i.boolean().default(false),     // Allow purchase when out of stock
  
  // Global Stock Summary (calculated from locations)
  totalOnHand: i.number().default(0),            // Total across all locations
  totalAvailable: i.number().default(0),         // Total available for sale
  totalCommitted: i.number().default(0),         // Total reserved
  
  // Metadata
  metafields: i.any().optional(),
  createdAt: i.date().default('now'),
  updatedAt: i.date().autoUpdate()
}),

// Locations for multi-location inventory
locations: i.entity({
  id: i.string().id(),
  storeId: i.string().indexed(),
  
  name: i.string(),                       // "135, street a", "Warehouse 2"
  type: i.string().default("warehouse"),  // "warehouse" | "retail" | "virtual"
  address: i.any().optional(),
  
  // Location Settings
  isDefault: i.boolean().default(false),
  isActive: i.boolean().default(true),
  fulfillsOnlineOrders: i.boolean().default(true),
  
  // Contact & Details
  contactInfo: i.any().optional(),
  
  metafields: i.any().optional(),
  createdAt: i.date().default('now'),
  updatedAt: i.date().autoUpdate()
}),

// Per-location inventory levels (core table)
itemLocations: i.entity({
  id: i.string().id(),                    // Unique ID for this record
  itemId: i.string().indexed(),           // → items.id
  locationId: i.string().indexed(),       // → locations.id
  storeId: i.string().indexed(),          // For filtering
  
  // Stock Levels
  onHand: i.number().default(0),          // Physical inventory count
  committed: i.number().default(0),       // Reserved for orders
  unavailable: i.number().default(0),     // Damaged/QC hold/expired
  
  // Calculated: available = onHand - committed - unavailable
  
  // Reorder Management
  reorderLevel: i.number().optional(),    // Low stock threshold
  reorderQuantity: i.number().optional(), // Suggested reorder amount
  
  // Tracking
  lastCounted: i.date().optional(),       // Last physical count date
  lastReceived: i.date().optional(),      // Last time stock was received
  
  updatedAt: i.date().autoUpdate()
}),

// Inventory adjustment history
inventoryAdjustments: i.entity({
  id: i.string().id(),
  storeId: i.string().indexed(),
  itemId: i.string().indexed(),
  locationId: i.string().indexed(),
  
  // Adjustment Details
  type: i.string(),                       // "adjustment" | "transfer" | "sale" | "purchase" | "count"
  quantityBefore: i.number(),             // Stock before adjustment
  quantityAfter: i.number(),              // Stock after adjustment
  quantityChange: i.number(),             // +/- change amount
  
  // Reason & Reference
  reason: i.string().optional(),          // "Correction", "Damaged", "Sold", "Received"
  reference: i.string().optional(),       // Order ID, PO number, etc.
  notes: i.string().optional(),
  
  // Audit Trail
  userId: i.string().optional(),          // Who made the change
  userName: i.string().optional(),        // User name for display
  
  createdAt: i.date().default('now')
}),
```

---

## 📱 **User Interface Design**

### **Inventory Details Screen (Shopify-Style)**
Based on your reference screenshot, here's the exact interface structure:

```
┌─────────────────────────────────────────┐
│ ×    Inventory details                  │
│      Red / S / Canvas                   │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ SKU (Stock keeping unit)            │ │
│ │ PRODUCT-49-RED                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Barcode (ISBN, UPC, etc.)        📷 │ │
│ │ 36527510829.0                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Track quantity                       ● │
│                                         │
│ Allow purchase when out of stock     ○ │
│                                         │
│ View adjustment history                 │
│                                         │
│ Quantity                 Edit locations │
│ 0 available • 2 locations               │
│                                         │
│ Location                     Available  │
│                                         │
│ 135, street a                        0  │
│                                         │
│ Warehouse 2                          0  │
│                                         │
└─────────────────────────────────────────┘
```

### **Main Inventory Dashboard**
```
┌─────────────────────────────────────────┐
│ Inventory                            ×  │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────┐ ┌─────────────┐         │
│ │ Stock       │ │ Adjustments │         │
│ │ Overview    │ │             │         │
│ │             │ │             │         │
│ └─────────────┘ └─────────────┘         │
│                                         │
│ ┌─────────────┐ ┌─────────────┐         │
│ │ Transfers   │ │ Locations   │         │
│ │             │ │             │         │
│ │             │ │             │         │
│ └─────────────┘ └─────────────┘         │
│                                         │
│ ┌─────────────┐ ┌─────────────┐         │
│ │ Reports     │ │ History     │         │
│ │             │ │             │         │
│ │             │ │             │         │
│ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────┘
```

### **Edit Locations Screen**
```
┌─────────────────────────────────────────┐
│ ← Edit locations                        │
├─────────────────────────────────────────┤
│                                         │
│ Location                     Available  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 135, street a                    [0]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Warehouse 2                      [0]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ + Add location ]                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │              Save                   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔄 **Core Features & Workflows**

### **1. Multi-Location Stock Management**
- **Location Setup**: Create and manage multiple warehouse/store locations
- **Stock Distribution**: Track inventory levels across all locations
- **Real-time Updates**: Instant synchronization across all devices
- **Location Types**: Warehouse, retail store, virtual locations

### **2. Item Inventory Control**
- **Track Quantity Toggle**: Enable/disable quantity tracking per item
- **Overselling Control**: Allow/prevent sales when out of stock
- **SKU Management**: Unique stock keeping units per item
- **Barcode Integration**: Scan barcodes for quick item identification

### **3. Stock Adjustments**
- **Manual Adjustments**: Correct stock levels with reason codes
- **Bulk Updates**: Update multiple items/locations at once
- **Adjustment History**: Complete audit trail of all changes
- **Reason Tracking**: Track why adjustments were made

### **4. Location Transfers**
- **Inter-location Transfers**: Move stock between locations
- **Transfer Tracking**: Monitor transfer status and history
- **Automatic Updates**: Update stock levels on both locations
- **Transfer Validation**: Prevent negative stock transfers

### **5. Inventory Reporting**
- **Stock Overview**: Current levels across all locations
- **Low Stock Alerts**: Notifications for items below reorder levels
- **Movement History**: Track all inventory movements
- **Valuation Reports**: Calculate inventory value by location

---

## 🎯 **Navigation Integration**

### **Adding to ComList**
Update the ComList component to include Inventory:

```typescript
const commerceItems = [
  { id: 'collections', title: 'Collections' },
  { id: 'options', title: 'Options' },
  { id: 'metafields', title: 'Metafields' },
  { id: 'inventory', title: 'Inventory' },    // NEW
  { id: 'reports', title: 'Reports' }
];
```

### **Product Form Integration**
Add inventory section to product forms:
- Link to item inventory details
- Quick stock overview
- Direct access to adjustments
- Location-specific stock display

---

## 🔧 **Technical Implementation**

### **Database Queries**
```typescript
// Get item with all location stock
const itemWithStock = await db.queryOnce({
  items: {
    $: { id: itemId },
    itemLocations: {
      location: {}
    }
  }
});

// Get low stock items
const lowStockItems = await db.queryOnce({
  itemLocations: {
    $: {
      where: {
        onHand: { $lt: reorderLevel }
      }
    },
    item: {},
    location: {}
  }
});

// Create stock adjustment
await db.transact([
  db.tx.itemLocations[itemLocationId].update({
    onHand: newQuantity,
    updatedAt: getCurrentTimestamp()
  }),
  db.tx.inventoryAdjustments[adjustmentId].update({
    itemId,
    locationId,
    type: 'adjustment',
    quantityBefore: oldQuantity,
    quantityAfter: newQuantity,
    quantityChange: newQuantity - oldQuantity,
    reason: 'Manual correction',
    userId: currentUser.id,
    createdAt: getCurrentTimestamp()
  })
]);
```

### **Stock Calculation Functions**
```typescript
// Calculate available stock
function calculateAvailable(itemLocation: ItemLocation): number {
  return itemLocation.onHand - itemLocation.committed - itemLocation.unavailable;
}

// Update item totals across all locations
async function updateItemTotals(itemId: string) {
  const locations = await db.queryOnce({
    itemLocations: {
      $: { where: { itemId } }
    }
  });

  const totals = locations.reduce((acc, loc) => ({
    totalOnHand: acc.totalOnHand + loc.onHand,
    totalAvailable: acc.totalAvailable + calculateAvailable(loc),
    totalCommitted: acc.totalCommitted + loc.committed
  }), { totalOnHand: 0, totalAvailable: 0, totalCommitted: 0 });

  await db.transact(
    db.tx.items[itemId].update(totals)
  );
}
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
**Database & Core Setup**
- Update InstantDB schema with new entities
- Create default location for existing stores
- Migrate existing stock data to new structure
- Add "Inventory" to ComList navigation

**Basic UI Components**
- Inventory dashboard with tile navigation
- Location management screen
- Basic item inventory details screen

### **Phase 2: Core Features (Week 2)**
**Stock Management**
- Multi-location stock tracking
- Stock adjustment functionality
- Location-based stock display
- Basic transfer between locations

**Integration**
- Product form integration
- Item creation with default stock
- Sales integration (stock deduction)

### **Phase 3: Advanced Features (Week 3)**
**Enhanced Operations**
- Bulk stock adjustments
- Advanced transfer management
- Barcode scanning integration
- Inventory reporting dashboard

**User Experience**
- Search and filter functionality
- Low stock alerts
- Adjustment history viewing
- Performance optimization

### **Phase 4: Polish & Optimization (Week 4)**
**Final Features**
- Advanced reporting
- Export functionality
- User permissions
- Performance tuning

**Testing & Documentation**
- Comprehensive testing
- User documentation
- Training materials
- Deployment preparation

---

## 💡 **Benefits of This Approach**

### **1. Shopify-Like Familiarity**
- **Proven UX Patterns**: Users familiar with Shopify will feel at home
- **Industry Standard**: Follows established inventory management conventions
- **Mobile Optimized**: Clean, efficient mobile interface
- **Scalable Design**: Grows with business needs

### **2. Technical Advantages**
- **InstantDB Perfect Fit**: Real-time sync ideal for inventory operations
- **Existing Integration**: Builds on current product/item system
- **Performance Optimized**: Fast queries and updates
- **Future-Ready**: Easy to enhance with additional features

### **3. Business Value**
- **Immediate ROI**: Solves real inventory management problems
- **Operational Efficiency**: Reduces manual inventory tracking
- **Multi-Location Support**: Scales with business growth
- **Audit Trail**: Complete history of all inventory changes

### **4. User Experience**
- **Consistent Design**: Follows your existing app patterns
- **Intuitive Interface**: Easy to learn and use
- **Mobile-First**: Optimized for on-the-go inventory management
- **Real-Time Updates**: Instant synchronization across devices

---

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Review Schema**: Confirm database structure meets requirements
2. **UI Mockups**: Create detailed designs for inventory screens
3. **Navigation Planning**: Plan integration with existing ComList
4. **Data Migration**: Plan migration of existing stock data

### **Technical Preparation**
1. **Schema Updates**: Prepare InstantDB schema changes
2. **Component Design**: Design reusable inventory components
3. **Integration Points**: Plan product form integration
4. **Testing Strategy**: Develop testing approach

This focused inventory system provides immediate value with Shopify-like functionality while maintaining your app's clean design principles. The system is designed to be practical, efficient, and scalable for real-world inventory management needs.

**Note**: The advanced blockchain traceability system has been moved to `docs/traceability.md` as a separate, independent future enhancement that can be developed later without affecting this core inventory system.
