import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useCart } from '../context/CartContext';
import { sendOrderConfirmationEmail } from '../utils/emailService';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt } from 'react-icons/fa';
// @ts-ignore
import QRCode from 'react-qr-code';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Address {
  _id: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

const Checkout: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    paymentDate: '',
    amount: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    fetchUserAddresses();
    setLoading(false);
  }, []);

  const fetchUserAddresses = async () => {
    try {
      const response = await axios.get('/api/users/me');
      if (response.data && response.data.addresses) {
        setUserAddresses(response.data.addresses);
        
        // Find default address if exists
        const defaultAddress = response.data.addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          populateAddressForm(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching user addresses:', error);
    }
  };

  const populateAddressForm = (address: Address) => {
    setShippingAddress({
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.pincode,
      phone: address.phone
    });
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      populateAddressForm(selectedAddress);
      setShowNewAddressForm(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'pincode' ? value.replace(/\D/g, '') : value)
    }));
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode || !newAddress.phone) {
        toast.error('Please fill in all required fields.');
        return;
      }
      const response = await axios.post('/api/users/addresses', newAddress);
      if (response.data) {
        toast.success('Address added successfully!');
        setShowNewAddressForm(false);
        setNewAddress({
          fullName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          isDefault: false
        });
        // Re-fetch addresses and select the new one
        await fetchUserAddresses();
        // Try to select the new address by phone (unique enough for now)
        const newAddr = (await axios.get('/api/users/me')).data.addresses.find((a: any) => a.phone === newAddress.phone);
        if (newAddr) setSelectedAddressId(newAddr._id);
      }
    } catch (err) {
      console.error('Error adding address:', err);
      toast.error('Failed to add address.');
    }
  };

  const handleEditClick = (address: Address) => {
    setEditingAddressId(address._id);
    setEditAddress({ ...address });
    setShowNewAddressForm(false);
  };

  const handleEditAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (!editAddress) return;
    setEditAddress({
      ...editAddress,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddress) return;
    try {
      if (!editAddress.fullName || !editAddress.addressLine1 || !editAddress.city || !editAddress.state || !editAddress.pincode || !editAddress.phone) {
        toast.error('Please fill in all required fields.');
        return;
      }
      const response = await axios.put(`/api/users/addresses/${editingAddressId}`, editAddress);
      if (response.data) {
        toast.success('Address updated successfully!');
        setEditingAddressId(null);
        setEditAddress(null);
        // Re-fetch addresses and select the edited one
        await fetchUserAddresses();
        setSelectedAddressId(editingAddressId);
      }
    } catch (err) {
      toast.error('Failed to update address.');
    }
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handlePaymentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setError(null);
    try {
      // Place the order first
      if (!selectedAddressId) {
        setError('Please select a delivery address.');
        setSubmittingPayment(false);
        return;
      }
      const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        setError('Selected address not found.');
        setSubmittingPayment(false);
        return;
      }
      if (!cartItems.length) {
        throw new Error('Cart is empty');
      }
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        })),
        shippingAddress: {
          fullName: selectedAddress.fullName,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: String(selectedAddress.pincode),
          phone: selectedAddress.phone
        },
        paymentMethod,
        totalAmount: calculateTotal()
      };
      const response = await axios.post('/api/orders', orderData);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }
      // Send payment details
      await axios.post(`/api/admin/orders/${response.data.order._id}/payment-details`, paymentForm);
      // Clear cart
      clearCart();
      localStorage.removeItem('cart');
      toast.success('Order and payment details submitted!');
      navigate('/my-orders');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit payment details.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedAddressId) {
        setError('Please select a delivery address.');
        setLoading(false);
        return;
      }
      const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        setError('Selected address not found.');
        setLoading(false);
        return;
      }

      // Validate cart items
      if (!cartItems.length) {
        throw new Error('Cart is empty');
      }

      // Log the cart items for debugging
      console.log('Cart items:', cartItems);

      // Prepare order data with correct structure
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        })),
        shippingAddress: {
          fullName: selectedAddress.fullName,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: String(selectedAddress.pincode),
          phone: selectedAddress.phone
        },
        paymentMethod,
        totalAmount: calculateTotal()
      };

      // Log the order data for debugging
      console.log('Order data being sent:', orderData);

      // Create order in the backend
      const response = await axios.post('/api/orders', orderData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }

      // Send order confirmation email
      const emailResult = await sendOrderConfirmationEmail({
        orderId: response.data.order._id,
        trackingNumber: response.data.order.trackingNumber,
        items: cartItems,
        totalAmount: calculateTotal(),
        shippingAddress,
        paymentMethod
      });

      // Clear cart
      clearCart();
      localStorage.removeItem('cart');

      // Show success message
      toast.success('Order placed successfully!');
      
      // Show warning if email failed
      if (!emailResult.success && emailResult.message) {
        toast(String(emailResult.message));
      }

      // Navigate to order confirmation or payment details form
      if (paymentMethod === 'online') {
        navigate(`/order-payment-details/${response.data.order._id}`);
      } else {
        navigate(`/order-confirmation/${response.data.order._id}`);
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Address */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="mb-4">
            <span className="font-medium">Saved Addresses</span>
            <button
              className="ml-4 text-pink-600 hover:underline"
              onClick={() => setShowNewAddressForm(true)}
            >
              Add new address
            </button>
          </div>
          {/* Address selection */}
          {userAddresses.length > 0 ? (
            <div className="space-y-2 mb-4">
              {userAddresses.map((address) => (
                <label
                  key={address._id}
                  className={`block border rounded-lg p-4 cursor-pointer transition-all ${selectedAddressId === address._id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    value={address._id}
                    checked={selectedAddressId === address._id}
                    onChange={() => handleAddressSelect(address._id)}
                    className="mr-2 accent-pink-600"
                  />
                  <span className="font-bold">{address.fullName}</span> <br />
                  {address.addressLine1}, {address.city}, {address.state} - {address.pincode}<br />
                  Phone: {address.phone}
                  {address.isDefault && (
                    <span className="ml-2 px-2 py-1 text-xs bg-pink-100 text-pink-600 rounded">Default</span>
                  )}
                  <button
                    type="button"
                    className="ml-2 text-blue-600 hover:underline text-xs"
                    onClick={() => handleEditClick(address)}
                  >
                    Edit
                  </button>
                </label>
              ))}
            </div>
          ) : (
            <div className="mb-4 text-gray-500">No saved addresses. Please add one.</div>
          )}
          {/* New address form */}
          {showNewAddressForm && (
            <form className="space-y-4" onSubmit={handleAddNewAddress}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={newAddress.fullName}
                  onChange={handleNewAddressChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={newAddress.addressLine1}
                  onChange={handleNewAddressChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={newAddress.addressLine2}
                  onChange={handleNewAddressChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={newAddress.pincode}
                    onChange={handleNewAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={newAddress.phone}
                    onChange={handleNewAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={newAddress.isDefault}
                  onChange={handleNewAddressChange}
                  className="mr-2"
                />
                <label className="text-sm">Set as default address</label>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  onClick={() => {
                    setShowNewAddressForm(false);
                    setNewAddress({
                      fullName: '',
                      addressLine1: '',
                      addressLine2: '',
                      city: '',
                      state: '',
                      pincode: '',
                      phone: '',
                      isDefault: false
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {editingAddressId && editAddress && (
            <form className="space-y-4" onSubmit={handleEditAddress}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editAddress.fullName}
                  onChange={handleEditAddressChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={editAddress.addressLine1}
                  onChange={handleEditAddressChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={editAddress.city}
                    onChange={handleEditAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={editAddress.state}
                    onChange={handleEditAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={editAddress.pincode}
                    onChange={handleEditAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editAddress.phone}
                    onChange={handleEditAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={editAddress.isDefault}
                  onChange={handleEditAddressChange}
                  className="mr-2"
                />
                <label className="text-sm">Set as default address</label>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  onClick={() => { setEditingAddressId(null); setEditAddress(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        {/* Order Summary (existing code) */}
        {/* ... */}
      </div>
      {/* Place Order button and error message */}
      {error && <div className="text-red-500 mt-4">{error}</div>}
      <button
        className="mt-8 w-full md:w-auto px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="flex flex-col space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
              className="mr-2 accent-pink-600"
            />
            Cash on Delivery
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === 'online'}
              onChange={() => setPaymentMethod('online')}
              className="mr-2 accent-pink-600"
            />
            UPI Payment
          </label>
        </div>
      </div>
      {paymentMethod === 'online' && (
        <div className="mb-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Scan to Pay with UPI</h3>
          <QRCode
            value={`upi://pay?pa=jastiraja500@sbi&pn=Parnika+Silks&am=${calculateTotal()}&cu=INR&tn=Order+Payment`}
            style={{ height: 200, width: 200 }}
          />
          <p className="mt-2 text-gray-600 text-sm">UPI ID: <span className="font-mono">jastiraja500@sbi</span></p>
          <p className="text-gray-500 text-xs">Scan this QR code with any UPI app to pay ₹{calculateTotal()}.</p>
          {!showPaymentForm && (
            <button
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setShowPaymentForm(true)}
            >
              Done
            </button>
          )}
          {showPaymentForm && (
            <form className="mt-4 w-full max-w-sm space-y-4" onSubmit={handlePaymentFormSubmit}>
              <div>
                <label className="block mb-1">Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentFormChange}
                  required
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block mb-1">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={paymentForm.paymentDate}
                  onChange={handlePaymentFormChange}
                  required
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block mb-1">Amount Paid</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                  required
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <button
                type="submit"
                disabled={submittingPayment}
                className="bg-pink-600 text-white px-4 py-2 rounded"
              >
                {submittingPayment ? 'Submitting...' : 'Submit Payment Details'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout; 