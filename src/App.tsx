import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import Orders from './pages/Orders';
import OrderConfirmation from './pages/OrderConfirmation';
import ManageAddresses from './pages/ManageAddresses';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import ProtectedRoute from './components/ProtectedRoute';
import ProductForm from './pages/admin/ProductForm';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
import About from './pages/About';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    ),
    children: [
      { path: '', element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'products', element: <Products /> },
      { path: 'product/:id', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'checkout', element: <ProtectedRoute><Checkout /></ProtectedRoute> },
      { path: 'account', element: <ProtectedRoute><Account /></ProtectedRoute> },
      { path: 'my-account', element: <ProtectedRoute><Account /></ProtectedRoute> },
      { path: 'addresses', element: <ProtectedRoute><ManageAddresses /></ProtectedRoute> },
      { path: 'my-orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
      { path: 'order-confirmation/:id', element: <ProtectedRoute><OrderConfirmation /></ProtectedRoute> },
      { path: 'admin/dashboard', element: <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute> },
      { path: 'admin/products', element: <ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute> },
      { path: 'admin/products/new', element: <ProtectedRoute requireAdmin><ProductForm /></ProtectedRoute> },
      { path: 'admin/products/:productId/edit', element: <ProtectedRoute requireAdmin><ProductForm /></ProtectedRoute> },
      { path: 'admin/orders', element: <ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute> },
      { path: 'admin/customers', element: <ProtectedRoute requireAdmin><AdminCustomers /></ProtectedRoute> },
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App: React.FC = () => {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </CartProvider>
  );
};

export default App;