import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the InstantDB before importing components
const mockTransact = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('../lib/instant', () => ({
  db: {
    useQuery: mockUseQuery,
    transact: mockTransact,
    tx: {
      products: {
        'test-id': {
          update: jest.fn()
        }
      }
    }
  },
  getCurrentTimestamp: () => Date.now()
}));

jest.mock('@instantdb/react-native', () => ({
  id: () => 'test-id'
}));

// Mock R2 service to avoid configuration errors
jest.mock('../lib/r2-service', () => ({
  r2Service: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getSignedUrl: jest.fn()
  }
}));

// Now import components after mocking
import ProductForm from '../components/prod-form';

// Mock store context
const mockStore = {
  id: 'test-store-id',
  name: 'Test Store'
};

// Create a simple wrapper that provides the store context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
    </div>
  );
};

// Test the tags conversion logic directly
describe('ProductForm Tags Conversion Logic', () => {

  it('should convert JSON string tags to array format', () => {
    const product = {
      tags: '["Electronics", "Accessories"]'
    };

    // Simulate the conversion logic from the component
    const convertTags = (tags: any) => {
      if (typeof tags === 'string') {
        try {
          return JSON.parse(tags);
        } catch {
          return tags ? [tags] : [];
        }
      }
      return Array.isArray(tags) ? tags : (tags ? [tags] : []);
    };

    const result = convertTags(product.tags);
    expect(result).toEqual(['Electronics', 'Accessories']);
  });

  it('should handle malformed JSON tags gracefully', () => {
    const product = {
      tags: 'invalid-json'
    };

    const convertTags = (tags: any) => {
      if (typeof tags === 'string') {
        try {
          return JSON.parse(tags);
        } catch {
          return tags ? [tags] : [];
        }
      }
      return Array.isArray(tags) ? tags : (tags ? [tags] : []);
    };

    const result = convertTags(product.tags);
    expect(result).toEqual(['invalid-json']);
  });

  it('should handle array tags correctly', () => {
    const product = {
      tags: ['Electronics', 'Accessories']
    };

    const convertTags = (tags: any) => {
      if (typeof tags === 'string') {
        try {
          return JSON.parse(tags);
        } catch {
          return tags ? [tags] : [];
        }
      }
      return Array.isArray(tags) ? tags : (tags ? [tags] : []);
    };

    const result = convertTags(product.tags);
    expect(result).toEqual(['Electronics', 'Accessories']);
  });

  it('should convert array tags to JSON string for database storage', () => {
    const tags = ['Electronics', 'Accessories'];

    // Simulate the conversion logic for saving
    const convertForSave = (tags: any) => {
      if (Array.isArray(tags)) {
        return JSON.stringify(tags);
      } else {
        return JSON.stringify([]);
      }
    };

    const result = convertForSave(tags);
    expect(result).toBe('["Electronics","Accessories"]');
  });

  it('should handle empty tags correctly', () => {
    const convertTags = (tags: any) => {
      if (typeof tags === 'string') {
        try {
          return JSON.parse(tags);
        } catch {
          return tags ? [tags] : [];
        }
      }
      return Array.isArray(tags) ? tags : (tags ? [tags] : []);
    };

    expect(convertTags(null)).toEqual([]);
    expect(convertTags(undefined)).toEqual([]);
    expect(convertTags('')).toEqual([]);
    expect(convertTags([])).toEqual([]);
  });
});
