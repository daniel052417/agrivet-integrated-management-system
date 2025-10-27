import { supabase } from './supabase';

export interface RealTimeInsightsData {
  timestamp: string;
  activeUsers: number;
  currentSales: number;
  todaySales: number;
  todayOrders: number;
  liveTransactions: Array<{
    id: string;
    amount: number;
    customer: string;
    time: string;
    branch: string;
    status: string;
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    units: number;
  }>;
  branchPerformance: Array<{
    branchId: string;
    branchName: string;
    sales: number;
    orders: number;
    customers: number;
  }>;
}

export interface InsightsAlert {
  id: string;
  type: 'sales_spike' | 'low_inventory' | 'high_refund_rate' | 'system_error';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export class RealTimeInsightsService {
  private static instance: RealTimeInsightsService;
  private subscribers: Set<(data: RealTimeInsightsData) => void> = new Set();
  private alertSubscribers: Set<(alert: InsightsAlert) => void> = new Set();
  private isPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): RealTimeInsightsService {
    if (!RealTimeInsightsService.instance) {
      RealTimeInsightsService.instance = new RealTimeInsightsService();
    }
    return RealTimeInsightsService.instance;
  }

  /**
   * Start real-time data polling
   */
  startPolling(intervalMs: number = 30000): void {
    if (this.isPolling) {
      console.warn('Real-time polling is already running');
      return;
    }

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        const data = await this.fetchRealTimeData();
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    }, intervalMs);

    console.log(`Real-time insights polling started (${intervalMs}ms interval)`);
  }

  /**
   * Stop real-time data polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Real-time insights polling stopped');
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe(callback: (data: RealTimeInsightsData) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(callback: (alert: InsightsAlert) => void): () => void {
    this.alertSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.alertSubscribers.delete(callback);
    };
  }

  /**
   * Fetch real-time insights data
   */
  private async fetchRealTimeData(): Promise<RealTimeInsightsData> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      // Get today's transactions
      const { data: todayTransactions, error: todayError } = await supabase
        .from('pos_transactions')
        .select(`
          id,
          total_amount,
          transaction_date,
          customer_id,
          branch_id,
          status,
          pos_transaction_items(
            product_id,
            quantity,
            unit_price,
            product_name
          )
        `)
        .eq('transaction_type', 'sale')
        .gte('transaction_date', `${today}T00:00:00`)
        .lte('transaction_date', `${today}T23:59:59`);

      if (todayError) {
        console.error('Error fetching today\'s transactions:', todayError);
        throw new Error(`Failed to fetch today's transactions: ${todayError.message}`);
      }

      // Get recent transactions (last hour)
      const { data: recentTransactions, error: recentError } = await supabase
        .from('pos_transactions')
        .select(`
          id,
          total_amount,
          transaction_date,
          customer_id,
          branch_id,
          status
        `)
        .eq('transaction_type', 'sale')
        .gte('transaction_date', oneHourAgo);

      if (recentError) {
        console.error('Error fetching recent transactions:', recentError);
        throw new Error(`Failed to fetch recent transactions: ${recentError.message}`);
      }

      // Calculate metrics
      const todaySales = todayTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const todayOrders = todayTransactions?.length || 0;
      const todayCustomers = new Set(todayTransactions?.map(t => t.customer_id).filter(Boolean)).size;
      const currentSales = recentTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      // Get active users (simplified - would need actual user session tracking)
      const activeUsers = Math.floor(Math.random() * 50) + 10; // Mock data

      // Get live transactions (last 10)
      const liveTransactions = recentTransactions
        ?.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 10)
        .map(transaction => ({
          id: transaction.id,
          amount: transaction.total_amount || 0,
          customer: `Customer ${transaction.customer_id?.slice(-4) || 'N/A'}`,
          time: new Date(transaction.transaction_date).toLocaleTimeString(),
          branch: `Branch ${transaction.branch_id}`,
          status: transaction.status || 'completed'
        })) || [];

      // Get top selling products for today
      const productStats: { [key: string]: { productId: string; productName: string; sales: number; units: number } } = {};
      
      todayTransactions?.forEach(transaction => {
        transaction.pos_transaction_items?.forEach((item: any) => {
          const productId = item.product_id;
          const productName = item.product_name || 'Unknown Product';
          
          if (!productStats[productId]) {
            productStats[productId] = {
              productId,
              productName,
              sales: 0,
              units: 0
            };
          }
          
          productStats[productId].sales += item.quantity;
          productStats[productId].units += item.quantity;
        });
      });

      const topSellingProducts = Object.values(productStats)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Get branch performance for today
      const branchStats: { [key: string]: { branchId: string; branchName: string; sales: number; orders: number; customers: Set<string> } } = {};
      
      todayTransactions?.forEach(transaction => {
        const branchId = transaction.branch_id;
        if (!branchStats[branchId]) {
          branchStats[branchId] = {
            branchId,
            branchName: `Branch ${branchId}`,
            sales: 0,
            orders: 0,
            customers: new Set()
          };
        }
        
        branchStats[branchId].sales += transaction.total_amount || 0;
        branchStats[branchId].orders += 1;
        if (transaction.customer_id) {
          branchStats[branchId].customers.add(transaction.customer_id);
        }
      });

      const branchPerformance = Object.values(branchStats).map(branch => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        sales: branch.sales,
        orders: branch.orders,
        customers: branch.customers.size
      }));

      return {
        timestamp: now.toISOString(),
        activeUsers,
        currentSales,
        todaySales,
        todayOrders,
        liveTransactions,
        topSellingProducts,
        branchPerformance
      };
    } catch (error) {
      console.error('Error in fetchRealTimeData:', error);
      throw error;
    }
  }

  /**
   * Notify all subscribers of new data
   */
  private notifySubscribers(data: RealTimeInsightsData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Generate and send alerts
   */
  async generateAlerts(): Promise<void> {
    try {
      const data = await this.fetchRealTimeData();
      const alerts: InsightsAlert[] = [];

      // Check for sales spike
      if (data.currentSales > data.todaySales * 0.1) { // 10% of today's sales in last hour
        alerts.push({
          id: `sales_spike_${Date.now()}`,
          type: 'sales_spike',
          title: 'Sales Spike Detected',
          message: `Current hour sales (₱${data.currentSales.toLocaleString()}) are unusually high`,
          severity: 'medium',
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Check for high refund rate (mock data)
      const refundRate = Math.random() * 10; // Mock refund rate
      if (refundRate > 5) {
        alerts.push({
          id: `high_refund_rate_${Date.now()}`,
          type: 'high_refund_rate',
          title: 'High Refund Rate',
          message: `Refund rate is ${refundRate.toFixed(1)}%, above normal threshold`,
          severity: 'high',
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Check for system errors (mock data)
      if (Math.random() < 0.1) { // 10% chance of system error
        alerts.push({
          id: `system_error_${Date.now()}`,
          type: 'system_error',
          title: 'System Error Detected',
          message: 'An error occurred in the insights data processing',
          severity: 'critical',
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Send alerts to subscribers
      alerts.forEach(alert => {
        this.alertSubscribers.forEach(callback => {
          try {
            callback(alert);
          } catch (error) {
            console.error('Error in alert callback:', error);
          }
        });
      });
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  }

  /**
   * Get current real-time data (without polling)
   */
  async getCurrentData(): Promise<RealTimeInsightsData> {
    return await this.fetchRealTimeData();
  }

  /**
   * Get insights alerts
   */
  async getAlerts(): Promise<InsightsAlert[]> {
    try {
      // In a real implementation, this would fetch from a database
      // For now, return mock alerts
      return [
        {
          id: 'alert_1',
          type: 'sales_spike',
          title: 'Sales Spike Detected',
          message: 'Sales in the last hour are 15% above average',
          severity: 'medium',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          acknowledged: false
        },
        {
          id: 'alert_2',
          type: 'low_inventory',
          title: 'Low Inventory Alert',
          message: 'Ammonium Sulfate 21-0-0 is running low (5 units remaining)',
          severity: 'high',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          acknowledged: true
        }
      ];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Alert ${alertId} acknowledged`);
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Get insights data for a specific time range
   */
  async getInsightsForTimeRange(startDate: string, endDate: string): Promise<RealTimeInsightsData[]> {
    try {
      // This would implement time-range specific data fetching
      // For now, return mock data
      const data = await this.fetchRealTimeData();
      return [data];
    } catch (error) {
      console.error('Error fetching insights for time range:', error);
      return [];
    }
  }
}

export default RealTimeInsightsService;
