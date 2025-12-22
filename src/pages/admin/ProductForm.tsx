import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { uploadInstance } from '../../utils/axios';
import { FaUpload, FaTrash, FaTag, FaRupeeSign, FaBox, FaPalette, FaInfoCircle, FaImage, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  deliveryCharges?: number;
  deliveryChargesApplicable?: boolean;
  category: string;
  images: (string | File)[];
  stock: number;
  specifications: {
    material: string;
    color: string;
    sareeType?: string;
    occasion?: string;
    pattern?: string;
  };
  // careInstructions: string;
}

const categories = ['saree', 'dress', 'lehenga', 'salwar', 'other'];

const ProductForm: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    category: '',
    images: [],
    stock: 0,
    deliveryCharges: 0,
    deliveryChargesApplicable: true,
    specifications: {
      material: '',
      color: '',
      sareeType: '',
      occasion: '',
      pattern: '',
    },
    // careInstructions: '',
  });

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/admin/products/${productId}`);
          if (response.data.success) {
            const productData = response.data.product;
            setProduct({
              ...productData,
              images: productData.images ? productData.images.map((img: string) => img) : []
            });
            
            // Set preview images if there are any
            if (productData.images && productData.images.length > 0) {
              const imageUrls = productData.images.map(
                (img: string) => `${import.meta.env.VITE_API_URL}/api/admin/images/${img}`
              );
              setPreviewImages(imageUrls);
            }
          } else {
            toast.error('Failed to load product details');
            setError('Failed to fetch product details');
          }
        } catch (error: any) {
          console.error('Error fetching product:', error);
          toast.error(error.response?.data?.message || 'Failed to load product details');
          setError('Failed to fetch product details');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId]);

  const handleImageChange = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
      setProduct(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray]
      }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append basic product details
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', product.price.toString());
      formData.append('category', product.category);
      formData.append('stock', product.stock.toString());
      
      // Append original price and discount if provided
      if (product.originalPrice) {
        formData.append('originalPrice', product.originalPrice.toString());
      }
      if (product.discountPercentage !== undefined) {
        formData.append('discountPercentage', product.discountPercentage.toString());
      }
      
      // Append delivery charges
      if (product.deliveryCharges !== undefined) {
        formData.append('deliveryCharges', product.deliveryCharges.toString());
      }
      if (product.deliveryChargesApplicable !== undefined) {
        formData.append('deliveryChargesApplicable', product.deliveryChargesApplicable.toString());
      }
      
      // Append specifications as a JSON string
      formData.append('specifications', JSON.stringify(product.specifications));
      
      // Append images
      if (product.images.length > 0) {
        product.images.forEach(image => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }
      
      const url = productId 
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
        
      // Use uploadInstance if there are images to upload (longer timeout)
      const apiInstance = product.images.length > 0 ? uploadInstance : axios;
      const method = productId ? 'put' : 'post';
      const response = await apiInstance[method](url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(productId ? 'Product updated successfully' : 'Product created successfully');
        navigate('/admin/products');
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error: any) {
      console.error('Error submitting product:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. The files may be too large or connection is slow. Please try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h1>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600">Fill in the details below to {productId ? 'update' : 'create'} your product</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="bg-pink-100 p-2 rounded-lg mr-3">
                <FaInfoCircle className="h-5 w-5 text-pink-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="mr-2">Product Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    placeholder="Enter product name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaTag className="mr-2 text-pink-600" />
                  <span>Category</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <select
                    value={product.category}
                    onChange={(e) => setProduct({ ...product, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaTag className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaRupeeSign className="mr-2 text-pink-600" />
                  <span>Selling Price</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={product.price || ''}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      let discountPercentage = product.discountPercentage || 0;
                      
                      // Auto-calculate discount if originalPrice is set
                      if (product.originalPrice && product.originalPrice > 0 && product.originalPrice >= newPrice) {
                        discountPercentage = ((product.originalPrice - newPrice) / product.originalPrice) * 100;
                      }
                      
                      setProduct({ 
                        ...product, 
                        price: newPrice,
                        discountPercentage: Math.round(discountPercentage)
                      });
                    }}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500">The price customers will pay</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaRupeeSign className="mr-2 text-pink-600" />
                  <span>Original Price (Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => {
                      const originalPrice = parseFloat(e.target.value) || 0;
                      const sellingPrice = product.price || 0;
                      let discountPercentage = 0;
                      
                      if (originalPrice > 0 && originalPrice >= sellingPrice) {
                        discountPercentage = ((originalPrice - sellingPrice) / originalPrice) * 100;
                      }
                      
                      setProduct({ 
                        ...product, 
                        originalPrice: originalPrice > 0 ? originalPrice : undefined,
                        discountPercentage: Math.round(discountPercentage)
                      });
                    }}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500">Original price before discount (leave empty if no discount)</p>
                {product.originalPrice && product.originalPrice > 0 && product.price && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Discount: <span className="font-bold">{product.discountPercentage || 0}% OFF</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaBox className="mr-2 text-pink-600" />
                  <span>Stock Quantity</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  value={product.stock || ''}
                  onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                  placeholder="0"
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaRupeeSign className="mr-2 text-pink-600" />
                  <span>Delivery Charges</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={product.deliveryCharges || ''}
                    onChange={(e) => setProduct({ ...product, deliveryCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={!product.deliveryChargesApplicable}
                  />
                </div>
                <p className="text-xs text-gray-500">Delivery charges for this product (Free if order total ≥ ₹1000)</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={product.deliveryChargesApplicable !== false}
                    onChange={(e) => setProduct({ ...product, deliveryChargesApplicable: e.target.checked })}
                    className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <span>Delivery Charges Applicable</span>
                </label>
                <p className="text-xs text-gray-500">Uncheck if this product has free delivery regardless of order total</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <span className="mr-2">Description</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none resize-none"
                rows={5}
                placeholder="Describe your product in detail..."
                required
              />
            </div>
          </div>

          {/* Specifications Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <FaPalette className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Specifications</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="mr-2">Material</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={product.specifications.material}
                  onChange={(e) => setProduct({
                    ...product,
                    specifications: { ...product.specifications, material: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                  placeholder="e.g., Silk, Cotton, Georgette"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <FaPalette className="mr-2 text-pink-600" />
                  <span>Color</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={product.specifications.color}
                  onChange={(e) => setProduct({
                    ...product,
                    specifications: { ...product.specifications, color: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                  placeholder="e.g., Red, Blue, Multicolor"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="mr-2">Saree Type</span>
                </label>
                <select
                  value={product.specifications.sareeType || ''}
                  onChange={(e) => setProduct({
                    ...product,
                    specifications: { ...product.specifications, sareeType: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                >
                  <option value="">Select saree type (optional)</option>
                  <option value="Kanjivaram">Kanjivaram</option>
                  <option value="Banarasi">Banarasi</option>
                  <option value="Silk">Silk</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Georgette">Georgette</option>
                  <option value="Chiffon">Chiffon</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="mr-2">Occasion</span>
                </label>
                <select
                  value={product.specifications.occasion || ''}
                  onChange={(e) => setProduct({
                    ...product,
                    specifications: { ...product.specifications, occasion: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                >
                  <option value="">Select occasion (optional)</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Party">Party</option>
                  <option value="Casual">Casual</option>
                  <option value="Festival">Festival</option>
                  <option value="Formal">Formal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="mr-2">Pattern</span>
                </label>
                <select
                  value={product.specifications.pattern || ''}
                  onChange={(e) => setProduct({
                    ...product,
                    specifications: { ...product.specifications, pattern: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                >
                  <option value="">Select pattern (optional)</option>
                  <option value="Solid">Solid</option>
                  <option value="Printed">Printed</option>
                  <option value="Embroidered">Embroidered</option>
                  <option value="Self Design">Self Design</option>
                  <option value="Floral">Floral</option>
                  <option value="Geometric">Geometric</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

        {/* Images Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FaImage className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Product Images</h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              id="file-upload"
              name="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-pink-100' : 'bg-gray-100'}`}>
                  <FaUpload className={`h-10 w-10 ${isDragging ? 'text-pink-600' : 'text-gray-400'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {isDragging ? 'Drop images here' : 'Upload product images'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-pink-600 hover:text-pink-700 font-semibold underline"
                  >
                    Click to upload
                  </button>
                  <span>or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
              </div>
            </div>
          </div>

          {previewImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Uploaded Images ({previewImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-pink-500 transition-colors">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove image"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <FaInfoCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{productId ? 'Update Product' : 'Save Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProductForm; 