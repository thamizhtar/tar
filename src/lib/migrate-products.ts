// Migration script to update existing products from old schema to new schema
import { db, getCurrentTimestamp } from './instant';

export const migrateProductsToNewSchema = async () => {
  console.log('🔄 Starting product schema migration...');
  
  try {
    // Get all products
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];
    console.log(`📦 Found ${products.length} products to migrate`);

    if (products.length === 0) {
      console.log('✅ No products to migrate');
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
        console.log(`⚙️ Migrating isActive to pos for "${product.name || product.title}"`);
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
        console.log(`✅ Migrated product: ${product.name || product.title}`);
      }
    }

    console.log(`🎉 Migration completed! Migrated ${migratedCount} products`);
    return { success: true, migrated: migratedCount };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Helper function to run migration in development
export const runMigrationIfNeeded = async () => {
  if (__DEV__) {
    console.log('🔍 Checking if migration is needed...');

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
        console.log('🚀 Migration needed, starting...');
        const result = await migrateProductsToNewSchema();

        if (result.success) {
          console.log(`✅ Migration completed successfully! Migrated ${result.migrated} products`);
        } else {
          console.error('❌ Migration failed:', result.error);
        }
      } else {
        console.log('✅ No migration needed, all products are up to date');
      }
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
    }
  }
};

// Force complete migration for all products
export const forceCompleteMigration = async () => {
  console.log('🔄 Force completing migration for all products...');

  try {
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];
    console.log(`📦 Processing ${products.length} products`);

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
        console.log(`✅ Updated product: ${product.title || product.name || product.id}`);
      }
    }

    console.log(`🎉 Force migration completed! Processed ${processedCount} products`);
    return { success: true, processed: processedCount };

  } catch (error) {
    console.error('❌ Force migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
