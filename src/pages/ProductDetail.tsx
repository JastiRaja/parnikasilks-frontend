import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { BACKEND_URL } from '../utils/constants';
import { FaShoppingCart, FaTimes, FaCheckCircle, FaStar, FaBolt } from 'react-icons/fa';

interface Review {
  _id: string;
  user: {
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

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
  reviews?: Review[];
  specifications?: {
    material: string;
    color: string;
    sareeType?: string;
    occasion?: string;
    pattern?: string;
  };
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart, removeFromCart, items } = useCart();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchSimilarProducts();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      
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

  const fetchSimilarProducts = async () => {
    if (!product) return;
    
    try {
      // Fetch products with same category, color, or material
      const response = await axios.get('/api/products', {
        params: {
          category: product.category,
          limit: 8
        }
      });
      
      if (response.data.success) {
        // Filter out current product and get products with similar color or material
        const similar = response.data.products
          .filter((p: Product) => 
            p._id !== product._id && 
            (p.specifications?.color === product.specifications?.color ||
             p.specifications?.material === product.specifications?.material ||
             p.category === product.category)
          )
          .slice(0, 6);
        setSimilarProducts(similar);
      }
    } catch (err) {
      console.error('Error fetching similar products:', err);
    }
  };

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

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.info('Please login to buy');
      navigate('/login');
      return;
    }

    if (product) {
      if (!isInCart) {
        addToCart(product);
      }
      navigate('/checkout');
    }
  };

  // Function to get the full image URL
  const getImageUrl = (imageId: string): string => {
    if (!imageId || imageId === 'null' || imageId === null || imageId === undefined || imageId === '') {
      return '/images/Placeholder.png';
    }
    return `${BACKEND_URL}/api/admin/images/${imageId}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = (): number => {
    if (product?.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return product?.discountPercentage || 0;
  };

  // Render star rating
  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400 text-sm fill-current" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <FaStar className="text-gray-300 text-sm" />
            <FaStar className="text-yellow-400 text-sm fill-current absolute inset-0 overflow-hidden" style={{ width: '50%' }} />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={i} className="text-gray-300 text-sm" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="mb-4">
            <FaTimes className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Product not found'}</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = getDiscountPercentage();

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Side - Fixed Image with Thumbnails */}
          <div className="w-2/5 flex-shrink-0">
            <div className="flex gap-4">
              {/* Thumbnail Images (Vertical) */}
              {product.images && product.images.length > 1 && (
                <div className="flex flex-col gap-2 w-20">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer border-2 rounded overflow-hidden ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} - View ${index + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/Placeholder.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

                {/* Main Image */}
                <div className="flex-1 bg-white border border-gray-200 rounded p-4">
                  {product.images && product.images[selectedImage] ? (
                    <img
                      src={getImageUrl(product.images[selectedImage])}
                      alt={product.name}
                      className="w-full h-96 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/Placeholder.png';
                      }}
                    />
                  ) : (
                    <img
                      src="/images/Placeholder.png"
                      alt={`${product.name} (no image)`}
                      className="w-full h-96 object-contain"
                    />
                  )}
                </div>
            </div>

            {/* Action Buttons Below Image */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleBuyNow}
                disabled={!product.stock}
                className="w-full py-3 bg-orange-500 text-white rounded font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaBolt className="h-4 w-4" />
                BUY NOW
              </button>
              <button
                onClick={handleCartAction}
                disabled={!product.stock}
                className={`w-full py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isInCart
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-orange-400 text-white hover:bg-orange-500'
                }`}
              >
                <FaShoppingCart className="h-4 w-4" />
                {isInCart ? 'REMOVE FROM CART' : 'ADD TO CART'}
              </button>
            </div>
          </div>

          {/* Right Side - Scrollable Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-8rem)] pr-4">
            <div className="space-y-6">
              {/* Product Title */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-4">
                  {product.averageRating && product.averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      {renderStars(product.averageRating)}
                      <span className="text-sm text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.totalReviews || 0} ratings)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-gray-900">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    {discount > 0 && (
                      <span className="text-sm text-green-600 font-semibold">{discount}% off</span>
                    )}
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                    <FaCheckCircle className="h-4 w-4" />
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                    <FaTimes className="h-4 w-4" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product Details Section */}
              <div className="bg-white border border-gray-200 rounded p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h2>
                <dl className="space-y-2 text-sm">
                  {product.specifications?.material && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Material:</dt>
                      <dd className="text-gray-600">{product.specifications.material}</dd>
                    </div>
                  )}
                  {product.specifications?.color && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Color:</dt>
                      <dd className="text-gray-600">{product.specifications.color}</dd>
                    </div>
                  )}
                  {product.specifications?.sareeType && product.specifications.sareeType !== 'Not specified' && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Saree Type:</dt>
                      <dd className="text-gray-600">{product.specifications.sareeType}</dd>
                    </div>
                  )}
                  {product.specifications?.occasion && product.specifications.occasion !== 'Not specified' && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Occasion:</dt>
                      <dd className="text-gray-600">{product.specifications.occasion}</dd>
                    </div>
                  )}
                  {product.specifications?.pattern && product.specifications.pattern !== 'Not specified' && (
                    <div className="flex">
                      <dt className="font-medium text-gray-700 w-32">Pattern:</dt>
                      <dd className="text-gray-600">{product.specifications.pattern}</dd>
                    </div>
                  )}
                  <div className="flex">
                    <dt className="font-medium text-gray-700 w-32">Category:</dt>
                    <dd className="text-gray-600 capitalize">{product.category}</dd>
                  </div>
                </dl>
              </div>

              {/* Description */}
              <div className="bg-white border border-gray-200 rounded p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Ratings & Reviews */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="bg-white border border-gray-200 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Ratings & Reviews</h2>
                    {product.averageRating && product.averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold">
                          {product.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {product.totalReviews || product.reviews.length} ratings and {product.reviews.length} reviews
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {product.reviews.slice(0, 5).map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Products */}
              {similarProducts.length > 0 && (
                <div className="bg-white border border-gray-200 rounded p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Similar Products</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {similarProducts.map((similarProduct) => {
                      const similarDiscount = similarProduct.originalPrice && similarProduct.originalPrice > similarProduct.price
                        ? Math.round(((similarProduct.originalPrice - similarProduct.price) / similarProduct.originalPrice) * 100)
                        : 0;
                      
                      return (
                        <Link
                          key={similarProduct._id}
                          to={`/product/${similarProduct._id}`}
                          className="border border-gray-200 rounded p-2 hover:shadow-md transition-shadow"
                        >
                          <div className="relative w-full pb-[100%] mb-2 bg-gray-100 overflow-hidden">
                            {similarProduct.images && similarProduct.images[0] ? (
                              <img
                                src={getImageUrl(similarProduct.images[0])}
                                alt={similarProduct.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/Placeholder.png';
                                }}
                              />
                            ) : (
                              <img
                                src="/images/Placeholder.png"
                                alt={similarProduct.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}
                            {similarDiscount > 0 && (
                              <span className="absolute top-1 left-1 bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                                {similarDiscount}% off
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                            {similarProduct.name}
                          </h3>
                          <div className="flex items-center gap-1 mb-1">
                            {similarProduct.averageRating && similarProduct.averageRating > 0 && (
                              <>
                                {renderStars(similarProduct.averageRating)}
                                <span className="text-xs text-gray-600">({similarProduct.totalReviews || 0})</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{similarProduct.price.toLocaleString()}
                            </span>
                            {similarProduct.originalPrice && similarProduct.originalPrice > similarProduct.price && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹{similarProduct.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
