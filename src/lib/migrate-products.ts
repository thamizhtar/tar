// Migration script to update existing products from old schema to new schema
import { db, getCurrentTimestamp } from './instant';

export const migrateProductsToNewSchema = async () => {
  try {
    // Get all products
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];

    if (products.length === 0) {
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    const timestamp = getCurrentTimestamp();

    for (const product of products) {
      const updates: any = {
        updatedAt: timestamp
      };

      let needsUpdate = false;

      // Migrate name to title
      if (product.name && !product.title) {
        updates.title = product.name;
        needsUpdate = true;
        console.log(`📝 Migrating name "${product.name}" to title`);
      }

      // Migrate description to excerpt
      if (product.description && !product.excerpt) {
        updates.excerpt = product.description;
        needsUpdate = true;
        console.log(`📝 Migrating description to excerpt for "${product.name || product.title}"`);
      }

      // Migrate imageUrl to image
      if (product.imageUrl && !product.image) {
        updates.image = product.imageUrl;
        needsUpdate = true;
        console.log(`🖼️ Migrating imageUrl to image for "${product.name || product.title}"`);
      }

      // Migrate isActive to pos (if pos is not set)
      if (product.isActive !== undefined && product.pos === undefined) {
        updates.pos = product.isActive;
        needsUpdate = true;
      }

      // Set default values for new fields if they don't exist
      if (product.website === undefined) {
        updates.website = false;
        needsUpdate = true;
      }

      if (product.featured === undefined) {
        updates.featured = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.transact(db.tx.products[product.id].update(updates));
        migratedCount++;
      }
    }

    return { success: true, migrated: migratedCount };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to run migration in development
export const runMigrationIfNeeded = async () => {
  if (__DEV__) {
    try {
      // Check if there are products with old schema
      const { data } = await db.queryOnce({
        products: {}
      });

      const products = data?.products || [];
      const needsMigration = products.some(product =>
        (product.name && !product.title) ||
        (product.description && !product.excerpt) ||
        (product.imageUrl && !product.image) ||
        (product.isActive !== undefined && product.pos === undefined)
      );

      if (needsMigration) {
        const result = await migrateProductsToNewSchema();
      }
    } catch (error) {
      // Silent error handling in development
    }
  }
};

// Force complete migration for all products
export const forceCompleteMigration = async () => {
  try {
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];

    let processedCount = 0;
    const timestamp = getCurrentTimestamp();

    for (const product of products) {
      const updates: any = {
        updatedAt: timestamp
      };

      let needsUpdate = false;

      // Ensure all products have required new fields
      if (!product.title && product.name) {
        updates.title = product.name;
        needsUpdate = true;
      } else if (!product.title) {
        updates.title = 'Untitled Product';
        needsUpdate = true;
      }

      if (!product.excerpt && product.description) {
        updates.excerpt = product.description;
        needsUpdate = true;
      }

      if (!product.image && product.imageUrl) {
        updates.image = product.imageUrl;
        needsUpdate = true;
      }

      if (product.pos === undefined && product.isActive !== undefined) {
        updates.pos = product.isActive;
        needsUpdate = true;
      } else if (product.pos === undefined) {
        updates.pos = false;
        needsUpdate = true;
      }

      // Set default values for new fields
      if (product.website === undefined) {
        updates.website = false;
        needsUpdate = true;
      }



      if (product.featured === undefined) {
        updates.featured = false;
        needsUpdate = true;
      }

      if (product.stock === undefined) {
        updates.stock = 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.transact(db.tx.products[product.id].update(updates));
        processedCount++;
      }
    }

    return { success: true, processed: processedCount };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
