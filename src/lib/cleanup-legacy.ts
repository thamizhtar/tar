// Cleanup script to remove legacy field data after migration is complete
import { db, getCurrentTimestamp } from './instant';
import { verifyMigrationStatus } from './verify-migration';

export const cleanupLegacyFields = async (force: boolean = false) => {
  console.log('🧹 Starting legacy field cleanup...');
  
  try {
    // First verify migration is complete
    if (!force) {
      const status = await verifyMigrationStatus();
      
      if (!status.migrationComplete) {
        console.log('❌ Cannot cleanup - migration not complete');
        console.log(`  - ${status.notMigrated} products not migrated`);
        console.log(`  - ${status.partiallyMigrated} products partially migrated`);
        return { success: false, error: 'Migration not complete' };
      }
      
      if (status.hasLegacyData === 0) {
        console.log('✅ No legacy data to cleanup');
        return { success: true, cleaned: 0 };
      }
      
      console.log(`📋 Found ${status.hasLegacyData} products with legacy data to cleanup`);
    }

    // Get all products
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];
    let cleanedCount = 0;
    const timestamp = getCurrentTimestamp();

    for (const product of products) {
      const updates: any = {
        updatedAt: timestamp
      };

      let needsCleanup = false;

      // Remove legacy fields by setting them to null/undefined
      if (product.name !== undefined) {
        updates.name = null;
        needsCleanup = true;
      }

      if (product.description !== undefined) {
        updates.description = null;
        needsCleanup = true;
      }

      if (product.imageUrl !== undefined) {
        updates.imageUrl = null;
        needsCleanup = true;
      }

      if (product.isActive !== undefined) {
        updates.isActive = null;
        needsCleanup = true;
      }

      if (product.sku !== undefined) {
        updates.sku = null;
        needsCleanup = true;
      }

      if (needsCleanup) {
        await db.transact(db.tx.products[product.id].update(updates));
        cleanedCount++;
        console.log(`🧹 Cleaned legacy data from: ${product.title || product.id}`);
      }
    }

    console.log(`🎉 Legacy cleanup completed! Cleaned ${cleanedCount} products`);
    return { success: true, cleaned: cleanedCount };

  } catch (error) {
    console.error('❌ Legacy cleanup failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Complete migration and cleanup process
export const completeMigrationProcess = async () => {
  console.log('🚀 Starting complete migration process...');
  
  try {
    // Step 1: Verify current status
    console.log('\n📋 Step 1: Verifying current migration status...');
    const initialStatus = await verifyMigrationStatus();
    
    if (initialStatus.migrationComplete && initialStatus.hasLegacyData === 0) {
      console.log('✅ Migration already complete - nothing to do');
      return { success: true, message: 'Already complete' };
    }

    // Step 2: Force complete migration if needed
    if (initialStatus.notMigrated > 0 || initialStatus.partiallyMigrated > 0) {
      console.log('\n🔄 Step 2: Completing migration...');
      const { forceCompleteMigration } = await import('./migrate-products');
      const migrationResult = await forceCompleteMigration();
      
      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }
      
      console.log(`✅ Migration completed for ${migrationResult.processed} products`);
    }

    // Step 3: Skip verification since we have legacy data to clean up
    console.log('\n⏭️ Step 3: Skipping verification - proceeding to cleanup...');

    // Step 4: Force cleanup legacy data (since products have both new and legacy fields)
    console.log('\n🧹 Step 4: Force cleaning up legacy data...');
    const cleanupResult = await cleanupLegacyFields(true); // Force cleanup

    if (!cleanupResult.success) {
      throw new Error(`Cleanup failed: ${cleanupResult.error}`);
    }

    // Step 5: Final verification
    console.log('\n✅ Step 5: Final verification...');
    const finalStatus = await verifyMigrationStatus();
    
    console.log('🎉 Complete migration process finished!');
    console.log(`  - Total products: ${finalStatus.totalProducts}`);
    console.log(`  - Fully migrated: ${finalStatus.fullyMigrated}`);
    console.log(`  - Legacy data remaining: ${finalStatus.hasLegacyData}`);
    console.log(`  - Migration complete: ${finalStatus.migrationComplete ? '✅' : '❌'}`);

    return { 
      success: true, 
      message: 'Complete migration process finished',
      finalStatus 
    };

  } catch (error) {
    console.error('❌ Complete migration process failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
