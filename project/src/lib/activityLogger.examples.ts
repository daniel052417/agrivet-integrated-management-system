/**
 * Activity Logger Usage Examples
 * 
 * This file demonstrates how to use the activityLogger service throughout your application.
 * Copy these examples into your actual components/services where needed.
 */

import { activityLogger } from './activityLogger';

// ============================================================================
// AUTHENTICATION ACTIVITIES
// ============================================================================

/**
 * Example: Log successful login
 */
export async function logSuccessfulLogin(loginMethod: 'password' | 'mfa' | 'sso' = 'password', mfaUsed: boolean = false) {
  await activityLogger.logLoginSuccess(loginMethod, mfaUsed);
  
  // Or use the generic method:
  // await activityLogger.logActivity({
  //   activityType: 'login_success',
  //   description: `User logged in successfully using ${loginMethod}${mfaUsed ? ' with MFA' : ''}`,
  //   module: 'Dashboard',
  //   metadata: { login_method: loginMethod, mfa_used: mfaUsed }
  // });
}

/**
 * Example: Log failed login
 */
export async function logFailedLogin(email: string, reason?: string) {
  await activityLogger.logLoginFailure(email, reason);
  
  // Or use the generic method:
  // await activityLogger.logActivity({
  //   activityType: 'login_failed',
  //   description: `Failed login attempt for ${email}${reason ? `: ${reason}` : ''}`,
  //   module: 'Dashboard',
  //   metadata: { attempted_email: email, failure_reason: reason || 'Invalid credentials' }
  // });
}

// ============================================================================
// INVENTORY MODULE ACTIVITIES
// ============================================================================

/**
 * Example: Log product creation
 */
export async function logProductCreation(productId: string, productName: string, productData: any) {
  await activityLogger.logCreate(
    'product',
    productId,
    `Created product: ${productName}`,
    'Inventory',
    productData // newValues
  );
  
  // Or use the generic method:
  // await activityLogger.logActivity({
  //   activityType: 'create',
  //   description: `Created product: ${productName}`,
  //   module: 'Inventory',
  //   entityId: productId,
  //   entityType: 'product',
  //   newValues: productData
  // });
}

/**
 * Example: Log product update
 */
export async function logProductUpdate(productId: string, productName: string, oldData: any, newData: any) {
  await activityLogger.logUpdate(
    'product',
    productId,
    `Updated product: ${productName}`,
    'Inventory',
    oldData, // oldValues
    newData  // newValues
  );
}

/**
 * Example: Log product deletion
 */
export async function logProductDeletion(productId: string, productName: string, productData: any) {
  await activityLogger.logDelete(
    'product',
    productId,
    `Deleted product: ${productName}`,
    'Inventory',
    productData // oldValues
  );
}

/**
 * Example: Log product view
 */
export async function logProductView(productId: string, productName: string) {
  await activityLogger.logView(
    'product',
    `Viewed product: ${productName}`,
    'Inventory',
    productId
  );
}

// ============================================================================
// SALES MODULE ACTIVITIES
// ============================================================================

/**
 * Example: Log order creation
 */
export async function logOrderCreation(orderId: string, orderData: any) {
  await activityLogger.logCreate(
    'order',
    orderId,
    `Created order: ${orderId}`,
    'Sales',
    orderData
  );
}

/**
 * Example: Log transaction completion
 */
export async function logTransactionCompletion(transactionId: string, amount: number, paymentMethod: string) {
  await activityLogger.logActivity({
    activityType: 'create',
    description: `Completed transaction: ${transactionId} - ${paymentMethod} - ₱${amount.toFixed(2)}`,
    module: 'Sales',
    entityId: transactionId,
    entityType: 'transaction',
    metadata: {
      amount,
      payment_method: paymentMethod
    }
  });
}

// ============================================================================
// REPORTS MODULE ACTIVITIES
// ============================================================================

/**
 * Example: Log report export
 */
export async function logReportExport(reportType: string, format: 'csv' | 'excel' | 'pdf', filters?: any) {
  await activityLogger.logExport(
    reportType,
    `Exported ${reportType} report as ${format.toUpperCase()}`,
    'Reports',
    {
      format,
      filters: filters || {}
    }
  );
}

