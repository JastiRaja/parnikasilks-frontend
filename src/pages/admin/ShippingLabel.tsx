import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { FaPrint, FaArrowLeft, FaEdit, FaSave } from 'react-icons/fa';

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
    };
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  createdAt: string;
}

// Default from address (can be configured)
const FROM_ADDRESS = {
  name: 'Parnika Silks',
  addressLine1: 'Your Warehouse Address Line 1',
  addressLine2: 'Your Warehouse Address Line 2',
  city: 'Your City',
  state: 'Your State',
  postalCode: 'Your Postal Code',
  phone: 'Your Contact Number',
  email: 'your@email.com'
};

const ShippingLabel: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromAddress, setFromAddress] = useState(FROM_ADDRESS);
  const [returnAddress, setReturnAddress] = useState(FROM_ADDRESS);
  const [isEditingFrom, setIsEditingFrom] = useState(false);
  const [isEditingReturn, setIsEditingReturn] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${orderId}`);
      if (response.data) {
        setOrder(response.data);
      } else {
        toast.error('Order not found');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveFromAddress = () => {
    setIsEditingFrom(false);
    toast.success('From address updated');
  };

  const handleSaveReturnAddress = () => {
    setIsEditingReturn(false);
    toast.success('Return address updated');
  };

  const handleFromAddressChange = (field: string, value: string) => {
    setFromAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReturnAddressChange = (field: string, value: string) => {
    setReturnAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyFromToReturn = () => {
    setReturnAddress({ ...fromAddress });
    toast.success('From address copied to return address');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="shipping-label-container p-6 pt-24 print:p-0 print:pt-0">
      {/* Print Controls - Hidden when printing */}
      <div className="mb-6 print:hidden space-y-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Shipping Label</h1>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            <FaPrint className="h-5 w-5" />
            Print Label
          </button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You can edit the FROM and RETURN addresses below before printing. Click the edit icon to modify addresses.
          </p>
        </div>
      </div>

      {/* Shipping Label - Print Friendly */}
      <div className="shipping-label-print bg-white border-2 border-gray-800 p-8 max-w-4xl mx-auto print:border-2 print:border-gray-800">
        {/* Brand Logo Section - Top Left */}
        <div className="mb-4 pb-3 border-b-2 border-gray-300 print:mb-2 print:pb-1">
          <div className="flex items-center gap-2">
            <img 
              src="/Parnikasilks logo.JPG" 
              alt="Parnika Silks" 
              className="h-14 w-auto object-contain print:h-8 print:max-w-[100px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* TO: Customer Address */}
          <div className="border-2 border-gray-800 p-4">
            <div className="mb-3 pb-2 border-b border-gray-400">
              <p className="text-sm font-bold text-gray-900 uppercase">TO (DELIVERY ADDRESS)</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-700">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-gray-700">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-700">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
              <p className="text-gray-700">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* FROM: Warehouse Address */}
          <div className="border-2 border-gray-800 p-4">
            <div className="mb-3 pb-2 border-b border-gray-400 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 uppercase">FROM (SENDER ADDRESS)</p>
              {!isEditingFrom && (
                <button
                  onClick={() => setIsEditingFrom(true)}
                  className="print:hidden text-blue-600 hover:text-blue-800 transition-colors"
                  title="Edit From Address"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              )}
            </div>
            {isEditingFrom ? (
              <div className="space-y-2 print:hidden">
                <input
                  type="text"
                  value={fromAddress.name}
                  onChange={(e) => handleFromAddressChange('name', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={fromAddress.addressLine1}
                  onChange={(e) => handleFromAddressChange('addressLine1', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={fromAddress.addressLine2 || ''}
                  onChange={(e) => handleFromAddressChange('addressLine2', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Address Line 2 (Optional)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={fromAddress.city}
                    onChange={(e) => handleFromAddressChange('city', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={fromAddress.state}
                    onChange={(e) => handleFromAddressChange('state', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={fromAddress.postalCode}
                    onChange={(e) => handleFromAddressChange('postalCode', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Postal Code"
                  />
                  <input
                    type="text"
                    value={fromAddress.phone}
                    onChange={(e) => handleFromAddressChange('phone', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Phone"
                  />
                </div>
                <input
                  type="email"
                  value={fromAddress.email || ''}
                  onChange={(e) => handleFromAddressChange('email', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Email (Optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveFromAddress}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <FaSave className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingFrom(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm print:text-xs">
                <p className="font-bold text-gray-900">{fromAddress.name}</p>
                <p className="text-gray-700">{fromAddress.addressLine1}</p>
                {fromAddress.addressLine2 && (
                  <p className="text-gray-700">{fromAddress.addressLine2}</p>
                )}
                <p className="text-gray-700">
                  {fromAddress.city}, {fromAddress.state} - {fromAddress.postalCode}
                </p>
                <p className="text-gray-700">Phone: {fromAddress.phone}</p>
                {fromAddress.email && (
                  <p className="text-gray-700">Email: {fromAddress.email}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RETURN ADDRESS */}
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 border-dashed rounded">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-red-900 uppercase">
              ⚠️ IF NOT DELIVERED, RETURN TO:
            </p>
            {!isEditingReturn && (
              <div className="print:hidden flex items-center gap-2">
                <button
                  onClick={copyFromToReturn}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 border border-blue-300 rounded"
                  title="Copy From Address"
                >
                  Copy From
                </button>
                <button
                  onClick={() => setIsEditingReturn(true)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Edit Return Address"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          {isEditingReturn ? (
            <div className="space-y-2 print:hidden">
              <input
                type="text"
                value={returnAddress.name}
                onChange={(e) => handleReturnAddressChange('name', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Name"
              />
              <input
                type="text"
                value={returnAddress.addressLine1}
                onChange={(e) => handleReturnAddressChange('addressLine1', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Address Line 1"
              />
              <input
                type="text"
                value={returnAddress.addressLine2 || ''}
                onChange={(e) => handleReturnAddressChange('addressLine2', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Address Line 2 (Optional)"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={returnAddress.city}
                  onChange={(e) => handleReturnAddressChange('city', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={returnAddress.state}
                  onChange={(e) => handleReturnAddressChange('state', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="State"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={returnAddress.postalCode}
                  onChange={(e) => handleReturnAddressChange('postalCode', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Postal Code"
                />
                <input
                  type="text"
                  value={returnAddress.phone}
                  onChange={(e) => handleReturnAddressChange('phone', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Phone"
                />
              </div>
              <input
                type="email"
                value={returnAddress.email || ''}
                onChange={(e) => handleReturnAddressChange('email', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Email (Optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveReturnAddress}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <FaSave className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditingReturn(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm print:text-xs">
              <p className="font-bold text-gray-900">{returnAddress.name}</p>
              <p className="text-gray-700">{returnAddress.addressLine1}</p>
              {returnAddress.addressLine2 && (
                <p className="text-gray-700">{returnAddress.addressLine2}</p>
              )}
              <p className="text-gray-700">
                {returnAddress.city}, {returnAddress.state} - {returnAddress.postalCode}
              </p>
              <p className="text-gray-700">Phone: {returnAddress.phone}</p>
              {returnAddress.email && (
                <p className="text-gray-700">Email: {returnAddress.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <div className="mt-6 pt-4 border-t-2 border-gray-300">
          <div className="text-center space-y-2 text-xs text-gray-600">
            <p className="text-gray-500">
              Order Date: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div> */}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Reset body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Hide navigation, footer, and controls */
          nav,
          header,
          footer,
          .navbar,
          .footer,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Hide main wrapper padding but keep structure */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Shipping label container */
          .shipping-label-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          
          /* Shipping label content */
          .shipping-label-print {
            margin: 0 auto !important;
            padding: 0.5cm !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            border: 2px solid #000 !important;
            page-break-inside: avoid !important;
          }
          
          /* Ensure all elements are visible */
          .shipping-label-print * {
            color: #000 !important;
          }
          
          /* Images */
          .shipping-label-print img {
            max-width: 100% !important;
            height: auto !important;
          }
          
          /* Make logo smaller in print */
          .shipping-label-print img[alt="Parnika Silks"] {
            height: 32px !important;
            max-width: 100px !important;
            width: auto !important;
          }
          
          /* Color adjustments */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ShippingLabel;

