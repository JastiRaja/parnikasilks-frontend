import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import toast from 'react-hot-toast';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { BACKEND_URL, PLACEHOLDER_IMAGE_DATA_URL } from '../utils/constants';
import Carousel from '../components/Carousel';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
}

const categories = ['all', 'saree', 'dress', 'lehenga', 'salwar', 'other'];
const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' }
];

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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-yellow-50 py-12 overflow-hidden">
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
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-gray-100 sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for sarees, dresses, and more..."
                  className="w-full px-6 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-6 py-3 bg-gray-100 rounded-xl flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FaFilter />
              Filters
            </button>
            <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex gap-4 flex-wrap lg:flex-nowrap`}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white font-medium text-gray-700 capitalize transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white font-medium text-gray-700 transition-all duration-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
                  className="px-8 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">No products found</h2>
              <p className="text-gray-600 mb-8">Try adjusting your search or filters to find what you're looking for.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  fetchProducts();
                }}
                className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center animate-slide-up">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-3">
                {searchTerm ? 'Search Results' : 'Featured Products'}
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-large transition-all duration-300 transform hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-80 overflow-hidden bg-gray-100">
                    {product.images && product.images[0] ? (
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {product.stock > 0 ? (
                      <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        In Stock
                      </span>
                    ) : (
                      <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        Out of Stock
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                        <span className="text-pink-600 font-semibold">View Details</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-2">
                      <span className="inline-block bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                        {product.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-pink-600">₹{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Home;