import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface PerformanceGoal {
  id: string;
  employee_id: string;
  employee_name: string;
  title: string;
  description: string;
  category: 'performance' | 'development' | 'behavioral' | 'quantitative';
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'on_track' | 'at_risk' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress_percentage: number;
  notes?: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  employee_name: string;
  reviewer_id: string;
  reviewer_name: string;
  review_type: 'annual' | 'quarterly' | 'probation' | 'promotion' | 'exit';
  review_date: string;
  next_review_date: string;
  overall_rating: number;
  performance_summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  goals_for_next_period: string[];
  recommendations: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'completed';
  employee_comments?: string;
  hr_comments?: string;
}

interface Feedback360 {
  id: string;
  employee_id: string;
  employee_name: string;
  feedback_provider_id: string;
  feedback_provider_name: string;
  provider_role: 'peer' | 'subordinate' | 'supervisor' | 'client' | 'stakeholder';
  feedback_date: string;
  rating: number;
  feedback_text: string;
  categories: string[];
  is_anonymous: boolean;
  status: 'pending' | 'submitted' | 'reviewed';
}

const PerformanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews' | 'feedback'>('goals');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Mock data
  const [goals, setGoals] = useState<PerformanceGoal[]>([
    {
      id: '1',
      employee_id: 'emp001',
      employee_name: 'John Smith',
      title: 'Increase Sales Performance',
      description: 'Achieve 20% increase in monthly sales compared to last year',
      category: 'quantitative',
      target_value: 20,
      current_value: 15,
      unit: '%',
      start_date: '2024-01-01',
      target_date: '2024-12-31',
      status: 'on_track',
      priority: 'high',
      progress_percentage: 75,
      notes: 'Strong performance in Q1 and Q2'
    },
    {
      id: '2',
      employee_id: 'emp002',
      employee_name: 'Sarah Johnson',
      title: 'Complete Advanced Training',
      description: 'Complete leadership development program and obtain certification',
      category: 'development',
      start_date: '2024-03-01',
      target_date: '2024-08-31',
      status: 'in_progress',
      priority: 'medium',
      progress_percentage: 40,
      notes: 'Enrolled in program, attending weekly sessions'
    }
  ]);

  const [reviews, setReviews] = useState<PerformanceReview[]>([
    {
      id: '1',
      employee_id: 'emp001',
      employee_name: 'John Smith',
      reviewer_id: 'mgr001',
      reviewer_name: 'Mike Wilson',
      review_type: 'annual',
      review_date: '2024-01-15',
      next_review_date: '2025-01-15',
      overall_rating: 4.2,
      performance_summary: 'Excellent performance with strong sales results and team collaboration',
      strengths: ['Sales expertise', 'Team leadership', 'Customer focus'],
      areas_for_improvement: ['Time management', 'Documentation'],
      goals_for_next_period: ['Increase team productivity', 'Improve reporting processes'],
      recommendations: ['Consider promotion to Senior Sales Manager', 'Attend time management workshop'],
      status: 'approved'
    }
  ]);

  const [feedback360, setFeedback360] = useState<Feedback360[]>([
    {
      id: '1',
      employee_id: 'emp001',
      employee_name: 'John Smith',
      feedback_provider_id: 'peer001',
      feedback_provider_name: 'Lisa Chen',
      provider_role: 'peer',
      feedback_date: '2024-01-10',
      rating: 4.5,
      feedback_text: 'John is an excellent team player who always supports colleagues and shares knowledge',
      categories: ['Teamwork', 'Knowledge sharing', 'Supportiveness'],
      is_anonymous: false,
      status: 'reviewed'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'on_track':
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'at_risk':
      case 'draft':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Performance Goals</h3>
        <button
          onClick={() => setShowGoalModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      <div className="grid gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-lg">{goal.title}</h4>
                <p className="text-gray-600 text-sm">{goal.employee_name}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                  {goal.priority}
                </span>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{goal.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium capitalize">{goal.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-medium">{goal.progress_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Date</p>
                <p className="font-medium">{new Date(goal.target_date).toLocaleDateString()}</p>
              </div>
              {goal.target_value && (
                <div>
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="font-medium">{goal.target_value}{goal.unit}</p>
                </div>
              )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${goal.progress_percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {goal.start_date} - {goal.target_date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Performance Reviews</h3>
        <button
          onClick={() => setShowReviewModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} />
          Schedule Review
        </button>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-lg">{review.employee_name}</h4>
                <p className="text-gray-600 text-sm">Reviewed by {review.reviewer_name}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                  {review.status}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={16} className={`${getRatingColor(review.overall_rating)} fill-current`} />
                  <span className="font-medium">{review.overall_rating}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Review Type</p>
                <p className="font-medium capitalize">{review.review_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Review Date</p>
                <p className="font-medium">{new Date(review.review_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Review</p>
                <p className="font-medium">{new Date(review.next_review_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{review.status}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Performance Summary</p>
                <p className="text-gray-600">{review.performance_summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Strengths</p>
                  <ul className="text-sm text-gray-600">
                    {review.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-600" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Areas for Improvement</p>
                  <ul className="text-sm text-gray-600">
                    {review.areas_for_improvement.map((area, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-600" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Eye size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {review.review_type} Review
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeedback360 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">360° Feedback</h3>
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} />
          Request Feedback
        </button>
      </div>

      <div className="grid gap-4">
        {feedback360.map((feedback) => (
          <div key={feedback.id} className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-lg">{feedback.employee_name}</h4>
                <p className="text-gray-600 text-sm">
                  Feedback from {feedback.feedback_provider_name} ({feedback.provider_role})
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                  {feedback.status}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={16} className={`${getRatingColor(feedback.rating)} fill-current`} />
                  <span className="font-medium">{feedback.rating}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">{feedback.feedback_text}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {feedback.categories.map((category, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {category}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Provider Role</p>
                <p className="font-medium capitalize">{feedback.provider_role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Feedback Date</p>
                <p className="font-medium">{new Date(feedback.feedback_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Anonymous</p>
                <p className="font-medium">{feedback.is_anonymous ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{feedback.status}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye size={16} />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <CheckCircle size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {feedback.is_anonymous ? 'Anonymous Feedback' : 'Named Feedback'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Management</h1>
          <p className="text-gray-600">Manage employee performance goals, reviews, and 360° feedback</p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900">{goals.filter(g => g.status !== 'completed').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(reviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviews.length || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.filter(r => r.status === 'draft' || r.status === 'submitted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Feedback Received</p>
                <p className="text-2xl font-bold text-gray-900">{feedback360.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'goals', label: 'Performance Goals', icon: Target },
                { id: 'reviews', label: 'Performance Reviews', icon: Star },
                { id: 'feedback', label: '360° Feedback', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'goals' && renderGoals()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'feedback' && renderFeedback360()}
          </div>
        </div>
      </div>

      {/* Modals would go here - simplified for now */}
    </div>
  );
};

export default PerformanceManagement;

