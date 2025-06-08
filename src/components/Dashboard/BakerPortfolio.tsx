import React, { useState, useRef } from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useAuthStore } from '../../store/authStore';
import { Plus, X, Upload, Trash2, Camera, Edit3, Image as ImageIcon, ZoomIn } from 'lucide-react';

export const BakerPortfolio: React.FC = () => {
  const { getBakerPortfolio, addPortfolioItem, deletePortfolioItem, updatePortfolioItem } = usePortfolioStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    image: '',
    caption: ''
  });
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const portfolioItems = user ? getBakerPortfolio(user.id) : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.caption.trim()) {
      setError('Please enter a caption');
      return;
    }

    if (uploadMethod === 'url') {
      if (!formData.image.trim()) {
        setError('Please enter an image URL');
        return;
      }
      
      // Validate URL format
      try {
        new URL(formData.image);
      } catch {
        setError('Please enter a valid image URL');
        return;
      }
    } else {
      if (!selectedFile && !editingItem) {
        setError('Please select an image file');
        return;
      }
    }

    if (editingItem) {
      // Update existing item
      updatePortfolioItem(editingItem, {
        image: formData.image.trim(),
        caption: formData.caption.trim()
      });
      setEditingItem(null);
    } else {
      // Add new item
      addPortfolioItem({
        bakerId: user!.id,
        image: formData.image.trim(),
        caption: formData.caption.trim()
      });
    }

    // Reset form
    setFormData({ image: '', caption: '' });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowAddModal(false);

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Portfolio ${editingItem ? 'updated' : 'item added'} successfully!</span>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  };

  const handleEdit = (item: any) => {
    setFormData({
      image: item.image,
      caption: item.caption
    });
    setPreviewUrl(item.image);
    setEditingItem(item.id);
    setShowAddModal(true);
    setError('');
    setUploadMethod('url'); // Default to URL for editing
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      deletePortfolioItem(itemId, user!.id);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({ image: '', caption: '' });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setUploadMethod('file');
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUrl('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">My Portfolio</h1>
            <p className="text-gray-600 mt-2">Showcase your best cake creations to attract customers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Portfolio Item</span>
          </button>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No portfolio items yet</p>
          <p className="text-sm text-gray-500 mb-6">Start building your portfolio by adding photos of your cake creations!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {portfolioItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <div 
                  className="w-full h-48 cursor-pointer relative group"
                  onClick={() => handleImageClick(item.image)}
                >
                  <img
                    src={item.image}
                    alt={item.caption}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
                    }}
                  />
                  
                  {/* Zoom overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
                
                {/* Action buttons - visible on hover */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-md"
                    title="Edit Item"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-md"
                    title="Delete Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 text-sm leading-relaxed">{item.caption}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-size Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImageUrl}
              alt="Portfolio item"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={closeImageModal}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Portfolio Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Upload Method Selection */}
                {!editingItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Method
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="file"
                          checked={uploadMethod === 'file'}
                          onChange={(e) => setUploadMethod(e.target.value as 'file' | 'url')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Upload File</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="url"
                          checked={uploadMethod === 'url'}
                          onChange={(e) => setUploadMethod(e.target.value as 'file' | 'url')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Image URL</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {uploadMethod === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ImageIcon className="inline h-4 w-4 mr-1" />
                      Select Image File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              ref={fileInputRef}
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Image URL */}
                {uploadMethod === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Upload className="inline h-4 w-4 mr-1" />
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image: e.target.value }));
                        setPreviewUrl(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://example.com/your-cake-image.jpg"
                      required={uploadMethod === 'url'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a direct link to your cake image (JPG, PNG, etc.)
                    </p>
                  </div>
                )}

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <textarea
                    value={formData.caption}
                    onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your cake creation..."
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.caption.length}/200 characters
                  </p>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => handleImageClick(previewUrl)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {formData.caption && (
                        <div className="p-3 bg-gray-50">
                          <p className="text-sm text-gray-700">{formData.caption}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Click image to view full size
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};