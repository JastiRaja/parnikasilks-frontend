import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { BACKEND_URL } from '../utils/constants';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  deliveryCharges?: number;
  deliveryChargesApplicable?: boolean;
  images: string[];
  category: string;
  stock: number;
}

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(() => {
    // Read category from URL query params on initial load
    return searchParams.get('category') || 'all';
  });
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Update category when URL query param changes
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategory(categoryParam);
    } else {
      setCategory('all');
    }
  }, [searchParams]);

  const getImageUrl = (imageId: string): string => {
    if (!imageId || imageId === 'null' || imageId === null || imageId === undefined || imageId === '') {
      return '/images/Placeholder.png';
    }
    // If it's already a full URL, return it
    if (imageId.startsWith('http')) {
      return imageId;
    }
    // If it's a data URL, return it
    if (imageId.startsWith('data:')) {
      return imageId;
    }
    // Otherwise, construct the GridFS image URL
    return `${BACKEND_URL}/api/admin/images/${imageId}`;
  };

  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, category, sortBy, sortOrder, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/products', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          category: category !== 'all' ? category : undefined,
          sortBy,
          sortOrder,
          search: searchTerm || undefined
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.success) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || Math.ceil((response.data.total || 0) / itemsPerPage));
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The server is taking too long to respond. Please check your connection and try again.');
      } else if (err.response) {
        const errorMsg = err.response.data?.message || 'Failed to fetch products';
        if (err.response.status === 503) {
          setError('Database connection unavailable. Please check the server connection and try again.');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later or contact support.');
        } else {
          setError(errorMsg);
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success('Added to cart successfully!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const categories = [
    'all',
    'silk sarees',
    'cotton sarees',
    'designer sarees',
    'bridal sarees',
    'traditional sarees'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 mt-16">
          <h1 className="text-3xl font-bold text-gray-900">Our Collection</h1>
          <p className="mt-2 text-gray-600">
            Discover our exquisite collection of traditional and contemporary sarees
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </form>

            <div className="flex gap-4">
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <FaFilter className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <span>Price</span>
                  {sortBy === 'price' ? (
                    sortOrder === 'asc' ? (
                      <FaSortAmountUp />
                    ) : (
                      <FaSortAmountDown />
                    )
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500">No products found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative pb-[100%] bg-gray-100">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/Placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                      <img
                        src="/images/Placeholder.png"
                        alt={`${product.name} (no image)`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {product.stock > 0 ? (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                      In Stock
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                              {product.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      )}
                      {product.deliveryChargesApplicable !== false && product.deliveryCharges !== undefined && product.deliveryCharges > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="text-gray-500">Delivery: </span>
                          <span className="font-medium">₹{product.deliveryCharges.toLocaleString()}</span>
                          <span className="text-green-600 ml-1">(Free above ₹1,000)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-primary text-white p-2 rounded-md hover:bg-primary-dark transition-colors"
                        title="Add to Cart"
                      >
                        <FaShoppingCart />
                      </button>
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products; 