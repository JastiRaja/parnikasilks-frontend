import axios from 'axios';
import config from '../config';

const BREVO_API_KEY = config.brevoApiKey;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

if (!BREVO_API_KEY) {
  console.error('Brevo API key is not configured in config.js');
}

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
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key is not configured, skipping email sending');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'Parnika Silks', email: 'parnikasilksofficial@gmail.com' },
        to: [{ email: 'sreechowdary11@gmail.com' }],
        subject: `New Order #${orderDetails.orderId}`,
        htmlContent: `
          <h2>New Order Received</h2>
          <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
          ${orderDetails.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderDetails.trackingNumber}</p>` : ''}
          <p><strong>Customer Name:</strong> ${orderDetails.shippingAddress.fullName}</p>
          <p><strong>Phone:</strong> ${orderDetails.shippingAddress.phone}</p>
          
          <h3>Shipping Address:</h3>
          <p>
            ${orderDetails.shippingAddress.addressLine1}<br/>
            ${orderDetails.shippingAddress.addressLine2 ? orderDetails.shippingAddress.addressLine2 + '<br/>' : ''}
            ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.postalCode}
          </p>
          
          <h3>Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
            </tr>
            ${orderDetails.items.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.price.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </table>
          
          <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
          <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount.toLocaleString()}</p>
        `
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    
    // Check if it's an IP authorization error
    if (error.response && error.response.status === 401) {
      console.warn('IP address not authorized for Brevo API. Please add your IP to the authorized IPs list at https://app.brevo.com/security/authorised_ips');
      return { 
        success: false, 
        message: 'Email service error: IP not authorized. Order was placed successfully, but confirmation email could not be sent.' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to send order confirmation email. Order was placed successfully.' 
    };
  }
}; 