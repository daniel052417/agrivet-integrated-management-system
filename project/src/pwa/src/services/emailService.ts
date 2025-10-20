import { EmailTemplate, EmailNotification } from '../types'
import { supabase } from './supabase'

interface EmailServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface SendEmailRequest {
  orderId?: string
  customerId?: string
  emailType: string
  recipientEmail: string
  recipientName?: string
  templateName?: string
  customData?: any
}

interface SendEmailResponse {
  success: boolean
  notificationId?: string
  error?: string
}

class EmailService {
  private config: EmailServiceConfig

  constructor(config: EmailServiceConfig) {
    this.config = config
  }

  /**
   * Get email template by name
   */
  async getEmailTemplate(templateName: string): Promise<{ success: boolean; template?: EmailTemplate; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single()

      if (error) {
        throw new Error(`Email template not found: ${error.message}`)
      }

      return {
        success: true,
        template
      }

    } catch (error) {
      console.error('Error fetching email template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderId: string, customerEmail: string, customerName: string, orderData: any): Promise<SendEmailResponse> {
    try {
      const templateResult = await this.getEmailTemplate('order_confirmation')
      
      if (!templateResult.success || !templateResult.template) {
        // Fallback to basic email
        return await this.sendBasicEmail({
          orderId,
          customerId: orderData.customerId,
          emailType: 'order_confirmation',
          recipientEmail: customerEmail,
          recipientName: customerName,
          customData: orderData
        })
      }

      const template = templateResult.template
      const subject = this.replaceTemplateVariables(template.subject_template, orderData)
      const htmlContent = this.replaceTemplateVariables(template.html_template, orderData)
      const textContent = template.text_template ? this.replaceTemplateVariables(template.text_template, orderData) : null

      return await this.createEmailNotification({
        orderId,
        customerId: orderData.customerId,
        emailType: 'order_confirmation',
        recipientEmail: customerEmail,
        recipientName: customerName,
        subject,
        templateName: template.name,
        contentHtml: htmlContent,
        contentText: textContent
      })

    } catch (error) {
      console.error('Error sending order confirmation email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send order ready notification
   */
  async sendOrderReady(orderId: string, customerEmail: string, customerName: string, orderData: any): Promise<SendEmailResponse> {
    try {
      const templateResult = await this.getEmailTemplate('order_ready')
      
      if (!templateResult.success || !templateResult.template) {
        // Fallback to basic email
        return await this.sendBasicEmail({
          orderId,
          customerId: orderData.customerId,
          emailType: 'order_ready',
          recipientEmail: customerEmail,
          recipientName: customerName,
          customData: orderData
        })
      }

      const template = templateResult.template
      const subject = this.replaceTemplateVariables(template.subject_template, orderData)
      const htmlContent = this.replaceTemplateVariables(template.html_template, orderData)
      const textContent = template.text_template ? this.replaceTemplateVariables(template.text_template, orderData) : null

      return await this.createEmailNotification({
        orderId,
        customerId: orderData.customerId,
        emailType: 'order_ready',
        recipientEmail: customerEmail,
        recipientName: customerName,
        subject,
        templateName: template.name,
        contentHtml: htmlContent,
        contentText: textContent
      })

    } catch (error) {
      console.error('Error sending order ready email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send order cancellation email
   */
  async sendOrderCancellation(orderId: string, customerEmail: string, customerName: string, orderData: any): Promise<SendEmailResponse> {
    try {
      const templateResult = await this.getEmailTemplate('order_cancelled')
      
      if (!templateResult.success || !templateResult.template) {
        // Fallback to basic email
        return await this.sendBasicEmail({
          orderId,
          customerId: orderData.customerId,
          emailType: 'order_cancelled',
          recipientEmail: customerEmail,
          recipientName: customerName,
          customData: orderData
        })
      }

      const template = templateResult.template
      const subject = this.replaceTemplateVariables(template.subject_template, orderData)
      const htmlContent = this.replaceTemplateVariables(template.html_template, orderData)
      const textContent = template.text_template ? this.replaceTemplateVariables(template.text_template, orderData) : null

      return await this.createEmailNotification({
        orderId,
        customerId: orderData.customerId,
        emailType: 'order_cancelled',
        recipientEmail: customerEmail,
        recipientName: customerName,
        subject,
        templateName: template.name,
        contentHtml: htmlContent,
        contentText: textContent
      })

    } catch (error) {
      console.error('Error sending order cancellation email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send basic email without template
   */
  async sendBasicEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const { orderId, customerId, emailType, recipientEmail, recipientName, customData } = request

      // Generate basic email content
      const subject = this.generateBasicSubject(emailType, customData)
      const htmlContent = this.generateBasicHtmlContent(emailType, customData)
      const textContent = this.generateBasicTextContent(emailType, customData)

      return await this.createEmailNotification({
        orderId,
        customerId,
        emailType,
        recipientEmail,
        recipientName,
        subject,
        contentHtml: htmlContent,
        contentText: textContent
      })

    } catch (error) {
      console.error('Error sending basic email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create email notification record
   */
  private async createEmailNotification(data: {
    orderId?: string
    customerId?: string
    emailType: string
    recipientEmail: string
    recipientName?: string
    subject: string
    templateName?: string
    contentHtml?: string
    contentText?: string
  }): Promise<SendEmailResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const notificationData = {
        order_id: data.orderId || null,
        customer_id: data.customerId || null,
        email_type: data.emailType,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName || null,
        subject: data.subject,
        template_name: data.templateName || null,
        content_html: data.contentHtml || null,
        content_text: data.contentText || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { data: notification, error } = await supabase
        .from('email_notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create email notification: ${error.message}`)
      }

      // In a real implementation, you would trigger the actual email sending here
      // For now, we'll just mark it as sent for demo purposes
      await this.markEmailAsSent(notification.id)

      return {
        success: true,
        notificationId: notification.id
      }

    } catch (error) {
      console.error('Error creating email notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark email as sent
   */
  async markEmailAsSent(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('email_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) {
        throw new Error(`Failed to mark email as sent: ${error.message}`)
      }

      return { success: true }

    } catch (error) {
      console.error('Error marking email as sent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Replace template variables with actual data
   */
  private replaceTemplateVariables(template: string, data: any): string {
    let result = template

    // Replace common variables
    const variables = {
      '{{customer_name}}': data.customerName || data.customer_name || 'Customer',
      '{{order_number}}': data.orderNumber || data.order_number || 'N/A',
      '{{order_total}}': data.orderTotal ? `₱${data.orderTotal.toFixed(2)}` : 'N/A',
      '{{order_date}}': data.orderDate || data.order_date || new Date().toLocaleDateString(),
      '{{branch_name}}': data.branchName || data.branch_name || 'AgriVet Branch',
      '{{branch_address}}': data.branchAddress || data.branch_address || 'N/A',
      '{{estimated_ready_time}}': data.estimatedReadyTime || data.estimated_ready_time || '30 minutes',
      '{{company_name}}': 'AgriVet Integrated Management System',
      '{{company_phone}}': '+63 912 345 6789',
      '{{company_email}}': 'support@agrivet.com'
    }

    Object.entries(variables).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value)
    })

    return result
  }

  /**
   * Generate basic email subject
   */
  private generateBasicSubject(emailType: string, data: any): string {
    switch (emailType) {
      case 'order_confirmation':
        return `Order Confirmation - ${data.orderNumber || 'N/A'}`
      case 'order_ready':
        return `Your Order is Ready for Pickup - ${data.orderNumber || 'N/A'}`
      case 'order_cancelled':
        return `Order Cancelled - ${data.orderNumber || 'N/A'}`
      default:
        return 'AgriVet Order Update'
    }
  }

  /**
   * Generate basic HTML content
   */
  private generateBasicHtmlContent(emailType: string, data: any): string {
    const baseHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AgriVet Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AgriVet Order Update</h1>
          </div>
          <div class="content">
            ${this.getEmailContent(emailType, data)}
          </div>
          <div class="footer">
            <p>Thank you for choosing AgriVet!</p>
            <p>For support, contact us at +63 912 345 6789</p>
          </div>
        </div>
      </body>
      </html>
    `

    return baseHtml
  }

  /**
   * Generate basic text content
   */
  private generateBasicTextContent(emailType: string, data: any): string {
    return `AgriVet Order Update\n\n${this.getEmailContent(emailType, data)}\n\nThank you for choosing AgriVet!\nFor support, contact us at +63 912 345 6789`
  }

  /**
   * Get email content based on type
   */
  private getEmailContent(emailType: string, data: any): string {
    switch (emailType) {
      case 'order_confirmation':
        return `
          <h2>Order Confirmed!</h2>
          <p>Dear ${data.customerName || 'Customer'},</p>
          <p>Your order <strong>${data.orderNumber || 'N/A'}</strong> has been confirmed and is being prepared.</p>
          <p><strong>Order Total:</strong> ₱${data.orderTotal?.toFixed(2) || 'N/A'}</p>
          <p><strong>Estimated Ready Time:</strong> ${data.estimatedReadyTime || '30 minutes'}</p>
          <p><strong>Pickup Location:</strong> ${data.branchName || 'AgriVet Branch'}</p>
          <p>We'll notify you when your order is ready for pickup.</p>
        `
      case 'order_ready':
        return `
          <h2>Your Order is Ready!</h2>
          <p>Dear ${data.customerName || 'Customer'},</p>
          <p>Your order <strong>${data.orderNumber || 'N/A'}</strong> is ready for pickup.</p>
          <p><strong>Pickup Location:</strong> ${data.branchName || 'AgriVet Branch'}</p>
          <p><strong>Address:</strong> ${data.branchAddress || 'N/A'}</p>
          <p>Please bring a valid ID for verification.</p>
        `
      case 'order_cancelled':
        return `
          <h2>Order Cancelled</h2>
          <p>Dear ${data.customerName || 'Customer'},</p>
          <p>Your order <strong>${data.orderNumber || 'N/A'}</strong> has been cancelled.</p>
          <p>If you have any questions, please contact us at +63 912 345 6789.</p>
        `
      default:
        return `
          <h2>Order Update</h2>
          <p>Dear ${data.customerName || 'Customer'},</p>
          <p>There has been an update to your order <strong>${data.orderNumber || 'N/A'}</strong>.</p>
        `
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!supabase
  }
}

export default EmailService
