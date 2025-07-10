// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  // We inferred 1 attribute!
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
      image: i.string().optional(), // Primary collection image URL
      isActive: i.boolean(),
      name: i.string().unique().indexed(),
      parent: i.string().optional(),
      pos: i.boolean().optional(), // Available in POS
      sortOrder: i.number().optional(),
      storefront: i.boolean().optional(), // Available on storefront
      storeId: i.string().indexed(),
      updatedAt: i.date(),
    }),
    items: i.entity({
      available: i.number().optional(),
      barcode: i.string().optional(),
      committed: i.number().optional(),
      cost: i.number().optional(),
      image: i.string().optional(),
      margin: i.number().optional(),
      metafields: i.any().optional(),
      onhand: i.number().optional(),
      option1: i.string().optional(),
      option2: i.string().optional(),
      option3: i.string().optional(),
      path: i.string().optional(),
      price: i.number().optional(),
      productId: i.string().indexed(),
      reorderlevel: i.number().optional(),
      saleprice: i.number().optional(),
      sku: i.string().optional(),
      storeId: i.string().indexed(),
      unavailable: i.number().optional(),
    }),
    media: i.entity({
      order: i.number().optional(),
      parentid: i.string().indexed(),
      storeId: i.string().indexed(),
      type: i.string().optional(),
      url: i.string().optional(),
    }),
    metafields: i.entity({
      config: i.any().optional(),
      filter: i.boolean().indexed().optional(),
      group: i.string().indexed().optional(), // Index for better group queries
      order: i.number().optional(),
      parentid: i.string().indexed(), // Required for linking definitions/values
      storeId: i.string().indexed(), // Required for store isolation
      title: i.string(), // Required field
      type: i.string().indexed().optional(), // Index for filtering by type
      value: i.string().optional(),
    }),
    modifiers: i.entity({
      identifier: i.string().optional(),
      notes: i.string().optional(),
      storeId: i.string().indexed(),
      title: i.string().optional(),
      type: i.string().optional(),
      value: i.number().optional(),
    }),
    optionSets: i.entity({
      name: i.string(),
      storeId: i.string().indexed(),
    }),
    optionValues: i.entity({
      setId: i.string().indexed(),
      name: i.string(),
      identifierType: i.string(), // 'text', 'color', 'image'
      identifierValue: i.string(),
      group: i.string().optional(), // Group within the option set (Group 1, Group 2, Group 3)
      order: i.number().optional(),
      storeId: i.string().indexed(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    orderitems: i.entity({
      orderid: i.string().indexed(),
      price: i.number().optional(),
      qty: i.number().optional(),
      sku: i.string().optional(),
      storeId: i.string().indexed(),
      taxamt: i.number().optional(),
      taxrate: i.number().optional(),
      title: i.string().optional(),
      total: i.number().optional(),
      varianttitle: i.string().optional(),
    }),
    orders: i.entity({
      billaddrs: i.any().optional(),
      createdat: i.date(),
      currency: i.string().optional(),
      customerid: i.string().optional(),
      discount: i.number().optional(),
      email: i.string().optional(),
      fulfill: i.string().optional(),
      name: i.string().optional(),
      phone: i.string().optional(),
      referid: i.string().unique().indexed(),
      shipaddrs: i.any().optional(),
      shipping: i.number().optional(),
      status: i.string().optional(),
      storeId: i.string().indexed(),
      subtotal: i.number().optional(),
      tax: i.number().optional(),
      total: i.number().optional(),
      updatedat: i.date().optional(),
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
      metafields: i.any().optional(),
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
  },
  links: {
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
