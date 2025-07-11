// Cleanup script to remove legacy field data after migration is complete
import { db, getCurrentTimestamp } from './instant';
import { verifyMigrationStatus } from './verify-migration';

export const cleanupLegacyFields = async (force: boolean = false) => {
  try {
    // First verify migration is complete
    if (!force) {
      const status = await verifyMigrationStatus();

      if (!status.migrationComplete) {
        return { success: false, error: 'Migration not complete' };
      }

      if (status.hasLegacyData === 0) {
        return { success: true, cleaned: 0 };
      }
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

      if ((product as any).description !== undefined) {
        updates.description = null;
        needsCleanup = true;
      }

      if ((product as any).imageUrl !== undefined) {
        updates.imageUrl = null;
        needsCleanup = true;
      }

      if ((product as any).isActive !== undefined) {
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
      }
    }

    return { success: true, cleaned: cleanedCount };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Complete migration and cleanup process
export const completeMigrationProcess = async () => {
  try {
    // Step 1: Verify current status
    const initialStatus = await verifyMigrationStatus();

    if (initialStatus.migrationComplete && initialStatus.hasLegacyData === 0) {
      return { success: true, message: 'Already complete' };
    }

    // Step 2: Force complete migration if needed
    if (initialStatus.notMigrated > 0 || initialStatus.partiallyMigrated > 0) {
      const { forceCompleteMigration } = await import('./migrate-products');
      const migrationResult = await forceCompleteMigration();

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }
    }

    // Step 3: Force cleanup legacy data (since products have both new and legacy fields)
    const cleanupResult = await cleanupLegacyFields(true); // Force cleanup

    if (!cleanupResult.success) {
      throw new Error(`Cleanup failed: ${cleanupResult.error}`);
    }

    // Step 4: Final verification
    const finalStatus = await verifyMigrationStatus();

    return {
      success: true,
      message: 'Complete migration process finished',
      finalStatus
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
