// Instant DB configuration and initialization
import { init } from '@instantdb/react-native';
import schema from '../../instant.schema';

// Get the app ID from environment variables
const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error('EXPO_PUBLIC_INSTANT_APP_ID is not set in environment variables');
}

// Initialize the database with schema for type safety
export const db = init({
  appId: APP_ID,
  schema,
});

// Export types for use throughout the app
export type { AppSchema } from '../../instant.schema';

// Helper types for better TypeScript experience
export type Product = {
  id: string;
  title: string;
  image?: string;
  medias?: any;
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
  saleinfo?: any;
  stores?: any;
  pos?: boolean;
  website?: boolean;
  seo?: any;
  tags?: string | string[]; // Database stores as string, UI uses array
  cost?: number;
  qrcode?: string;
  stock?: number;
  createdAt: number | string;
  updatedAt?: number | string;
  publishAt?: number | string;
  publish?: boolean;
  promoinfo?: any;
  featured?: boolean;
  relproducts?: any;
  sellproducts?: any;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: number | string;
  updatedAt: number | string;
  products?: Product[];
};

// Utility function to generate current timestamp
export const getCurrentTimestamp = () => Date.now();

// Utility function to format dates
export const formatDate = (timestamp: number | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString();
};

// Utility function to format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