/**
 * Example: Log report view
 */
export async function logReportView(reportType: string) {
  await activityLogger.logView(
    'report',
    `Viewed ${reportType} report`,
    'Reports'
  );
}

// ============================================================================
// STAFF/USER MANAGEMENT ACTIVITIES
// ============================================================================

/**
 * Example: Log user account creation
 */
export async function logUserCreation(userId: string, email: string, role: string) {
  await activityLogger.logCreate(
    'user',
    userId,
    `Created user account: ${email} (${role})`,
    'Staff',
    { email, role }
  );
}

/**
 * Example: Log user account update
 */
export async function logUserUpdate(userId: string, email: string, changes: any) {
  await activityLogger.logUpdate(
    'user',
    userId,
    `Updated user account: ${email}`,
    'Staff',
    undefined, // oldValues - you would pass the previous state here
    changes    // newValues
  );
}

/**
 * Example: Log user account deactivation
 */
export async function logUserDeactivation(userId: string, email: string) {
  await activityLogger.logActivity({
    activityType: 'update',
    description: `Deactivated user account: ${email}`,
    module: 'Staff',
    entityId: userId,
    entityType: 'user',
    metadata: {
      action: 'deactivate'
    }
  });
}

// ============================================================================
// MARKETING MODULE ACTIVITIES
// ============================================================================

/**
 * Example: Log promotion creation
 */
export async function logPromotionCreation(promotionId: string, promotionName: string) {
  await activityLogger.logCreate(
    'promotion',
    promotionId,
    `Created promotion: ${promotionName}`,
    'Marketing'
  );
}

/**
 * Example: Log campaign launch
 */
export async function logCampaignLaunch(campaignId: string, campaignName: string) {
  await activityLogger.logActivity({
    activityType: 'create',
    description: `Launched campaign: ${campaignName}`,
    module: 'Marketing',
    entityId: campaignId,
    entityType: 'campaign',
    metadata: {
      action: 'launch'
    }
  });
}

// ============================================================================
// SETTINGS MODULE ACTIVITIES
// ============================================================================

/**
 * Example: Log settings update
 */
export async function logSettingsUpdate(settingKey: string, oldValue: any, newValue: any) {
  await activityLogger.logUpdate(
    'setting',
    settingKey,
    `Updated setting: ${settingKey}`,
    'Settings',
    { [settingKey]: oldValue },
    { [settingKey]: newValue }
  );
}

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example: Integrate into a React component
 * 
 * In your component:
 * 
 * import { activityLogger } from '@/lib/activityLogger';
 * 
 * const handleCreateProduct = async (productData) => {
 *   try {
 *     const result = await createProduct(productData);
 *     
 *     // Log the activity
 *     await activityLogger.logProductCreation(
 *       result.id,
 *       result.name,
 *       productData
 *     );
 *     
 *     // Show success message
 *     toast.success('Product created successfully');
 *   } catch (error) {
 *     console.error('Error creating product:', error);
 *   }
 * };
 */

/**
 * Example: Integrate into a service/API function
 * 
 * In your service:
 * 
 * import { activityLogger } from '@/lib/activityLogger';
 * 
 * export async function updateProduct(productId: string, updates: any) {
 *   // Get old data first
 *   const oldData = await getProduct(productId);
 *   
 *   // Perform update
 *   const updatedProduct = await supabase
 *     .from('products')
 *     .update(updates)
 *     .eq('id', productId)
 *     .select()
 *     .single();
 *   
 *   // Log the activity
 *   await activityLogger.logProductUpdate(
 *     productId,
 *     updatedProduct.name,
 *     oldData,
 *     updatedProduct
 *   );
 *   
 *   return updatedProduct;
 * }
 */

/**
 * Example: Batch logging (for multiple operations)
 * 
 * const logBatchOperations = async (operations: Array<{type: string, id: string, name: string}>) => {
 *   for (const op of operations) {
 *     await activityLogger.logActivity({
 *       activityType: 'create',
 *       description: `Batch created ${op.type}: ${op.name}`,
 *       module: 'Inventory',
 *       entityId: op.id,
 *       entityType: op.type
 *     });
 *   }
 * };
 */


