import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import { FaSearch, FaStar, FaChevronDown, FaChevronUp, FaFilter, FaTimes } from 'react-icons/fa';
import { BACKEND_URL } from '../utils/constants';
import Carousel from '../components/Carousel';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  category: string;
  stock: number;
  averageRating?: number;
  totalReviews?: number;
  specifications?: {
    material: string;
    color: string;
    sareeType?: string;
    occasion?: string;
    pattern?: string;
  };
}

const categories = ['all', 'saree', 'dress', 'lehenga', 'salwar', 'other'];

// Filter options - will be populated from actual product data
const getUniqueValues = (products: Product[], field: 'sareeType' | 'material' | 'color' | 'occasion' | 'pattern'): string[] => {
  const values = new Set<string>();
  products.forEach(product => {
    if (product.specifications) {
      const value = field === 'material' 
        ? product.specifications.material
        : field === 'color'
        ? product.specifications.color
        : field === 'sareeType'
        ? product.specifications.sareeType
        : field === 'occasion'
        ? product.specifications.occasion
        : product.specifications.pattern;
      
      if (value && value !== 'Not specified' && value.trim() !== '') {
        values.add(value);
      }
    }
  });
  return Array.from(values).sort();
};

// Function to get the full image URL
const getImageUrl = (imageId: string): string => {
  if (!imageId || imageId === 'null' || imageId === null || imageId === undefined || imageId === '') {
    return '/images/Placeholder.png';
  }
  return `${BACKEND_URL}/api/admin/images/${imageId}`;
};

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [expandedFilters, setExpandedFilters] = useState<{ [key: string]: boolean }>({
    sareeType: false,
    fabric: false,
    color: false,
    occasion: false,
    pattern: false
  });
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({
    sareeType: [],
    fabric: [],
    color: [],
    occasion: [],
    pattern: []
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, selectedFilters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/products?';
      
      // Add category filter
      if (selectedCategory !== 'all') {
        url += `category=${selectedCategory}&`;
      }
      
      // Add sort parameter
      if (sortBy !== 'default') {
        url += `sort=${sortBy}&`;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error fetching products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchProducts();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setError(response.data.message || 'Failed to search products');
      }
    } catch (err: any) {
      console.error('Error searching products:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error searching products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      sareeType: [],
      fabric: [],
      color: [],
      occasion: [],
      pattern: []
    });
  };

  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    // Saree Type filter
    const matchesSareeType = selectedFilters.sareeType.length === 0 || 
      (product.specifications?.sareeType && selectedFilters.sareeType.includes(product.specifications.sareeType));
    
    // Fabric/Material filter
    const matchesFabric = selectedFilters.fabric.length === 0 || 
      (product.specifications?.material && selectedFilters.fabric.includes(product.specifications.material));
    
    // Color filter
    const matchesColor = selectedFilters.color.length === 0 || 
      (product.specifications?.color && selectedFilters.color.includes(product.specifications.color));
    
    // Occasion filter
    const matchesOccasion = selectedFilters.occasion.length === 0 || 
      (product.specifications?.occasion && selectedFilters.occasion.includes(product.specifications.occasion));
    
    // Pattern filter
    const matchesPattern = selectedFilters.pattern.length === 0 || 
      (product.specifications?.pattern && selectedFilters.pattern.includes(product.specifications.pattern));
    
    return matchesSearch && matchesCategory && matchesSareeType && matchesFabric && 
           matchesColor && matchesOccasion && matchesPattern;
  });

  // Calculate discount percentage if originalPrice exists
  const getDiscountPercentage = (product: Product): number => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return product.discountPercentage || 0;
  };

  // Render star rating
  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400 text-xs fill-current" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <FaStar className="text-gray-300 text-xs" />
            <FaStar className="text-yellow-400 text-xs fill-current absolute inset-0 overflow-hidden" style={{ width: '50%' }} />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={i} className="text-gray-300 text-xs" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
            <p className="text-lg text-gray-600 mb-2">{error}</p>
            {!import.meta.env.VITE_API_URL && (
              <p className="text-sm text-red-600 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                ⚠️ API URL not configured. Please set VITE_API_URL in your environment variables.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => fetchProducts()}
              className="px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null);
                setSearchTerm('');
                setSelectedCategory('all');
                setSortBy('default');
                fetchProducts();
              }}
              className="px-8 py-3 bg-white text-pink-600 border-2 border-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Carousel Section */}
      <Carousel />

      {/* Hero Section */}
      {/*<section className="relative bg-gradient-to-br from-pink-50 via-white to-yellow-50 py-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
              Elegant Silk Collection
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover the finest handcrafted silk sarees, curated with love and tradition from across India
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Shop Now
              </Link>
              <Link
                to="/about"
                className="px-8 py-3 bg-white text-pink-600 border-2 border-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>*/}

      {/* Top Search Bar - Flipkart Style */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for products, brands and more"
                  className="w-full px-4 py-2.5 pl-10 rounded-sm border border-gray-300 focus:outline-none focus:border-blue-500 bg-white text-sm"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="px-8 py-2.5 bg-blue-500 text-white rounded-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content - Flipkart Style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border border-gray-200 rounded-sm p-4 h-fit sticky top-32">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Filters</h3>
              
              {/* Categories */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">CATEGORIES</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                      selectedCategory === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.filter(c => c !== 'all').map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 capitalize ${
                        selectedCategory === category ? 'text-blue-600 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saree Type Filter */}
              {getUniqueValues(products, 'sareeType').length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleFilter('sareeType')}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>SAREE TYPE</span>
                    {expandedFilters.sareeType ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>
                  {expandedFilters.sareeType && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getUniqueValues(products, 'sareeType').map((type) => (
                        <label key={type} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.sareeType.includes(type)}
                            onChange={() => handleFilterChange('sareeType', type)}
                            className="mr-2"
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fabric/Material Filter */}
              {getUniqueValues(products, 'material').length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleFilter('fabric')}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>FABRIC</span>
                    {expandedFilters.fabric ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>
                  {expandedFilters.fabric && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getUniqueValues(products, 'material').map((fabric) => (
                        <label key={fabric} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.fabric.includes(fabric)}
                            onChange={() => handleFilterChange('fabric', fabric)}
                            className="mr-2"
                          />
                          {fabric}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Color Filter */}
              {getUniqueValues(products, 'color').length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleFilter('color')}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>COLOR</span>
                    {expandedFilters.color ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>
                  {expandedFilters.color && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getUniqueValues(products, 'color').map((color) => (
                        <label key={color} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.color.includes(color)}
                            onChange={() => handleFilterChange('color', color)}
                            className="mr-2"
                          />
                          {color}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Occasion Filter */}
              {getUniqueValues(products, 'occasion').length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => toggleFilter('occasion')}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>OCCASION</span>
                    {expandedFilters.occasion ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>
                  {expandedFilters.occasion && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getUniqueValues(products, 'occasion').map((occasion) => (
                        <label key={occasion} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.occasion.includes(occasion)}
                            onChange={() => handleFilterChange('occasion', occasion)}
                            className="mr-2"
                          />
                          {occasion}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pattern Filter */}
              {getUniqueValues(products, 'pattern').length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => toggleFilter('pattern')}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>PATTERN</span>
                    {expandedFilters.pattern ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </button>
                  {expandedFilters.pattern && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getUniqueValues(products, 'pattern').map((pattern) => (
                        <label key={pattern} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.pattern.includes(pattern)}
                            onChange={() => handleFilterChange('pattern', pattern)}
                            className="mr-2"
                          />
                          {pattern}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clear Filters Button */}
              {(Object.values(selectedFilters).some(arr => arr.length > 0)) && (
                <button
                  onClick={clearFilters}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Products Grid */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FaFilter className="h-4 w-4" />
                Filters
                {(Object.values(selectedFilters).some(arr => arr.length > 0) || selectedCategory !== 'all') && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0) + (selectedCategory !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)}>
                <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <FaTimes className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    {/* Categories */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">CATEGORIES</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                            selectedCategory === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600'
                          }`}
                        >
                          All Products
                        </button>
                        {categories.filter(c => c !== 'all').map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 capitalize ${
                              selectedCategory === category ? 'text-blue-600 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Saree Type Filter */}
                    {getUniqueValues(products, 'sareeType').length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleFilter('sareeType')}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                        >
                          <span>SAREE TYPE</span>
                          {expandedFilters.sareeType ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        {expandedFilters.sareeType && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {getUniqueValues(products, 'sareeType').map((type) => (
                              <label key={type} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedFilters.sareeType.includes(type)}
                                  onChange={() => handleFilterChange('sareeType', type)}
                                  className="mr-2"
                                />
                                {type}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fabric/Material Filter */}
                    {getUniqueValues(products, 'material').length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleFilter('fabric')}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                        >
                          <span>FABRIC</span>
                          {expandedFilters.fabric ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        {expandedFilters.fabric && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {getUniqueValues(products, 'material').map((fabric) => (
                              <label key={fabric} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedFilters.fabric.includes(fabric)}
                                  onChange={() => handleFilterChange('fabric', fabric)}
                                  className="mr-2"
                                />
                                {fabric}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Color Filter */}
                    {getUniqueValues(products, 'color').length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleFilter('color')}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                        >
                          <span>COLOR</span>
                          {expandedFilters.color ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        {expandedFilters.color && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {getUniqueValues(products, 'color').map((color) => (
                              <label key={color} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedFilters.color.includes(color)}
                                  onChange={() => handleFilterChange('color', color)}
                                  className="mr-2"
                                />
                                {color}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Occasion Filter */}
                    {getUniqueValues(products, 'occasion').length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleFilter('occasion')}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                        >
                          <span>OCCASION</span>
                          {expandedFilters.occasion ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        {expandedFilters.occasion && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {getUniqueValues(products, 'occasion').map((occasion) => (
                              <label key={occasion} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedFilters.occasion.includes(occasion)}
                                  onChange={() => handleFilterChange('occasion', occasion)}
                                  className="mr-2"
                                />
                                {occasion}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pattern Filter */}
                    {getUniqueValues(products, 'pattern').length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleFilter('pattern')}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                        >
                          <span>PATTERN</span>
                          {expandedFilters.pattern ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        {expandedFilters.pattern && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {getUniqueValues(products, 'pattern').map((pattern) => (
                              <label key={pattern} className="flex items-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedFilters.pattern.includes(pattern)}
                                  onChange={() => handleFilterChange('pattern', pattern)}
                                  className="mr-2"
                                />
                                {pattern}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clear Filters Button */}
                    {(Object.values(selectedFilters).some(arr => arr.length > 0) || selectedCategory !== 'all') && (
                      <button
                        onClick={() => {
                          clearFilters();
                          setSelectedCategory('all');
                        }}
                        className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}

                    {/* Apply Button */}
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

        {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h2>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                      clearFilters();
                  fetchProducts();
                }}
                    className="px-6 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCategory !== 'all' ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : 'All'} Products
              </h2>
                  <div className="text-sm text-gray-600">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </div>
            </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => {
                    const discount = getDiscountPercentage(product);
                    return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                        className="bg-white border border-gray-200 rounded-sm p-3 hover:shadow-lg transition-all duration-200 group"
                >
                        <div className="relative w-full pb-[100%] mb-3 bg-gray-100 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/Placeholder.png';
                        }}
                      />
                    ) : (
                      <img
                        src="/images/Placeholder.png"
                        alt={`${product.name} (no image)`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                              {discount}% off
                      </span>
                    )}
                      </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                          <div className="flex items-center gap-1">
                            {renderStars(product.averageRating || 0)}
                            <span className="text-xs text-gray-600 ml-1">
                              ({product.totalReviews || 0})
                            </span>
                      </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-gray-900">
                              ₹{product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <>
                                <span className="text-xs text-gray-500 line-through">
                                  ₹{product.originalPrice.toLocaleString()}
                                </span>
                              </>
                            )}
                    </div>
                  </div>
                </Link>
                    );
                  })}
            </div>
          </>
        )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;