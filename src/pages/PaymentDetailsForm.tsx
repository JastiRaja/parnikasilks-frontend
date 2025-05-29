import React, { useState } from 'react';
import axios from '../utils/axios';
import { useParams, useNavigate } from 'react-router-dom';

const PaymentDetailsForm: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    paymentDate: '',
    amount: '',
    transactionId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/admin/orders/${orderId}/payment-details`, form);
      alert('Payment details submitted! We will verify and process your order soon.');
      navigate('/my-orders');
    } catch (err) {
      alert('Error submitting payment details.');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Submit UPI Payment Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block mb-1">Payment Date</label>
          <input
            type="date"
            name="paymentDate"
            value={form.paymentDate}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Amount Paid</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block mb-1">Transaction ID</label>
          <input
            type="text"
            name="transactionId"
            value={form.transactionId}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-pink-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default PaymentDetailsForm; 