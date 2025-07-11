// Fix unlinked items script
import { db } from './instant';

export const fixUnlinkedItems = async (storeId: string) => {
  try {
    console.log('Starting fix for unlinked items...');
    
    // Query all items for the store
    const { data: allItemsData } = await db.queryOnce({
      items: {
        $: { where: { storeId } },
        product: {}
      }
    });

    const allItems = allItemsData?.items || [];
    console.log(`Found ${allItems.length} total items`);
    
    // Find items that have productId but no product link
    const unlinkedItems = allItems.filter(item => 
      item.productId && (!item.product || item.product.length === 0)
    );

    console.log(`Found ${unlinkedItems.length} unlinked items`);

    if (unlinkedItems.length > 0) {
      // Create link transactions for unlinked items
      const linkTransactions = unlinkedItems.map(item => {
        console.log(`Linking item ${item.id} to product ${item.productId}`);
        return db.tx.items[item.id].link({ product: item.productId });
      });

      await db.transact(linkTransactions);
      console.log(`Successfully fixed ${unlinkedItems.length} unlinked items`);
      
      return { 
        success: true, 
        fixed: unlinkedItems.length,
        message: `Fixed ${unlinkedItems.length} unlinked items`
      };
    } else {
      console.log('No unlinked items found');
      return { 
        success: true, 
        fixed: 0,
        message: 'No unlinked items found'
      };
    }
  } catch (error) {
    console.error('Failed to fix unlinked items:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fix unlinked items'
    };
  }
};

// Function to verify item links
export const verifyItemLinks = async (storeId: string) => {
  try {
    const { data } = await db.queryOnce({
      items: {
        $: { where: { storeId } },
        product: {}
      }
    });

    const items = data?.items || [];
    const linkedItems = items.filter(item => item.product && item.product.length > 0);
    const unlinkedItems = items.filter(item => 
      item.productId && (!item.product || item.product.length === 0)
    );

    return {
      total: items.length,
      linked: linkedItems.length,
      unlinked: unlinkedItems.length,
      unlinkedItems: unlinkedItems.map(item => ({
        id: item.id,
        sku: item.sku,
        productId: item.productId
      }))
    };
  } catch (error) {
    console.error('Failed to verify item links:', error);
    return null;
  }
};
