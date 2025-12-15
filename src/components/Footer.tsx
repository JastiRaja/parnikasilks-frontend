import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaEnvelope, FaYoutube} from 'react-icons/fa';
import { GiRotaryPhone } from 'react-icons/gi';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img 
                src="/Parnikasilks logo.JPG" 
                alt="Parnika Silks" 
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">About Parnika Silks</h3>
            <p className="text-gray-300 leading-relaxed">
              We bring you the finest collection of traditional and contemporary silk sarees,
              curated with love and craftsmanship from across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-pink-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-pink-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/products" 
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-pink-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start group">
                <GiRotaryPhone className="mr-3 mt-1 text-pink-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a 
                  href="tel:+919030389516" 
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200"
                >
                  +91 9030389516
                </a>
              </li>
              <li className="flex items-start group">
                <FaEnvelope className="mr-3 mt-1 text-pink-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a 
                  href="mailto:parnikasilksofficial@gmail.com" 
                  className="text-gray-300 hover:text-pink-400 transition-colors duration-200 break-all"
                >
                  parnikasilksofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Follow Us</h3>
            <p className="text-gray-300 mb-4 text-sm">
              Stay connected with us on social media for the latest updates and exclusive offers.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/people/parnikasilks-official/61572494053539/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/parnikasilks_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://m.youtube.com/@parnikasilksofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                aria-label="YouTube"
              >
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Parnika Silks. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-pink-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-pink-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 