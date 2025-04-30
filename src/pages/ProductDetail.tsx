import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
        <Link
          to="/products"
          className="mt-4 inline-block px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Function to get the full image URL
  const getImageUrl = (imagePath: string): string | undefined => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-h-1 aspect-w-1 w-full">
            {product.images && product.images.length > 0 ? (
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.name}
                className="h-full w-full object-cover object-center rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`aspect-h-1 aspect-w-1 w-full cursor-pointer rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-pink-500' : ''
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} - View ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">{product?.name}</h1>
          
          <div className="text-2xl font-bold text-pink-600">
            ₹{product?.price.toLocaleString()}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              Category: {product?.category}
            </span>
            <span
              className={`px-2 py-1 text-sm rounded ${
                product?.stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {product?.stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <p className="text-gray-600 leading-relaxed">{product?.description}</p>

          <div className="border-t pt-4">
            <h3 className="text-xl font-semibold mb-4">Specifications</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <dt className="text-sm text-gray-500">Material</dt>
                <dd className="font-medium text-gray-900">
                  {product?.specifications?.material || 'Not specified'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm text-gray-500">Color</dt>
                <dd className="font-medium text-gray-900">
                  {product?.specifications?.color || 'Not specified'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCartAction}
              className={`w-full py-3 rounded-lg transition-colors ${
                isInCart
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-pink-600 text-white hover:bg-pink-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!product?.stock}
            >
              {!isAuthenticated
                ? 'Login to Add to Cart'
                : isInCart
                ? 'Remove from Cart'
                : product?.stock
                ? 'Add to Cart'
                : 'Out of Stock'}
            </button>

            <Link
              to="/products"
              className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;