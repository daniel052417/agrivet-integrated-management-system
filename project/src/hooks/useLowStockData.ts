import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';
import { LowStockItem, InventoryMetrics } from '../types/inventory';
import { AlertTriangle, Clock, Package } from 'lucide-react';

interface CategoryAgg {
  category: string;
  items: number;
  value: number;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  color: string;
}

interface Suggestion {
  supplier: string;
  items: number;
  totalValue: number;
  contact: string;
  email: string;
  leadTime: string;
  lastOrder: string;
}

interface BranchData {
  id: string;
  name: string;
  items: LowStockItem[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalValue: number;
}

interface UseLowStockDataReturn {
  lowStockItems: LowStockItem[];
  alertMetrics: InventoryMetrics[];
  categoryBreakdown: CategoryAgg[];
  reorderSuggestions: Suggestion[];
  branchData: BranchData[];
  availableBranches: Array<{ id: string; name: string }>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500'];

/**
 * Custom hook for fetching low stock alerts data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (inventory-clerk) see only their branch data
 */
export const useLowStockData = (): UseLowStockDataReturn => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [alertMetrics, setAlertMetrics] = useState<InventoryMetrics[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryAgg[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<Suggestion[]>([]);
  const [branchData, setBranchData] = useState<BranchData[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get RBAC filter configuration
  const getFilterConfig = useCallback(() => {
    const currentUser = simplifiedAuth.getCurrentUser();
    
    if (!currentUser) {
      return { 
        isSuperAdmin: false, 
        branchId: null,
        shouldFilter: false 
      };
    }

    const isSuperAdmin = currentUser.role_name === SYSTEM_ROLES.SUPER_ADMIN;
    const branchId = currentUser.branch_id || null;
    const shouldFilter = !isSuperAdmin && branchId !== null;

    return {
      isSuperAdmin,
      branchId,
      shouldFilter
    };
  }, []);

  // Fetch low stock data with RBAC filtering
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Build query with RBAC filtering
      let inventoryQuery = supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          branch_id,
          quantity_available,
          quantity_on_hand,
          reorder_level,
          last_counted,
          updated_at,
          base_unit,
          products:product_id (
            id,
            sku,
            name,
            cost,
            categories:category_id ( id, name ),
            suppliers:supplier_id ( id, name, contact_person, email, phone )
          ),
          branches:branch_id ( id, name, code )
        `)
        .not('branch_id', 'is', null);

      // Apply RBAC branch filter for non-Super Admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        inventoryQuery = inventoryQuery.eq('branch_id', filterConfig.branchId);
      }

      const { data: inventoryData, error: inventoryError } = await inventoryQuery;

      if (inventoryError) throw inventoryError;

      // Transform and filter items
      const transformedItems: LowStockItem[] = (inventoryData || [])
        .filter(item => {
          if (!item.products || !item.branches) return false;
          const currentStock = Number(item.quantity_available || 0);
          const minimumStock = Number(item.reorder_level || 10);
          return currentStock <= minimumStock;
        })
        .map((item: any) => {
          const product = item.products;
          const currentStock = Number(item.quantity_available || 0);
          const minimumStock = Number(item.reorder_level || 10);
          const avgDailyUsage = Math.max(1, Math.round(currentStock / 14));
          const daysUntilEmpty = currentStock > 0 ? Math.max(1, Math.ceil(currentStock / avgDailyUsage)) : 0;
          
          let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
          const ratio = minimumStock > 0 ? currentStock / minimumStock : 1;
          
          if (currentStock === 0) {
            urgency = 'Critical';
          } else if (ratio <= 0.25) {
            urgency = 'High';
          } else if (ratio <= 0.5) {
            urgency = 'Medium';
          }

          const unitPrice = Number(product.cost || 0);
          const totalValue = currentStock * unitPrice;

          return {
            id: `${product.id}-${item.branch_id}`,
            name: product.name || 'Unknown Product',
            sku: product.sku || 'N/A',
            category: product.categories?.name || 'Uncategorized',
            currentStock,
            minimumStock,
            reorderLevel: Math.max(minimumStock, Math.ceil(minimumStock * 1.5)),
            unitPrice,
            totalValue,
            supplier: product.suppliers?.name || 'Unknown',
            supplierContact: product.suppliers?.phone || 'N/A',
            supplierEmail: product.suppliers?.email || 'N/A',
            lastOrderDate: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Never',
            leadTime: '7 days',
            urgency,
            daysUntilEmpty,
            avgDailyUsage,
            unitLabel: item.base_unit || 'pcs',
            branchId: item.branch_id,
            branchName: item.branches?.name || 'Unknown Branch'
          };
        });

      setLowStockItems(transformedItems);

      // Calculate branch data
      const branchMap = new Map<string, BranchData>();
      const branches = new Set<string>();
      
      transformedItems.forEach(item => {
        const branchId = item.branchId;
        const branchName = item.branchName;
        
        branches.add(JSON.stringify({ id: branchId, name: branchName }));
        
        if (!branchMap.has(branchId)) {
          branchMap.set(branchId, {
            id: branchId,
            name: branchName,
            items: [],
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            totalValue: 0
          });
        }
        
        const branchDataItem = branchMap.get(branchId)!;
        branchDataItem.items.push(item);
        branchDataItem.totalValue += item.totalValue;
        
        if (item.urgency === 'Critical') branchDataItem.criticalCount++;
        else if (item.urgency === 'High') branchDataItem.highCount++;
        else if (item.urgency === 'Medium') branchDataItem.mediumCount++;
      });
      
      const branchDataArray = Array.from(branchMap.values()).sort((a, b) => b.totalValue - a.totalValue);
      setBranchData(branchDataArray);
      
      const availableBranchesArray = Array.from(branches)
        .map(b => JSON.parse(b))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableBranches(availableBranchesArray);

      // Calculate alert metrics
      const critical = transformedItems.filter(i => i.urgency === 'Critical').length;
      const high = transformedItems.filter(i => i.urgency === 'High').length;
      const medium = transformedItems.filter(i => i.urgency === 'Medium').length;
      
      setAlertMetrics([
        { 
          title: 'Critical Alerts', 
          value: String(critical), 
          description: 'Immediate action required', 
          color: 'text-red-600', 
          bgColor: 'bg-red-100', 
          icon: AlertTriangle, 
          period: 'current' 
        },
        { 
          title: 'High Priority', 
          value: String(high), 
          description: 'Reorder within 3 days', 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-100', 
          icon: Clock, 
          period: 'current' 
        },
        { 
          title: 'Medium Priority', 
          value: String(medium), 
          description: 'Reorder within 7 days', 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100', 
          icon: Package, 
          period: 'current' 
        },
      ]);

      // Calculate category breakdown
      const byCat = new Map<string, { items: number; value: number; urgencyRank: number }>();
      const urgencyToRank: Record<'Critical' | 'High' | 'Medium' | 'Low', number> = { 
        Critical: 3, 
        High: 2, 
        Medium: 1, 
        Low: 0 
      };
      
      transformedItems.forEach(i => {
        const key = i.category;
        const agg = byCat.get(key) || { items: 0, value: 0, urgencyRank: 0 };
        agg.items += 1;
        agg.value += i.totalValue;
        agg.urgencyRank = Math.max(agg.urgencyRank, urgencyToRank[i.urgency]);
        byCat.set(key, agg);
      });
      
      const catList: CategoryAgg[] = Array.from(byCat.entries()).map(([cat, agg], idx) => {
        const urgencyKey = (Object.keys(urgencyToRank) as Array<'Critical' | 'High' | 'Medium' | 'Low'>)
          .find(u => urgencyToRank[u] === agg.urgencyRank) || 'Low';
        return {
          category: cat,
          items: agg.items,
          value: agg.value,
          urgency: urgencyKey,
          color: COLORS[idx % COLORS.length],
        };
      }).sort((a, b) => b.value - a.value);
      
      setCategoryBreakdown(catList);

      // Calculate reorder suggestions
      const bySupplier = new Map<string, { 
        items: number; 
        value: number; 
        last: string; 
        contact: string; 
        email: string;
      }>();
      
      transformedItems.forEach(i => {
        const key = i.supplier;
        const agg = bySupplier.get(key) || { 
          items: 0, 
          value: 0, 
          last: '', 
          contact: i.supplierContact, 
          email: i.supplierEmail 
        };
        agg.items += 1;
        agg.value += i.totalValue;
        agg.last = agg.last && i.lastOrderDate && agg.last > i.lastOrderDate ? agg.last : i.lastOrderDate;
        bySupplier.set(key, agg);
      });
      
      const sug: Suggestion[] = Array.from(bySupplier.entries()).map(([supplier, agg]) => ({
        supplier,
        items: agg.items,
        totalValue: agg.value,
        contact: agg.contact || '—',
        email: agg.email || '—',
        leadTime: '7-14 days',
        lastOrder: agg.last || '—',
      })).sort((a, b) => b.totalValue - a.totalValue);
      
      setReorderSuggestions(sug);

    } catch (err: any) {
      console.error('Error loading low stock data:', err);
      setError(err.message || 'Failed to load low stock data');
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    lowStockItems,
    alertMetrics,
    categoryBreakdown,
    reorderSuggestions,
    branchData,
    availableBranches,
    loading,
    error,
    refreshData
  };
};










