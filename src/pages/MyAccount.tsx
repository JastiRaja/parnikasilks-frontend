import React from 'react';

const MyAccount = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Account</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
          {/* User details form will be implemented here */}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Saved Addresses</h3>
          {/* Addresses list will be implemented here */}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;