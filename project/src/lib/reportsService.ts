import { supabase } from './supabase';
import { customAuth } from './customAuth';

export interface ReportDefinition {
  id: string;
  category: 'sales' | 'inventory' | 'hr' | 'financial' | 'marketing' | 'operational';
  report_name: string;
  report_key: string;
  description: string | null;
  report_type: string;
  frequency: string;
  is_active: boolean;
  required_permission: string | null;
  required_role: string | null;
  parameters_schema: Record<string, any>;
  display_order: number;
  icon: string | null;
  color_scheme: string | null;
}

export interface GeneratedReport {
  id: string;
  report_definition_id: string | null;
  report_key: string;
  category: string;
  report_name: string;
  file_path: string | null;
  file_url: string | null;
  file_size: number | null;
  file_format: string;
  generated_by: string | null;
  generated_at: string;
  parameters: Record<string, any>;
  date_range_start: string | null;
  date_range_end: string | null;
  branch_id: string | null;
  status: 'generating' | 'completed' | 'failed' | 'expired';
  error_message: string | null;
  execution_time: number | null;
  record_count: number | null;
}

export interface CategoryMetrics {
  category: string;
  totalReports: number;
  lastGenerated: string | null;
  avgSize: string;
  frequency: string;
}

export interface ReportGenerationParams {
  dateRangeStart?: string;
  dateRangeEnd?: string;
  branchId?: string;
  format?: 'pdf' | 'csv' | 'excel' | 'json';
  [key: string]: any;
}

