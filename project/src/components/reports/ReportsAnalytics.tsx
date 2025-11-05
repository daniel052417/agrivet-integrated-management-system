import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  Download, 
  FileText, 
  Activity, 
  Target, 
  Clock, 
  X, 
  AlertCircle, 
  Loader2,
  Search,
  Info,
  Filter,
  ChevronDown
} from 'lucide-react';
import { reportsService, ReportDefinition, GeneratedReport } from '../../lib/reportsService';

interface ReportItem {
  id?: string;
  name: string;
  description: string;
  lastGenerated: string | null;
  size: string;
  reportKey: string;
  definition?: ReportDefinition;
  lastReport?: GeneratedReport;
}

const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDefinitions, setReportDefinitions] = useState<ReportDefinition[]>([]);
  const [generatedReports, setGeneratedReports] = useState<Record<string, GeneratedReport[]>>({});
  const [categoryMetrics, setCategoryMetrics] = useState<Record<string, any>>({});
  const [summaryStats, setSummaryStats] = useState({
    totalReports: 0,
    generatedToday: 0,
    totalSize: 0,
    avgGenerationTime: 0
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState<string>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterShowDownloadable, setFilterShowDownloadable] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [generateParams, setGenerateParams] = useState({
    dateRangePreset: 'this_month' as 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom',
    dateRangeStart: '',
    dateRangeEnd: '',
    format: 'pdf' as 'pdf' | 'csv' | 'excel' | 'json'
  });

  // Category configuration
  const categoryConfig: Record<string, { 
    title: string; 
    icon: any; 
    color: string; 
    description: string;
    accentColor: string;
  }> = {
    sales: {
      title: 'Sales',
      icon: BarChart3,
      color: 'text-green-600',
      accentColor: 'border-green-500',
      description: 'Sales performance and revenue tracking'
    },
    inventory: {
      title: 'Inventory',
      icon: Package,
      color: 'text-blue-600',
      accentColor: 'border-blue-500',
      description: 'Stock levels and inventory analysis'
    },
    hr: {
      title: 'HR',
      icon: Users,
      color: 'text-purple-600',
      accentColor: 'border-purple-500',
      description: 'Employee performance and payroll'
    },
    financial: {
      title: 'Financial',
      icon: DollarSign,
      color: 'text-yellow-600',
      accentColor: 'border-yellow-500',
      description: 'Financial performance and P&L'}
    // },
    // marketing: {
    //   title: 'Marketing',
    //   icon: Target,
    //   color: 'text-pink-600',
    //   accentColor: 'border-pink-500',
    //   description: 'Campaign performance and ROI'
    // },
    // operational: {
    //   title: 'Operational',
    //   icon: Activity,
    //   color: 'text-indigo-600',
    //   accentColor: 'border-indigo-500',
    //   description: 'System performance and operations'
    // }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load report definitions
      const definitions = await reportsService.getReportDefinitions();
      setReportDefinitions(definitions);

      // Load category metrics
      const metrics = await reportsService.getCategoryMetrics();
      const metricsMap: Record<string, any> = {};
      metrics.forEach(m => {
        metricsMap[m.category] = m;
      });
      setCategoryMetrics(metricsMap);

      // Load summary stats
      const stats = await reportsService.getSummaryStats();
      setSummaryStats(stats);

      // Load recent generated reports for each report key (lazy load per category)
      const reportsMap: Record<string, GeneratedReport[]> = {};
      for (const def of definitions) {
        const reports = await reportsService.getGeneratedReports(def.report_key, 1);
        reportsMap[def.report_key] = reports;
      }
      setGeneratedReports(reportsMap);

    } catch (err: any) {
      console.error('Error loading reports data:', err);
      setError(err.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions - defined before useMemo hooks
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Get reports for active category
  const activeCategoryReports = useMemo(() => {
    const definitions = reportDefinitions.filter(d => d.category === activeTab);
    
    return definitions.map(def => {
      const lastReport = generatedReports[def.report_key]?.[0];
      return {
        id: def.id,
        name: def.report_name,
        description: def.description || '',
        lastGenerated: lastReport?.generated_at || null,
        size: formatFileSize(lastReport?.file_size || null),
        reportKey: def.report_key,
        definition: def,
        lastReport: lastReport
      };
    });
  }, [reportDefinitions, generatedReports, activeTab]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = activeCategoryReports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Show only downloadable filter
    if (filterShowDownloadable) {
      filtered = filtered.filter(r => r.lastReport !== undefined);
    }

    return filtered;
  }, [activeCategoryReports, searchTerm, filterShowDownloadable]);

  const handleGenerateReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    // Set default date range based on preset
    const now = new Date();
    const presetRanges = getPresetDateRange('this_month');
    setGenerateParams({
      dateRangePreset: 'this_month',
      dateRangeStart: presetRanges.start,
      dateRangeEnd: presetRanges.end,
      format: 'pdf'
    });
    setShowGenerateModal(true);
  };

  const handleDownloadReport = async (reportId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await reportsService.downloadReport(reportId);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      alert(err.message || 'Failed to download report');
    }
  };

  const handleConfirmGenerate = async () => {
    if (!selectedReport) return;

    try {
      setGeneratingReport(selectedReport.report_key);
      
      const params: any = {
        format: generateParams.format
      };
      
      if (generateParams.dateRangeStart) {
        params.dateRangeStart = generateParams.dateRangeStart;
      }
      if (generateParams.dateRangeEnd) {
        params.dateRangeEnd = generateParams.dateRangeEnd;
      }

      await reportsService.generateReport(selectedReport.report_key, params);
      
      alert('Report generated successfully!');
      setShowGenerateModal(false);
      await loadReportsData();
    } catch (err: any) {
      console.error('Error generating report:', err);
      alert(err.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setGenerateParams({ ...generateParams, dateRangePreset: 'custom' });
      return;
    }
    const ranges = getPresetDateRange(preset as any);
    setGenerateParams({
      ...generateParams,
      dateRangePreset: preset as any,
      dateRangeStart: ranges.start,
      dateRangeEnd: ranges.end
    });
  };

  const getPresetDateRange = (preset: 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        return { start: '', end: '' };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const activeCategoryMetrics = categoryMetrics[activeTab] || {
    totalReports: 0,
    lastGenerated: null,
    avgSize: '0 MB'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Reports</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadReportsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeConfig = categoryConfig[activeTab];

  return (
    <div className="reports-analytics">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and download comprehensive reports from your data</p>
      </div>

      {/* Simplified Summary Stats - 3 cards instead of 4 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Reports Generated</p>
                <p className="text-xl font-bold text-gray-900">
                  {summaryStats.generatedToday} <span className="text-sm font-normal text-gray-500">/ {summaryStats.totalReports}</span>
                </p>
                <p className="text-xs text-gray-500">Today / Total</p>
              </div>
            </div>
            <div className="text-right">
              <span title="Total reports generated in system">
                <Info className="w-4 h-4 text-gray-400" />
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Avg Generation</p>
                <p className="text-xl font-bold text-gray-900">{summaryStats.avgGenerationTime.toFixed(1)} min</p>
              </div>
            </div>
            <span title="Average time to generate reports">
              <Info className="w-4 h-4 text-gray-400" />
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Download className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Size</p>
                <p className="text-xl font-bold text-gray-900">{summaryStats.totalSize.toFixed(1)} MB</p>
              </div>
            </div>
            <span title="Total storage used by all reports">
              <Info className="w-4 h-4 text-gray-400" />
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {Object.keys(categoryConfig).map((categoryKey) => {
              const config = categoryConfig[categoryKey];
              const isActive = activeTab === categoryKey;
              return (
                <button
                  key={categoryKey}
                  onClick={() => setActiveTab(categoryKey)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                    isActive
                      ? `${config.accentColor} border-b-2 text-gray-900 font-medium`
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <config.icon className={`w-5 h-5 ${isActive ? config.color : ''}`} />
                  <span>{config.title}</span>
                  {categoryMetrics[categoryKey]?.totalReports > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {categoryMetrics[categoryKey].totalReports}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${
                showFilters ? 'bg-gray-100' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterShowDownloadable}
                  onChange={(e) => setFilterShowDownloadable(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show only downloadable reports</span>
              </label>
            </div>
          )}
        </div>

        {/* Active Category Info */}
        <div className="p-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            <activeConfig.icon className={`w-5 h-5 ${activeConfig.color}`} />
            <p className="text-sm text-gray-600">{activeConfig.description}</p>
            <div className="ml-auto flex items-center space-x-4 text-xs text-gray-500">
              <span>Last: {formatDate(activeCategoryMetrics.lastGenerated)}</span>
              <span>Avg Size: {activeCategoryMetrics.avgSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards Grid - Only show active category */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterShowDownloadable
                ? 'No reports match your search criteria.'
                : `No ${activeConfig.title.toLowerCase()} reports available yet.`}
            </p>
            {!searchTerm && !filterShowDownloadable && (
              <p className="text-sm text-gray-400">Choose a report below to generate your first report.</p>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const hasReport = report.lastReport !== undefined;
                const isGenerating = generatingReport === report.reportKey;

                return (
                  <div
                    key={report.reportKey}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex-1">{report.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        Last: {formatDate(report.lastGenerated)}
                      </span>
                      {report.size && (
                        <span className="text-xs text-gray-500" title="File size">
                          {report.size}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {hasReport && report.lastReport && (
                        <button
                          onClick={(e) => handleDownloadReport(report.lastReport!.id, e)}
                          disabled={generatingReport !== null}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => report.definition && handleGenerateReport(report.definition)}
                        disabled={generatingReport !== null && generatingReport !== report.reportKey}
                        className={`${hasReport ? 'flex-1' : 'w-full'} px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          hasReport
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } ${generatingReport === report.reportKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {generatingReport === report.reportKey ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            {hasReport ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Simplified Quick Actions - Automation Section */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Automation</h3>
            <p className="text-xs text-gray-500">Schedule and automate report generation</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => alert('Feature coming soon: Generate all scheduled reports')}
              className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Generate All
            </button>
            <button 
              onClick={() => alert('Feature coming soon: Schedule reports')}
              className="px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Generate Report Modal */}
      {showGenerateModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Generate {selectedReport.report_name}</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date Range with Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date Range
                </label>
                <select
                  value={generateParams.dateRangePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>

                {generateParams.dateRangePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      value={generateParams.dateRangeStart}
                      onChange={(e) => setGenerateParams({ ...generateParams, dateRangeStart: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Start"
                    />
                    <input
                      type="date"
                      value={generateParams.dateRangeEnd}
                      onChange={(e) => setGenerateParams({ ...generateParams, dateRangeEnd: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="End"
                    />
                  </div>
                )}
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Format
                </label>
                <select
                  value={generateParams.format}
                  onChange={(e) => setGenerateParams({ ...generateParams, format: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGenerate}
                disabled={generatingReport !== null}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate 🔄'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
