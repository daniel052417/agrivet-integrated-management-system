import { OnlineOrder, OnlineOrderFilters } from '../../types/pos';

export class OnlineOrdersService {
  private static orders: OnlineOrder[] = [];

  static async getOrders(filters?: OnlineOrderFilters): Promise<OnlineOrder[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredOrders = [...this.orders];

    if (filters) {
      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }
      if (filters.order_type) {
        filteredOrders = filteredOrders.filter(order => order.order_type === filters.order_type);
      }
      if (filters.customer_name) {
        const name = filters.customer_name.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.customer_name.toLowerCase().includes(name)
        );
      }
    }

    return filteredOrders;
  }

  static async getOrderById(id: string): Promise<OnlineOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.orders.find(order => order.id === id) || null;
  }

  static async updateOrderStatus(
    orderId: string, 
    status: OnlineOrder['status']
  ): Promise<OnlineOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return null;

    const now = new Date().toISOString();
    const updates: Partial<OnlineOrder> = {
      status,
      updated_at: now,
    };

    if (status === 'confirmed' && !this.orders[orderIndex].confirmed_at) {
      updates.confirmed_at = now;
    }
    if (status === 'ready' && !this.orders[orderIndex].actual_ready_time) {
      updates.actual_ready_time = now;
    }
    if (status === 'completed' && !this.orders[orderIndex].completed_at) {
      updates.completed_at = now;
    }

    this.orders[orderIndex] = { ...this.orders[orderIndex], ...updates };
    return this.orders[orderIndex];
  }

  static async getNewOrdersCount(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.orders.filter(order => order.status === 'pending').length;
  }

  static async addOrder(order: OnlineOrder): Promise<OnlineOrder> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.orders.unshift(order); // Add to beginning of array
    return order;
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const initialLength = this.orders.length;
    this.orders = this.orders.filter(order => order.id !== orderId);
    return this.orders.length < initialLength;
  }

  // Initialize with sample data
  static initializeSampleData() {
    this.orders = [
      {
        id: '1',
        order_number: 'ORD-001',
        customer_id: 'cust-1',
        customer_name: 'Maria Santos',
        customer_phone: '+63 912 345 6789',
        customer_email: 'maria.santos@email.com',
        customer_address: '123 Main St, Quezon City',
        branch_id: 'branch-1',
        order_type: 'pickup',
        status: 'pending',
        payment_status: 'paid',
        payment_method: 'digital',
        subtotal: 1250.00,
        tax_amount: 150.00,
        total_amount: 1400.00,
        special_instructions: 'Please pack carefully',
        estimated_ready_time: '2024-01-15T14:30:00Z',
        created_at: '2024-01-15T13:00:00Z',
        updated_at: '2024-01-15T13:00:00Z',
        items: [
          {
            id: 'item-1',
            order_id: '1',
            product_id: 'prod-1',
            product_name: 'Chicken Feed Premium 50kg',
            product_sku: 'CF-001',
            quantity: 1,
            unit_price: 1250.00,
            line_total: 1250.00
          }
        ]
      },
      {
        id: '2',
        order_number: 'ORD-002',
        customer_id: 'cust-2',
        customer_name: 'Juan Dela Cruz',
        customer_phone: '+63 917 123 4567',
        customer_address: '456 Oak St, Makati City',
        branch_id: 'branch-1',
        order_type: 'delivery',
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'cash',
        subtotal: 850.00,
        tax_amount: 102.00,
        delivery_fee: 50.00,
        total_amount: 1002.00,
        special_instructions: 'Leave at gate if no answer',
        estimated_ready_time: '2024-01-15T15:00:00Z',
        created_at: '2024-01-15T12:30:00Z',
        updated_at: '2024-01-15T12:45:00Z',
        confirmed_at: '2024-01-15T12:45:00Z',
        items: [
          {
            id: 'item-2',
            order_id: '2',
            product_id: 'prod-2',
            product_name: 'Pig Vitamins - Multivitamin',
            product_sku: 'PV-002',
            quantity: 2,
            unit_price: 425.00,
            line_total: 850.00
          }
        ]
      },
      {
        id: '3',
        order_number: 'ORD-003',
        customer_id: 'cust-3',
        customer_name: 'Ana Rodriguez',
        customer_phone: '+63 918 987 6543',
        customer_email: 'ana.rodriguez@email.com',
        customer_address: '789 Pine St, Taguig City',
        branch_id: 'branch-1',
        order_type: 'reservation',
        status: 'ready',
        payment_status: 'paid',
        payment_method: 'digital',
        subtotal: 2100.00,
        tax_amount: 252.00,
        total_amount: 2352.00,
        special_instructions: 'Customer will pick up at 4 PM',
        estimated_ready_time: '2024-01-15T16:00:00Z',
        actual_ready_time: '2024-01-15T15:45:00Z',
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T15:45:00Z',
        confirmed_at: '2024-01-15T11:15:00Z',
        items: [
          {
            id: 'item-3',
            order_id: '3',
            product_id: 'prod-3',
            product_name: 'Cattle Feed Mix 25kg',
            product_sku: 'CF-003',
            quantity: 2,
            unit_price: 1050.00,
            line_total: 2100.00
          }
        ]
      },
      {
        id: '4',
        order_number: 'ORD-004',
        customer_id: 'cust-4',
        customer_name: 'Pedro Martinez',
        customer_phone: '+63 919 456 7890',
        customer_address: '321 Elm St, Pasig City',
        branch_id: 'branch-1',
        order_type: 'pickup',
        status: 'completed',
        payment_status: 'paid',
        payment_method: 'card',
        subtotal: 750.00,
        tax_amount: 90.00,
        total_amount: 840.00,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
        confirmed_at: '2024-01-15T10:15:00Z',
        completed_at: '2024-01-15T14:00:00Z',
        items: [
          {
            id: 'item-4',
            order_id: '4',
            product_id: 'prod-4',
            product_name: 'Dog Food Premium 15kg',
            product_sku: 'DF-004',
            quantity: 1,
            unit_price: 750.00,
            line_total: 750.00
          }
        ]
      },
      {
        id: '5',
        order_number: 'ORD-005',
        customer_id: 'cust-5',
        customer_name: 'Lisa Garcia',
        customer_phone: '+63 920 111 2222',
        customer_email: 'lisa.garcia@email.com',
        customer_address: '654 Maple St, Mandaluyong City',
        branch_id: 'branch-1',
        order_type: 'delivery',
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'digital',
        subtotal: 1800.00,
        tax_amount: 216.00,
        delivery_fee: 75.00,
        total_amount: 2091.00,
        special_instructions: 'Call before delivery',
        estimated_ready_time: '2024-01-15T17:00:00Z',
        created_at: '2024-01-15T13:30:00Z',
        updated_at: '2024-01-15T13:30:00Z',
        items: [
          {
            id: 'item-5',
            order_id: '5',
            product_id: 'prod-5',
            product_name: 'Fish Feed Floating Pellets 20kg',
            product_sku: 'FF-005',
            quantity: 3,
            unit_price: 600.00,
            line_total: 1800.00
          }
        ]
      }
    ];
  }

  // Simulate real-time order updates
  static startOrderSimulation() {
    // Simulate new orders coming in
    setInterval(() => {
      const shouldAddOrder = Math.random() < 0.1; // 10% chance every interval
      if (shouldAddOrder) {
        const newOrder: OnlineOrder = {
          id: `order-${Date.now()}`,
          order_number: `ORD-${String(this.orders.length + 1).padStart(3, '0')}`,
          customer_id: `cust-${Date.now()}`,
          customer_name: `Customer ${this.orders.length + 1}`,
          customer_phone: `+63 9${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`,
          customer_address: `${Math.floor(Math.random() * 999) + 1} Street, City`,
          branch_id: 'branch-1',
          order_type: ['pickup', 'delivery', 'reservation'][Math.floor(Math.random() * 3)] as any,
          status: 'pending',
          payment_status: 'paid',
          payment_method: ['cash', 'digital', 'card'][Math.floor(Math.random() * 3)] as any,
          subtotal: Math.floor(Math.random() * 2000) + 500,
          tax_amount: 0,
          total_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: []
        };
        
        newOrder.tax_amount = newOrder.subtotal * 0.12;
        newOrder.total_amount = newOrder.subtotal + newOrder.tax_amount;
        
        this.addOrder(newOrder);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Initialize sample data when the service is imported
OnlineOrdersService.initializeSampleData();













