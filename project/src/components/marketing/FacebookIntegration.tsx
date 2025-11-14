import React, { useState } from 'react';
import {
  Facebook,
  RefreshCw,
  Link,
  XCircle,
  CheckCircle,
  Upload,
  PlayCircle,
  Eye,
  Trash2,
  Radio
} from 'lucide-react';

interface FacebookConnection {
  connected: boolean;
  pageName: string | null;
  pageId: string | null;
  accessToken: string | null;
  lastPostedPromotion?: {
    promotionTitle: string;
    postedAt: string;
    status: 'success' | 'failed';
    facebookUrl?: string;
  };
}

interface RecentFacebookPost {
  id: string;
  promotionTitle: string;
  postedAt: string;
  status: 'success' | 'failed';
  facebookUrl?: string;
}

const mockRecentPosts: RecentFacebookPost[] = [
  {
    id: 'fb-post-001',
    promotionTitle: 'New Hybrid Seeds — Limited Stocks',
    postedAt: 'Jan 22, 2025 09:45 AM',
    status: 'success',
    facebookUrl: 'https://facebook.com/posts/123456789'
  },
  {
    id: 'fb-post-002',
    promotionTitle: 'Community Vet Day Announcement',
    postedAt: 'Jan 20, 2025 02:20 PM',
    status: 'success',
    facebookUrl: 'https://facebook.com/posts/987654321'
  },
  {
    id: 'fb-post-003',
    promotionTitle: 'Bulk Fertilizer Restock Available',
    postedAt: 'Jan 18, 2025 11:10 AM',
    status: 'failed'
  }
];

