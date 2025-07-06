// Verification script to check migration status and data integrity
import { db } from './instant';

export interface MigrationStatus {
  totalProducts: number;
  fullyMigrated: number;
  partiallyMigrated: number;
  notMigrated: number;
  hasLegacyData: number;
  migrationComplete: boolean;
  issues: string[];
}

export const verifyMigrationStatus = async (): Promise<MigrationStatus> => {
  console.log('🔍 Verifying migration status...');
  
  try {
    // Get all products
    const { data } = await db.queryOnce({
      products: {}
    });

    const products = data?.products || [];
    console.log(`📦 Found ${products.length} products to verify`);

    const status: MigrationStatus = {
      totalProducts: products.length,
      fullyMigrated: 0,
      partiallyMigrated: 0,
      notMigrated: 0,
      hasLegacyData: 0,
      migrationComplete: false,
      issues: []
    };

    if (products.length === 0) {
      status.migrationComplete = true;
      console.log('✅ No products found - migration complete by default');
      return status;
    }

    for (const product of products) {
      let hasNewFields = false;
      let hasLegacyFields = false;
      let missingRequired = false;

      // Check for new fields
      if (product.title) hasNewFields = true;
      if (product.excerpt) hasNewFields = true;
      if (product.image) hasNewFields = true;
      if (product.pos !== undefined) hasNewFields = true;

      // Check for legacy fields (ignore null/undefined values from cleanup)
      if (product.name && product.name !== null) hasLegacyFields = true;
      if (product.description && product.description !== null) hasLegacyFields = true;
      if (product.imageUrl && product.imageUrl !== null) hasLegacyFields = true;
      if (product.isActive !== undefined && product.isActive !== null) hasLegacyFields = true;
      if (product.sku && product.sku !== null) hasLegacyFields = true;

      // Check for required fields
      if (!product.title && !product.name) {
        missingRequired = true;
        status.issues.push(`Product ${product.id} missing both title and name`);
      }

      // Categorize product migration status
      if (hasNewFields && !hasLegacyFields && !missingRequired) {
        status.fullyMigrated++;
      } else if (hasNewFields && hasLegacyFields) {
        status.partiallyMigrated++;
      } else if (!hasNewFields && hasLegacyFields) {
        status.notMigrated++;
        status.issues.push(`Product ${product.id} (${product.name || 'unnamed'}) not migrated`);
      } else {
        status.issues.push(`Product ${product.id} has inconsistent data`);
      }

      if (hasLegacyFields) {
        status.hasLegacyData++;
      }

      // Log detailed info for first few products
      if (status.totalProducts <= 5 || status.issues.length <= 10) {
        console.log(`📋 Product ${product.id}:`, {
          title: product.title,
          name: product.name,
          hasNewFields,
          hasLegacyFields,
          missingRequired
        });
      }
    }

    // Determine if migration is complete
    status.migrationComplete = status.fullyMigrated === status.totalProducts && status.hasLegacyData === 0;

    console.log('📊 Migration Status Summary:');
    console.log(`  Total Products: ${status.totalProducts}`);
    console.log(`  Fully Migrated: ${status.fullyMigrated}`);
    console.log(`  Partially Migrated: ${status.partiallyMigrated}`);
    console.log(`  Not Migrated: ${status.notMigrated}`);
    console.log(`  Has Legacy Data: ${status.hasLegacyData}`);
    console.log(`  Migration Complete: ${status.migrationComplete ? '✅' : '❌'}`);

    if (status.issues.length > 0) {
      console.log('⚠️ Issues found:');
      status.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return status;

  } catch (error) {
    console.error('❌ Error verifying migration status:', error);
    throw error;
  }
};

export const runMigrationVerification = async () => {
  try {
    const status = await verifyMigrationStatus();
    
    if (status.migrationComplete) {
      console.log('🎉 Migration verification complete - all products migrated!');
    } else {
      console.log('⚠️ Migration incomplete - manual intervention may be required');
    }
    
    return status;
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return null;
  }
};
