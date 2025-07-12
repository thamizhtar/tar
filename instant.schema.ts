// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  // We inferred 3 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    brands: i.entity({
      name: i.string().unique().indexed(),
      storeId: i.string().indexed(),
    }),
    categories: i.entity({
      name: i.string().unique().indexed(),
      parent: i.string().optional(),
      storeId: i.string().indexed(),
    }),
    collections: i.entity({
      createdAt: i.date(),
      description: i.string().optional(),
      image: i.string().optional(),
      isActive: i.boolean(),
      name: i.string().unique().indexed(),
      parent: i.string().optional(),
      pos: i.boolean().optional(),
      sortOrder: i.number().optional(),
      storefront: i.boolean().optional(),
      storeId: i.string().indexed(),
      updatedAt: i.date(),
    }),
    items: i.entity({
      storeId: i.string().indexed(),
      productId: i.string().indexed(),

      // Basic Identity
      sku: i.string(),
      barcode: i.string().optional(),
      option1: i.string().optional(),
      option2: i.string().optional(),
      option3: i.string().optional(),
      image: i.string().optional(),
      path: i.string().optional(),

      // Pricing
      cost: i.number().optional(),
      price: i.number().optional(),
      saleprice: i.number().optional(),
      margin: i.number().optional(),

      // Inventory Control Settings
      trackQty: i.boolean().optional(),
      allowPreorder: i.boolean().optional(),

      // Global Stock Summary (calculated from locations)
      totalOnHand: i.number().optional().indexed(),
      totalAvailable: i.number().optional().indexed(),
      totalCommitted: i.number().optional().indexed(),

      // Legacy fields (keep for backward compatibility)
      available: i.number().optional(),
      committed: i.number().optional(),
      onhand: i.number().optional(),
      unavailable: i.number().optional(),
      reorderlevel: i.number().optional(),

      // Metadata
      metafields: i.any().optional(),
      createdAt: i.date().optional(),
      updatedAt: i.date().optional()
    }),
    media: i.entity({
      order: i.number().optional(),
      parentid: i.string().indexed(),
      storeId: i.string().indexed(),
      type: i.string().optional(),
      url: i.string().optional(),
    }),
    metasets: i.entity({
      category: i.string().indexed(),
      createdAt: i.date(),
      group: i.string().optional(),
      inputConfig: i.json().optional(),
      name: i.string(),
      namespace: i.string().optional(),
      key: i.string().optional(),
      description: i.string().optional(),
      order: i.number().optional(),
      required: i.boolean().optional(),
      storeId: i.string().indexed(),
      type: i.string(),
      title: i.string().optional(),
      filter: i.boolean().optional(),
      config: i.json().optional(),
      value: i.string().optional(),
      parentid: i.string().optional(),
      updatedAt: i.date(),
    }),
    metavalues: i.entity({
      id: i.string().unique().indexed(),
      setId: i.string().indexed(),
      entityId: i.string().indexed(),
      entityType: i.string().indexed(),
      value: i.string().optional(),
      storeId: i.string().indexed(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    modifiers: i.entity({
      identifier: i.string().optional(),
      notes: i.string().optional(),
      storeId: i.string().indexed(),
      title: i.string().optional(),
      type: i.string().optional(),
      value: i.number().optional(),
    }),
    opsets: i.entity({
      createdAt: i.date().optional(),
      name: i.string(),
      storeId: i.string().indexed(),
      updatedAt: i.date().optional(),
    }),
    opvalues: i.entity({
      createdAt: i.date(),
      group: i.string().optional(),
      identifierType: i.string(),
      identifierValue: i.string(),
      name: i.string(),
      order: i.number().optional(),
      setId: i.string().indexed(),
      storeId: i.string().indexed(),
      updatedAt: i.date(),
    }),
    // Customer Management
    customers: i.entity({
      storeId: i.string().indexed(),
      name: i.string(),
      email: i.string().optional(),
      phone: i.string().optional(),
      notes: i.string().optional(),
      tags: i.string().optional(), // JSON string of tags array
      createdAt: i.date(),
      updatedAt: i.date().optional(),

      // Address information
      defaultAddress: i.any().optional(), // JSON object for default address
      addresses: i.any().optional(), // JSON array of addresses

      // Customer stats
      totalOrders: i.number().optional(),
      totalSpent: i.number().optional(),
      lastOrderDate: i.date().optional(),
    }),

    // Enhanced Order Items
    orderitems: i.entity({
      orderid: i.string().indexed(), // Keep original name for compatibility
      productId: i.string().optional(),
      itemId: i.string().optional(), // Reference to items table for variants
      sku: i.string().optional(),
      title: i.string(),
      variantTitle: i.string().optional(),
      qty: i.number(),
      price: i.number(),
      compareAtPrice: i.number().optional(),
      cost: i.number().optional(),
      taxRate: i.number().optional(),
      taxAmount: i.number().optional(),
      discountAmount: i.number().optional(),
      lineTotal: i.number(),
      storeId: i.string().indexed(),

      // Product details for order history
      productImage: i.string().optional(),
      productType: i.string().optional(),
      vendor: i.string().optional(),

      // Fulfillment tracking
      fulfillmentStatus: i.string().optional(), // 'unfulfilled', 'partial', 'fulfilled'
      trackingNumber: i.string().optional(),
      trackingUrl: i.string().optional(),
    }),

    // Enhanced Orders
    orders: i.entity({
      storeId: i.string().indexed(),
      orderNumber: i.string().unique().indexed(), // Human readable order number like #1001
      referid: i.string().unique().indexed(), // Internal reference ID (keeping original name for compatibility)
      createdat: i.date(), // Keep original name for compatibility

      // Customer Information
      customerId: i.string().optional().indexed(),
      customerName: i.string().optional(),
      customerEmail: i.string().optional(),
      customerPhone: i.string().optional(),

      // Order Status
      status: i.string().indexed(), // 'open', 'closed', 'cancelled'
      fulfillmentStatus: i.string().indexed(), // 'unfulfilled', 'partial', 'fulfilled'
      paymentStatus: i.string().indexed(), // 'unpaid', 'partial', 'paid', 'refunded'

      // Financial Information
      currency: i.string().optional(),
      subtotal: i.number(),
      discountAmount: i.number().optional(),
      discountCode: i.string().optional(),
      shippingAmount: i.number().optional(),
      taxAmount: i.number().optional(),
      total: i.number(),
      totalPaid: i.number().optional(),
      totalRefunded: i.number().optional(),

      // Addresses
      billingAddress: i.any().optional(),
      shippingAddress: i.any().optional(),

      // Order Metadata
      notes: i.string().optional(),
      tags: i.string().optional(), // JSON string of tags array
      source: i.string().optional(), // 'pos', 'online', 'phone', etc.

      // Timestamps
      updatedAt: i.date().optional(),
      closedAt: i.date().optional(),
      cancelledAt: i.date().optional(),

      // Location and Staff
      locationId: i.string().optional(),
      staffId: i.string().optional(),

      // Additional fields for POS
      deviceId: i.string().optional(),
      receiptNumber: i.string().optional(),

      // Market/Channel information
      market: i.string().optional(), // 'online', 'pos', 'wholesale', etc.
    }),
    path: i.entity({
      location: i.string().optional(),
      notes: i.string().optional(),
      parentid: i.string().indexed(),
      storeId: i.string().indexed(),
      title: i.string().optional(),
    }),
    products: i.entity({
      blurb: i.string().optional(),
      brand: i.string().optional(),
      category: i.string().optional(),
      cost: i.number().optional(),
      createdAt: i.date(),
      featured: i.boolean().optional(),
      image: i.string().optional(),
      medias: i.json().optional(),
      metafields: i.json().optional(),
      modifiers: i.any().optional(),
      name: i.string().optional(),
      notes: i.string().optional(),
      options: i.string().optional(),
      pos: i.boolean().optional(),
      price: i.number().optional(),
      promoinfo: i.any().optional(),
      publishAt: i.date().optional(),
      relproducts: i.any().optional(),
      saleinfo: i.any().optional(),
      saleprice: i.number().optional(),
      sellproducts: i.any().optional(),
      seo: i.any().optional(),
      sku: i.string().optional(),
      status: i.boolean().optional(),
      stock: i.number().optional(),
      storeId: i.string().indexed(),
      stores: i.any().optional(),
      tags: i.string().indexed().optional(),
      title: i.string().optional(),
      type: i.string().indexed().optional(),
      updatedAt: i.date().optional(),
      vendor: i.string().indexed().optional(),
      website: i.boolean().optional(),
    }),
    stocks: i.entity({
      available: i.number().optional(),
      committed: i.number().optional(),
      datetime: i.date().optional(),
      expdate: i.date().optional(),
      fifo: i.number().optional(),
      parentid: i.string().indexed(),
      path: i.string().optional(),
      storeId: i.string().indexed(),
    }),
    store: i.entity({
      address: i.string().optional(),
      createdAt: i.date(),
      description: i.string().optional(),
      email: i.string().optional(),
      logo: i.string().optional(),
      name: i.string().unique().indexed(),
      phone: i.string().optional(),
      updatedAt: i.date().optional(),
      website: i.string().optional(),
    }),
    tags: i.entity({
      createdAt: i.date().optional(),
      name: i.string().unique().indexed(),
      storeId: i.string().indexed(),
      updatedAt: i.date().optional(),
    }),
    types: i.entity({
      name: i.string().unique().indexed(),
      parent: i.string().optional(),
      storeId: i.string().indexed(),
    }),
    vendors: i.entity({
      name: i.string().unique().indexed(),
      storeId: i.string().indexed(),
    }),
    // Locations for multi-location inventory
    locations: i.entity({
      storeId: i.string().indexed(),

      name: i.string(),
      type: i.string().optional(),
      address: i.any().optional(),

      // Location Settings
      isDefault: i.boolean().optional(),
      isActive: i.boolean().optional(),
      fulfillsOnlineOrders: i.boolean().optional(),

      // Contact & Details
      contactInfo: i.any().optional(),

      metafields: i.any().optional(),
      createdAt: i.date().optional(),
      updatedAt: i.date().optional()
    }),

    // Per-location inventory levels (core table)
    ilocations: i.entity({
      itemId: i.string().indexed(),
      locationId: i.string().indexed(),
      storeId: i.string().indexed(),

      // Stock Levels
      onHand: i.number().optional(),
      committed: i.number().optional(),
      unavailable: i.number().optional(),

      // Reorder Management
      reorderLevel: i.number().optional(),
      reorderQuantity: i.number().optional(),

      // Tracking
      lastCounted: i.date().optional(),
      lastReceived: i.date().optional(),

      updatedAt: i.date().optional()
    }),

    // Inventory adjustment history
    iadjust: i.entity({
      storeId: i.string().indexed(),
      itemId: i.string().indexed(),
      locationId: i.string().indexed(),

      // Adjustment Details
      type: i.string(),
      quantityBefore: i.number(),
      quantityAfter: i.number(),
      quantityChange: i.number(),

      // Reason & Reference
      reason: i.string().optional(),
      reference: i.string().optional(),
      notes: i.string().optional(),

      // Audit Trail
      userId: i.string().optional(),
      userName: i.string().optional(),

      createdAt: i.date().optional().indexed()
    }),

    inventory: i.entity({
      id: i.string().unique().indexed(),
      storeId: i.string().indexed(),
      itemId: i.string().indexed(),
      quantity: i.number().optional(),
      reserved: i.number().optional(),
      available: i.number().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
  },
  links: {
    inventoryStocks: {
      forward: {
        on: "inventory",
        has: "many",
        label: "stocks",
      },
      reverse: {
        on: "stocks",
        has: "one",
        label: "inventory",
      },
    },
    productsCollection: {
      forward: {
        on: "products",
        has: "one",
        label: "collection",
      },
      reverse: {
        on: "collections",
        has: "many",
        label: "products",
      },
    },
    productsItem: {
      forward: {
        on: "products",
        has: "many",
        label: "item",
      },
      reverse: {
        on: "items",
        has: "one",
        label: "product",
      },
    },
    itemsIlocations: {
      forward: {
        on: "items",
        has: "many",
        label: "ilocations",
      },
      reverse: {
        on: "ilocations",
        has: "one",
        label: "item",
      },
    },
    locationsIlocations: {
      forward: {
        on: "locations",
        has: "many",
        label: "ilocations",
      },
      reverse: {
        on: "ilocations",
        has: "one",
        label: "location",
      },
    },
    itemsIadjust: {
      forward: {
        on: "items",
        has: "many",
        label: "iadjust",
      },
      reverse: {
        on: "iadjust",
        has: "one",
        label: "item",
      },
    },
    locationsIadjust: {
      forward: {
        on: "locations",
        has: "many",
        label: "iadjust",
      },
      reverse: {
        on: "iadjust",
        has: "one",
        label: "location",
      },
    },
    // Customer relationships
    customersOrders: {
      forward: {
        on: "customers",
        has: "many",
        label: "orders",
      },
      reverse: {
        on: "orders",
        has: "one",
        label: "customer",
      },
    },

    // Order relationships
    ordersOrderitems: {
      forward: {
        on: "orders",
        has: "many",
        label: "orderitems",
      },
      reverse: {
        on: "orderitems",
        has: "one",
        label: "order",
      },
    },

    // Order item relationships to products and items
    orderitemsProducts: {
      forward: {
        on: "orderitems",
        has: "one",
        label: "product",
      },
      reverse: {
        on: "products",
        has: "many",
        label: "orderitems",
      },
    },

    orderitemsItems: {
      forward: {
        on: "orderitems",
        has: "one",
        label: "item",
      },
      reverse: {
        on: "items",
        has: "many",
        label: "orderitems",
      },
    },

    store$users: {
      forward: {
        on: "store",
        has: "many",
        label: "$users",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "store",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
