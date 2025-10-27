// Staff-User Integration Test and Utility Functions
import { staffManagementApi } from './staffApi';

export interface IntegrationTestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

export class StaffUserIntegrationTester {
  static async runAllTests(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];
    
    // Test 1: Database Connection
    results.push(await this.testDatabaseConnection());
    
    // Test 2: Staff API
    results.push(await this.testStaffAPI());
    
    // Test 3: User API
    results.push(await this.testUserAPI());
    
    // Test 4: Staff-User Linking
    results.push(await this.testStaffUserLinking());
    
    // Test 5: Account Creation Workflow
    results.push(await this.testAccountCreationWorkflow());
    
    return results;
  }
  
  private static async testDatabaseConnection(): Promise<IntegrationTestResult> {
    try {
      // Test basic database connectivity
      const { data, error } = await staffManagementApi.staff.getAllStaff();
      
      if (error) {
        return {
          test: 'Database Connection',
          success: false,
          message: `Database connection failed: ${error.message}`,
          data: error
        };
      }
      
      return {
        test: 'Database Connection',
        success: true,
        message: `Successfully connected to database. Found ${data?.length || 0} staff records.`,
        data: { staffCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        test: 'Database Connection',
        success: false,
        message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }
  
  private static async testStaffAPI(): Promise<IntegrationTestResult> {
    try {
      const staff = await staffManagementApi.staff.getAllStaff();
      
      return {
        test: 'Staff API',
        success: true,
        message: `Staff API working. Retrieved ${staff.length} staff members.`,
        data: { staffCount: staff.length }
      };
    } catch (error) {
      return {
        test: 'Staff API',
        success: false,
        message: `Staff API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }
  
  private static async testUserAPI(): Promise<IntegrationTestResult> {
    try {
      const users = await staffManagementApi.users.getAllUsers();
      
      return {
        test: 'User API',
        success: true,
        message: `User API working. Retrieved ${users.length} users.`,
        data: { userCount: users.length }
      };
    } catch (error) {
      return {
        test: 'User API',
        success: false,
        message: `User API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }
  
  private static async testStaffUserLinking(): Promise<IntegrationTestResult> {
    try {
      const staffWithoutAccounts = await staffManagementApi.staffUser.getStaffWithoutAccounts();
      
      return {
        test: 'Staff-User Linking',
        success: true,
        message: `Staff-User linking API working. Found ${staffWithoutAccounts.length} staff without accounts.`,
        data: { staffWithoutAccounts: staffWithoutAccounts.length }
      };
    } catch (error) {
      return {
        test: 'Staff-User Linking',
        success: false,
        message: `Staff-User linking error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }
  
  private static async testAccountCreationWorkflow(): Promise<IntegrationTestResult> {
    try {
      // Test workflow status retrieval (should not fail even if no workflows exist)
      const staffWithoutAccounts = await staffManagementApi.staffUser.getStaffWithoutAccounts();
      
      if (staffWithoutAccounts.length > 0) {
        const firstStaff = staffWithoutAccounts[0];
        const workflowStatus = await staffManagementApi.enhancedStaff.getAccountCreationStatus(firstStaff.id);
        
        return {
          test: 'Account Creation Workflow',
          success: true,
          message: `Account creation workflow API working. Tested with staff member: ${firstStaff.first_name} ${firstStaff.last_name}.`,
          data: { 
            testStaffId: firstStaff.id,
            workflowStatus: workflowStatus?.workflow_status || 'none'
          }
        };
      } else {
        return {
          test: 'Account Creation Workflow',
          success: true,
          message: 'Account creation workflow API working. No staff without accounts to test with.',
          data: { note: 'All staff have accounts' }
        };
      }
    } catch (error) {
      return {
        test: 'Account Creation Workflow',
        success: false,
        message: `Account creation workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }
}

// Utility function to get system status
export const getSystemStatus = async () => {
  const results = await StaffUserIntegrationTester.runAllTests();
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  return {
    overall: successCount === totalCount ? 'healthy' : 'degraded',
    successRate: (successCount / totalCount) * 100,
    tests: results,
    summary: {
      total: totalCount,
      passed: successCount,
      failed: totalCount - successCount
    }
  };
};

// Utility function to validate staff-user data integrity
export const validateDataIntegrity = async () => {
  try {
    const [staff, users] = await Promise.all([
      staffManagementApi.staff.getAllStaff(),
      staffManagementApi.users.getAllUsers()
    ]);
    
    const issues: string[] = [];
    
    // Check for staff with user_account_id but no corresponding user
    const staffWithInvalidUserRefs = staff.filter(s => 
      s.user_account_id && !users.find(u => u.id === s.user_account_id)
    );
    
    if (staffWithInvalidUserRefs.length > 0) {
      issues.push(`${staffWithInvalidUserRefs.length} staff members have invalid user account references`);
    }
    
    // Check for users with staff_id but no corresponding staff
    const usersWithInvalidStaffRefs = users.filter(u => 
      u.staff_id && !staff.find(s => s.id === u.staff_id)
    );
    
    if (usersWithInvalidStaffRefs.length > 0) {
      issues.push(`${usersWithInvalidStaffRefs.length} users have invalid staff references`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      summary: {
        totalStaff: staff.length,
        totalUsers: users.length,
        staffWithAccounts: staff.filter(s => s.user_account_id).length,
        usersWithStaff: users.filter(u => u.staff_id).length
      }
    };
  } catch (error) {
    return {
      valid: false,
      issues: [`Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      summary: null
    };
  }
};








































