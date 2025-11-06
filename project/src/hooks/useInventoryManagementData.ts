import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { simplifiedAuth, SYSTEM_ROLES } from '../lib/simplifiedAuth';
import { InventoryManagementRow } from '../types/inventory';

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
  image_url?: string;
}

interface UseInventoryManagementDataReturn {
  products: InventoryManagementRow[];
  categories: Category[];
  suppliers: Supplier[];
  branches: Branch[];
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refreshProducts: (filters?: {
    searchTerm?: string;
    selectedBranch?: string;
    selectedCategory?: string;
  }) => Promise<void>;
  refreshSupportingData: () => Promise<void>;
}

/**
 * Custom hook for fetching inventory management data with RBAC-based filtering
 * - Super Admin sees all data
 * - Branch-based users (inventory-clerk) see only their branch data
 */
export const useInventoryManagementData = (): UseInventoryManagementDataReturn => {
  const [products, setProducts] = useState<InventoryManagementRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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

  // Fetch supporting data (categories, suppliers, branches, brands)
  const refreshSupportingData = useCallback(async () => {
    try {
      const filterConfig = getFilterConfig();

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Fetch branches - filter by branch_id for non-Super Admin users
      let branchesQuery = supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (filterConfig.shouldFilter && filterConfig.branchId) {
        branchesQuery = branchesQuery.eq('id', filterConfig.branchId);
      }

      const { data: branchesData, error: branchesError } = await branchesQuery.order('name');

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, image_url')
        .order('name');

      if (brandsError) throw brandsError;
      setBrands(brandsData || []);
    } catch (err: any) {
      console.error('Error fetching supporting data:', err);
      setError(err.message || 'Failed to load supporting data');
    }
  }, [getFilterConfig]);

  // Fetch products with RBAC filtering
  const refreshProducts = useCallback(async (filters?: {
    searchTerm?: string;
    selectedBranch?: string;
    selectedCategory?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const filterConfig = getFilterConfig();

      // Build query with filters
      let query = supabase
        .from('inventory_management')
        .select('*')
        .order('product_name');

      // Apply RBAC branch filter for non-Super Admin users
      if (filterConfig.shouldFilter && filterConfig.branchId) {
        query = query.eq('branch_id', filterConfig.branchId);
      }

      // Apply user-selected branch filter (only if Super Admin or if it matches their branch)
      if (filters?.selectedBranch && filters.selectedBranch !== 'all') {
        // For non-Super Admin, ensure they can only filter by their own branch
        if (filterConfig.isSuperAdmin || filters.selectedBranch === filterConfig.branchId) {
          query = query.eq('branch_id', filters.selectedBranch);
        }
      }

      // Apply category filter
      if (filters?.selectedCategory && filters.selectedCategory !== 'all') {
        query = query.eq('category_id', filters.selectedCategory);
      }

      // Apply search filter
      if (filters?.searchTerm && filters.searchTerm.trim()) {
        query = query.or(`product_name.ilike.%${filters.searchTerm}%,sku.ilike.%${filters.searchTerm}%,category_name.ilike.%${filters.searchTerm}%`);
      }

      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.error('❌ Query Error:', queryError);
        throw queryError;
      }
      
      console.log('🔍 Raw inventory data fetched:', data);
      console.log('📊 Number of inventory records:', data?.length || 0);
      
      setProducts(data || []);
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [getFilterConfig]);

  // Load supporting data on mount
  useEffect(() => {
    refreshSupportingData();
  }, [refreshSupportingData]);

  return {
    products,
    categories,
    suppliers,
    branches,
    brands,
    loading,
    error,
    refreshProducts,
    refreshSupportingData
  };
};







