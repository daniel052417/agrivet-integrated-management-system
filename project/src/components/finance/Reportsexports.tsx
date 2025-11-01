import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, FileSpreadsheet, Eye, Send, RefreshCw } from 'lucide-react';
import { useReportsExportData } from '../../hooks/useReportsExportData';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
type Format = 'pdf' | 'excel' | 'csv';

const ReportsExports: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('income-expense');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [selectedFormat, setSelectedFormat] = useState<Format>('pdf');
  const [customDateRange, setCustomDateRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Data fetching with RBAC filtering - uses hook
  const {
    reportTypes,
    recentReports,
    quickReports,
    exportStatistics,
    loading,
    error,
    refreshData,
    generateReport
  } = useReportsExportData();

  const selectedReport = reportTypes.find(report => report.id === selectedReportType);

  const handleReportTypeClick = (reportId: string) => {
    setSelectedReportType(reportId);
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const period = event.target.value as Period;
    setSelectedPeriod(period);
    setCustomDateRange(period === 'custom');
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(event.target.value as Format);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  const handleQuickReportClick = async (reportType: string) => {
    try {
      // Map quick report types to periods
      const periodMap: Record<string, Period> = {
        'daily': 'today',
        'weekly': 'week',
        'monthly': 'month',
        'comparison': 'month'
      };
      
      const period = periodMap[reportType] || 'month';
      await generateReport(reportType, period, selectedFormat);
      
      // Refresh data to show new report
      await refreshData();
    } catch (err) {
      console.error('Error generating quick report:', err);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handlePreviewReport = () => {
    // Handle report preview
    console.log('Previewing report');
  };

  const handleGenerateDownload = async () => {
    try {
      await generateReport(
        selectedReportType,
        selectedPeriod,
        selectedFormat,
        customDateRange ? startDate : undefined,
        customDateRange ? endDate : undefined
      );
      
      // Refresh data to show new report
      await refreshData();
      
      alert('Report generation started. You will be notified when it\'s ready.');
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleEmailReport = async () => {
    try {
      await generateReport(
        selectedReportType,
        selectedPeriod,
        selectedFormat,
        customDateRange ? startDate : undefined,
        customDateRange ? endDate : undefined
      );
      
      // In a real implementation, you would trigger an email action
      alert('Report will be emailed to you when ready.');
    } catch (err) {
      console.error('Error emailing report:', err);
      alert('Failed to email report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-lg text-gray-600">Loading reports data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-800">{error}</span>
            <button 
              onClick={refreshData}
              className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-600" />
                Reports & Exports
              </h1>
              <p className="text-gray-600 mt-2">Generate and download financial summaries and reports</p>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickReportClick(report.type)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <Download className="h-4 w-4 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Generator */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Custom Report</h2>
            
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((report) => {
                    const Icon = report.icon;
                    return (
                      <button
                        key={report.id}
                        onClick={() => handleReportTypeClick(report.id)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedReportType === report.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`h-5 w-5 ${
                            selectedReportType === report.id ? 'text-indigo-600' : 'text-gray-500'
                          }`} />
                          <h3 className="font-medium text-gray-900">{report.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500">{report.description}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span>~{report.estimatedSize}</span>
                          <span>Last: {report.lastGenerated}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Period Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select 
                    value={selectedPeriod} 
                    onChange={handlePeriodChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                  <select 
                    value={selectedFormat} 
                    onChange={handleFormatChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV Data File</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              {customDateRange && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Report Preview */}
              {selectedReport && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Report Preview</h3>
                  <div className="text-sm text-blue-800">
                    <p><strong>Type:</strong> {selectedReport.name}</p>
                    <p><strong>Period:</strong> {selectedPeriod === 'custom' ? `${startDate} to ${endDate}` : selectedPeriod}</p>
                    <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
                    <p><strong>Estimated Size:</strong> {selectedReport.estimatedSize}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handlePreviewReport}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Report
                </button>
                <button 
                  onClick={handleGenerateDownload}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate & Download
                </button>
                <button 
                  onClick={handleEmailReport}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Recent Reports & Settings */}
          <div className="space-y-6">
            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent reports available</div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{report.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'Ready' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        <span>{report.type} • {report.size} • {report.generated}</span>
                      </div>
                      {report.status === 'Ready' && (
                        <button className="w-full text-center py-1 px-2 bg-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-200 transition-colors">
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Include branch breakdown</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Show payment method details</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Include charts and graphs</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Add comparative data</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Auto-generate monthly</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Export Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reports generated this month</span>
                  <span className="font-medium text-gray-900">{exportStatistics.reportsGeneratedThisMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Most popular format</span>
                  <span className="font-medium text-gray-900">{exportStatistics.mostPopularFormat}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average generation time</span>
                  <span className="font-medium text-gray-900">{exportStatistics.averageGenerationTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total storage used</span>
                  <span className="font-medium text-gray-900">{exportStatistics.totalStorageUsed}</span>
                </div>
              </div>
            </div>

            {/* Help & Tips */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
              <h4 className="font-medium text-amber-800 mb-2">💡 Tips for Better Reports</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Use PDF for formal presentations</li>
                <li>• Choose Excel for data analysis</li>
                <li>• CSV works best for importing data</li>
                <li>• Monthly reports are ideal for trends</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExports;