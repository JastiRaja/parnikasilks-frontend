import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useCart } from '../context/CartContext';
import { sendOrderConfirmationEmail } from '../utils/emailService';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Address {
  _id: string;
  fullName: string;
  address: string;
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
      addressLine1: address.address,
      addressLine2: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate shipping address
      const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'phone'];
      const missingFields = requiredFields.filter(field => !shippingAddress[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
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
          price: parseFloat(item.price)
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          phone: shippingAddress.phone
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

      // Save shipping address to user's addresses if it's a new address
      if (!selectedAddressId) {
        try {
          await axios.post('/api/users/addresses', {
            fullName: shippingAddress.fullName,
            address: shippingAddress.addressLine1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.postalCode,
            phone: shippingAddress.phone,
            isDefault: false // Don't set as default automatically
          });
        } catch (addressError) {
          console.error('Error saving address:', addressError);
          // Don't throw error here, just log it and continue
        }
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
      if (!emailResult.success) {
        toast.warning(emailResult.message);
      }

      // Navigate to order confirmation
      navigate(`/order-confirmation/${response.data.order._id}`);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping and Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                
                {/* Saved Addresses Section */}
                {userAddresses.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-700">Saved Addresses</h3>
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                        className="text-pink-600 hover:text-pink-700 text-sm"
                      >
                        {showNewAddressForm ? 'Select from saved addresses' : 'Add new address'}
                      </button>
                    </div>
                    
                    {!showNewAddressForm && (
                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <div
                            key={address._id}
                            className={`border rounded-md p-3 cursor-pointer ${
                              selectedAddressId === address._id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                            }`}
                            onClick={() => handleAddressSelect(address._id)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{address.fullName}</p>
                                <p className="text-gray-600">{address.address}</p>
                                <p className="text-gray-600">
                                  {address.city}, {address.state} - {address.pincode}
                                </p>
                                <p className="text-gray-600">Phone: {address.phone}</p>
                              </div>
                              {address.isDefault && (
                                <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* New Address Form */}
                {showNewAddressForm && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        name="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        name="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={shippingAddress.state}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                      Cash on Delivery
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 text-white py-3 rounded-md hover:bg-pink-700 transition-colors font-medium text-lg"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold text-primary">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 