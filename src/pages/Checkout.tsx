import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useCart } from '../context/CartContext';
import { sendOrderConfirmationEmail } from '../utils/emailService';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaUser, FaHome, FaCity, FaPhone, FaEdit, FaPlus, FaCheck, FaTimes, FaMobileAlt } from 'react-icons/fa';
// @ts-ignore
import QRCode from 'react-qr-code';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  deliveryCharges?: number;
  deliveryChargesApplicable?: boolean;
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
    fetchProductDetails(cart);
    fetchUserAddresses();
    setLoading(false);
  }, []);

  const fetchProductDetails = async (cart: CartItem[]) => {
    try {
      // Fetch product details for all cart items to get delivery charges
      const productPromises = cart.map(item => 
        axios.get(`/api/products/${item._id}`).catch(() => null)
      );
      const productResponses = await Promise.all(productPromises);
      
      const updatedCart = cart.map((item, index) => {
        const productResponse = productResponses[index];
        if (productResponse?.data?.success && productResponse.data.product) {
          return {
            ...item,
            deliveryCharges: productResponse.data.product.deliveryCharges || 0,
            deliveryChargesApplicable: productResponse.data.product.deliveryChargesApplicable !== false
          };
        }
        return item;
      });
      
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateDeliveryCharges = () => {
    const FREE_DELIVERY_THRESHOLD = 1000;
    const subtotal = calculateSubtotal();
    
    // If order total >= ₹1000, delivery is free
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      return 0;
    }
    
    // Calculate delivery charges for items that have delivery charges applicable
    let deliveryCharges = 0;
    cartItems.forEach(item => {
      if (item.deliveryChargesApplicable !== false && item.deliveryCharges) {
        deliveryCharges += (item.deliveryCharges * item.quantity);
      }
    });
    
    return deliveryCharges;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryCharges();
  };

  const generateUpiDeepLink = () => {
    const upiId = '9959430763@axl';
    const amount = calculateTotal();
    const merchantName = 'Parnika Silks';
    const transactionNote = 'Order Payment';
    
    // Create UPI deep link URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    return upiUrl;
  };

  const handleOpenUpiApp = () => {
    const upiUrl = generateUpiDeepLink();
    window.location.href = upiUrl;
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Address - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-pink-600" />
                  Shipping Address
                </h2>
                {!showNewAddressForm && !editingAddressId && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <FaPlus className="h-4 w-4" />
                    Add New Address
                  </button>
                )}
              </div>
              {/* Address selection */}
              {!showNewAddressForm && !editingAddressId && (
                <>
                  {userAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {userAddresses.map((address) => (
                        <label
                          key={address._id}
                          className={`block border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                            selectedAddressId === address._id
                              ? 'border-pink-500 bg-pink-50 shadow-md'
                              : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedAddress"
                              value={address._id}
                              checked={selectedAddressId === address._id}
                              onChange={() => handleAddressSelect(address._id)}
                              className="mt-1 accent-pink-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FaUser className="text-gray-400" />
                                  <span className="font-bold text-gray-900">{address.fullName}</span>
                                  {address.isDefault && (
                                    <span className="px-2 py-1 text-xs bg-pink-600 text-white rounded-full font-semibold">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(address);
                                  }}
                                  className="text-pink-600 hover:text-pink-700 transition-colors p-2 hover:bg-pink-100 rounded-lg"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <FaHome className="text-gray-400" />
                                  <span>{address.addressLine1}</span>
                                </div>
                                {address.addressLine2 && (
                                  <div className="ml-6">{address.addressLine2}</div>
                                )}
                                <div className="flex items-center gap-2">
                                  <FaCity className="text-gray-400" />
                                  <span>{address.city}, {address.state} - {address.pincode}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaPhone className="text-gray-400" />
                                  <span>{address.phone}</span>
                                </div>
                              </div>
                            </div>
                            {selectedAddressId === address._id && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                                  <FaCheck className="text-white text-xs" />
                                </div>
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No saved addresses. Please add one.</p>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                      >
                        Add Address
                      </button>
                    </div>
                  )}
                </>
              )}
              {/* New address form */}
              {showNewAddressForm && (
                <form className="space-y-4" onSubmit={handleAddNewAddress}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Address</h3>
                    <button
                      type="button"
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
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={newAddress.fullName}
                        onChange={handleNewAddressChange}
                        className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaHome className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="addressLine1"
                        value={newAddress.addressLine1}
                        onChange={handleNewAddressChange}
                        className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        placeholder="Street address, P.O. box"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={newAddress.addressLine2}
                      onChange={handleNewAddressChange}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaCity className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          value={newAddress.city}
                          onChange={handleNewAddressChange}
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          placeholder="City"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={newAddress.state}
                        onChange={handleNewAddressChange}
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        placeholder="State"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={newAddress.pincode}
                        onChange={handleNewAddressChange}
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        placeholder="PIN code"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={newAddress.phone}
                          onChange={handleNewAddressChange}
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          placeholder="10-digit number"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleNewAddressChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label className="ml-2 text-sm text-gray-700 cursor-pointer">Set as default address</label>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
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
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {/* Edit address form */}
              {editingAddressId && editAddress && (
                <form className="space-y-4" onSubmit={handleEditAddress}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Address</h3>
                    <button
                      type="button"
                      onClick={() => { setEditingAddressId(null); setEditAddress(null); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={editAddress.fullName}
                        onChange={handleEditAddressChange}
                        className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaHome className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="addressLine1"
                        value={editAddress.addressLine1}
                        onChange={handleEditAddressChange}
                        className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaCity className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          value={editAddress.city}
                          onChange={handleEditAddressChange}
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={editAddress.state}
                        onChange={handleEditAddressChange}
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={editAddress.pincode}
                        onChange={handleEditAddressChange}
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={editAddress.phone}
                          onChange={handleEditAddressChange}
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={editAddress.isDefault}
                      onChange={handleEditAddressChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label className="ml-2 text-sm text-gray-700 cursor-pointer">Set as default address</label>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingAddressId(null); setEditAddress(null); }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'online' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mr-3 accent-pink-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">UPI Payment</div>
                    <div className="text-sm text-gray-600">Pay via UPI apps (PhonePe, Google Pay, Paytm, etc.)</div>
                  </div>
                </label>
              </div>

              {/* UPI Payment Section */}
              {paymentMethod === 'online' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Pay with UPI</h3>
                  
                  {isMobileDevice() ? (
                    <div className="text-center py-6">
                      <button
                        onClick={handleOpenUpiApp}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
                      >
                        <FaMobileAlt className="text-2xl" />
                        <span>Open UPI App</span>
                      </button>
                      <p className="mt-4 text-gray-600 text-sm">
                        This will open your default UPI app with pre-filled payment details
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <QRCode
                          value={generateUpiDeepLink()}
                          style={{ height: 200, width: 200 }}
                        />
                      </div>
                      <p className="mt-4 text-gray-700 font-semibold">UPI ID: <span className="font-mono text-pink-600">9959430763@axl</span></p>
                      <p className="mt-2 text-gray-500 text-sm">Scan this QR code with any UPI app to pay ₹{calculateTotal().toLocaleString()}</p>
                    </div>
                  )}
                  
                  {!showPaymentForm && (
                    <button
                      className="mt-6 w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      I've Completed Payment
                    </button>
                  )}
                  
                  {showPaymentForm && (
                    <form className="mt-6 space-y-4" onSubmit={handlePaymentFormSubmit}>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID</label>
                        <input
                          type="text"
                          name="transactionId"
                          value={paymentForm.transactionId}
                          onChange={handlePaymentFormChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date</label>
                        <input
                          type="date"
                          name="paymentDate"
                          value={paymentForm.paymentDate}
                          onChange={handlePaymentFormChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid</label>
                        <input
                          type="number"
                          name="amount"
                          value={paymentForm.amount}
                          onChange={handlePaymentFormChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-pink-500 focus:ring-pink-200 transition-all"
                          placeholder="Enter amount"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {submittingPayment ? 'Submitting...' : 'Submit Payment Details'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                      <div className="text-pink-600 font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  {calculateDeliveryCharges() === 0 ? (
                    <span className="text-green-600 font-semibold">Free</span>
                  ) : (
                    <span>₹{calculateDeliveryCharges().toLocaleString()}</span>
                  )}
                </div>
                {calculateSubtotal() < 1000 && calculateDeliveryCharges() > 0 && (
                  <div className="text-xs text-gray-500 italic">
                    💡 Free delivery on orders above ₹1000
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-pink-600">₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedAddressId}
                className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold text-lg hover:from-pink-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 