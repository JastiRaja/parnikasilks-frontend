import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTruck, FaBox } from 'react-icons/fa';

const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return placeholderImage;
  if (imagePath.startsWith('data:')) return imagePath;
  if (imagePath.startsWith('http')) return imagePath;
  return `${import.meta.env.VITE_API_URL}/uploads/products/${imagePath.split('/').pop()}`;
};

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  trackingNumber: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  createdAt: string;
  paymentMethod: string;
}

const OrderConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('Fetching order with ID:', id);
        const response = await axios.get(`/api/orders/${id}`);
        console.log('Order API response:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from the server');
        }

        setOrder(response.data);
        setError(null);
      } catch (error: any) {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        const errorMessage = error.response?.data?.message || error.message;
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {error || 'Order Not Found'}
        </h2>
        <p className="text-gray-600 mb-6">
          {error ? 'An error occurred while fetching the order.' : 'The requested order could not be found.'}
        </p>
        <div className="flex space-x-4">
          <Link 
            to="/my-orders" 
            className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition-colors"
          >
            View My Orders
          </Link>
          <Link 
            to="/" 
            className="bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <FaCheckCircle className="text-green-500 text-4xl mr-3" />
            <h1 className="text-2xl font-semibold text-gray-800">Order Confirmed!</h1>
          </div>

          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{order._id}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Tracking Number:</span>
              <span className="font-medium">{order.trackingNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <FaBox className="text-pink-500 text-xl" />
                <div className="ml-2">
                  <p className="font-medium text-gray-800">{order.status.toUpperCase()}</p>
                  <p className="text-sm text-gray-500">We'll notify you when your order ships</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.product._id} className="flex items-center border-b pb-4">
                  <div className="w-20 h-20 relative">
                    <img
                      src={item.product.images?.[0] ? getImageUrl(item.product.images[0]) : placeholderImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.log('Image load error:', item.product.images?.[0]);
                        const target = e.target as HTMLImageElement;
                        target.src = placeholderImage;
                      }}
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-gray-500">₹{item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>PIN: {order.shippingAddress.pincode}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between mb-2">
                  <span>Payment Method</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Total Amount</span>
                  <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/"
              className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/my-orders"
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 