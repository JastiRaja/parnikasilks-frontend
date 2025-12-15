import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src="/Parnikasilks logo.JPG" 
              alt="Parnika Silks" 
              className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-600 transition-all group-hover:w-full"></span>
            </Link>
            {!isAuthenticated || !isAdmin ? (
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
              >
                Products
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-600 transition-all group-hover:w-full"></span>
              </Link>
            ) : null}
            
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    <Link 
                      to="/admin/products" 
                      className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200"
                    >
                      Products
                    </Link>
                    <Link 
                      to="/admin/slides" 
                      className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200"
                    >
                      Slides
                    </Link>
                    <Link 
                      to="/admin/dashboard" 
                      className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/my-orders" 
                      className="text-gray-700 hover:text-pink-600 font-medium transition-colors duration-200"
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/cart" 
                      className="relative p-2 text-gray-700 hover:text-pink-600 transition-colors duration-200 group"
                    >
                      <ShoppingBag className="h-6 w-6" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-scale-in shadow-md">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <Link 
                  to="/my-account" 
                  className="p-2 text-gray-700 hover:text-pink-600 transition-colors duration-200"
                >
                  <User className="h-6 w-6" />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-pink-600 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              {!isAuthenticated || !isAdmin ? (
                <Link 
                  to="/products" 
                  className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Products
                </Link>
              ) : null}
              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <>
                      <Link 
                        to="/admin/products" 
                        className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Products
                      </Link>
                      <Link 
                        to="/admin/slides" 
                        className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Slides
                      </Link>
                      <Link 
                        to="/admin/dashboard" 
                        className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/my-orders" 
                        className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link 
                        to="/cart" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/my-account" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Account</span>
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors text-center whitespace-nowrap"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;