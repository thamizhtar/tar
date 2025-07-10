// Metafields system types and constants

export type MetafieldEntityType = 
  | 'products' 
  | 'items' 
  | 'collections' 
  | 'customers' 
  | 'orders' 
  | 'draft_orders' 
  | 'locations' 
  | 'pages' 
  | 'blogs';

export interface MetafieldSet {
  id: string;
  title: string;
  type: 'single_line_text' | 'multi_line_text' | 'number' | 'url' | 'email' | 'color' | 'date' | 'date_time' | 'boolean' | 'weight' | 'dimension' | 'volume' | 'money' | 'rating' | 'reference';
  category: MetafieldEntityType;
  group: string;
  order: number;
  filter: boolean;
  config: {
    placeholder?: string;
    min?: number;
    max?: number;
    unit?: string;
    options?: string[];
    reference_type?: string;
  };
  storeId: string;
}

export interface MetafieldValue {
  id: string;
  metafieldSetId: string;
  entityId: string;
  value: string;
  storeId: string;
}

export const METAFIELD_CATEGORIES = [
  { id: 'products', name: 'Products' },
  { id: 'items', name: 'Items' },
  { id: 'collections', name: 'Collections' },
  { id: 'customers', name: 'Customers' },
  { id: 'orders', name: 'Orders' },
  { id: 'draft_orders', name: 'Draft orders' },
  { id: 'locations', name: 'Locations' },
  { id: 'pages', name: 'Pages' },
  { id: 'blogs', name: 'Blogs' },
] as const;
