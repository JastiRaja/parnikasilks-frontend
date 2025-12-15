import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { FaClock, FaCheckCircle, FaTimesCircle, FaTruck } from 'react-icons/fa';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
  };
  items: {
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  createdAt: string;
  expectedDeliveryDate?: string;
  courierService?: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  paymentDetails?: {
    paymentDate?: string;
    amount?: number;
    transactionId?: string;
    verified?: boolean;
  };
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState({
    expectedDeliveryDate: '',
    courierService: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders');
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // If changing to "shipped", show modal to enter delivery details
    if (newStatus === 'shipped') {
      setSelectedOrderId(orderId);
      setShippingData({ expectedDeliveryDate: '', courierService: '' });
      setShowShippingModal(true);
      return;
    }

    // For other status changes, update directly
    try {
      setUpdatingStatus(orderId);
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleShippingSubmit = async () => {
    if (!selectedOrderId) return;

    if (!shippingData.expectedDeliveryDate) {
      toast.error('Please enter expected delivery date');
      return;
    }

    try {
      setUpdatingStatus(selectedOrderId);
      await api.put(`/api/orders/${selectedOrderId}/status`, {
        status: 'shipped',
        expectedDeliveryDate: shippingData.expectedDeliveryDate,
        courierService: shippingData.courierService || undefined
      });
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === selectedOrderId 
            ? { 
                ...order, 
                status: 'shipped',
                expectedDeliveryDate: shippingData.expectedDeliveryDate,
                courierService: shippingData.courierService
              }
            : order
        )
      );
      
      toast.success('Order marked as shipped with delivery date');
      setShowShippingModal(false);
      setSelectedOrderId(null);
      setShippingData({ expectedDeliveryDate: '', courierService: '' });
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'processing':
        return <FaCheckCircle className="text-blue-500" />;
      case 'shipped':
        return <FaTruck className="text-indigo-500" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Txn ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.user?.name}</div>
                    <div className="text-sm text-gray-500">{order.user?.email}</div>
                    {order.shippingAddress && (
                      <div className="text-xs text-gray-500 mt-1">
                        {order.shippingAddress.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items?.map((item, index) => (
                        <div key={index} className="mb-1">
                          {item.product?.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{order.totalAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingStatus === order._id}
                        className={`${getStatusColor(order.status)} pl-8 pr-4 py-1 rounded-full text-sm font-medium cursor-pointer border-2 border-transparent hover:border-gray-300 transition-colors appearance-none`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        {getStatusIcon(order.status)}
                      </div>
                      {updatingStatus === order._id && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.expectedDeliveryDate ? (
                      <div>
                        <div className="text-sm font-medium text-pink-600">
                          {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        {order.courierService && (
                          <div className="text-xs text-gray-500">{order.courierService}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.paymentDetails?.transactionId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.paymentDetails?.amount ? `₹${order.paymentDetails.amount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.paymentDetails?.paymentDate
                      ? new Date(order.paymentDetails.paymentDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.paymentDetails?.verified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-yellow-600">Not Verified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!order.paymentDetails?.verified && order.paymentDetails?.transactionId && (
                      <button
                        onClick={async () => {
                          await api.post(`/api/admin/orders/${order._id}/verify-payment`);
                          toast.success('Payment marked as verified!');
                          fetchOrders();
                        }}
                        className="bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Mark as Verified
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mark Order as Shipped</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={shippingData.expectedDeliveryDate}
                  onChange={(e) => setShippingData({ ...shippingData, expectedDeliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the delivery date provided by courier service</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Courier Service (Optional)
                </label>
                <input
                  type="text"
                  value={shippingData.courierService}
                  onChange={(e) => setShippingData({ ...shippingData, courierService: e.target.value })}
                  placeholder="e.g., Blue Dart, DTDC, FedEx"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleShippingSubmit}
                disabled={updatingStatus === selectedOrderId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {updatingStatus === selectedOrderId ? 'Updating...' : 'Mark as Shipped'}
              </button>
              <button
                onClick={() => {
                  setShowShippingModal(false);
                  setSelectedOrderId(null);
                  setShippingData({ expectedDeliveryDate: '', courierService: '' });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 