const FacebookIntegration: React.FC = () => {
  const [connection, setConnection] = useState<FacebookConnection>({
    connected: true,
    pageName: 'Tiongson Agrivet Official',
    pageId: '123456789012345',
    accessToken: 'EAABwzLixnjYBO...',
    lastPostedPromotion: mockRecentPosts[0]
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [autoShowToggle, setAutoShowToggle] = useState(true);
  const [recentPosts, setRecentPosts] = useState<RecentFacebookPost[]>(mockRecentPosts);
  const [selectedPromotion, setSelectedPromotion] = useState<string | null>(null);
  const [testPostStatus, setTestPostStatus] = useState<string | null>(null);

  const availablePromotions = [
    { id: 'promo-001', title: 'Dry Season Starter Bundle', scheduled: 'Jan 25, 2025' },
    { id: 'promo-002', title: 'Community Giveaway Event', scheduled: 'Feb 01, 2025' },
    { id: 'promo-003', title: 'Summer Agri Expo', scheduled: 'Mar 10, 2025' }
  ];

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConnection({
        connected: true,
        pageName: 'Tiongson Agrivet Official',
        pageId: '123456789012345',
        accessToken: 'EAABwzLixnjYBO...'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnection({
      connected: false,
      pageName: null,
      pageId: null,
      accessToken: null
    });
  };

  const handleTestPost = async () => {
    if (!connection.connected) {
      setTestPostStatus('Please connect your Facebook page first.');
      return;
    }
    setIsPosting(true);
    setTestPostStatus(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setTestPostStatus('Test post sent successfully (check Drafts in Facebook).');
    } catch (error) {
      setTestPostStatus('Failed to send test post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostPromotion = async () => {
    if (!selectedPromotion) {
      setTestPostStatus('Select a promotion to post.');
      return;
    }
    if (!connection.connected) {
      setTestPostStatus('Please connect your Facebook page first.');
      return;
    }

    setIsPosting(true);
    setTestPostStatus(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const promotion = availablePromotions.find(p => p.id === selectedPromotion);
      if (!promotion) return;

      const newPost: RecentFacebookPost = {
        id: `fb-post-${Date.now()}`,
        promotionTitle: promotion.title,
        postedAt: new Date().toLocaleString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }),
        status: 'success',
        facebookUrl: 'https://facebook.com/posts/newly-created-post'
      };

      setRecentPosts(prev => [newPost, ...prev].slice(0, 5));
      setConnection(prev => ({
        ...prev,
        lastPostedPromotion: {
          promotionTitle: promotion.title,
          postedAt: newPost.postedAt,
          status: 'success',
          facebookUrl: newPost.facebookUrl
        }
      } as FacebookConnection));
      setTestPostStatus('Promotion posted to Facebook successfully!');
    } catch (error) {
      const promotion = availablePromotions.find(p => p.id === selectedPromotion);
      if (promotion) {
        const failedPost: RecentFacebookPost = {
          id: `fb-post-${Date.now()}`,
          promotionTitle: promotion.title,
          postedAt: new Date().toLocaleString('en-PH'),
          status: 'failed'
        };
        setRecentPosts(prev => [failedPost, ...prev].slice(0, 5));
      }
      setTestPostStatus('Failed to post promotion. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facebook Integration</h2>
          <p className="text-gray-600">Allow the owner to easily post promotions to Facebook with one click.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => connection.connected ? handleDisconnect() : handleConnect()}
            disabled={isConnecting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white ${connection.connected ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
          >
            {connection.connected ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <Facebook className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Page'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
            <p className="text-sm text-gray-500">Basic connection details for the official Facebook page.</p>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${connection.connected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {connection.connected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{connection.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {connection.connected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="text-xs uppercase text-gray-500">Page Name</p>
              <p className="text-gray-900 font-semibold">{connection.pageName}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Page ID</p>
              <p className="font-mono">{connection.pageId}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Access Token</p>
              <p className="font-mono truncate">{connection.accessToken}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">Connect your Facebook page to start posting promotions.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Auto-Show Promotions</h3>
            <button
              onClick={() => setAutoShowToggle(prev => !prev)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${autoShowToggle ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
            >
              <Radio className="w-3 h-3" />
              <span>{autoShowToggle ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>
          <p className="text-sm text-gray-500">Automatically show promotions on both the landing page and Facebook when published.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Test Connection</h3>
          <p className="text-sm text-gray-500">Use this to confirm the page connection before posting live promotions.</p>
          <button
            onClick={handleTestPost}
            disabled={isPosting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isPosting ? 'Sending...' : 'Send Test Post'}</span>
          </button>
          {testPostStatus && (
            <p className="text-xs text-gray-500">{testPostStatus}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Post Promotion</h3>
          <div className="space-y-2">
            <label className="block text-xs uppercase text-gray-500">Select Promotion</label>
            <select
              value={selectedPromotion ?? ''}
              onChange={(e) => setSelectedPromotion(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a promotion</option>
              {availablePromotions.map(promo => (
                <option key={promo.id} value={promo.id}>
                  {promo.title} • {promo.scheduled}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePostPromotion}
            disabled={isPosting}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isPosting ? 'Posting...' : 'Post Promotion to Facebook'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Last Posted Promotion</h3>
            <Link className="w-4 h-4 text-gray-400" />
          </div>
          {connection.lastPostedPromotion ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{connection.lastPostedPromotion.promotionTitle}</p>
              <p className="text-xs text-gray-500">Posted: {connection.lastPostedPromotion.postedAt}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${connection.lastPostedPromotion.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {connection.lastPostedPromotion.status === 'success' ? 'Success' : 'Failed'}
                </span>
                {connection.lastPostedPromotion.facebookUrl && (
                  <a
                    href={connection.lastPostedPromotion.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on Facebook
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No promotions posted yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Facebook Posts</h3>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts yet.</p>
            ) : (
              recentPosts.slice(0, 5).map(post => (
                <div key={post.id} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{post.promotionTitle}</p>
                    <p className="text-xs text-gray-500">{post.postedAt}</p>
                    {post.facebookUrl && (
                      <a
                        href={post.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View post
                      </a>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${post.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {post.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookIntegration;
