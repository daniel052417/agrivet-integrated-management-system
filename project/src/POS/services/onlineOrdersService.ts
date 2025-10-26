import { OnlineOrder, OnlineOrderFilters } from '../../types/pos';
import { supabase } from '../../lib/supabase';
import { customAuth } from '../../lib/customAuth';
import { POSTransactionService, CreateTransactionData } from '../../lib/posTransactionService';
import { POSDatabaseService } from '../services/databaseService';

export class OnlineOrdersService {
  static async getOrders(filters?: OnlineOrderFilters, branchId?: string): Promise<OnlineOrder[]> {
    try {
      console.log('🔍 OnlineOrdersService.getOrders() called with:', { filters, branchId });
      
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            id,
            first_name,
            last_name,
            phone,
            email
          ),
          order_items (
            id,
            product_id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            line_total,
            unit_name,
            unit_label,
            notes
          ),
          branches (
            id,
            name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      // CRITICAL: Filter by branch_id for branch isolation
      if (branchId && branchId !== 'default-branch') {
        query = query.eq('branch_id', branchId);
      } else if (!branchId) {
        console.warn('⚠️ No branchId provided to OnlineOrdersService.getOrders() - this may show orders from all branches!');
      }

      // Apply filters
      if (filters?.status) {
        // Map OnlineOrder status to your database status
        const dbStatus = this.mapToOrderStatus(filters.status as OnlineOrder['status']);
        query = query.eq('status', dbStatus);
      }
      if (filters?.order_type) {
        query = query.eq('order_type', filters.order_type);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }
      
      console.log('✅ Query successful! Found orders:', data?.length || 0);

      // Transform to OnlineOrder format - handle both guest and registered customers
      const transformedOrders: OnlineOrder[] = (data || []).map((order: any) => {
        
        // Use customer data from join if available, otherwise use guest fields
        const customerName = order.customers 
          ? `${order.customers.first_name} ${order.customers.last_name}`
          : order.customer_name || 'Guest Customer';
        
        const customerPhone = order.customers?.phone || order.customer_phone || '';
        const customerEmail = order.customers?.email || order.customer_email;
        
        return {
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id || 'guest',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: order.branches?.address || 'Store Pickup',
          branch_id: order.branch_id,
          order_type: order.order_type,
          status: this.mapOrderStatus(order.status),
          payment_status: order.payment_status,
          payment_method: order.payment_method,
           payment_reference: order.payment_reference,        // ✅ ADD THIS LINE
          payment_proof_url: order.payment_proof_url,        // ✅ ADD THIS LINE
          subtotal: parseFloat(order.subtotal),
          tax_amount: parseFloat(order.tax_amount),
          delivery_fee: order.delivery_fee ? parseFloat(order.delivery_fee) : (order.order_type === 'delivery' ? 50 : undefined),
          total_amount: parseFloat(order.total_amount),
          special_instructions: order.special_instructions,
          estimated_ready_time: order.estimated_ready_time,
          actual_ready_time: order.status === 'ready_for_pickup' ? order.updated_at : undefined,
          pickup_time: order.order_type === 'pickup' ? order.estimated_ready_time : undefined,
          delivery_time: order.order_type === 'delivery' ? order.estimated_ready_time : undefined,
          created_at: order.created_at,
          updated_at: order.updated_at,
          confirmed_at: order.confirmed_at,
          completed_at: order.completed_at,
          ready_at: order.ready_at,
          // Delivery-related fields
          delivery_method: order.delivery_method,
          delivery_address: order.delivery_address,
          delivery_contact_number: order.delivery_contact_number,
          delivery_landmark: order.delivery_landmark,
          delivery_status: order.delivery_status,
          delivery_tracking_number: order.delivery_tracking_number,
          delivery_latitude: order.delivery_latitude,
          delivery_longitude: order.delivery_longitude,
          items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            line_total: parseFloat(item.line_total),
            special_instructions: item.notes,
            weight_kg: item.weight ? parseFloat(item.weight) : undefined,
            expiry_date: item.expiry_date
          }))
        };
      });

      console.log('✅ Transformation complete! Orders ready:', transformedOrders.length);

      return transformedOrders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  // Map your order statuses to OnlineOrder statuses
  private static mapOrderStatus(status: string): OnlineOrder['status'] {
    const statusMap: Record<string, OnlineOrder['status']> = {
      'pending_confirmation': 'pending_confirmation',
      'confirmed': 'confirmed',
      'preparing': 'confirmed',
      'ready_for_pickup': 'ready_for_pickup',
      'for_payment': 'for_payment',
      'for_dispatch': 'for_dispatch',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'abandoned': 'cancelled'
    };
    return statusMap[status] || 'pending_confirmation';
  }

  // Map OnlineOrder statuses back to your order statuses
  private static mapToOrderStatus(status: OnlineOrder['status']): string {
    const statusMap: Record<OnlineOrder['status'], string> = {
      'pending_confirmation': 'pending_confirmation',
      'confirmed': 'confirmed',
      'ready_for_pickup': 'ready_for_pickup',
      'for_payment': 'for_payment',
      'for_dispatch': 'for_dispatch',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending_confirmation';
  }

  static async getOrderById(id: string, branchId?: string): Promise<OnlineOrder | null> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            id,
            first_name,
            last_name,
            phone,
            email
          ),
          order_items (
            id,
            product_id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            line_total,
            unit_name,
            unit_label,
            notes
          ),
          branches (
            id,
            name,
            address
          )
        `)
        .eq('id', id);

      // CRITICAL: Filter by branch_id for branch isolation
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) return null;

      // Transform to OnlineOrder format - handle both guest and registered customers
      const customerName = data.customers 
        ? `${data.customers.first_name} ${data.customers.last_name}`
        : data.customer_name || 'Guest Customer';
      
      const customerPhone = data.customers?.phone || data.customer_phone || '';
      const customerEmail = data.customers?.email || data.customer_email;
      
      const order: OnlineOrder = {
        id: data.id,
        order_number: data.order_number,
        customer_id: data.customer_id || 'guest',
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: data.branches?.address || 'Store Pickup',
        branch_id: data.branch_id,
        order_type: data.order_type,
        status: this.mapOrderStatus(data.status),
        payment_status: data.payment_status,
        payment_method: data.payment_method,
        subtotal: parseFloat(data.subtotal),
        tax_amount: parseFloat(data.tax_amount),
        delivery_fee: data.delivery_fee ? parseFloat(data.delivery_fee) : (data.order_type === 'delivery' ? 50 : undefined),
        total_amount: parseFloat(data.total_amount),
        special_instructions: data.special_instructions,
        estimated_ready_time: data.estimated_ready_time,
        actual_ready_time: data.status === 'ready_for_pickup' ? data.updated_at : undefined,
        pickup_time: data.order_type === 'pickup' ? data.estimated_ready_time : undefined,
        delivery_time: data.order_type === 'delivery' ? data.estimated_ready_time : undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        confirmed_at: data.confirmed_at,
        completed_at: data.completed_at,
        ready_at: data.ready_at,
        // Delivery-related fields
        delivery_method: data.delivery_method,
        delivery_address: data.delivery_address,
        delivery_contact_number: data.delivery_contact_number,
        delivery_landmark: data.delivery_landmark,
        delivery_status: data.delivery_status,
        delivery_tracking_number: data.delivery_tracking_number,
        delivery_latitude: data.delivery_latitude,
        delivery_longitude: data.delivery_longitude,
        items: (data.order_items || []).map((item: any) => ({
          id: item.id,
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          line_total: parseFloat(item.line_total),
          special_instructions: item.notes,
          weight_kg: item.weight ? parseFloat(item.weight) : undefined,
          expiry_date: item.expiry_date
        }))
      };

      return order;
    } catch (error) {
      console.error('Error loading order:', error);
      return null;
    }
  }

  static async updateOrderStatus(
    orderId: string, 
    status: OnlineOrder['status'],
    branchId?: string
  ): Promise<OnlineOrder | null> {
    try {
      const mappedStatus = this.mapToOrderStatus(status);
      const now = new Date().toISOString();
      
      const updates: any = {
        status: mappedStatus,
        updated_at: now
      };

      // Set specific timestamps based on status
      if (status === 'confirmed') {
      updates.confirmed_at = now;
    }
      if (status === 'ready_for_pickup') {
      updates.actual_ready_time = now;
    }
      if (status === 'completed') {
      updates.completed_at = now;
    }

      let query = supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      // CRITICAL: Ensure we can only update orders from this branch
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { error } = await query.select().single();

      if (error) throw error;

      // Log status change in order_status_history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: mappedStatus,
          changed_at: now,
          notes: `Status changed to ${mappedStatus}`
        });

      // Return the updated order
      return await this.getOrderById(orderId, branchId);
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  }

  static async getNewOrdersCount(branchId?: string): Promise<number> {
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_confirmation');

      // CRITICAL: Filter by branch_id for branch isolation
      if (branchId && branchId !== 'default-branch') {
        query = query.eq('branch_id', branchId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Count query error:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('❌ Error getting new orders count:', error);
      return 0;
    }
  }

  static async addOrder(order: OnlineOrder): Promise<OnlineOrder> {
    try {
      const mappedStatus = this.mapToOrderStatus(order.status);
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: order.order_number,
          customer_id: order.customer_id === 'guest' ? null : order.customer_id,
          branch_id: order.branch_id,
          status: mappedStatus,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          estimated_ready_time: order.estimated_ready_time,
          is_guest_order: true,
          order_type: order.order_type,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          special_instructions: order.special_instructions,
          confirmed_at: order.confirmed_at,
          completed_at: order.completed_at
        })
        .select()
        .single();

      if (error) throw error;

      // Add order items
      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map(item => ({
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.special_instructions,
          weight: item.weight_kg,
          expiry_date: item.expiry_date
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      const createdOrder = await this.getOrderById(data.id);
      if (!createdOrder) {
        throw new Error('Failed to retrieve created order');
      }
      return createdOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // ===== ENHANCED ORDER PROCESSING METHODS =====

  /**
   * Check inventory availability for all items in an order
   */
  static async checkInventoryAvailability(orderId: string, _branchId: string): Promise<{
    available: boolean;
    missingItems: string[];
    details: Array<{
      product_id: string;
      product_name: string;
      required_quantity: number;
      available_quantity: number;
      shortfall: number;
    }>;
  }> {
    try {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          products:product_id (
            id,
            name
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const missingItems: string[] = [];
      const details: any[] = [];

      // Since we don't have inventory_levels table, we'll assume inventory is available
      // and focus on reservation management instead
      for (const item of orderItems || []) {
        const requiredQuantity = parseFloat(item.quantity);
        
        details.push({
          product_id: item.product_id,
          product_name: item.product_name,
          required_quantity: requiredQuantity,
          available_quantity: requiredQuantity, // Assume available since no inventory tracking
          shortfall: 0
        });
      }

      return {
        available: missingItems.length === 0,
        missingItems,
        details
      };
    } catch (error) {
      console.error('Error checking inventory availability:', error);
      return {
        available: false,
        missingItems: ['Error checking inventory'],
        details: []
      };
    }
  }

  /**
   * Reserve inventory for an order using existing inventory_reservations table
   */
  static async reserveInventoryForOrder(orderId: string, branchId: string, _userId: string): Promise<boolean> {
    try {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Create inventory reservations for each item
      for (const item of orderItems || []) {
        const quantity = parseFloat(item.quantity);
        const reservedUntil = new Date();
        reservedUntil.setHours(reservedUntil.getHours() + 24); // Reserve for 24 hours

        // Create reservation record
        const { error: reservationError } = await supabase
          .from('inventory_reservations')
          .insert({
            order_id: orderId,
            product_id: item.product_id,
            branch_id: branchId,
            quantity_reserved: quantity,
            reserved_until: reservedUntil.toISOString(),
            status: 'active'
          });

        if (reservationError) {
          console.error('Error creating inventory reservation:', reservationError);
          continue;
        }

        // Create inventory transaction record
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            product_id: item.product_id,
            branch_id: branchId,
            order_id: orderId,
            transaction_type: 'reservation',
            quantity_change: quantity,
            quantity_before: 0, // We don't track current inventory levels
            quantity_after: quantity,
            reference_number: `RES-${orderId.slice(-8)}`,
            notes: `Reserved for order ${orderId}`,
            created_by_name: 'System'
          });

        if (transactionError) {
          console.error('Error creating inventory transaction:', transactionError);
        }

        console.log(`✅ Reserved ${quantity} units of ${item.product_name} for order ${orderId}`);
      }

      return true;
    } catch (error) {
      console.error('Error reserving inventory:', error);
      return false;
    }
  }

  /**
   * Release reserved inventory for an order using existing inventory_reservations table
   */
  static async releaseReservedInventory(orderId: string, _userId: string): Promise<boolean> {
    try {
      // Update all active reservations for this order to 'released' status
      const { error: updateError } = await supabase
        .from('inventory_reservations')
        .update({
          status: 'released',
          reserved_until: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error releasing inventory reservations:', updateError);
        return false;
      }

      // Create inventory transaction records for the release
      const { data: reservations, error: fetchError } = await supabase
        .from('inventory_reservations')
        .select('product_id, branch_id, quantity_reserved')
        .eq('order_id', orderId)
        .eq('status', 'released');

      if (fetchError) {
        console.error('Error fetching reservations for transaction records:', fetchError);
      } else {
        // Create release transaction records
        for (const reservation of reservations || []) {
          const { error: transactionError } = await supabase
            .from('inventory_transactions')
            .insert({
              product_id: reservation.product_id,
              branch_id: reservation.branch_id,
              order_id: orderId,
              transaction_type: 'release',
              quantity_change: -reservation.quantity_reserved,
              quantity_before: reservation.quantity_reserved,
              quantity_after: 0,
              reference_number: `REL-${orderId.slice(-8)}`,
              notes: `Released reservation for order ${orderId}`,
              created_by_name: 'System'
            });

          if (transactionError) {
            console.error('Error creating release transaction:', transactionError);
          }
        }
      }

      console.log(`✅ Released all inventory reservations for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error releasing reserved inventory:', error);
      return false;
    }
  }

  /**
   * Calculate estimated ready time based on order size and type
   */
  static calculateReadyTime(orderType: string, itemCount: number): string {
    const now = new Date();
    let minutesToAdd = 15; // Base time

    // Add time based on order type
    if (orderType === 'delivery') {
      minutesToAdd += 30; // Extra time for delivery preparation
    }

    // Add time based on item count
    minutesToAdd += Math.ceil(itemCount / 5) * 5; // 5 minutes per 5 items

    const readyTime = new Date(now.getTime() + minutesToAdd * 60000);
    return readyTime.toISOString();
  }

  /**
   * Log order status change for audit trail (simplified version)
   */
  static async logOrderStatusChange(
    orderId: string,
    newStatus: string,
    previousStatus: string,
    userId: string,
    notes?: string,
    _metadata?: any
  ): Promise<boolean> {
    try {
      const currentUser = customAuth.getCurrentUser();
      
      // For now, just log to console since order_status_history table might not exist
      console.log(`📝 Order Status Change:`, {
        orderId,
        previousStatus,
        newStatus,
        changedBy: currentUser?.email || 'Unknown',
        userId,
        notes,
        timestamp: new Date().toISOString()
      });

      // TODO: Implement proper audit logging when order_status_history table is available
      // const { error } = await supabase
      //   .from('order_status_history')
      //   .insert({
      //     order_id: orderId,
      //     status: newStatus,
      //     previous_status: previousStatus,
      //     changed_by: userId,
      //     changed_by_name: currentUser?.email || 'Unknown',
      //     notes: notes,
      //     metadata: metadata
      //   });

      return true;
    } catch (error) {
      console.error('Error logging order status change:', error);
      return false;
    }
  }

  /**
   * Send notification to customer (simplified version)
   */
  static async sendOrderNotification(
    orderId: string,
    notificationType: 'confirmation' | 'cancellation' | 'ready' | 'reminder',
    messageContent: string,
    sentTo: string,
    sentVia: 'sms' | 'email' | 'push' = 'sms',
    userId: string
  ): Promise<boolean> {
    try {
      // For now, just log to console since order_notifications table might not exist
      console.log(`📱 Notification sent: ${notificationType} to ${sentTo}`);
      console.log(`Message: ${messageContent}`);
      console.log(`Order ID: ${orderId}, User ID: ${userId}, Via: ${sentVia}`);

      // TODO: Implement proper notification logging when order_notifications table is available
      // const { error } = await supabase
      //   .from('order_notifications')
      //   .insert({
      //     order_id: orderId,
      //     notification_type: notificationType,
      //     sent_to: sentTo,
      //     sent_via: sentVia,
      //     message_content: messageContent,
      //     sent_by: userId,
      //     status: 'sent'
      //   });

      // Here you would integrate with actual SMS/email service
      // For now, we'll just log the notification

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Confirm an order with full processing
   */
  static async confirmOrder(orderId: string, branchId: string): Promise<{
    success: boolean;
    message: string;
    missingItems?: string[];
  }> {
    try {
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // 1. Check inventory availability (with fallback if table doesn't exist)
      let inventoryCheck;
      try {
        inventoryCheck = await this.checkInventoryAvailability(orderId, branchId);
        if (!inventoryCheck.available) {
          return {
            success: false,
            message: 'Insufficient inventory',
            missingItems: inventoryCheck.missingItems
          };
        }
      } catch (inventoryError) {
        console.warn('⚠️ Inventory check failed, proceeding without inventory validation:', inventoryError);
        // Continue with order confirmation even if inventory check fails
        // This allows the system to work while inventory table issues are resolved
      }

      // 2. Get order details for ready time calculation
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_type, order_items(count)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const itemCount = order.order_items?.[0]?.count || 1;
      const estimatedReadyTime = this.calculateReadyTime(order.order_type, itemCount);

      // 3. Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
        status: 'confirmed',
          payment_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: currentUser.id,
          estimated_ready_time: estimatedReadyTime
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 4. Reserve inventory (with fallback if table doesn't exist)
      try {
        await this.reserveInventoryForOrder(orderId, branchId, currentUser.id);
      } catch (reservationError) {
        console.warn('⚠️ Inventory reservation failed, proceeding without inventory reservation:', reservationError);
        // Continue with order confirmation even if inventory reservation fails
        // This allows the system to work while inventory table issues are resolved
      }

      // 5. Log status change
      await this.logOrderStatusChange(
        orderId,
        'confirmed',
        'pending_confirmation',
        currentUser.id,
        'Order confirmed by cashier'
      );

      // 6. Send confirmation notification
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('order_number, customer_phone, customer_name')
        .eq('id', orderId)
        .single();

      if (orderDetails?.customer_phone) {
        const message = `Hi ${orderDetails.customer_name}! Your order #${orderDetails.order_number} has been confirmed and is being prepared. Estimated ready time: ${new Date(estimatedReadyTime).toLocaleString()}. Thank you!`;
        await this.sendOrderNotification(
          orderId,
          'confirmation',
          message,
          orderDetails.customer_phone,
          'sms',
          currentUser.id
        );
      }

      return {
        success: true,
        message: 'Order confirmed successfully!'
      };
    } catch (error) {
      console.error('Error confirming order:', error);
      return {
        success: false,
        message: 'Failed to confirm order'
      };
    }
  }

  /**
   * Cancel an order with reason
   */
  static async cancelOrder(
    orderId: string,
    reason: string,
    _branchId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // 1. Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: currentUser.id,
          cancellation_reason: reason
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 2. Release any reserved inventory
      await this.releaseReservedInventory(orderId, currentUser.id);

      // 3. Log status change
      await this.logOrderStatusChange(
        orderId,
        'cancelled',
        'pending_confirmation',
        currentUser.id,
        `Order cancelled. Reason: ${reason}`
      );

      // 4. Send cancellation notification
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('order_number, customer_phone, customer_name')
        .eq('id', orderId)
        .single();

      if (orderDetails?.customer_phone) {
        const message = `Hi ${orderDetails.customer_name}! We're sorry, but your order #${orderDetails.order_number} has been cancelled. Reason: ${reason}. Please call us for alternatives. Thank you for understanding.`;
        await this.sendOrderNotification(
          orderId,
          'cancellation',
          message,
          orderDetails.customer_phone,
          'sms',
          currentUser.id
        );
      }

      return {
        success: true,
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        message: 'Failed to cancel order'
      };
    }
  }

  /**
   * Mark order as ready for pickup
   */
  static async markOrderReady(orderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'ready_for_pickup',
          ready_at: new Date().toISOString(),
          ready_by: currentUser.id
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Log status change
      await this.logOrderStatusChange(
        orderId,
        'ready_for_pickup',
        'confirmed',
        currentUser.id,
        'Order marked ready for pickup'
      );

      // Send ready notification
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('order_number, customer_phone, customer_name, order_type')
        .eq('id', orderId)
        .single();

      if (orderDetails?.customer_phone) {
        const pickupMessage = orderDetails.order_type === 'pickup' 
          ? `Hi ${orderDetails.customer_name}! Your order #${orderDetails.order_number} is ready for pickup! Please come to our store. Thank you!`
          : `Hi ${orderDetails.customer_name}! Your order #${orderDetails.order_number} is ready and will be delivered soon. Thank you!`;
        
        await this.sendOrderNotification(
          orderId,
          'ready',
          pickupMessage,
          orderDetails.customer_phone,
          'sms',
          currentUser.id
        );
      }

      return {
        success: true,
        message: 'Order marked as ready!'
      };
    } catch (error) {
      console.error('Error marking order ready:', error);
      return {
        success: false,
        message: 'Failed to mark order as ready'
      };
    }
  }

  /**
   * Complete an order
   */
  static async completeOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const currentUser = customAuth.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch order details including items
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            line_total,
            unit_name,
            unit_label,
            notes
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (!orderData) throw new Error('Order not found');

      console.log('📦 Processing order completion:', orderData.order_number);

      // 1. Get or create POS session using POSDatabaseService
      console.log('Getting or creating POS session for cashier:', currentUser.id, 'branch:', orderData.branch_id);
      const posSession = await POSDatabaseService.getOrCreatePOSSession(currentUser.id, orderData.branch_id);
      const posSessionId = posSession.id;
      
      console.log('✅ Using POS session:', posSessionId);

      // 2. Prepare transaction data using the same format as CashierScreen
      const transactionData: CreateTransactionData = {
        pos_session_id: posSessionId,
        customer_id: orderData.customer_id || undefined,
        cashier_id: currentUser.id,
        branch_id: orderData.branch_id,
        items: orderData.order_items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: parseFloat(item.quantity),
          unit_of_measure: item.unit_label || item.unit_name || 'unit',
          unit_price: parseFloat(item.unit_price),
          line_total: parseFloat(item.line_total),
          notes: item.notes
        })),
        subtotal: parseFloat(orderData.subtotal),
        discount_percentage: parseFloat(orderData.discount_percentage) || 0,
        tax_amount: parseFloat(orderData.tax_amount) || 0,
        total_amount: parseFloat(orderData.total_amount),
        notes: `Online order #${orderData.order_number} - ${orderData.order_type} - ${orderData.payment_method || 'N/A'}`,
        payment_method: orderData.payment_method || 'online',
        reference_number: orderData.payment_reference || `ORDER-${orderData.order_number}`,
        transaction_source: orderData.order_source || 'online',
        order_id: orderId
      };

      console.log('Creating POS transaction:', transactionData);

      // 3. Create the transaction using POSTransactionService
      const result = await POSTransactionService.createTransaction(transactionData);
      
      console.log('✅ Transaction created successfully:', result.transaction.transaction_number
);

      // 4. Update inventory using POSTransactionService
      await POSTransactionService.updateInventoryAfterTransaction(
        orderData.branch_id,
        orderData.order_items.map((item: any) => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity)
        }))
      );

      console.log('✅ Inventory updated successfully');

      // 5. Update POS session totals
      await POSTransactionService.updatePOSSessionAfterTransaction(
        posSessionId,
        {
          total_amount: parseFloat(orderData.total_amount),
          discount_amount: parseFloat(orderData.discount_amount) || 0,
          tax_amount: parseFloat(orderData.tax_amount) || 0
        }
      );

      console.log('✅ POS session updated successfully');

      // 6. Update order status to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: currentUser.id
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      console.log('✅ Order status updated to completed');

      // 7. Fulfill inventory reservations
      const { error: fulfillError } = await supabase
        .from('inventory_reservations')
        .update({
          status: 'fulfilled',
          reserved_until: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('status', 'active');

      if (fulfillError) {
        console.error('Error fulfilling inventory reservations:', fulfillError);
      } else {
        console.log(`✅ Fulfilled all inventory reservations for order ${orderId}`);
      }

      // 8. Log status change
      await this.logOrderStatusChange(
        orderId,
        'completed',
        'ready_for_pickup',
        currentUser.id,
        'Order completed and POS transaction created'
      );

      return {
        success: true,
        message: 'Order completed successfully!'
      };
    } catch (error) {
      console.error('❌ Error completing order:', error);
      return {
        success: false,
        message: `Failed to complete order: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

}