class ReportsService {
  /**
   * Get all report definitions grouped by category
   */
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    const { data, error } = await supabase
      .from('report_definitions')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get metrics for each report category
   */
  async getCategoryMetrics(): Promise<CategoryMetrics[]> {
    const { data, error } = await supabase
      .from('generated_reports')
      .select('category, file_size, generated_at, report_key')
      .eq('status', 'completed');

    if (error) throw error;

    // Get report definitions for frequency
    const definitions = await this.getReportDefinitions();

    // Group by category and calculate metrics
    const categoryMap: Record<string, {
      reports: any[];
      sizes: number[];
      dates: string[];
    }> = {};

    (data || []).forEach(report => {
      if (!categoryMap[report.category]) {
        categoryMap[report.category] = { reports: [], sizes: [], dates: [] };
      }
      categoryMap[report.category].reports.push(report);
      if (report.file_size) categoryMap[report.category].sizes.push(report.file_size);
      if (report.generated_at) categoryMap[report.category].dates.push(report.generated_at);
    });

    const metrics: CategoryMetrics[] = Object.keys(categoryMap).map(category => {
      const categoryData = categoryMap[category];
      const totalReports = categoryData.reports.length;
      const avgSizeBytes = categoryData.sizes.length > 0
        ? categoryData.sizes.reduce((a, b) => a + b, 0) / categoryData.sizes.length
        : 0;
      const avgSizeMB = (avgSizeBytes / (1024 * 1024)).toFixed(1) + ' MB';

      // Find most recent generation
      const lastGenerated = categoryData.dates.length > 0
        ? new Date(Math.max(...categoryData.dates.map(d => new Date(d).getTime()))).toISOString()
        : null;

      // Get most common frequency from definitions
      const categoryDefs = definitions.filter(d => d.category === category);
      const frequencies = categoryDefs.map(d => d.frequency);
      const frequency = frequencies.length > 0
        ? frequencies.sort((a, b) =>
            frequencies.filter(v => v === a).length - frequencies.filter(v => v === b).length
          ).pop() || 'on_demand'
        : 'on_demand';

      return {
        category,
        totalReports,
        lastGenerated,
        avgSize: avgSizeMB,
        frequency: frequency.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
    });

    return metrics;
  }

  /**
   * Get generated reports for a specific report definition
   */
  async getGeneratedReports(reportKey: string, limit: number = 10): Promise<GeneratedReport[]> {
    const { data, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('report_key', reportKey)
      .eq('status', 'completed')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(): Promise<{
    totalReports: number;
    generatedToday: number;
    totalSize: number;
    avgGenerationTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: allReports, error: allError } = await supabase
      .from('generated_reports')
      .select('file_size, generated_at, execution_time')
      .eq('status', 'completed');

    if (allError) throw allError;

    const totalReports = allReports?.length || 0;
    const generatedToday = allReports?.filter(r => 
      new Date(r.generated_at) >= today
    ).length || 0;

    const totalSizeBytes = allReports?.reduce((sum, r) => sum + (r.file_size || 0), 0) || 0;
    const totalSizeMB = totalSizeBytes / (1024 * 1024);

    const executionTimes = allReports?.map(r => r.execution_time).filter(t => t !== null) || [];
    const avgGenerationTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + (b || 0), 0) / executionTimes.length
      : 0;

    return {
      totalReports,
      generatedToday,
      totalSize: totalSizeMB,
      avgGenerationTime: avgGenerationTime / 1000 / 60 // Convert to minutes
    };
  }

  /**
   * Generate a report
   */
  async generateReport(
    reportKey: string,
    params: ReportGenerationParams = {}
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    const currentUser = customAuth.getCurrentUser();

    if (!currentUser) {
      throw new Error('User must be authenticated to generate reports');
    }

    // Get report definition
    const { data: definition, error: defError } = await supabase
      .from('report_definitions')
      .select('*')
      .eq('report_key', reportKey)
      .eq('is_active', true)
      .single();

    if (defError || !definition) {
      throw new Error(`Report definition not found: ${reportKey}`);
    }

    // Create report record with 'generating' status
    const { data: reportRecord, error: createError } = await supabase
      .from('generated_reports')
      .insert({
        report_definition_id: definition.id,
        report_key: reportKey,
        category: definition.category,
        report_name: definition.report_name,
        file_format: params.format || 'pdf',
        generated_by: currentUser.id,
        status: 'generating',
        parameters: params,
        date_range_start: params.dateRangeStart || null,
        date_range_end: params.dateRangeEnd || null,
        branch_id: params.branchId || null,
        execution_time: null,
        record_count: null
      })
      .select()
      .single();

    if (createError || !reportRecord) {
      throw new Error(`Failed to create report record: ${createError?.message}`);
    }

    try {
      // Generate report data based on category and report type
      const reportData = await this.generateReportData(definition, params);
      
      console.log('Generated report data:', {
        category: definition.category,
        reportKey: definition.report_key,
        recordCount: reportData.recordCount,
        dataLength: reportData.data?.length || 0,
        firstRecord: reportData.data?.[0]
      });
      
      // Convert to file format
      const fileData = await this.convertToFileFormat(reportData, params.format || 'pdf', definition);
      
      // Upload to storage (Supabase Storage or generate download URL)
      const fileUrl = await this.storeReportFile(reportRecord.id, fileData, params.format || 'pdf');
      
      const executionTime = Date.now() - startTime;

      // Update report record with results
      const { data: updatedReport, error: updateError } = await supabase
        .from('generated_reports')
        .update({
          status: 'completed',
          file_url: fileUrl,
          file_size: fileData.size,
          execution_time: executionTime,
          record_count: reportData.recordCount || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedReport;
    } catch (error: any) {
      // Update report record with error
      await supabase
        .from('generated_reports')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error occurred',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportRecord.id);

      throw error;
    }
  }

  /**
   * Generate report data based on report definition
   */
  private async generateReportData(
    definition: ReportDefinition,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    const { category, report_key } = definition;
    const { dateRangeStart, dateRangeEnd, branchId } = params;

    switch (category) {
      case 'sales':
        return await this.generateSalesReportData(report_key, params);
      
      case 'inventory':
        return await this.generateInventoryReportData(report_key, params);
      
      case 'hr':
        return await this.generateHRReportData(report_key, params);
      
      case 'financial':
        return await this.generateFinancialReportData(report_key, params);
      
      case 'marketing':
        return await this.generateMarketingReportData(report_key, params);
      
      case 'operational':
        return await this.generateOperationalReportData(report_key, params);
      
      default:
        throw new Error(`Unknown report category: ${category}`);
    }
  }

  /**
   * Generate Sales Report Data
   */
  private async generateSalesReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    const { dateRangeStart, dateRangeEnd, branchId } = params;
    
    let query = supabase
      .from('pos_transactions')
      .select(`
        id,
        transaction_number,
        transaction_date,
        total_amount,
        subtotal,
        tax_amount,
        payment_status,
        branch_id,
        cashier_id,
        customer_id,
        branches:branch_id(name),
        users:cashier_id(first_name, last_name),
        customers:customer_id(first_name, last_name)
      `)
      .eq('transaction_type', 'sale')
      .eq('status', 'active');

    if (dateRangeStart) {
      query = query.gte('transaction_date', dateRangeStart);
    }
    if (dateRangeEnd) {
      query = query.lte('transaction_date', dateRangeEnd);
    }
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: transactions, error } = await query.order('transaction_date', { ascending: false });

    if (error) throw error;

    // For specific report types, add more details
    if (reportKey === 'daily_sales_summary' || reportKey === 'monthly_sales_report') {
      // Transform transactions to clean, readable format
      const cleanTransactions = (transactions || []).map((row: any) => {
        const branch = row.branches as any;
        const user = row.users as any;
        const customer = row.customers as any;
        
        return {
          transaction_number: row.transaction_number || '',
          transaction_date: row.transaction_date ? new Date(row.transaction_date).toLocaleString() : '',
          branch_name: branch?.name || 'N/A',
          cashier_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'N/A',
          customer_name: customer 
            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
            : 'Walk-in',
          subtotal: typeof row.subtotal === 'number' ? row.subtotal.toFixed(2) : row.subtotal || '0.00',
          tax_amount: typeof row.tax_amount === 'number' ? row.tax_amount.toFixed(2) : row.tax_amount || '0.00',
          total_amount: typeof row.total_amount === 'number' ? row.total_amount.toFixed(2) : row.total_amount || '0.00',
          payment_status: row.payment_status || 'N/A'
        };
      });

      return {
        data: cleanTransactions,
        recordCount: cleanTransactions.length
      };
    }

    if (reportKey === 'product_performance') {
      // Get transaction items for product analysis
      const transactionIds = transactions?.map(t => t.id) || [];
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          line_total,
          products:product_id(name, sku, category_id)
        `)
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;

      // Aggregate by product
      const productMap: Record<string, any> = {};
      items?.forEach(item => {
        const productId = item.product_id;
        if (!productMap[productId]) {
          productMap[productId] = {
            product_id: productId,
            product_name: (item.products as any)?.name || 'Unknown',
            sku: (item.products as any)?.sku || '',
            total_quantity: 0,
            total_revenue: 0,
            transaction_count: 0
          };
        }
        productMap[productId].total_quantity += item.quantity;
        productMap[productId].total_revenue += item.line_total || 0;
        productMap[productId].transaction_count += 1;
      });

      return {
        data: Object.values(productMap).sort((a: any, b: any) => b.total_revenue - a.total_revenue),
        recordCount: Object.keys(productMap).length
      };
    }

    if (reportKey === 'sales_by_category') {
      // Get products with categories
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, category_id, categories:category_id(name)');

      if (productsError) throw productsError;

      const productCategoryMap: Record<string, string> = {};
      products?.forEach((p: any) => {
        productCategoryMap[p.id] = (p.categories as any)?.name || 'Uncategorized';
      });

      // Get transaction items and group by category
      const transactionIds = transactions?.map(t => t.id) || [];
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('product_id, line_total')
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;

      const categoryMap: Record<string, any> = {};
      items?.forEach(item => {
        const category = productCategoryMap[item.product_id] || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category_name: category,
            total_revenue: 0,
            transaction_count: 0
          };
        }
        categoryMap[category].total_revenue += item.line_total || 0;
      });

      return {
        data: Object.values(categoryMap).sort((a: any, b: any) => b.total_revenue - a.total_revenue),
        recordCount: Object.keys(categoryMap).length
      };
    }

    // Default: Transform transactions to clean format
    const cleanTransactions = (transactions || []).map((row: any) => {
      const branch = row.branches as any;
      const user = row.users as any;
      const customer = row.customers as any;
      
      return {
        transaction_number: row.transaction_number || '',
        transaction_date: row.transaction_date ? new Date(row.transaction_date).toLocaleString() : '',
        branch_name: branch?.name || 'N/A',
        cashier_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'N/A',
        customer_name: customer 
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : 'Walk-in',
        subtotal: typeof row.subtotal === 'number' ? row.subtotal.toFixed(2) : row.subtotal || '0.00',
        tax_amount: typeof row.tax_amount === 'number' ? row.tax_amount.toFixed(2) : row.tax_amount || '0.00',
        total_amount: typeof row.total_amount === 'number' ? row.total_amount.toFixed(2) : row.total_amount || '0.00',
        payment_status: row.payment_status || 'N/A'
      };
    });

    return {
      data: cleanTransactions,
      recordCount: cleanTransactions.length
    };
  }

  /**
   * Generate Inventory Report Data
   */
  private async generateInventoryReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    const { dateRangeStart, dateRangeEnd, branchId } = params;

    if (reportKey === 'stock_level' || reportKey === 'stock_level_report') {
      // Query inventory table with joins to products, categories, and branches
      let query = supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          branch_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          base_unit,
          last_counted,
          products:product_id(
            id,
            name,
            sku,
            category_id,
            is_active,
            categories:category_id(name)
          ),
          branches:branch_id(name, code)
        `);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: inventoryData, error } = await query.order('quantity_available', { ascending: false });

      if (error) throw error;

      // Transform to clean, readable format (filter out inactive products)
      const cleanData = (inventoryData || [])
        .filter((row: any) => {
          const product = row.products as any;
          return product && product.is_active !== false;
        })
        .map((row: any) => {
          const product = row.products as any;
          const branch = row.branches as any;
          const category = product?.categories as any;

          return {
            product_name: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            category_name: category?.name || 'Uncategorized',
            branch_name: branch?.name || 'Unknown Branch',
            quantity_on_hand: typeof row.quantity_on_hand === 'number' 
              ? Number(row.quantity_on_hand).toFixed(2) 
              : '0.00',
            quantity_reserved: typeof row.quantity_reserved === 'number' 
              ? Number(row.quantity_reserved).toFixed(2) 
              : '0.00',
            quantity_available: typeof row.quantity_available === 'number' 
              ? Number(row.quantity_available).toFixed(2) 
              : '0.00',
            reorder_level: typeof row.reorder_level === 'number' 
              ? Number(row.reorder_level).toFixed(2) 
              : '0.00',
            max_stock_level: typeof row.max_stock_level === 'number' 
              ? Number(row.max_stock_level).toFixed(2) 
              : 'N/A',
            base_unit: row.base_unit || 'piece',
            last_counted: row.last_counted ? new Date(row.last_counted).toLocaleString() : 'Never'
          };
        });

      return {
        data: cleanData,
        recordCount: cleanData.length
      };
    }

