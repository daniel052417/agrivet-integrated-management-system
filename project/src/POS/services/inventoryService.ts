import POSDatabaseService from './databaseService';
import { ProductVariant, StockMovement, StockAdjustment } from '../../types/pos';

export class InventoryService {
  
  /**
   * Get low stock products
   */
  static async getLowStockProducts(branchId?: string, limit: number = 20) {
    try {
      const products = await POSDatabaseService.getProductVariants({
        inStockOnly: true
      });
      
      return products
        .filter(product => product.stock_quantity <= product.minimum_stock)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(branchId?: string, limit: number = 20) {
    try {
      const products = await POSDatabaseService.getProductVariants({
        inStockOnly: false
      });
      
      return products
        .filter(product => product.stock_quantity <= 0)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting out of stock products:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string, branchId?: string) {
    try {
      return await POSDatabaseService.getProductVariants({
        categoryId: categoryId
      });
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  }

  /**
   * Search products by barcode
   */
  static async searchProductByBarcode(barcode: string) {
    try {
      return await POSDatabaseService.getProductVariantByBarcode(barcode);
    } catch (error) {
      console.error('Error searching product by barcode:', error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  static async updateStock(
    productVariantId: string, 
    newQuantity: number, 
    branchId: string, 
    userId: string,
    reason: string = 'manual_adjustment'
  ) {
    try {
      // Get current product
      const product = await POSDatabaseService.getProductVariantById(productVariantId);
      const oldQuantity = product.stock_quantity;
      const quantityDifference = newQuantity - oldQuantity;

      // Update stock quantity
      await POSDatabaseService.updateProductVariantStock(productVariantId, newQuantity);

      // Create stock movement record
      await POSDatabaseService.createStockMovement({
        branch_id: branchId,
        product_variant_id: productVariantId,
        movement_type: quantityDifference > 0 ? 'in' : 'out',
        quantity: Math.abs(quantityDifference),
        reference_type: 'adjustment',
        created_by: userId,
        notes: reason
      });

      // Log inventory action
      await POSDatabaseService.logPOSAction({
        action: 'stock_updated',
        entity_type: 'product_variant',
        entity_id: productVariantId,
        cashier_id: userId,
        old_value: oldQuantity.toString(),
        new_value: newQuantity.toString()
      });

      return { success: true, oldQuantity, newQuantity };
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Process sale stock reduction
   */
  static async processSaleStockReduction(
    items: Array<{
      productVariantId: string;
      quantity: number;
      weight?: number;
    }>,
    branchId: string,
    userId: string,
    transactionId: string
  ) {
    try {
      for (const item of items) {
        const product = await POSDatabaseService.getProductVariantById(item.productVariantId);
        const quantityToReduce = item.weight || item.quantity;
        const newQuantity = product.stock_quantity - quantityToReduce;

        // Update stock quantity
        await POSDatabaseService.updateProductVariantStock(item.productVariantId, newQuantity);

        // Create stock movement record
        await POSDatabaseService.createStockMovement({
          branch_id: branchId,
          product_variant_id: item.productVariantId,
          movement_type: 'out',
          quantity: quantityToReduce,
          reference_type: 'order',
          reference_id: transactionId,
          created_by: userId,
          notes: 'Sale transaction'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing sale stock reduction:', error);
      throw error;
    }
  }

  /**
   * Get stock movements for product
   */
  static async getProductStockMovements(productVariantId: string, branchId?: string) {
    try {
      return await POSDatabaseService.getStockMovements(productVariantId, branchId);
    } catch (error) {
      console.error('Error getting product stock movements:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary
   */
  static async getInventorySummary(branchId?: string) {
    try {
      const products = await POSDatabaseService.getProductVariants();
      
      const summary = {
        totalProducts: products.length,
        inStock: products.filter(p => p.stock_quantity > 0).length,
        lowStock: products.filter(p => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0).length,
        outOfStock: products.filter(p => p.stock_quantity <= 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || 0)), 0),
        categories: {} as { [key: string]: number }
      };

      // Count by category
      products.forEach(product => {
        const categoryName = product.products?.categories?.name || 'Uncategorized';
        summary.categories[categoryName] = (summary.categories[categoryName] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      throw error;
    }
  }

  /**
   * Get products requiring expiry tracking
   */
  static async getProductsRequiringExpiryTracking() {
    try {
      const products = await POSDatabaseService.getProductVariants();
      return products.filter(product => product.requires_expiry_date);
    } catch (error) {
      console.error('Error getting products requiring expiry tracking:', error);
      throw error;
    }
  }

  /**
   * Get products requiring batch tracking
   */
  static async getProductsRequiringBatchTracking() {
    try {
      const products = await POSDatabaseService.getProductVariants();
      return products.filter(product => product.requires_batch_tracking);
    } catch (error) {
      console.error('Error getting products requiring batch tracking:', error);
      throw error;
    }
  }

  /**
   * Get quick sale products
   */
  static async getQuickSaleProducts() {
    try {
      return await POSDatabaseService.getProductVariants({
        quickSaleOnly: true
      });
    } catch (error) {
      console.error('Error getting quick sale products:', error);
      throw error;
    }
  }

  /**
   * Validate stock availability
   */
  static async validateStockAvailability(
    productVariantId: string, 
    requestedQuantity: number, 
    weight?: number
  ): Promise<{ available: boolean; currentStock: number; requestedQuantity: number }> {
    try {
      const product = await POSDatabaseService.getProductVariantById(productVariantId);
      const quantityToCheck = weight || requestedQuantity;
      
      return {
        available: product.stock_quantity >= quantityToCheck,
        currentStock: product.stock_quantity,
        requestedQuantity: quantityToCheck
      };
    } catch (error) {
      console.error('Error validating stock availability:', error);
      throw error;
    }
  }

  /**
   * Get stock alerts
   */
  static async getStockAlerts(branchId?: string) {
    try {
      const [lowStock, outOfStock] = await Promise.all([
        this.getLowStockProducts(branchId),
        this.getOutOfStockProducts(branchId)
      ]);

      return {
        lowStock,
        outOfStock,
        totalAlerts: lowStock.length + outOfStock.length
      };
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get inventory trends
   */
  static async getInventoryTrends(productVariantId: string, days: number = 30) {
    try {
      const movements = await this.getProductStockMovements(productVariantId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentMovements = movements.filter(movement => 
        new Date(movement.created_at) >= cutoffDate
      );

      const trends = {
        totalIn: recentMovements
          .filter(m => m.movement_type === 'in')
          .reduce((sum, m) => sum + m.quantity, 0),
        totalOut: recentMovements
          .filter(m => m.movement_type === 'out')
          .reduce((sum, m) => sum + m.quantity, 0),
        netChange: 0,
        movementCount: recentMovements.length
      };

      trends.netChange = trends.totalIn - trends.totalOut;

      return trends;
    } catch (error) {
      console.error('Error getting inventory trends:', error);
      throw error;
    }
  }
}

export default InventoryService;
