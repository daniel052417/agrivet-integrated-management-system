import React, { useState, useEffect, DragEvent } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Upload,
  Move,
  Calendar,
  Layers,
  ToggleRight,
  ToggleLeft,
  Pin,
  PinOff,
  PlayCircle,
  PauseCircle,
  Activity
} from 'lucide-react';
import {
  PromotionsManagementService,
  Promotion,
  CreatePromotionData,
  PromotionBranchRow,
  PromotionImageRow
} from '../../lib/promotionsManagementService';

interface PromotionFormState {
  title: string;
  description: string;
  category: 'new_arrival' | 'restock' | 'announcement';
  startDate: string;
  endDate: string;
  branches: string[];
  showOnLandingPage: boolean;
  showOnPWA: boolean;
  pinToTop: boolean;
  autoEnd: boolean;
  slideshowAutoPlay: boolean;
  slideshowSpeed: number;
  images: Array<{ id: string; url: string; file?: File }>;
}

const emptyForm: PromotionFormState = {
  title: '',
  description: '',
  category: 'new_arrival',
  startDate: '',
  endDate: '',
  branches: [],
  showOnLandingPage: true,
  showOnPWA: true,
  pinToTop: false,
  autoEnd: true,
  slideshowAutoPlay: true,
  slideshowSpeed: 5000,
  images: []
};

const mapPromotionTypeFromServer = (type: string | undefined): PromotionFormState['category'] => {
  switch (type) {
    case 'new_item':
      return 'new_arrival';
    case 'event':
      return 'announcement';
    case 'restock':
    default:
      return 'restock';
  }
};

const mapPromotionTypeToServer = (type: PromotionFormState['category']): 'restock' | 'new_item' | 'event' => {
  switch (type) {
    case 'new_arrival':
      return 'new_item';
    case 'announcement':
      return 'event';
    case 'restock':
    default:
      return 'restock';
  }
};

interface BranchOption {
  id: string;
  name: string;
}

interface PromotionRecord {
  id: string;
  title: string;
  description: string;
  category: PromotionFormState['category'];
  startDate: string;
  endDate: string;
  branches: string[];
  branchNames: string[];
  showOnLandingPage: boolean;
  showOnPWA: boolean;
  pinToTop: boolean;
  autoEnd: boolean;
  slideshowAutoPlay: boolean;
  slideshowSpeed: number;
  imageUrls: string[];
  viewCount: number;
  clickCount: number;
  createdAt?: string;
}

const toComponentPromotion = (promotion: Promotion): PromotionRecord => {
  const extra = promotion as any;
  const branchRows = (extra.promotion_branches || []) as PromotionBranchRow[];
  const branchIds = branchRows
    .map(row => row.branch_id || row.branch?.id)
    .filter((value): value is string => Boolean(value));
  const branchNames = branchRows
    .map(row => row.branch?.name)
    .filter((value): value is string => Boolean(value));
  const imageRows = ((extra.promotion_images || []) as PromotionImageRow[]).sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const imageUrls = imageRows
    .map(row => row.image_url)
    .filter((value): value is string => Boolean(value));

  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description,
    category: mapPromotionTypeFromServer(promotion.promotion_type) ?? 'restock',
    startDate: promotion.start_date ?? '',
    endDate: promotion.end_date ?? '',
    branches: branchIds,
    branchNames,
    showOnLandingPage: promotion.show_on_landing_page ?? true,
    showOnPWA: promotion.show_on_pwa ?? true,
    pinToTop: promotion.pin_to_top ?? false,
    autoEnd: promotion.auto_end ?? true,
    slideshowAutoPlay: promotion.slideshow_autoplay ?? true,
    slideshowSpeed: promotion.slideshow_speed ?? 5000,
    imageUrls: imageUrls.length > 0 ? imageUrls : (promotion.image_url ? [promotion.image_url] : []),
    viewCount: promotion.total_views ?? 0,
    clickCount: promotion.total_clicks ?? 0,
    createdAt: promotion.created_at
  };
};

