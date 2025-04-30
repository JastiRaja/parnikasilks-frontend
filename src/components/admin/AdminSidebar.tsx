import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag,
  LogOut 
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white h-screen shadow-md fixed left-0 top-0 pt-16">
      <div className="p-4">
        <nav className="space-y-2">
          <Link
            to="/admin"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/admin') ? 'bg-pink-100 text-pink-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          
          <Link
            to="/admin/products"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/admin/products') ? 'bg-pink-100 text-pink-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Products</span>
          </Link>
          
          <Link
            to="/admin/orders"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/admin/orders') ? 'bg-pink-100 text-pink-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Orders</span>
          </Link>
          
          <Link
            to="/admin/customers"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/admin/customers') ? 'bg-pink-100 text-pink-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar; 