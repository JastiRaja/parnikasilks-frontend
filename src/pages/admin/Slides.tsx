import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { uploadInstance } from '../../utils/axios';
import { FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../../utils/constants';

interface Slide {
  _id: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
  linkText?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const Slides: React.FC = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [linkType, setLinkType] = useState<'preset' | 'custom'>('preset');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    linkText: 'Shop Now',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
    image: null as File | null
  });

  // Product categories for dropdown
  const productCategories = [
    { value: '', label: 'Select a category...' },
    { value: '/products?category=saree', label: 'Saree' },
    { value: '/products?category=dress', label: 'Dress' },
    { value: '/products?category=lehenga', label: 'Lehenga' },
    { value: '/products?category=salwar', label: 'Salwar' },
    { value: '/products?category=other', label: 'Other' },
    { value: '/products', label: 'All Products' },
  ];

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/slides/admin/all');
      if (response.data.success) {
        setSlides(response.data.slides);
      }
    } catch (err: any) {
      console.error('Error fetching slides:', err);
      toast.error('Error fetching slides');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('linkText', formData.linkText);
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('order', formData.order.toString());
      if (formData.startDate) formDataToSend.append('startDate', formData.startDate);
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Use uploadInstance for file uploads (longer timeout)
      const apiInstance = formData.image ? uploadInstance : axios;

      if (editingSlide) {
        await apiInstance.put(`/api/slides/admin/${editingSlide._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Slide updated successfully');
      } else {
        await apiInstance.post('/api/slides/admin', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Slide created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchSlides();
    } catch (err: any) {
      console.error('Error saving slide:', err);
      if (err.code === 'ECONNABORTED') {
        toast.error('Upload timeout. The file may be too large or connection is slow. Please try again.');
      } else {
        toast.error(err.response?.data?.message || 'Error saving slide');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    const slideLink = slide.link || '';
    // Check if link matches a category route
    const isPreset = productCategories.some(cat => cat.value === slideLink);
    setLinkType(isPreset ? 'preset' : 'custom');
    setFormData({
      title: slide.title,
      description: slide.description || '',
      link: slideLink,
      linkText: slide.linkText || 'Shop Now',
      isActive: slide.isActive,
      order: slide.order,
      startDate: slide.startDate ? slide.startDate.split('T')[0] : '',
      endDate: slide.endDate ? slide.endDate.split('T')[0] : '',
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;

    try {
      await axios.delete(`/api/slides/admin/${id}`);
      toast.success('Slide deleted successfully');
      fetchSlides();
    } catch (err: any) {
      console.error('Error deleting slide:', err);
      toast.error('Error deleting slide');
    }
  };

  const toggleActive = async (slide: Slide) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isActive', (!slide.isActive).toString());
      formDataToSend.append('title', slide.title);
      formDataToSend.append('description', slide.description || '');
      formDataToSend.append('link', slide.link || '');
      formDataToSend.append('linkText', slide.linkText || 'Shop Now');
      formDataToSend.append('order', slide.order.toString());

      // Use regular axios for non-file updates
      await axios.put(`/api/slides/admin/${slide._id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Slide ${!slide.isActive ? 'activated' : 'deactivated'}`);
      fetchSlides();
    } catch (err: any) {
      console.error('Error toggling slide:', err);
      toast.error('Error updating slide');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      linkText: 'Shop Now',
      isActive: true,
      order: 0,
      startDate: '',
      endDate: '',
      image: null
    });
    setLinkType('preset');
    setEditingSlide(null);
  };

  const getImageUrl = (imageId: string): string => {
    if (!imageId) return '';
    return `${BACKEND_URL}/api/admin/images/${imageId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Slides</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap z-10 relative"
        >
          <FaPlus className="h-5 w-5" /> 
          <span>Add New Slide</span>
        </button>
      </div>

      {slides.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-gray-600 mb-6 text-lg">No slides found. Create your first slide to get started!</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
            >
              <FaPlus className="h-5 w-5" />
              <span>Add Your First Slide</span>
            </button>
          </div>
        </div>
      ) : slides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <div
              key={slide._id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !slide.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="relative h-48">
                <img
                  src={getImageUrl(slide.image)}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/Placeholder.png';
                  }}
                />
                {!slide.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Inactive
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{slide.title}</h3>
                {slide.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{slide.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Order: {slide.order}</span>
                  {slide.link && (
                    <span className="text-pink-600">Link: {slide.link}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                      slide.isActive
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {slide.isActive ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={() => handleDelete(slide._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSlide ? 'Edit Slide' : 'Create New Slide'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Type
                  </label>
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setLinkType('preset');
                        setFormData({ ...formData, link: '' });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        linkType === 'preset'
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Select Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkType('custom')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        linkType === 'custom'
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Custom URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link URL
                    </label>
                    {linkType === 'preset' ? (
                      <select
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        {productCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="/products or https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    )}
                    {linkType === 'preset' && formData.link && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: <span className="font-mono">{formData.link}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Text
                    </label>
                    <input
                      type="text"
                      value={formData.linkText}
                      onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                      placeholder="Shop Now"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image {!editingSlide && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingSlide}
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  {editingSlide && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to keep current image
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active (visible on homepage)
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>{editingSlide ? 'Update Slide' : 'Create Slide'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slides;

