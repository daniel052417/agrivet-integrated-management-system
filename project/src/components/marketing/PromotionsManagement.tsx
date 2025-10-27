import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  Facebook,
  Image as ImageIcon,
  AlertCircle,
  Megaphone,
  Upload,
  Share2,
  Loader2
} from 'lucide-react';
import { PromotionsManagementService, Promotion, CreatePromotionData } from '../../lib/promotionsManagementService';

// Helper function to convert database promotion to component format
const convertPromotionToComponent = (dbPromotion: Promotion) => ({
  id: dbPromotion.id,
  title: dbPromotion.title,
  description: dbPromotion.description,
  imageUrl: dbPromotion.image_url || '',
  promotionType: dbPromotion.promotion_type,
  startDate: dbPromotion.start_date,
  endDate: dbPromotion.end_date,
  showOnPWA: dbPromotion.show_on_pwa,
  shareToFacebook: dbPromotion.share_to_facebook,
  status: dbPromotion.status,
  createdBy: dbPromotion.created_by || 'Unknown',
  createdAt: dbPromotion.created_at,
  totalViews: dbPromotion.total_views,
  totalClicks: dbPromotion.total_clicks
});

// Helper function to convert component form data to database format
const convertFormDataToDatabase = (formData: any): CreatePromotionData => ({
  title: formData.title,
  description: formData.description,
  image_url: formData.imageUrl || undefined,
  promotion_type: formData.promotionType,
  start_date: formData.startDate,
  end_date: formData.endDate,
  show_on_pwa: formData.showOnPWA,
  share_to_facebook: formData.shareToFacebook
});

