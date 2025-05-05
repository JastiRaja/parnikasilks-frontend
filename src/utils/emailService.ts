import axios from 'axios';
import { API_URL } from '../config';

interface OrderDetails {
  orderId: string;
  trackingNumber?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
}

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  try {
    // Call the backend API endpoint to send the email
    const response = await axios.post(`${API_URL}/email/order-confirmation`, orderDetails);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    return {
      success: false,
      message: 'Failed to send order confirmation email. Order was placed successfully.'
    };
  }
}; 