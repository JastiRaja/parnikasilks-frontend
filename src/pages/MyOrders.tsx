import React from 'react';

const MyOrders = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Orders</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Order list will be implemented here */}
        <p className="p-4 text-gray-500">No orders found.</p>
      </div>
    </div>
  );
};

export default MyOrders;