// Promotion types for selection
const promotionTypes = [
  { value: 'new_item', label: 'New Item Arrival', icon: '📦' },
  { value: 'restock', label: 'Product Restock', icon: '🔄' },
  { value: 'event', label: 'Event/Workshop', icon: '🎪' }
];

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [viewingPromotion, setViewingPromotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local image selection state (defer upload until save)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  // Multiple images support
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>([]);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    promotionType: 'new_item',
    startDate: '',
    endDate: '',
    showOnPWA: true,
    shareToFacebook: false,
    // New design fields
    layoutStyle: 'half', // 'half' | 'full' | 'text_only'
    textAlignment: 'center', // 'left' | 'center' | 'right'
    fontFamily: 'Poppins', // 'Poppins' | 'Roboto' | 'Montserrat' | 'Lato'
    fontSize: 'md', // 'sm' | 'md' | 'lg'
    textColor: '#000000',
    buttonText: 'Start Shopping',
    buttonLink: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPromotionTypeInfo = (type: string) => {
    return promotionTypes.find(t => t.value === type) || { value: type, label: type, icon: '📢' };
  };

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case 'new_item': return 'bg-blue-100 text-blue-800';
      case 'restock': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load promotions on component mount
  useEffect(() => {
    loadPromotions();
  }, []);

  // Load promotions from database
  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await PromotionsManagementService.getPromotions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });

      if (error) {
        setError('Failed to load promotions');
        console.error('Error loading promotions:', error);
        return;
      }

      // Convert database format to component format
      const convertedPromotions = data.map(convertPromotionToComponent);
      setPromotions(convertedPromotions);
    } catch (err) {
      setError('Failed to load promotions');
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload promotions when filters change
  useEffect(() => {
    if (!loading) {
      loadPromotions();
    }
  }, [statusFilter, searchTerm]);


  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promotion.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePromotion = () => {
    // Clean up any previous preview object URL
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
      setSelectedImagePreviewUrl(null);
    }
    setSelectedImageFile(null);
    // Cleanup multiple previews
    selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedImagePreviews([]);
    setSelectedImageFiles([]);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      promotionType: 'new_item',
      startDate: '',
      endDate: '',
      showOnPWA: true,
      shareToFacebook: false,
      layoutStyle: 'half',
      textAlignment: 'center',
      fontFamily: 'Poppins',
      fontSize: 'md',
      textColor: '#000000',
      buttonText: 'Start Shopping',
      buttonLink: ''
    });
    setEditingPromotion(null);
    setShowCreateModal(true);
  };

  const handleEditPromotion = (promotion: any) => {
    // Reset any newly selected file; keep existing image URL for display
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
      setSelectedImagePreviewUrl(null);
    }
    setSelectedImageFile(null);
    selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedImagePreviews([]);
    setSelectedImageFiles([]);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      imageUrl: promotion.imageUrl,
      promotionType: promotion.promotionType,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      showOnPWA: promotion.showOnPWA,
      shareToFacebook: promotion.shareToFacebook,
      layoutStyle: promotion.layoutStyle || 'half',
      textAlignment: promotion.textAlignment || 'center',
      fontFamily: promotion.fontFamily || 'Poppins',
      fontSize: promotion.fontSize || 'md',
      textColor: promotion.textColor || '#000000',
      buttonText: promotion.buttonText || 'Start Shopping',
      buttonLink: promotion.buttonLink || ''
    });
    setEditingPromotion(promotion);
    setShowCreateModal(true);
  };

  const handleSavePromotion = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate date range
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date');
        return;
      }

      // Build data without image_url; we'll attach image after upload (post-create/update)
      const { image_url: _omit, ...dataWithoutImage } = convertFormDataToDatabase(formData) as any;
      // attach design/button fields into payload (backend may store as columns or JSON)
      const extendedData: any = {
        ...dataWithoutImage,
        layout_style: formData.layoutStyle,
        text_alignment: formData.textAlignment,
        font_family: formData.fontFamily,
        font_size: formData.fontSize,
        text_color: formData.textColor,
        button_text: formData.buttonText,
        button_link: formData.buttonLink
      };

      // 1) Create or update base promotion record first
      let promotionId: string | null = null;

      if (editingPromotion) {
        const updateRes = await PromotionsManagementService.updatePromotion({
          id: editingPromotion.id,
          ...extendedData
        } as any);
        if (updateRes.error) {
          setError(updateRes.error.message || 'Failed to save promotion');
          return;
        }
        promotionId = editingPromotion.id;
      } else {
        const createRes = await PromotionsManagementService.createPromotion({
          ...extendedData
        } as any);
        if (createRes.error || !createRes.data) {
          setError(createRes?.error?.message || 'Failed to create promotion');
          return;
        }
        promotionId = createRes.data.id;
      }

      // 2) Upload images (single preview file backward-compat OR multiple new files)
      let imageUrls: string[] = [];
      const filesToUpload: File[] = selectedImageFiles.length > 0
        ? selectedImageFiles
        : (selectedImageFile ? [selectedImageFile] : []);
      if (promotionId && filesToUpload.length > 0) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const { data: imagePublicUrl, error: uploadErr } = await PromotionsManagementService.uploadPromotionImage(
            file,
            `${promotionId}/images/${i}`
          );
          if (uploadErr) {
            setError(uploadErr.message || 'Failed to upload image');
            continue;
          }
          if (imagePublicUrl) imageUrls.push(imagePublicUrl);
        }
        if (imageUrls.length > 0) {
          const imgUpdateRes = await PromotionsManagementService.updatePromotion({
            id: promotionId,
            // keep legacy image_url for table compatibility using first image
            image_url: imageUrls[0],
            // if backend supports array/json column, this will persist
            image_urls: imageUrls
          } as any);
          if (imgUpdateRes.error) {
            setError(imgUpdateRes.error.message || 'Failed to update promotion images');
          }
        }
      }

      // 3) Reload and cleanup state
      await loadPromotions();
      setShowCreateModal(false);
      setEditingPromotion(null);
      // Cleanup any object URL used for preview
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
        setSelectedImagePreviewUrl(null);
      }
      selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
      setSelectedImagePreviews([]);
      setSelectedImageFiles([]);
      setSelectedImageFile(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        promotionType: 'new_item',
        startDate: '',
        endDate: '',
        showOnPWA: true,
        shareToFacebook: false,
        layoutStyle: 'half',
        textAlignment: 'center',
        fontFamily: 'Poppins',
        fontSize: 'md',
        textColor: '#000000',
        buttonText: 'Start Shopping',
        buttonLink: ''
      });
    } catch (err) {
      setError('Failed to save promotion');
      console.error('Error saving promotion:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        setError(null);
        const { error } = await PromotionsManagementService.deletePromotion(id);
        
        if (error) {
          setError('Failed to delete promotion');
          console.error('Error deleting promotion:', error);
          return;
        }

        // Reload promotions to reflect the deletion
        await loadPromotions();
      } catch (err) {
        setError('Failed to delete promotion');
        console.error('Error deleting promotion:', err);
      }
    }
  };

  const renderCreateEditModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                  <Megaphone className="w-7 h-7" />
                </div>
                <span>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</span>
              </h3>
              <p className="text-emerald-50 mt-2 text-sm flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                <span>Design your perfect promotion with live preview</span>
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
                setSelectedImagePreviewUrl(null);
                setSelectedImageFile(null);
                selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
                setSelectedImagePreviews([]);
                setSelectedImageFiles([]);
                setShowCreateModal(false);
                setError(null);
              }}
              className="group p-2 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Form (60%) */}
          <div className="w-3/5 p-8 overflow-y-auto bg-gray-50 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-shake">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
  
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-emerald-200 transition-all duration-200">
              <div className="flex items-center space-x-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  <p className="text-xs text-gray-500">Set up the core details</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Promotion Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-emerald-300"
                    placeholder="e.g., Grand Opening Sale - 50% Off!"
                  />
                </div>
  
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Promotion Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {promotionTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({...formData, promotionType: type.value})}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.promotionType === type.value
                            ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md hover:scale-102'
                        }`}
                      >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">{type.icon}</div>
                        <div className="text-xs font-semibold text-gray-900">{type.label}</div>
                        {formData.promotionType === type.value && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
  
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    maxLength={500}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-emerald-300 resize-none"
                    placeholder="Write a compelling description that will attract customers..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Make it engaging and informative</p>
                    <p className={`text-xs font-mono ${formData.description.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.description.length}/500
                    </p>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Section 2: Visual Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-200 transition-all duration-200">
              <div className="flex items-center space-x-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Banner Image</h4>
                  <p className="text-xs text-gray-500">Upload or design your promotional banner</p>
                </div>
              </div>
  
              {/* Image Grid Preview */}
              {(selectedImagePreviews.length > 0 || formData.imageUrl) && (
                <div className="mb-5">
                  <div className="grid grid-cols-3 gap-3">
                    {(selectedImagePreviews.length > 0 ? selectedImagePreviews : [formData.imageUrl]).map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-all duration-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-end justify-center p-2 space-x-1">
                          {selectedImagePreviews.length > 0 && (
                            <>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = [...selectedImagePreviews];
                                    const newFiles = [...selectedImageFiles];
                                    [newPreviews[idx-1], newPreviews[idx]] = [newPreviews[idx], newPreviews[idx-1]];
                                    [newFiles[idx-1], newFiles[idx]] = [newFiles[idx], newFiles[idx-1]];
                                    setSelectedImagePreviews(newPreviews);
                                    setSelectedImageFiles(newFiles);
                                  }}
                                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                  title="Move left"
                                >
                                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const newPreviews = [...selectedImagePreviews];
                                  const newFiles = [...selectedImageFiles];
                                  URL.revokeObjectURL(newPreviews[idx]);
                                  newPreviews.splice(idx, 1);
                                  newFiles.splice(idx, 1);
                                  setSelectedImagePreviews(newPreviews);
                                  setSelectedImageFiles(newFiles);
                                  if (newPreviews.length === 0) setFormData({...formData, imageUrl: ''});
                                }}
                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {idx < selectedImagePreviews.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = [...selectedImagePreviews];
                                    const newFiles = [...selectedImageFiles];
                                    [newPreviews[idx+1], newPreviews[idx]] = [newPreviews[idx], newPreviews[idx+1]];
                                    [newFiles[idx+1], newFiles[idx]] = [newFiles[idx], newFiles[idx+1]];
                                    setSelectedImagePreviews(newPreviews);
                                    setSelectedImageFiles(newFiles);
                                  }}
                                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                  title="Move right"
                                >
                                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Upload Area */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-200 group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
                    setSelectedImagePreviewUrl(null);
                    setSelectedImageFile(null);
                    const newPreviews = files.map(f => URL.createObjectURL(f));
                    const allPreviews = [...selectedImagePreviews, ...newPreviews];
                    const allFiles = [...selectedImageFiles, ...files];
                    setSelectedImagePreviews(allPreviews);
                    setSelectedImageFiles(allFiles);
                    setFormData({...formData, imageUrl: allPreviews[0]});
                  }}
                  className="hidden"
                  id="banner-upload"
                />
                <label htmlFor="banner-upload" className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                    <Upload className="w-10 h-10 text-blue-600 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">Click to upload images</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB • Multiple images allowed</p>
                  <p className="text-xs text-gray-400 mt-2">First image will be the primary banner</p>
                </label>
              </div>
            </div>
  
            {/* Section 3: Design Customization */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-purple-200 transition-all duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Overlay Text & Design</h4>
                    <p className="text-xs text-gray-500">Customize text overlay on your banner</p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                  Optional
                </span>
              </div>
  
              <div className="space-y-5">
                {/* Overlay Text Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Headline Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="e.g., Buy 1 Take 1 on Feeds!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Additional description text"
                    />
                  </div>
                </div>
  
                {/* Layout Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Layout Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'half', icon: '📐', label: 'Split (50/50)', desc: 'Image & Text Side by Side' },
                      { value: 'full', icon: '🖼️', label: 'Full Banner', desc: 'Text Overlay on Image' },
                      { value: 'text_only', icon: '📝', label: 'Text Only', desc: 'No Image Display' }
                    ].map(layout => (
                      <button
                        key={layout.value}
                        type="button"
                        onClick={() => setFormData({...formData, layoutStyle: layout.value})}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          formData.layoutStyle === layout.value
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-2">{layout.icon}</div>
                        <div className="text-sm font-semibold text-gray-900">{layout.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{layout.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
  
                {/* Typography Controls */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Text Alignment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alignment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'left', icon: '⬅️', label: 'L' },
                        { value: 'center', icon: '↔️', label: 'C' },
                        { value: 'right', icon: '➡️', label: 'R' }
                      ].map(align => (
                        <button
                          key={align.value}
                          type="button"
                          onClick={() => setFormData({...formData, textAlignment: align.value})}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.textAlignment === align.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          title={align.value}
                        >
                          <div className="text-xl">{align.icon}</div>
                        </button>
                      ))}
                    </div>
                  </div>
  
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Font Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'sm', label: 'S' },
                        { value: 'md', label: 'M' },
                        { value: 'lg', label: 'L' }
                      ].map(size => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => setFormData({...formData, fontSize: size.value})}
                          className={`p-3 rounded-lg border-2 font-bold transition-all ${
                            formData.fontSize === size.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
  
                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Font</label>
                    <select
                      value={formData.fontFamily}
                      onChange={(e) => setFormData({...formData, fontFamily: e.target.value})}
                      className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{ fontFamily: formData.fontFamily }}
                    >
                      <option value="Poppins" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                      <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                      <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                      <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
                    </select>
                  </div>
                </div>
  
                {/* Color Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Text Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                        className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm uppercase focus:ring-2 focus:ring-purple-500"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Button Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value="#00B050"
                        onChange={(e) => console.log('Button color:', e.target.value)}
                        className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value="#00B050"
                        onChange={(e) => console.log('Button color text:', e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm uppercase focus:ring-2 focus:ring-purple-500"
                        placeholder="#00B050"
                      />
                    </div>
                  </div>
                </div>
  
                {/* Call-to-Action Button */}
                <div className="pt-4 border-t-2 border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Call-to-Action Button</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Shop Now"
                    />
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="/shop or https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
  
            {/* Section 4: Schedule & Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-orange-200 transition-all duration-200">
              <div className="flex items-center space-x-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Schedule & Distribution</h4>
                  <p className="text-xs text-gray-500">Set when and where to show this promotion</p>
                </div>
              </div>
  
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>
  
              {/* Channels */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Display Channels</label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                    <input
                      type="checkbox"
                      checked={formData.showOnPWA}
                      onChange={(e) => setFormData({...formData, showOnPWA: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Progressive Web App (PWA)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Display on customer mobile application</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${formData.showOnPWA ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${formData.showOnPWA ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                    <input
                      type="checkbox"
                      checked={formData.shareToFacebook}
                      onChange={(e) => setFormData({...formData, shareToFacebook: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center space-x-2">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Facebook Business Page</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Automatically share to your Facebook page</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${formData.shareToFacebook ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform m-0.5 ${formData.shareToFacebook ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
  
          {/* Right Panel - Live Preview (40%) */}
          <div className="w-2/5 bg-gradient-to-br from-gray-100 via-gray-50 to-white p-8 overflow-y-auto border-l-2 border-gray-200">
            <div className="sticky top-0 space-y-6">
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Live Preview</h4>
                    <p className="text-xs text-gray-500">Real-time render</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-gray-600">LIVE</span>
                </div>
              </div>
  
              {/* Phone Mockup */}
              <div className="relative">
                {/* Phone Frame */}
                <div className="bg-gray-900 rounded-[3rem] shadow-2xl p-3 mx-auto" style={{ maxWidth: '400px' }}>
                  {/* Status Bar */}
                  <div className="bg-gray-900 h-8 rounded-t-[2.5rem] flex items-center justify-center mb-1">
                    <div className="w-24 h-5 bg-gray-800 rounded-full"></div>
                  </div>
  
                  {/* Screen Content */}
                  <div className="bg-white rounded-[2rem] overflow-hidden shadow-inner" style={{ minHeight: '600px' }}>
                    {/* App Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between">
                      <h5 className="text-white font-bold text-sm">Promotions</h5>
                      <div className="flex space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      </div>
                    </div>
  
                    {/* Promotion Content */}
                    <div className="p-4">
                      <div className={`rounded-2xl overflow-hidden shadow-lg ${
                        formData.layoutStyle === 'full' ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-white'
                      } border-2 border-gray-100`}>
                        <div className={`flex ${
                          formData.layoutStyle === 'half' ? 'flex-row' : 'flex-col'
                        } ${formData.layoutStyle === 'text_only' ? 'p-6' : ''}`}>
                          {/* Image Section */}
                          {formData.layoutStyle !== 'text_only' && (
                            <div className={`${formData.layoutStyle === 'half' ? 'w-1/2' : 'w-full'} relative`}>
                              {selectedImagePreviews.length > 0 || formData.imageUrl ? (
                                <img
                                  src={selectedImagePreviews[0] || formData.imageUrl}
                                  alt="Preview"
                                  className={`w-full object-cover ${
                                    formData.layoutStyle === 'half' ? 'h-48 rounded-l-2xl' : 'h-56'
                                  }`}
                                />
                              ) : (
                                <div className={`w-full ${
                                  formData.layoutStyle === 'half' ? 'h-48' : 'h-56'
                                } bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
                                  <div className="text-center">
                                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Upload banner</p>
                                  </div>
                                </div>
                              )}
                              {/* Gradient Overlay for full banner */}
                              {formData.layoutStyle === 'full' && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              )}
                            </div>
                          )}
  
                          {/* Text Section */}
                          <div 
                            className={`${
                              formData.layoutStyle === 'half' ? 'w-1/2' : 'w-full'
                            } ${
                              formData.layoutStyle === 'full' ? 'absolute inset-0 flex flex-col justify-end' : ''
                            } p-5`}
                            style={{ 
                              textAlign: formData.textAlignment as 'left' | 'center' | 'right',
                              fontFamily: formData.fontFamily as 'Poppins' | 'Roboto' | 'Montserrat' | 'Lato'
                            }}
                          >
                            {/* Promotion Type Badge */}
                            <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${
                              formData.layoutStyle === 'full' ? 'bg-white/90 text-gray-900' : 'bg-emerald-100 text-emerald-700'
                            }`} style={{ 
                              justifyContent: formData.textAlignment === 'center' ? 'center' : 
                                             formData.textAlignment === 'right' ? 'flex-end' : 'flex-start',
                              display: 'inline-flex'
                            }}>
                              <span>{promotionTypes.find(t => t.value === formData.promotionType)?.icon}</span>
                              <span>{promotionTypes.find(t => t.value === formData.promotionType)?.label}</span>
                            </div>
  
                            {/* Title */}
                            <h3 
                              className={`font-bold mb-2 line-clamp-2 ${
                                formData.fontSize === 'lg' ? 'text-xl' : 
                                formData.fontSize === 'sm' ? 'text-sm' : 'text-base'
                              } ${formData.layoutStyle === 'full' ? 'text-white drop-shadow-lg' : ''}`}
                              style={{ color: formData.layoutStyle === 'full' ? '#fff' : formData.textColor }}
                            >
                              {formData.title || 'Your Promotion Title Here'}
                            </h3>
  
                            {/* Description */}
                            <p 
                              className={`mb-4 line-clamp-3 ${
                                formData.fontSize === 'lg' ? 'text-sm' : 
                                formData.fontSize === 'sm' ? 'text-xs' : 'text-xs'
                              } ${formData.layoutStyle === 'full' ? 'text-white/90 drop-shadow' : 'text-gray-600'}`}
                              style={{ 
                                color: formData.layoutStyle === 'full' ? 'rgba(255,255,255,0.9)' : formData.textColor,
                                opacity: formData.layoutStyle === 'full' ? 1 : 0.8 
                              }}
                            >
                              {formData.description || 'Add a compelling description to attract customers and explain your promotion details...'}
                            </p>
  
                            {/* CTA Button */}
                            <button 
                              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                              style={{ 
                                fontSize: formData.fontSize === 'sm' ? '0.75rem' : 
                                         formData.fontSize === 'lg' ? '0.9rem' : '0.8rem',
                                alignSelf: formData.textAlignment === 'center' ? 'center' : 
                                          formData.textAlignment === 'right' ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <span>{formData.buttonText || 'Shop Now'}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
  
                            {/* Dates */}
                            {formData.startDate && formData.endDate && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <span>→</span>
                                  <div className="flex items-center space-x-1">
                                    <span>{new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
  
                  </div>
  
                  {/* Home Indicator */}
                  <div className="h-6 flex items-center justify-center">
                    <div className="w-32 h-1.5 bg-gray-800 rounded-full"></div>
                  </div>
                </div>
              </div>
  
              {/* Preview Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-blue-900 mb-1">Preview Tips</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Changes update in real-time</li>
                      <li>• Try different layouts to see what works best</li>
                      <li>• Full banner overlays text on the image</li>
                      <li>• Half layout splits image and text side-by-side</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Footer Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-4 border-t-2 border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-600">
            {editingPromotion ? (
              <span className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Editing promotion</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Creating new promotion</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
                setSelectedImagePreviewUrl(null);
                setSelectedImageFile(null);
                selectedImagePreviews.forEach(url => URL.revokeObjectURL(url));
                setSelectedImagePreviews([]);
                setSelectedImageFiles([]);
                setShowCreateModal(false);
                setError(null);
              }}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePromotion}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{editingPromotion ? 'Update Promotion' : 'Create Promotion'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => {
    if (!viewingPromotion) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{viewingPromotion.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPromotion.status)}`}>
                {viewingPromotion.status}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{viewingPromotion.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                <p className="text-gray-600">{formatDate(viewingPromotion.startDate)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">End Date</h4>
                <p className="text-gray-600">{formatDate(viewingPromotion.endDate)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                <p className="text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPromotionTypeColor(viewingPromotion.promotionType)}`}>
                    {getPromotionTypeInfo(viewingPromotion.promotionType).icon} {getPromotionTypeInfo(viewingPromotion.promotionType).label}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Engagement</h4>
                <p className="text-gray-600">
                  {viewingPromotion.totalViews} views • {viewingPromotion.totalClicks} clicks
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Channels</h4>
              <div className="flex space-x-4">
                {viewingPromotion.showOnPWA && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">PWA</span>
                  </div>
                )}
                {viewingPromotion.shareToFacebook && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">Facebook</span>
                  </div>
                )}
              </div>
            </div>
            
            {viewingPromotion.imageUrl && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Promotion Image</h4>
                <img 
                  src={viewingPromotion.imageUrl} 
                  alt="Promotion" 
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={() => setViewingPromotion(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promotions & Announcements</h2>
          <p className="text-gray-600">Create and manage announcements for new items, restocks, and events</p>
        </div>
        <button 
          onClick={handleCreatePromotion}
          disabled={loading}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-gray-600">Loading promotions...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {promotion.imageUrl && (
                        <img 
                          src={promotion.imageUrl} 
                          alt="Promotion" 
                          className="w-12 h-8 object-cover rounded border border-gray-200"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{promotion.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{promotion.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created by {promotion.createdBy} • {formatDate(promotion.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPromotionTypeColor(promotion.promotionType)}`}>
                      {getPromotionTypeInfo(promotion.promotionType).icon} {getPromotionTypeInfo(promotion.promotionType).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(promotion.startDate)}</div>
                    <div className="text-sm text-gray-500">to {formatDate(promotion.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(promotion.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(promotion.status)}`}>
                        {promotion.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {promotion.showOnPWA && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Smartphone className="w-4 h-4" />
                          <span className="text-xs">PWA</span>
                        </div>
                      )}
                      {promotion.shareToFacebook && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Facebook className="w-4 h-4" />
                          <span className="text-xs">FB</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.totalViews} views
                    </div>
                    <div className="text-sm text-gray-500">
                      {promotion.totalClicks} clicks
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setViewingPromotion(promotion)}
                        className="text-emerald-600 hover:text-emerald-900" 
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPromotion(promotion)}
                        className="text-blue-600 hover:text-blue-900" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {promotion.shareToFacebook && (
                        <button 
                          onClick={() => console.log('Share to Facebook:', promotion.id)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Share to Facebook"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePromotion(promotion.id)}
                        className="text-red-600 hover:text-red-900" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPromotions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new announcement.</p>
          <button 
            onClick={handleCreatePromotion}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCreateEditModal()}
      {viewingPromotion && renderViewModal()}
    </div>
  );
};

export default PromotionsManagement;