    if (reportKey === 'low_stock_alert' || reportKey === 'low_stock_alert_report') {
      // Query inventory table and filter for low stock items
      let query = supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          branch_id,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          max_stock_level,
          base_unit,
          products:product_id(
            id,
            name,
            sku,
            category_id,
            is_active,
            categories:category_id(name)
          ),
          branches:branch_id(name, code)
        `);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: allInventory, error: allError } = await query;
      
      if (allError) throw allError;
      
      // Filter items where quantity_available <= reorder_level and product is active
      const lowStockItems = (allInventory || []).filter((inv: any) => {
        const product = inv.products as any;
        if (!product || !product.is_active) return false;
        
        const quantityAvailable = inv.quantity_available || 0;
        const reorderLevel = inv.reorder_level || 0;
        return quantityAvailable <= reorderLevel;
      });

      // Transform to clean, readable format
      const cleanData = lowStockItems.map((row: any) => {
        const product = row.products as any;
        const branch = row.branches as any;
        const category = product?.categories as any;

        const quantityAvailable = row.quantity_available || 0;
        const reorderLevel = row.reorder_level || 0;
        const shortage = Math.max(0, reorderLevel - quantityAvailable);

        return {
          product_name: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
          category_name: category?.name || 'Uncategorized',
          branch_name: branch?.name || 'Unknown Branch',
          quantity_available: Number(quantityAvailable).toFixed(2),
          reorder_level: Number(reorderLevel).toFixed(2),
          shortage: Number(shortage).toFixed(2),
          status: quantityAvailable <= 0 ? 'Out of Stock' : 'Low Stock',
          base_unit: row.base_unit || 'piece'
        };
      });

      return {
        data: cleanData.sort((a: any, b: any) => 
          parseFloat(a.quantity_available) - parseFloat(b.quantity_available)
        ),
        recordCount: cleanData.length
      };
    }

    if (reportKey === 'inventory_movement' || reportKey === 'inventory_movement_report') {
      // Query inventory movements with joins
      let query = supabase
        .from('inventory_movements')
        .select(`
          id,
          product_id,
          branch_id,
          movement_type,
          quantity,
          reference_number,
          movement_date,
          notes,
          products:product_id(name, sku),
          branches:branch_id(name),
          users:created_by(first_name, last_name)
        `);

      if (dateRangeStart) {
        query = query.gte('movement_date', dateRangeStart);
      }
      if (dateRangeEnd) {
        query = query.lte('movement_date', dateRangeEnd);
      }
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: movements, error: movementsError } = await query
        .order('movement_date', { ascending: false });

      if (movementsError) throw movementsError;

      // Transform to clean, readable format
      const cleanData = (movements || []).map((row: any) => {
        const product = row.products as any;
        const branch = row.branches as any;
        const user = row.users as any;

        const quantity = row.quantity || 0;
        const isIncoming = quantity > 0;

        return {
          movement_date: row.movement_date ? new Date(row.movement_date).toLocaleString() : '',
          product_name: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
          branch_name: branch?.name || 'Unknown Branch',
          movement_type: this.formatMovementType(row.movement_type || ''),
          quantity: Math.abs(quantity).toFixed(2),
          direction: isIncoming ? 'In' : 'Out',
          reference_number: row.reference_number || 'N/A',
          created_by: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'System',
          notes: row.notes || ''
        };
      });

      return {
        data: cleanData,
        recordCount: cleanData.length
      };
    }

    // Default: return stock level report
    return this.generateInventoryReportData('stock_level', params);
  }

  /**
   * Format movement type for display
   */
  private formatMovementType(type: string): string {
    const typeMap: Record<string, string> = {
      'purchase': 'Purchase',
      'sale': 'Sale',
      'adjustment': 'Adjustment',
      'transfer_in': 'Transfer In',
      'transfer_out': 'Transfer Out',
      'return': 'Return',
      'damage': 'Damage',
      'expired': 'Expired',
      'count_adjustment': 'Count Adjustment'
    };
    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  }

  /**
   * Generate HR Report Data
   */
  private async generateHRReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    const { dateRangeStart, dateRangeEnd, branchId } = params;

    if (reportKey === 'employee_attendance' || reportKey === 'employee_attendance_report') {
      // Note: Table name is 'attendance' not 'attendance_records' based on user's schema
      let query = supabase
        .from('attendance')
        .select(`
          id,
          staff_id,
          attendance_date,
          time_in,
          time_out,
          total_hours,
          overtime_hours,
          status,
          notes,
          is_late,
          late_minutes,
          location,
          check_in_method,
          staff:staff_id(
            first_name,
            last_name,
            employee_id,
            branch_id,
            position,
            department
          )
        `);

      // Format dates for date field (not timestamp)
      // attendance_date is a DATE field, so we need just YYYY-MM-DD format
      if (dateRangeStart) {
        const startDate = dateRangeStart.includes('T') ? dateRangeStart.split('T')[0] : dateRangeStart;
        query = query.gte('attendance_date', startDate);
        console.log('Attendance date range start:', startDate);
      }
      if (dateRangeEnd) {
        const endDate = dateRangeEnd.includes('T') ? dateRangeEnd.split('T')[0] : dateRangeEnd;
        query = query.lte('attendance_date', endDate);
        console.log('Attendance date range end:', endDate);
      }

      const { data, error } = await query.order('attendance_date', { ascending: false });

      if (error) {
        console.error('Error fetching attendance data:', error);
        throw error;
      }

      console.log('Attendance raw data:', data?.length, 'records');
      if (data && data.length > 0) {
        console.log('Sample attendance record:', data[0]);
      } else {
        console.warn('No attendance records found. Query params:', {
          dateRangeStart,
          dateRangeEnd,
          branchId
        });
      }

      // Fetch branch names separately if needed
      const branchIds = [...new Set((data || []).map((row: any) => row.staff?.branch_id).filter(Boolean))];
      const branchMap: Record<string, string> = {};
      
      if (branchIds.length > 0) {
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIds);
        
        (branchesData || []).forEach((b: any) => {
          branchMap[b.id] = b.name;
        });
      }

      // Transform to clean, readable format
      const cleanData = (data || []).map((row: any) => {
        const staff = row.staff as any;
        const branchName = staff?.branch_id ? branchMap[staff.branch_id] || 'N/A' : 'N/A';

        // Format time strings
        const formatTime = (timeString: string | null): string => {
          if (!timeString) return 'N/A';
          const date = new Date(timeString);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        };

        // Format status
        const formatStatus = (status: string | null): string => {
          if (!status) return 'Unknown';
          const statusMap: Record<string, string> = {
            'present': 'Present',
            'absent': 'Absent',
            'late': 'Late',
            'half_day': 'Half Day',
            'on_leave': 'On Leave'
          };
          return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
        };

        // Calculate overtime hours if available
        const overtimeHours = typeof row.overtime_hours === 'number' && row.overtime_hours > 0
          ? Number(row.overtime_hours).toFixed(2)
          : '0.00';

        // Format check-in method
        const formatCheckInMethod = (method: string | null): string => {
          if (!method) return 'Manual';
          const methodMap: Record<string, string> = {
            'manual': 'Manual',
            'pin': 'PIN',
            'qr': 'QR Code',
            'biometric': 'Biometric'
          };
          return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
        };

        return {
          employee_name: staff ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() : 'Unknown Employee',
          employee_id: staff?.employee_id || 'N/A',
          attendance_date: row.attendance_date ? new Date(row.attendance_date).toLocaleDateString() : '',
          time_in: formatTime(row.time_in),
          time_out: formatTime(row.time_out),
          total_hours: typeof row.total_hours === 'number' ? Number(row.total_hours).toFixed(2) : '0.00',
          overtime_hours: overtimeHours,
          status: formatStatus(row.status),
          is_late: row.is_late ? 'Yes' : 'No',
          late_minutes: row.late_minutes ? String(row.late_minutes) : '0',
          branch_name: branchName,
          position: staff?.position || 'N/A',
          department: staff?.department || 'N/A',
          location: row.location || 'N/A',
          check_in_method: formatCheckInMethod(row.check_in_method),
          notes: row.notes || ''
        };
      });

      console.log('Attendance transformed data:', cleanData.length, 'records');
      
      if (cleanData.length === 0) {
        console.warn('No attendance records found for the selected date range');
      }

      return {
        data: cleanData,
        recordCount: cleanData.length
      };
    }

    if (reportKey === 'payroll_summary' || reportKey === 'payroll_summary_report') {
      let query = supabase
        .from('payroll_records')
        .select(`
          id,
          period_id,
          staff_id,
          base_salary,
          days_present,
          daily_allowance,
          total_allowance,
          overtime_pay,
          bonuses,
          other_earnings,
          gross_pay,
          tax_deduction,
          sss_deduction,
          philhealth_deduction,
          pagibig_deduction,
          cash_advances,
          other_deductions,
          total_deductions,
          net_pay,
          status,
          payroll_periods:period_id(name, start_date, end_date, period_type),
          staff:staff_id(
            first_name,
            last_name,
            employee_id,
            branch_id,
            position,
            department
          )
        `);

      if (dateRangeStart) {
        query = query.gte('created_at', dateRangeStart);
      }
      if (dateRangeEnd) {
        query = query.lte('created_at', dateRangeEnd);
      }

      const { data: payrollData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payroll data:', error);
        throw error;
      }

      console.log('Payroll raw data:', payrollData?.length, 'records');
      if (payrollData && payrollData.length > 0) {
        console.log('Sample payroll record:', payrollData[0]);
      } else {
        console.warn('No payroll records found. Query params:', {
          dateRangeStart,
          dateRangeEnd,
          branchId
        });
      }

      // Filter by branch_id if provided (Supabase doesn't support nested filtering)
      let filteredData = payrollData || [];
      if (branchId) {
        filteredData = filteredData.filter((row: any) => {
          const staff = row.staff as any;
          return staff?.branch_id === branchId;
        });
      }

      // Fetch branch names separately if needed
      const branchIds = [...new Set(filteredData.map((row: any) => row.staff?.branch_id).filter(Boolean))];
      const branchMap: Record<string, string> = {};
      
      if (branchIds.length > 0) {
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIds);
        
        (branchesData || []).forEach((b: any) => {
          branchMap[b.id] = b.name;
        });
      }

      // Transform to clean, readable format
      const cleanData = filteredData.map((row: any) => {
        const staff = row.staff as any;
        const branchName = staff?.branch_id ? branchMap[staff.branch_id] || 'N/A' : 'N/A';
        const period = row.payroll_periods as any;

        // Format pay period dates
        const formatPayPeriod = (): string => {
          if (!period) return 'N/A';
          const periodName = period.name || '';
          const start = period.start_date ? new Date(period.start_date).toLocaleDateString() : '';
          const end = period.end_date ? new Date(period.end_date).toLocaleDateString() : '';
          const dateRange = start && end ? `${start} - ${end}` : start || end || 'N/A';
          return periodName ? `${periodName} (${dateRange})` : dateRange;
        };

        // Format payroll status
        const formatPayrollStatus = (status: string | null): string => {
          if (!status) return 'Pending';
          const statusMap: Record<string, string> = {
            'pending': 'Pending',
            'approved': 'Approved',
            'paid': 'Paid'
          };
          return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
        };

        // Format currency values
        const formatCurrency = (value: number | null | undefined): string => {
          if (typeof value !== 'number') return '0.00';
          return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const grossPay = row.gross_pay || 0;
        const netPay = row.net_pay || 0;
        const totalDeductions = row.total_deductions || 0;

        return {
          employee_name: staff ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() : 'Unknown Employee',
          employee_id: staff?.employee_id || 'N/A',
          pay_period: formatPayPeriod(),
          period_type: period?.period_type || 'N/A',
          days_present: String(row.days_present || 0),
          base_salary: formatCurrency(row.base_salary),
          daily_allowance: formatCurrency(row.daily_allowance),
          total_allowance: formatCurrency(row.total_allowance),
          overtime_pay: formatCurrency(row.overtime_pay),
          bonuses: formatCurrency(row.bonuses),
          other_earnings: formatCurrency(row.other_earnings),
          gross_pay: formatCurrency(grossPay),
          tax_deduction: formatCurrency(row.tax_deduction),
          sss_deduction: formatCurrency(row.sss_deduction),
          philhealth_deduction: formatCurrency(row.philhealth_deduction),
          pagibig_deduction: formatCurrency(row.pagibig_deduction),
          cash_advances: formatCurrency(row.cash_advances),
          other_deductions: formatCurrency(row.other_deductions),
          total_deductions: formatCurrency(totalDeductions),
          net_pay: formatCurrency(netPay),
          status: formatPayrollStatus(row.status),
          branch_name: branchName,
          position: staff?.position || 'N/A',
          department: staff?.department || 'N/A'
        };
      });

      console.log('Payroll transformed data:', cleanData.length, 'records');
      
      if (cleanData.length === 0) {
        console.warn('No payroll records found for the selected date range');
      }
      
      return {
        data: cleanData,
        recordCount: cleanData.length
      };
    }

    // Default: return all staff (cleaned)
    let staffQuery = supabase
      .from('staff')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        department,
        branch_id,
        hire_date,
        salary,
        is_active,
        role,
        branches:branch_id(name)
      `);

