import { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/AnimatedSection';
import { supabase, BrandWithCategory, ProductWithDetails, ProductWithJoinedCategory } from '../lib/supabaseClient';
import feeds from '../assets/feeds.jpg';
import fert from '../assets/fert.webp';
import vet from '../assets/vet.jpg';
import pet from '../assets/pet.jpg';

type ViewMode = 'categories' | 'brands' | 'products';

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  brandCount: number;
}

const ProductsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('All Products');
  const [brandsWithCategories, setBrandsWithCategories] = useState<BrandWithCategory[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandWithCategory | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories with brand counts
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Get brand counts per category by grouping products
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Count unique brands in this category
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('brand')
            .eq('category_id', category.id)
            .eq('is_active', true)
            .not('brand', 'is', null);

          if (productsError) {
            console.error('Error fetching products for category:', productsError);
            return {
              ...category,
              brandCount: 0,
            };
          }

          // Count unique brands
          const uniqueBrands = new Set(productsData?.map((p) => p.brand) || []);

          return {
            ...category,
            brandCount: uniqueBrands.size,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPTIMIZED: Fetch brands for a specific category (FIXED N+1 QUERY PROBLEM)
  const fetchBrandsForCategory = async (categoryId: string | null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(
          `
          brand,
          category_id,
          categories!inner (
            id,
            name
          )
        `
        )
        .eq('is_active', true)
        .not('brand', 'is', null);

      // Filter by category if specified
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Cast the response to the correct type
      const typedProducts = productsData as unknown as ProductWithJoinedCategory[];

      // ✅ FIX: Fetch all unique brands in ONE query instead of N queries
      const uniqueBrandNames = [...new Set(typedProducts?.map((p) => p.brand) || [])];
      
      const { data: allBrands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, image_url')
        .in('name', uniqueBrandNames);

      if (brandsError) {
        console.error('Error fetching brands:', brandsError);
      }

      // Create a lookup map for O(1) access
      const brandMap = new Map(allBrands?.map((b) => [b.name, b]) || []);

      // Group by brand and category, count products
      const brandCategoryMap = new Map<string, BrandWithCategory>();

      for (const product of typedProducts || []) {
        const key = `${product.brand}_${product.category_id}`;

        if (brandCategoryMap.has(key)) {
          const existing = brandCategoryMap.get(key)!;
          existing.product_count += 1;
        } else {
          const brandData = brandMap.get(product.brand);

          brandCategoryMap.set(key, {
            brand_id: brandData?.id || '',
            brand_name: product.brand,
            brand_image_url: brandData?.image_url || null,
            category_id: product.category_id,
            // ✅ FIX: Use joined category data instead of state lookup
            category_name: product.categories?.name || '',
            product_count: 1,
          });
        }
      }

      const brandsArray = Array.from(brandCategoryMap.values());
      setBrandsWithCategories(brandsArray);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for a specific brand and category
  const fetchProductsForBrand = async (brandName: string, categoryId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(
          `
          *,
          categories (
            id,
            name,
            description
          ),
          product_units (
            id,
            unit_name,
            unit_label,
            conversion_factor,
            is_base_unit,
            is_sellable,
            price_per_unit,
            min_sellable_quantity
          )
        `
        )
        .eq('brand', brandName)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter brands based on search query
  const filteredBrands = brandsWithCategories.filter((brand) => {
    return brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort brands
  const sortedBrands = [...filteredBrands].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.brand_name.localeCompare(b.brand_name);
      case 'products':
        return b.product_count - a.product_count;
      default:
        return 0;
    }
  });

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
    setViewMode('brands');
    setSearchQuery('');
    fetchBrandsForCategory(categoryId);
  };

  const handleBrandSelect = (brand: BrandWithCategory) => {
    setSelectedBrand(brand);
    setViewMode('products');
    fetchProductsForBrand(brand.brand_name, brand.category_id);
  };

  const handleBackToBrands = () => {
    setViewMode('brands');
    setSelectedBrand(null);
    setProducts([]);
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedCategoryName('All Products');
    setSelectedBrand(null);
    setBrandsWithCategories([]);
    setProducts([]);
  };

  const handleBuyNow = (productId: string) => {
    // Store product ID in sessionStorage for the branch selection page
    sessionStorage.setItem('selectedProductId', productId);
    window.location.href = 'https://tiongsononline.vercel.app/branch-selection';
  };

  // ✅ IMPROVED: Flexible category emoji matching
  const getCategoryEmoji = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('feed') || lowerName.includes('supplement')) return '🌾';
    if (lowerName.includes('veterinary') || lowerName.includes('medicine')) return '💊';
    if (lowerName.includes('pesticide') || lowerName.includes('fertilizer') || lowerName.includes('chemical')) return '🌱';
    if (lowerName.includes('pet')) return '🐾';
    return '📦';
  };

  // ✅ IMPROVED: Flexible category image matching
  const getCategoryImage = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('feed')) return feeds;
    if (lowerName.includes('veterinary') || lowerName.includes('vet')) return vet;
    if (lowerName.includes('chemical') || lowerName.includes('fertilizer') || lowerName.includes('pesticide') || lowerName.includes('seed')) return fert;
    if (lowerName.includes('pet')) return pet;
    return null;
  };

  // ✅ ENHANCED: Get base price with multiple unit support
  const getProductPrice = (product: ProductWithDetails) => {
    const sellableUnits = product.product_units?.filter((unit) => unit.is_sellable) || [];
    if (sellableUnits.length === 0) return null;

    // Show lowest price if multiple units available
    const prices = sellableUnits.map((u) => u.price_per_unit);
    const minPrice = Math.min(...prices);

    return {
      price: minPrice,
      hasMultiple: prices.length > 1,
    };
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      {/* Hero Section */}
      <AnimatedSection animation="fadeInUp">
        <section className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <button
                onClick={handleBackToCategories}
                className="hover:underline opacity-90 hover:opacity-100"
              >
                Products
              </button>
              {viewMode !== 'categories' && (
                <>
                  <span>/</span>
                  <button
                    onClick={handleBackToBrands}
                    className="hover:underline opacity-90 hover:opacity-100"
                  >
                    {selectedCategoryName}
                  </button>
                </>
              )}
              {viewMode === 'products' && selectedBrand && (
                <>
                  <span>/</span>
                  <span className="opacity-90">{selectedBrand.brand_name}</span>
                </>
              )}
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {viewMode === 'categories' && 'What We Offer'}
              {viewMode === 'brands' && `${selectedCategoryName} - Brands`}
              {viewMode === 'products' && selectedBrand?.brand_name}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              {viewMode === 'categories' &&
                'Browse our extensive collection of quality agricultural and veterinary supplies'}
              {viewMode === 'brands' && 'Select a brand to view available products'}
              {viewMode === 'products' &&
                `Explore ${selectedBrand?.brand_name} products in ${selectedCategoryName}`}
            </p>
          </div>
        </section>
      </AnimatedSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={() => {
                setError(null);
                if (viewMode === 'categories') fetchCategories();
                else if (viewMode === 'brands' && selectedCategory)
                  fetchBrandsForCategory(selectedCategory);
                else if (viewMode === 'products' && selectedBrand)
                  fetchProductsForBrand(selectedBrand.brand_name, selectedBrand.category_id);
              }}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* VIEW MODE: CATEGORIES (Initial View) */}
        {!loading && viewMode === 'categories' && (
          <>
            <AnimatedSection animation="fadeInUp" delay={0.2}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Select a Category</h2>
                <p className="text-gray-600">Choose from our product categories to explore brands</p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category: CategoryData, index: number) => {
                // ✅ IMPROVED: Use flexible matching function
                const categoryImage = getCategoryImage(category.name);

                return (
                  <AnimatedSection key={category.id} animation="fadeInUp" delay={0.1 * index}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      onClick={() => handleCategorySelect(category.id, category.name)}
                      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer h-full"
                    >
                      <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 h-48 flex items-center justify-center">
                        {categoryImage ? (
                          <img
                            src={categoryImage}
                            alt={category.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-7xl">{getCategoryEmoji(category.name)}</span>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                        {category.description && (
                          <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                        )}
                        <p className="text-gray-600 text-sm mb-4">
                          {category.brandCount} {category.brandCount === 1 ? 'brand' : 'brands'}{' '}
                          available
                        </p>
                        <button className="flex items-center space-x-2 text-green-600 font-medium hover:text-green-700 transition-colors">
                          <span>View Brands</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatedSection>
                );
              })}
            </div>

            {/* No Categories */}
            {categories.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Categories Found</h3>
                <p className="text-gray-600">Please add some categories to get started</p>
              </div>
            )}
          </>
        )}

        {/* VIEW MODE: BRANDS */}
        {!loading && viewMode === 'brands' && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <AnimatedSection animation="slideLeft" delay={0.2}>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                  <button
                    onClick={handleBackToCategories}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 mb-6 transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span className="font-medium">Back to Categories</span>
                  </button>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                  </h3>

                  {/* Current Category */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Category</h4>
                    <div className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg">
                      {selectedCategoryName}
                    </div>
                  </div>

                  {/* Reset Filters */}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('name');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </AnimatedSection>

            {/* Brands Grid */}
            <div className="lg:col-span-3">
              {/* Search and Sort Bar */}
              <AnimatedSection animation="fadeInUp" delay={0.3}>
                <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search brands..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                    >
                      <option value="name">Name: A-Z</option>
                      <option value="products">Most Products</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <p className="text-gray-600 mt-4">
                    Showing <span className="font-semibold">{sortedBrands.length}</span> brands
                  </p>
                </div>
              </AnimatedSection>

              {/* Brands Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBrands.map((brand, index) => (
                  <AnimatedSection
                    key={`${brand.brand_id}_${brand.category_id}`}
                    animation="fadeInUp"
                    delay={0.1 * (index % 6)}
                  >
                    <motion.div
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col"
                    >
                      {/* Brand Image */}
                      <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 h-48 flex items-center justify-center overflow-hidden">
                        {brand.brand_image_url ? (
                          <img
                            src={brand.brand_image_url}
                            alt={brand.brand_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-6xl">{getCategoryEmoji(brand.category_name)}</span>
                        )}
                      </div>

                      {/* Brand Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-xs text-green-600 font-medium mb-1">
                          {brand.category_name}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {brand.brand_name}
                        </h3>

                        {/* Product Count */}
                        <p className="text-sm text-gray-500 mb-4 flex-1">
                          {brand.product_count} {brand.product_count === 1 ? 'product' : 'products'}{' '}
                          available
                        </p>

                        {/* View Products Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBrandSelect(brand)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all duration-200"
                        >
                          <span>View Products</span>
                          <ArrowRight size={18} />
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatedSection>
                ))}
              </div>

              {/* No Results */}
              {sortedBrands.length === 0 && !loading && (
                <AnimatedSection animation="fadeIn">
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Brands Found</h3>
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'No brands available in this category'}
                    </p>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE: PRODUCTS */}
        {!loading && viewMode === 'products' && (
          <>
            <AnimatedSection animation="fadeInUp">
              <div className="mb-8">
                <button
                  onClick={handleBackToBrands}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 mb-6 transition-colors"
                >
                  <ChevronLeft size={20} />
                  <span className="font-medium">Back to Brands</span>
                </button>
              </div>
            </AnimatedSection>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const priceData = getProductPrice(product);
                return (
                  <AnimatedSection key={product.id} animation="fadeInUp" delay={0.1 * index}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col"
                    >
                      {/* Product Image */}
                      <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 h-48 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-6xl">
                            {getCategoryEmoji(product.categories?.name || '')}
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                            {product.description}
                          </p>
                        )}

                        {/* SKU */}
                        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>

                        {/* Price */}
                        {priceData && (
                          <p className="text-2xl font-bold text-green-600 mb-4">
                            {priceData.hasMultiple ? 'From ' : ''}
                            ₱{priceData.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                        )}

                        {/* Buy Now Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBuyNow(product.id)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all duration-200"
                        >
                          <span>Buy Now</span>
                          <ArrowRight size={18} />
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatedSection>
                );
              })}
            </div>

            {/* Empty State for Products */}
            {products.length === 0 && !loading && (
              <AnimatedSection animation="fadeIn">
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600">
                    Products for {selectedBrand?.brand_name} will be available soon
                  </p>
                </div>
              </AnimatedSection>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;