const toPayload = (form: PromotionFormState): CreatePromotionData & Record<string, any> => ({
  title: form.title,
  description: form.description,
  promotion_type: mapPromotionTypeToServer(form.category),
  start_date: form.startDate,
  end_date: form.endDate,
  branches: form.branches,
  show_on_landing_page: form.showOnLandingPage,
  show_on_pwa: form.showOnPWA,
  pin_to_top: form.pinToTop,
  auto_end: form.autoEnd,
  slideshow_autoplay: form.slideshowAutoPlay,
  slideshow_speed: form.slideshowSpeed,
  share_to_facebook: false
});

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionFormState>(emptyForm);
  const [editingPromotion, setEditingPromotion] = useState<PromotionRecord | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      const { data, error } = await PromotionsManagementService.getBranches();
      if (error) {
        console.error('Error loading branches:', error);
        return;
      }
      setBranchOptions(data);
    };

    loadBranches();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await PromotionsManagementService.getPromotions({});
      if (error) {
        console.error('Error loading promotions:', error);
        setError('Failed to load promotions');
        return;
      }
      setPromotions(data.map(toComponentPromotion));
    } catch (err) {
      console.error('Error loading promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPromotion(null);
    setShowModal(false);
    setDraggedImageId(null);
  };

  const handleBranchToggle = (branchId: string) => {
    setForm(prev => {
      const exists = prev.branches.includes(branchId);
      return {
        ...prev,
        branches: exists ? prev.branches.filter(b => b !== branchId) : [...prev.branches, branchId]
      };
    });
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const uploads = Array.from(files).map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      url: URL.createObjectURL(file),
      file
    }));
    setForm(prev => ({ ...prev, images: [...prev.images, ...uploads] }));
  };

  const handleImageRemove = (id: string) => {
    setForm(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedImageId(id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    if (!draggedImageId || draggedImageId === id) return;
    setForm(prev => {
      const images = [...prev.images];
      const fromIndex = images.findIndex(img => img.id === draggedImageId);
      const toIndex = images.findIndex(img => img.id === id);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return { ...prev, images };
    });
  };

  const handleDragEnd = () => {
    setDraggedImageId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError('Start and end dates are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = toPayload(form);

      const collectImageUrls = async (promotionId: string) => {
        const urls: string[] = [];
        for (let index = 0; index < form.images.length; index++) {
          const image = form.images[index];
          if (image.file) {
            const { data, error } = await PromotionsManagementService.uploadPromotionImage(
              image.file,
              `${promotionId}/carousel/${index}`
            );
            if (!error && data) {
              urls.push(data);
            } else {
              console.error('Error uploading promotion image:', error);
              setError(error?.message || 'Failed to upload image.');
            }
          } else if (image.url) {
            urls.push(image.url);
          }
        }
        return urls;
      };

      if (editingPromotion) {
        const promotionId = editingPromotion.id;
        const imageUrls = await collectImageUrls(promotionId);
        const res = await PromotionsManagementService.updatePromotion({
          id: promotionId,
          ...payload,
          image_urls: imageUrls
        } as any);
        if (res.error) {
          setError(res.error.message || 'Failed to update promotion');
          return;
        }
      } else {
        const createRes = await PromotionsManagementService.createPromotion({
          ...payload,
          image_urls: []
        } as any);
        if (createRes.error || !createRes.data) {
          setError(createRes.error?.message || 'Failed to create promotion');
          return;
        }
        const promotionId = createRes.data.id;
        const imageUrls = await collectImageUrls(promotionId);
        if (imageUrls.length > 0 || form.images.length === 0) {
          const syncRes = await PromotionsManagementService.updatePromotion({
            id: promotionId,
            branches: form.branches,
            image_urls: imageUrls
          } as any);
          if (syncRes.error) {
            setError(syncRes.error.message || 'Failed to update promotion media');
            return;
          }
        }
      }

      await loadPromotions();
      resetForm();
    } catch (err) {
      console.error('Error saving promotion:', err);
      setError('Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promotion: PromotionRecord) => {
    setEditingPromotion(promotion);
    setForm({
      title: promotion.title,
      description: promotion.description,
      category: promotion.category,
      startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : '',
      endDate: promotion.endDate ? promotion.endDate.slice(0, 10) : '',
      branches: promotion.branches || [],
      showOnLandingPage: promotion.showOnLandingPage,
      showOnPWA: promotion.showOnPWA,
      pinToTop: promotion.pinToTop,
      autoEnd: promotion.autoEnd,
      slideshowAutoPlay: promotion.slideshowAutoPlay,
      slideshowSpeed: promotion.slideshowSpeed,
      images: (promotion.imageUrls || []).map((url, index) => ({
        id: `${promotion.id}-img-${index}`,
        url
      }))
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const { error } = await PromotionsManagementService.deletePromotion(id);
      if (error) {
        setError('Failed to delete promotion');
        return;
      }
      await loadPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError('Failed to delete promotion');
    }
  };

  const filteredPromotions = promotions.filter(promotion =>
    promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promotions & Announcements</h2>
          <p className="text-gray-600">Manage promotional images and announcements for restocked/new items and show them on the landing page & PWA.</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingPromotion(null);
            setError(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search promotions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="py-12 flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-gray-600">Loading promotions...</span>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No promotions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.map(promotion => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{promotion.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-2">{promotion.description}</div>
                        <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {promotion.category.replace('_', ' ')}
                        </div>
                        {promotion.branchNames.length > 0 && (
                          <div className="text-xs text-gray-400">
                            Branches: {promotion.branchNames.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{promotion.startDate?.slice(0, 10) || '—'} → {promotion.endDate?.slice(0, 10) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${promotion.showOnLandingPage ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                          {promotion.showOnLandingPage ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          <span>Landing Page</span>
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${promotion.showOnPWA ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                          {promotion.showOnPWA ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          <span>PWA</span>
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${promotion.pinToTop ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                          {promotion.pinToTop ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                          <span>Pin to Top</span>
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${promotion.autoEnd ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>
                          <span>Auto-end</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span>{promotion.viewCount}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span>{promotion.clickCount}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => handleEdit(promotion)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => window.alert('Preview coming soon')} className="text-emerald-600 hover:text-emerald-900" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(promotion.id)} className="text-red-600 hover:text-red-900" title="Delete">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
                </h3>
                <p className="text-sm text-gray-500">Keep details concise—only what you need for landing page & PWA.</p>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <Trash2 className="w-5 h-5 transform rotate-45" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Promotion title"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Brief description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as PromotionFormState['category'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 capitalize"
                    >
                      <option value="new_arrival">New Arrival</option>
                      <option value="restock">Restock</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Branches</label>
                    <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-36 overflow-y-auto">
                      {branchOptions.length === 0 ? (
                        <p className="text-xs text-gray-500">No branches available.</p>
                      ) : (
                        branchOptions.map(branch => (
                          <label key={branch.id} className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={form.branches.includes(branch.id)}
                              onChange={() => handleBranchToggle(branch.id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{branch.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.showOnLandingPage}
                      onChange={(e) => setForm(prev => ({ ...prev, showOnLandingPage: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Show on Landing Page</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.showOnPWA}
                      onChange={(e) => setForm(prev => ({ ...prev, showOnPWA: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Show on PWA</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.pinToTop}
                      onChange={(e) => setForm(prev => ({ ...prev, pinToTop: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Pin to Top</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.autoEnd}
                      onChange={(e) => setForm(prev => ({ ...prev, autoEnd: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Auto-end when expired</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Slideshow Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={form.slideshowAutoPlay}
                        onChange={(e) => setForm(prev => ({ ...prev, slideshowAutoPlay: e.target.checked }))}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Auto-play carousel</span>
                    </label>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500">Carousel Speed (ms)</label>
                      <input
                        type="number"
                        min={1000}
                        step={500}
                        value={form.slideshowSpeed}
                        disabled={!form.slideshowAutoPlay}
                        onChange={(e) => setForm(prev => ({ ...prev, slideshowSpeed: parseInt(e.target.value || '0', 10) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Promotion Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                    <input
                      id="promotion-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <label htmlFor="promotion-images" className="cursor-pointer">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-10 h-10 text-emerald-600" />
                        <p className="text-sm text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-400">PNG or JPG up to 5MB • Multiple allowed</p>
                      </div>
                    </label>
                  </div>

                  {form.images.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">Drag images to reorder the carousel sequence.</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {form.images.map(image => (
                          <div
                            key={image.id}
                            className={`relative border-2 rounded-lg overflow-hidden ${draggedImageId === image.id ? 'border-emerald-500' : 'border-gray-200'}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, image.id)}
                            onDragOver={(e) => handleDragOver(e, image.id)}
                            onDragEnd={handleDragEnd}
                          >
                            <img src={image.url} alt="Promotion" className="w-full h-32 object-cover" />
                            <div className="absolute top-2 left-2 bg-white/80 rounded-full p-1 text-xs text-gray-600 flex items-center space-x-1">
                              <Move className="w-3 h-3" />
                              <span>Drag</span>
                            </div>
                            <button
                              onClick={() => handleImageRemove(image.id)}
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 rounded-full p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Preview</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">Landing Page Preview</span>
                      {form.slideshowAutoPlay ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                        {form.images[0] ? (
                          <img src={form.images[0].url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-sm text-gray-400">No image selected</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{form.title || 'Promotion title'}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{form.description || 'Promotion description preview'}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                          <Layers className="w-3 h-3" />
                          <span>{form.category.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Landing Page: {form.showOnLandingPage ? 'Visible' : 'Hidden'}</p>
                    <p>PWA: {form.showOnPWA ? 'Visible' : 'Hidden'}</p>
                    <p>Carousel speed: {form.slideshowAutoPlay ? `${form.slideshowSpeed / 1000}s` : 'Manual'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{editingPromotion ? 'Update Promotion' : 'Create Promotion'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManagement;
