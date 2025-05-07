import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/axios';
import { FaUpload, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: (string | File)[];
  stock: number;
  specifications: {
    material: string;
    color: string;
   
  };
  // careInstructions: string;
}

const categories = ['saree', 'dress', 'lehenga', 'salwar', 'other'];

const ProductForm: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    category: '',
    images: [],
    stock: 0,
    specifications: {
      material: '',
      color: '',
      // size: '',
      // weight: '',
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
              images: productData.images.map((img: string) => img)
            });
            
            // Set preview images if there are any
            if (productData.images && productData.images.length > 0) {
              const imageUrls = productData.images.map(
                (img: string) => `${import.meta.env.VITE_API_URL}${img}`
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
      setProduct(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
    }
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
        
      const method = productId ? 'put' : 'post';
      const response = await axios[method](url, formData, {
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
      toast.error(error.response?.data?.message || 'Failed to save product');
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {productId ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={product.category}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              value={product.price || ''}
              onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              value={product.stock || ''}
              onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              value={product.specifications.material}
              onChange={(e) => setProduct({
                ...product,
                specifications: { ...product.specifications, material: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="text"
              value={product.specifications.color}
              onChange={(e) => setProduct({
                ...product,
                specifications: { ...product.specifications, color: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <input
              type="text"
              value={product.specifications.size}
              onChange={(e) => setProduct({
                ...product,
                specifications: { ...product.specifications, size: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div> */}

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Weight</label>
            <input
              type="text"
              value={product.specifications.weight}
              onChange={(e) => setProduct({
                ...product,
                specifications: { ...product.specifications, weight: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div> */}
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700">Care Instructions</label>
          <textarea
            value={product.careInstructions}
            onChange={(e) => setProduct({ ...product, careInstructions: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            rows={4}
            required
          />
        </div> */}

        <div>
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
            </div>
          </div>
        </div>

        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 