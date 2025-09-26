const fs = require('fs');
const path = require('path');

// List of files that need ComponentGuard removal
const filesToUpdate = [
  'src/components/dashboard/TopPerformers.tsx',
  'src/components/dashboard/LowStockAlert.tsx',
  'src/components/dashboard/InventorySummary.tsx',
  'src/components/dashboard/SalesByProduct.tsx',
  'src/components/dashboard/RecentActivity.tsx',
  'src/components/dashboard/SalesByBranch.tsx',
  'src/components/dashboard/SalesChart.tsx',
  'src/components/dashboard/AdminDashboard.tsx',
  'src/components/dashboard/SalesValue.tsx',
  'src/components/dashboard/SalesDashboard.tsx',
  'src/components/dashboard/AllSalesRecords.tsx',
  'src/components/dashboard/DailySalesSummary.tsx',
  'src/components/dashboard/ProductSalesReport.tsx',
  'src/components/hr/HRDashboard.tsx',
  'src/components/hr/AttendanceDashboard.tsx',
  'src/components/hr/LeaveManagement.tsx',
  'src/components/hr/HRAnalytics.tsx',
  'src/components/hr/PayrollCompensation.tsx',
  'src/components/hr/AddStaff.tsx',
  'src/components/inventory/InventoryManagement.tsx',
  'src/components/inventory/InventorySummaryPage.tsx',
  'src/components/inventory/LowStockAlerts.tsx',
  'src/components/inventory/Categories.tsx',
  'src/components/marketing/MarketingDashboard.tsx',
  'src/components/marketing/CampaignForm.tsx',
  'src/components/marketing/CampaignPreview.tsx',
  'src/components/marketing/TemplateManagement.tsx',
  'src/components/marketing/ClientNotifications.tsx',
  'src/components/sales/SalesValue.tsx',
  'src/components/sales/AllSalesRecords.tsx',
  'src/components/sales/DailySalesSummary.tsx',
  'src/components/sales/ProductSalesReport.tsx',
  'src/components/sales/SalesDashboard.tsx',
  'src/components/staff/RolesPermissions.tsx',
  'src/components/staff/LeaveRequest.tsx',
  'src/components/staff/AttendanceTimesheet.tsx',
  'src/components/users/UserAccounts.tsx',
  'src/components/users/UserActivity.tsx',
  'src/components/users/UserPermissions.tsx',
  'src/components/users/ActiveUsers.tsx',
  'src/components/reports/ReportsAnalytics.tsx',
  'src/components/reports/EventCenter.tsx',
  'src/components/settings/SettingsPage.tsx',
  'src/components/pos/POSInterface.tsx',
  'src/components/shared/layout/Sidebar.tsx'
];

function removeComponentGuard(filePath) {
  try {
    const fullPath = path.join(__dirname, 'project', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove ComponentGuard import
    content = content.replace(/import { ComponentGuard } from ['"][^'"]*['"];\n?/g, '');
    
    // Remove ComponentGuard wrapper patterns
    // Pattern 1: <ComponentGuard ...>content</ComponentGuard>
    content = content.replace(
      /<ComponentGuard[^>]*>\s*([\s\S]*?)\s*<\/ComponentGuard>/g,
      '$1'
    );
    
    // Pattern 2: <ComponentGuard ... /> (self-closing)
    content = content.replace(/<ComponentGuard[^>]*\/>/g, '');
    
    // Clean up any extra whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Process all files
filesToUpdate.forEach(removeComponentGuard);

console.log('ComponentGuard removal completed!');
