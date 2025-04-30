import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const { cartCount } = useCart();

  const handleLogout = () => {
    // Remove all authentication-related items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
    
    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization'];
    
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-full  ">
          <Link to="/" className="flex items-center">
            <img 
              src="/Parnikasilks logo.JPG" 
              alt="Parnika Silks" 
              className="h-12 w-auto object-contain"
            />
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-pink-600">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-pink-600">
              About
            </Link>
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin/products" className="text-gray-700 hover:text-pink-600">Products</Link>
                    <Link to="/admin/dashboard" className="text-gray-700 hover:text-pink-600">
                      Admin Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/my-orders" className="text-gray-700 hover:text-pink-600">
                      My Orders
                    </Link>
                    <Link to="/cart" className="text-gray-700 hover:text-pink-600 relative">
                      <ShoppingBag className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <Link to="/my-account" className="text-gray-700 hover:text-pink-600">
                  <User className="h-5 w-5" />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-pink-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-pink-600">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;