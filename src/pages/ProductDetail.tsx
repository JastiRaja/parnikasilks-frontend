import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';
import { FaShoppingCart, FaCheck, FaTimes, FaTag, FaPalette, FaBox, FaArrowLeft, FaRupeeSign, FaCheckCircle, FaStar, FaHeart, FaShare } from 'react-icons/fa';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  specifications: {
    material: string;
    color: string;
  };
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageZoomed, setImageZoomed] = useState(false);
  const { addToCart, removeFromCart, items } = useCart();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        console.log('Product response:', response);
        
        if (response.data.success) {
          setProduct(response.data.product);
        } else {
          setError('Product not found');
          toast.error('Product not found');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        const errorMessage = err.response?.data?.message || 'Error loading product details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const isInCart = product ? items.some(item => item._id === product._id) : false;

  const handleCartAction = () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product) {
      if (isInCart) {
        removeFromCart(product._id);
        toast.success('Removed from cart');
      } else {
        addToCart(product);
        toast.success('Added to cart successfully!');
      }
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="mb-4">
            <FaTimes className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-xl"
          >
            <FaArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Function to get the full image URL
  const getImageUrl = (imageId: string): string => {
    if (!imageId || imageId === 'null' || imageId === null || imageId === undefined || imageId === '') {
      return '/images/Placeholder.png';
    }
    return `${API_URL}/api/admin/images/${imageId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-purple-50/30">
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-600 transition-colors font-medium">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/products" className="text-gray-500 hover:text-pink-600 transition-colors font-medium">Products</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-5 flex flex-col items-center lg:items-start">
            {/* Main Image */}
            <div 
              className="relative w-full max-w-sm lg:max-w-lg aspect-square bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden group cursor-zoom-in border border-gray-100"
              onClick={() => setImageZoomed(!imageZoomed)}
            >
              {product.images && product.images[selectedImage] ? (
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="h-full w-full object-contain transition-all duration-500 group-hover:scale-110 p-8"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/Placeholder.png';
                  }}
                />
              ) : (
                <img
                  src="/images/Placeholder.png"
                  alt={`${product.name} (no image)`}
                  className="h-full w-full object-contain p-8"
                />
              )}
              {/* Image Counter Badge */}
              {product.images && product.images.length > 1 && (
                <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-gray-800 shadow-lg border border-gray-200">
                  {selectedImage + 1} / {product.images.length}
                </div>
              )}
              {/* Zoom Indicator */}
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-gray-200">
                Click to zoom
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4 w-full max-w-sm lg:max-w-lg">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square w-full cursor-pointer rounded-2xl overflow-hidden border-3 transition-all duration-300 transform ${
                      selectedImage === index 
                        ? 'border-pink-500 ring-4 ring-pink-200 shadow-2xl scale-110 z-10' 
                        : 'border-gray-200 hover:border-pink-400 hover:shadow-lg hover:scale-105'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} - View ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/Placeholder.png';
                      }}
                    />
                    {selectedImage === index && (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <FaCheckCircle className="h-4 w-4 text-pink-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Category Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 rounded-full text-sm font-bold shadow-sm border border-pink-200">
                <FaTag className="h-3.5 w-3.5" />
                {product?.category?.charAt(0).toUpperCase() + product?.category?.slice(1)}
              </span>
              <span
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${
                  product?.stock 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 border border-green-200' 
                    : 'bg-gradient-to-r from-red-100 to-rose-50 text-red-700 border border-red-200'
                }`}
              >
                {product?.stock ? (
                  <>
                    <FaCheckCircle className="h-3.5 w-3.5" />
                    In Stock ({product.stock} available)
                  </>
                ) : (
                  <>
                    <FaTimes className="h-3.5 w-3.5" />
                    Out of Stock
                  </>
                )}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                {product?.name}
              </h1>
              {/* Rating Placeholder */}
              <div className="flex items-center gap-2 text-amber-500">
                <FaStar className="h-5 w-5 fill-current" />
                <FaStar className="h-5 w-5 fill-current" />
                <FaStar className="h-5 w-5 fill-current" />
                <FaStar className="h-5 w-5 fill-current" />
                <FaStar className="h-5 w-5 fill-current" />
                <span className="ml-2 text-sm text-gray-600 font-medium">(4.8)</span>
              </div>
            </div>
            
            {/* Price */}
            <div className="flex items-baseline gap-3 py-4">
              <span className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                ₹{product?.price.toLocaleString()}
              </span>
              <span className="text-lg text-gray-500 line-through">₹{(product?.price * 1.2).toLocaleString()}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">20% OFF</span>
            </div>

            {/* Description */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-7 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <FaBox className="h-4 w-4 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Description</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {product?.description || 'No description available.'}
              </p>
            </div>

            {/* Specifications */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-7 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <FaBox className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Specifications</h3>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl border border-pink-200/50 hover:shadow-md transition-all duration-300">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <FaPalette className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Material</dt>
                    <dd className="text-lg font-bold text-gray-900">
                      {product?.specifications?.material || 'Not specified'}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <FaPalette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Color</dt>
                    <dd className="text-lg font-bold text-gray-900">
                      {product?.specifications?.color || 'Not specified'}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-6">
              <div className="flex gap-3">
                <button
                  onClick={handleCartAction}
                  className={`flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
                    isInCart
                      ? 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white hover:from-gray-700 hover:via-gray-800 hover:to-gray-900'
                      : 'bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white hover:from-pink-700 hover:via-pink-600 hover:to-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  disabled={!product?.stock}
                >
                  <FaShoppingCart className="h-6 w-6" />
                  <span>
                    {!isAuthenticated
                      ? 'Login to Add to Cart'
                      : isInCart
                      ? 'Remove from Cart'
                      : product?.stock
                      ? 'Add to Cart'
                      : 'Out of Stock'}
                  </span>
                </button>
                <button
                  className="p-5 rounded-2xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-pink-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                  title="Add to Wishlist"
                >
                  <FaHeart className="h-5 w-5" />
                </button>
                <button
                  className="p-5 rounded-2xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-pink-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                  title="Share"
                >
                  <FaShare className="h-5 w-5" />
                </button>
              </div>

              <Link
                to="/products"
                className="block w-full text-center px-6 py-4 border-2 border-gray-300 rounded-2xl font-bold text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-pink-50 hover:border-pink-300 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {imageZoomed && product.images && product.images[selectedImage] && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImageZoomed(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={getImageUrl(product.images[selectedImage])}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setImageZoomed(false)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;