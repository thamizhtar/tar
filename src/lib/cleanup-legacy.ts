// Cleanup script to remove legacy field data after migration is complete
import { db, getCurrentTimestamp } from './instant';


export const cleanupLegacyFields = async () => {
  try {
    // Get all products
    const { data } = await db.queryOnce({ products: {} });
    const products = data?.products || [];
    let cleanedCount = 0;
    const timestamp = getCurrentTimestamp();

    for (const product of products) {
      const updates: any = { updatedAt: timestamp };
      let needsCleanup = false;

      // Remove legacy fields by setting them to null/undefined
      if (product.name !== undefined) { updates.name = null; needsCleanup = true; }
      if ((product as any).description !== undefined) { updates.description = null; needsCleanup = true; }
      if ((product as any).imageUrl !== undefined) { updates.imageUrl = null; needsCleanup = true; }
      if ((product as any).isActive !== undefined) { updates.isActive = null; needsCleanup = true; }
      if (product.sku !== undefined) { updates.sku = null; needsCleanup = true; }

      if (needsCleanup) {
        await db.transact(db.tx.products[product.id].update(updates));
        cleanedCount++;
      }
    }

    return { success: true, cleaned: cleanedCount };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Complete migration and cleanup process removed. Migration is complete.