    if (branchId) {
      staffQuery = staffQuery.eq('branch_id', branchId);
    }
    staffQuery = staffQuery.eq('is_active', true);

    const { data: staffData, error: staffError } = await staffQuery;

    if (staffError) throw staffError;

    // Transform to clean format
    const cleanStaff = (staffData || []).map((s: any) => {
      const branch = s.branches as any;
      return {
        employee_name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        employee_id: s.employee_id || 'N/A',
        email: s.email || 'N/A',
        phone: s.phone || 'N/A',
        position: s.position || 'N/A',
        department: s.department || 'N/A',
        branch_name: branch?.name || 'N/A',
        hire_date: s.hire_date ? new Date(s.hire_date).toLocaleDateString() : 'N/A',
        salary: typeof s.salary === 'number' 
          ? Number(s.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : 'N/A',
        role: s.role || 'N/A',
        status: s.is_active ? 'Active' : 'Inactive'
      };
    });

    return {
      data: cleanStaff,
      recordCount: cleanStaff.length
    };
  }

  /**
   * Generate Financial Report Data
   */
  private async generateFinancialReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    const { dateRangeStart, dateRangeEnd, branchId } = params;

    // Format dates for queries
    const formatDateForQuery = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };

    const startDate = formatDateForQuery(dateRangeStart);
    const endDate = formatDateForQuery(dateRangeEnd);

    if (reportKey === 'financial_summary' || reportKey === 'financial_summary_report') {
      // Get revenue from sales transactions
      let transactionsQuery = supabase
        .from('pos_transactions')
        .select('total_amount, subtotal, tax_amount, transaction_date, branch_id')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .eq('payment_status', 'completed');

      if (startDate) {
        transactionsQuery = transactionsQuery.gte('transaction_date', startDate);
      }
      if (endDate) {
        transactionsQuery = transactionsQuery.lte('transaction_date', endDate);
      }
      if (branchId) {
        transactionsQuery = transactionsQuery.eq('branch_id', branchId);
      }

      const { data: transactions, error: txError } = await transactionsQuery;

      if (txError) {
        console.error('Error fetching transactions:', txError);
        throw txError;
      }

      console.log('Financial - Transactions:', transactions?.length || 0, 'records');

      // Calculate revenue metrics
      const revenue = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
      const tax = transactions?.reduce((sum, t) => sum + (parseFloat(t.tax_amount?.toString() || '0') || 0), 0) || 0;
      const subtotal = transactions?.reduce((sum, t) => sum + (parseFloat(t.subtotal?.toString() || '0') || 0), 0) || 0;

      // Get expenses (using date field - primary field in schema)
      let totalExpenses = 0;
      let expenseCount = 0;
      try {
        let expensesQuery = supabase
          .from('expenses')
          .select('amount, date, expense_date, status')
          .in('status', ['approved', 'paid', 'Paid']);

        // Use date field (primary) or expense_date (fallback)
        if (startDate) {
          expensesQuery = expensesQuery.or(`date.gte.${startDate},expense_date.gte.${startDate}`);
        }
        if (endDate) {
          expensesQuery = expensesQuery.or(`date.lte.${endDate},expense_date.lte.${endDate}`);
        }
        if (branchId) {
          expensesQuery = expensesQuery.eq('branch_id', branchId);
        }

        const { data: expenses, error: expError } = await expensesQuery;

        if (!expError && expenses) {
          totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0);
          expenseCount = expenses.length;
          console.log('Financial - Expenses:', expenseCount, 'records');
        } else if (expError) {
          console.warn('Expenses table query failed:', expError.message);
        }
      } catch (expErr) {
        console.warn('Could not fetch expenses:', expErr);
      }

      // Try to get payroll expenses
      let totalPayroll = 0;
      let payrollCount = 0;
      try {
        let payrollQuery = supabase
          .from('payroll_records')
          .select('gross_pay, created_at')
          .in('status', ['approved', 'paid']);

        if (startDate) {
          payrollQuery = payrollQuery.gte('created_at', startDate);
        }
        if (endDate) {
          payrollQuery = payrollQuery.lte('created_at', endDate);
        }

        const { data: payrollRecords, error: payrollError } = await payrollQuery;

        if (!payrollError && payrollRecords) {
          totalPayroll = payrollRecords.reduce((sum, p) => sum + (parseFloat(p.gross_pay?.toString() || '0') || 0), 0);
          payrollCount = payrollRecords.length;
          console.log('Financial - Payroll:', payrollCount, 'records');
        }
      } catch (payrollErr) {
        console.warn('Could not fetch payroll:', payrollErr);
      }

      // Calculate net profit/loss
      const totalExpensesAll = totalExpenses + totalPayroll;
      const netProfit = revenue - totalExpensesAll;
      const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

      // Format currency values
      const formatCurrency = (value: number): string => {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // Format period dates
      const formatPeriod = (): string => {
        if (startDate && endDate) {
          const start = new Date(startDate).toLocaleDateString();
          const end = new Date(endDate).toLocaleDateString();
          return `${start} - ${end}`;
        }
        return startDate || endDate || 'All Time';
      };

      return {
        data: [{
          period: formatPeriod(),
          revenue: formatCurrency(revenue),
          revenue_subtotal: formatCurrency(subtotal),
          tax_collected: formatCurrency(tax),
          transaction_count: String(transactions?.length || 0),
          total_expenses: formatCurrency(totalExpenses),
          payroll_expenses: formatCurrency(totalPayroll),
          total_expenses_all: formatCurrency(totalExpensesAll),
          expense_count: String(expenseCount),
          payroll_count: String(payrollCount),
          net_profit: formatCurrency(netProfit),
          profit_margin: `${profitMargin.toFixed(2)}%`,
          period_start: startDate || '',
          period_end: endDate || ''
        }],
        recordCount: 1
      };
    }

    if (reportKey === 'expense_report' || reportKey === 'expense_report_detail') {
      // Get expenses with categories - fetch branch names separately to avoid nested relationship issues
      let expensesQuery = supabase
        .from('expenses')
        .select(`
          id,
          date,
          expense_date,
          amount,
          description,
          category,
          category_id,
          status,
          branch_id,
          payment_method,
          expense_number,
          expense_categories:category_id(name)
        `);

      // Use date field (primary) or expense_date (fallback)
      if (startDate) {
        expensesQuery = expensesQuery.or(`date.gte.${startDate},expense_date.gte.${startDate}`);
      }
      if (endDate) {
        expensesQuery = expensesQuery.or(`date.lte.${endDate},expense_date.lte.${endDate}`);
      }
      if (branchId) {
        expensesQuery = expensesQuery.eq('branch_id', branchId);
      }

      // Filter by approved/paid status
      expensesQuery = expensesQuery.in('status', ['approved', 'paid', 'Paid']);

      const { data: expenses, error: expensesError } = await expensesQuery.order('date', { ascending: false });

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        throw expensesError;
      }

      console.log('Expense report - Expenses:', expenses?.length || 0, 'records');

      // Fetch branch names separately if needed
      const branchIds = [...new Set((expenses || []).map((row: any) => row.branch_id).filter(Boolean))];
      const branchMap: Record<string, string> = {};
      
      if (branchIds.length > 0) {
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIds);
        
        (branchesData || []).forEach((b: any) => {
          branchMap[b.id] = b.name;
        });
      }

      // Transform to clean, readable format
      const cleanData = (expenses || []).map((row: any) => {
        const category = row.expense_categories as any;
        const branchName = row.branch_id ? branchMap[row.branch_id] || 'N/A' : 'N/A';

        // Use date field (primary) or expense_date (fallback)
        const expenseDate = row.date || row.expense_date;

        // Format status
        const formatStatus = (status: string | null): string => {
          if (!status) return 'Pending';
          const statusMap: Record<string, string> = {
            'pending': 'Pending',
            'approved': 'Approved',
            'paid': 'Paid',
            'Paid': 'Paid',
            'rejected': 'Rejected',
            'cancelled': 'Cancelled',
            'reimbursed': 'Reimbursed'
          };
          return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
        };

        // Format currency
        const formatCurrency = (value: number | null | undefined): string => {
          if (typeof value !== 'number') return '0.00';
          return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        return {
          expense_date: expenseDate ? new Date(expenseDate).toLocaleDateString() : '',
          expense_number: row.expense_number || 'N/A',
          category_name: category?.name || row.category || 'Uncategorized',
          description: row.description || 'N/A',
          amount: formatCurrency(row.amount),
          branch_name: branchName,
          payment_method: row.payment_method || 'N/A',
          status: formatStatus(row.status)
        };
      });

      console.log('Expense report - Transformed data:', cleanData.length, 'records');

      return {
        data: cleanData,
        recordCount: cleanData.length
      };
    }

    if (reportKey === 'profit_loss' || reportKey === 'profit_loss_report') {
      // Get revenue
      let revenueQuery = supabase
        .from('pos_transactions')
        .select('total_amount, subtotal, tax_amount')
        .eq('transaction_type', 'sale')
        .eq('status', 'active')
        .eq('payment_status', 'completed');

      if (startDate) {
        revenueQuery = revenueQuery.gte('transaction_date', startDate);
      }
      if (endDate) {
        revenueQuery = revenueQuery.lte('transaction_date', endDate);
      }
      if (branchId) {
        revenueQuery = revenueQuery.eq('branch_id', branchId);
      }

      const { data: transactions, error: txError } = await revenueQuery;
      if (txError) throw txError;

      const totalRevenue = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;

      // Get expenses by category - fetch categories separately to avoid nested relationship issues
      let expensesQuery = supabase
        .from('expenses')
        .select('amount, category, category_id, date, expense_date')
        .in('status', ['approved', 'paid', 'Paid']);

      // Use date field (primary) or expense_date (fallback)
      if (startDate) {
        expensesQuery = expensesQuery.or(`date.gte.${startDate},expense_date.gte.${startDate}`);
      }
      if (endDate) {
        expensesQuery = expensesQuery.or(`date.lte.${endDate},expense_date.lte.${endDate}`);
      }
      if (branchId) {
        expensesQuery = expensesQuery.eq('branch_id', branchId);
      }

      const { data: expenses, error: expError } = await expensesQuery;
      if (expError && expError.code !== 'PGRST116') {
        // PGRST116 = table not found, ignore it
        console.warn('Could not fetch expenses:', expError);
      }

      // Fetch category names separately if category_id exists
      const categoryIds = [...new Set((expenses || []).map((exp: any) => exp.category_id).filter(Boolean))];
      const categoryMap: Record<string, string> = {};
      
      if (categoryIds.length > 0) {
        const { data: categoriesData } = await supabase
          .from('expense_categories')
          .select('id, name')
          .in('id', categoryIds);
        
        (categoriesData || []).forEach((c: any) => {
          categoryMap[c.id] = c.name;
        });
      }

      // Group expenses by category
      const expenseCategoryMap: Record<string, number> = {};
      (expenses || []).forEach((exp: any) => {
        const categoryName = exp.category_id && categoryMap[exp.category_id] 
          ? categoryMap[exp.category_id] 
          : (exp.category || 'Uncategorized');
        const amount = parseFloat(exp.amount?.toString() || '0') || 0;
        expenseCategoryMap[categoryName] = (expenseCategoryMap[categoryName] || 0) + amount;
      });

      // Get payroll expenses
      let payrollQuery = supabase
        .from('payroll_records')
        .select('gross_pay')
        .in('status', ['approved', 'paid']);

      if (startDate) {
        payrollQuery = payrollQuery.gte('created_at', startDate);
      }
      if (endDate) {
        payrollQuery = payrollQuery.lte('created_at', endDate);
      }

      const { data: payrollRecords } = await payrollQuery;
      const totalPayroll = payrollRecords?.reduce((sum, p) => sum + (parseFloat(p.gross_pay?.toString() || '0') || 0), 0) || 0;

      // Format currency
      const formatCurrency = (value: number): string => {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // Build P&L structure
      const pnlData: any[] = [];

      // Revenue section
      pnlData.push({
        section: 'Revenue',
        category: 'Sales Revenue',
        amount: formatCurrency(totalRevenue),
        type: 'revenue'
      });

      // Expenses section
      Object.entries(expenseCategoryMap).forEach(([category, amount]) => {
        pnlData.push({
          section: 'Expenses',
          category: category,
          amount: formatCurrency(amount),
          type: 'expense'
        });
      });

      // Payroll expenses
      if (totalPayroll > 0) {
        pnlData.push({
          section: 'Expenses',
          category: 'Payroll & Benefits',
          amount: formatCurrency(totalPayroll),
          type: 'expense'
        });
      }

      // Calculate totals
      const totalExpenses = Object.values(expenseCategoryMap).reduce((sum, amt) => sum + amt, 0) + totalPayroll;
      const netProfit = totalRevenue - totalExpenses;

      pnlData.push({
        section: 'Summary',
        category: 'Total Expenses',
        amount: formatCurrency(totalExpenses),
        type: 'summary'
      });

      pnlData.push({
        section: 'Summary',
        category: 'Net Profit (Loss)',
        amount: formatCurrency(netProfit),
        type: netProfit >= 0 ? 'profit' : 'loss'
      });

      return {
        data: pnlData,
        recordCount: pnlData.length
      };
    }

    // Default: Return basic financial summary (revenue only)
    // Avoid infinite recursion - return a basic summary
    let transactionsQuery = supabase
      .from('pos_transactions')
      .select('total_amount, subtotal, tax_amount')
      .eq('transaction_type', 'sale')
      .eq('status', 'active')
      .eq('payment_status', 'completed');

    if (startDate) {
      transactionsQuery = transactionsQuery.gte('transaction_date', startDate);
    }
    if (endDate) {
      transactionsQuery = transactionsQuery.lte('transaction_date', endDate);
    }
    if (branchId) {
      transactionsQuery = transactionsQuery.eq('branch_id', branchId);
    }

    const { data: transactions, error: txError } = await transactionsQuery;
    if (txError) throw txError;

    const revenue = transactions?.reduce((sum, t) => sum + (parseFloat(t.total_amount?.toString() || '0') || 0), 0) || 0;
    const tax = transactions?.reduce((sum, t) => sum + (parseFloat(t.tax_amount?.toString() || '0') || 0), 0) || 0;
    const subtotal = transactions?.reduce((sum, t) => sum + (parseFloat(t.subtotal?.toString() || '0') || 0), 0) || 0;

    const formatCurrency = (value: number): string => {
      return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return {
      data: [{
        revenue: formatCurrency(revenue),
        revenue_subtotal: formatCurrency(subtotal),
        tax_collected: formatCurrency(tax),
        transaction_count: String(transactions?.length || 0),
        period_start: startDate || '',
        period_end: endDate || ''
      }],
      recordCount: 1
    };
  }

  /**
   * Generate Marketing Report Data
   */
  private async generateMarketingReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    if (reportKey === 'campaign_performance') {
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: campaigns || [],
        recordCount: campaigns?.length || 0
      };
    }

    // Default: return campaigns
    const { data: campaigns, error } = await supabase
      .from('marketing_campaigns')
      .select('*');

    if (error) throw error;

    return {
      data: campaigns || [],
      recordCount: campaigns?.length || 0
    };
  }

  /**
   * Generate Operational Report Data
   */
  private async generateOperationalReportData(
    reportKey: string,
    params: ReportGenerationParams
  ): Promise<{ data: any[]; recordCount: number }> {
    if (reportKey === 'user_activity') {
      const { dateRangeStart, dateRangeEnd } = params;
      
      let query = supabase
        .from('user_activity')
        .select(`
          id,
          activity_type,
          description,
          created_at,
          users:user_id(email, first_name, last_name)
        `);

      if (dateRangeStart) {
        query = query.gte('created_at', dateRangeStart);
      }
      if (dateRangeEnd) {
        query = query.lte('created_at', dateRangeEnd);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

      if (error) throw error;

      return {
        data: data || [],
        recordCount: data?.length || 0
      };
    }

    if (reportKey === 'security_audit') {
      const { dateRangeStart, dateRangeEnd } = params;
      
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          entity_type,
          created_at,
          users:user_id(email)
        `);

      if (dateRangeStart) {
        query = query.gte('created_at', dateRangeStart);
      }
      if (dateRangeEnd) {
        query = query.lte('created_at', dateRangeEnd);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

      if (error) throw error;

      return {
        data: data || [],
        recordCount: data?.length || 0
      };
    }

    // Default: return empty
    return {
      data: [],
      recordCount: 0
    };
  }

  /**
   * Convert report data to file format
   */
  private async convertToFileFormat(
    reportData: { data: any[]; recordCount: number },
    format: 'pdf' | 'csv' | 'excel' | 'json',
    definition: ReportDefinition
  ): Promise<{ content: string | Blob; size: number }> {
    switch (format) {
      case 'json':
        const jsonContent = JSON.stringify(reportData.data, null, 2);
        return {
          content: jsonContent,
          size: new Blob([jsonContent]).size
        };

      case 'csv':
        const csvContent = this.convertToCSV(reportData.data);
        return {
          content: csvContent,
          size: new Blob([csvContent]).size
        };

      case 'pdf':
        // For PDF, we'll create a simple HTML representation
        // Note: This creates HTML that can be printed to PDF via browser print dialog
        // For production, consider using jsPDF, pdfkit, or a backend PDF generation service
        const htmlContent = this.convertToHTML(reportData.data, definition);
        // Return HTML with explicit MIME type for proper handling
        return {
          content: htmlContent,
          size: new Blob([htmlContent], { type: 'text/html' }).size
        };

      case 'excel':
        // For Excel, create CSV format (actual Excel would need a library)
        const excelContent = this.convertToCSV(reportData.data);
        return {
          content: excelContent,
          size: new Blob([excelContent]).size
        };

      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        // Escape commas and quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Convert data to HTML format (for PDF generation)
   */
  private convertToHTML(data: any[], definition: ReportDefinition): string {
    console.log('convertToHTML called with:', {
      dataLength: data?.length || 0,
      hasData: !!data && data.length > 0,
      firstItem: data?.[0]
    });
    
    if (!data || data.length === 0) {
      console.warn('convertToHTML: No data provided, showing empty message');
      return `
        <html>
          <head><title>${definition.report_name}</title></head>
          <body>
            <h1>${definition.report_name}</h1>
            <p>No data available for the selected date range.</p>
            <p style="color: #666; font-size: 12px;">Please verify that data exists in the database for the selected period.</p>
          </body>
        </html>
      `;
    }

    // Format headers with human-readable labels
    const headerLabels: Record<string, string> = {
      transaction_number: 'Transaction #',
      transaction_date: 'Date',
      branch_name: 'Branch',
      cashier_name: 'Cashier',
      customer_name: 'Customer',
      subtotal: 'Subtotal',
      tax_amount: 'Tax',
      total_amount: 'Total',
      payment_status: 'Payment Status',
      // Product performance headers
      product_name: 'Product',
      sku: 'SKU',
      total_quantity: 'Quantity Sold',
      total_revenue: 'Revenue',
      // Category headers
      category_name: 'Category',
      // Inventory headers
      quantity_on_hand: 'On Hand',
      quantity_reserved: 'Reserved',
      quantity_available: 'Available',
      reorder_level: 'Reorder Level',
      max_stock_level: 'Max Level',
      base_unit: 'Unit',
      last_counted: 'Last Counted',
      shortage: 'Shortage',
      status: 'Status',
      movement_date: 'Movement Date',
      movement_type: 'Movement Type',
      quantity: 'Quantity',
      direction: 'Direction',
      reference_number: 'Reference #',
      created_by: 'Created By',
      notes: 'Notes',
      // HR headers
      employee_name: 'Employee',
      employee_id: 'Employee ID',
      attendance_date: 'Date',
      time_in: 'Time In',
      time_out: 'Time Out',
      total_hours: 'Hours',
      overtime_hours: 'Overtime',
      is_late: 'Late',
      late_minutes: 'Late (Minutes)',
      location: 'Location',
      check_in_method: 'Check-in Method',
      pay_period: 'Pay Period',
      period_type: 'Period Type',
      days_present: 'Days Present',
      base_salary: 'Base Salary',
      daily_allowance: 'Daily Allowance',
      total_allowance: 'Total Allowance',
      overtime_pay: 'Overtime Pay',
      bonuses: 'Bonuses',
      other_earnings: 'Other Earnings',
      gross_pay: 'Gross Pay',
      tax_deduction: 'Tax',
      sss_deduction: 'SSS',
      philhealth_deduction: 'PhilHealth',
      pagibig_deduction: 'Pag-IBIG',
      cash_advances: 'Cash Advances',
      other_deductions: 'Other Deductions',
      total_deductions: 'Total Deductions',
      net_pay: 'Net Pay',
      position: 'Position',
      department: 'Department',
      hire_date: 'Hire Date',
      salary: 'Salary',
      // Financial headers
      period: 'Period',
      revenue: 'Revenue',
      revenue_subtotal: 'Revenue (Subtotal)',
      tax_collected: 'Tax Collected',
      transaction_count: 'Transactions',
      total_expenses: 'Expenses',
      payroll_expenses: 'Payroll',
      total_expenses_all: 'Total Expenses',
      expense_count: 'Expense Count',
      payroll_count: 'Payroll Count',
      net_profit: 'Net Profit',
      profit_margin: 'Profit Margin',
      period_start: 'Period Start',
      period_end: 'Period End',
      expense_date: 'Date',
      expense_number: 'Expense #',
      section: 'Section',
      category: 'Category',
      amount: 'Amount',
      type: 'Type',
      // Default: capitalize and replace underscores
    };

    const formatHeader = (header: string): string => {
      if (headerLabels[header]) return headerLabels[header];
      return header
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const headers = Object.keys(data[0]);
    const formattedHeaders = headers.map(formatHeader);

    const rows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        
        // Skip objects - they should already be transformed
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // If there's still an object, try to extract meaningful value
          if (value.name) return String(value.name);
          if (value.first_name && value.last_name) {
            return `${value.first_name} ${value.last_name}`.trim();
          }
          // Last resort: skip or show placeholder
          return 'N/A';
        }
        
        // Format the value for display
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          // Format numbers with proper decimals
          return Number(value).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        }
        return String(value);
      });
    });

    return `
      <html>
        <head>
          <title>${definition.report_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #4CAF50; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            tr:hover { background-color: #e8f5e9; }
            .summary { margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; }
          </style>
        </head>
        <body>
          <h1>${definition.report_name}</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${formattedHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${this.escapeHtml(String(cell))}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="summary">
            <p><strong>Total Records:</strong> ${data.length}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    if (typeof text !== 'string') return String(text);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Store report file and return URL
   */
  private async storeReportFile(
    reportId: string,
    fileData: { content: string | Blob; size: number },
    format: string
  ): Promise<string> {
    const fileName = `report_${reportId}.${format}`;
    const filePath = `reports/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

      // Convert content to Blob if it's a string
      // For PDF format, we're storing HTML, so use text/html MIME type
      const mimeType = format === 'pdf' && typeof fileData.content === 'string' 
        ? 'text/html' 
        : this.getMimeType(format);
      
      const blob = typeof fileData.content === 'string'
        ? new Blob([fileData.content], { type: mimeType })
        : fileData.content;

    // Upload to Supabase Storage
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        // If storage bucket doesn't exist, return a data URL instead
        console.warn('Storage upload failed, using data URL:', uploadError);
        if (typeof fileData.content === 'string') {
          // For PDF format (which is HTML), use text/html MIME type
          const mimeType = format === 'pdf' ? 'text/html' : this.getMimeType(format);
          return `data:${mimeType};base64,${btoa(fileData.content)}`;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      // Fallback: return data URL
      console.warn('Storage error, using data URL:', error);
      if (typeof fileData.content === 'string') {
        // For PDF format (which is HTML), use text/html MIME type
        const mimeType = format === 'pdf' ? 'text/html' : this.getMimeType(format);
        return `data:${mimeType};base64,${btoa(fileData.content)}`;
      }
      throw error;
    }
  }

  /**
   * Get MIME type for file format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json',
      html: 'text/html'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Download report file
   */
  async downloadReport(reportId: string): Promise<void> {
    const { data: report, error } = await supabase
      .from('generated_reports')
      .select('file_url, report_name, file_format')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new Error('Report not found');
    }

    if (!report.file_url) {
      throw new Error('Report file not available');
    }

    // If it's a data URL, download directly
    if (report.file_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = report.file_url;
      
      // For PDF format with HTML content, we need to handle it differently
      if (report.file_format === 'pdf' && report.file_url.startsWith('data:text/html')) {
        // Convert HTML to proper PDF data URL or trigger browser print
        // For now, we'll create a blob URL from the HTML and trigger print
        const htmlContent = atob(report.file_url.split(',')[1]);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Open in new window and trigger print dialog (user can save as PDF)
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        }
        
        // Also provide direct download as HTML
        link.href = blobUrl;
        link.download = `${report.report_name}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        return;
      }
      
      link.download = `${report.report_name}.${report.file_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // If it's a storage URL, try to download directly
    try {
      // Fetch the file from the URL
      const response = await fetch(report.file_url);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${report.report_name}.${report.file_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (fetchError) {
      // Fallback: open in new window
      console.warn('Direct download failed, opening in new window:', fetchError);
      window.open(report.file_url, '_blank');
    }
  }
}

export const reportsService = new ReportsService();
export default reportsService;

