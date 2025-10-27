import { FacebookService } from './facebookService';

export interface FacebookApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  facebookError?: any;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  fan_count: number;
  category: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPostData {
  message: string;
  link?: string;
  picture?: string;
  name?: string;
  caption?: string;
  description?: string;
}

export interface FacebookInsights {
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  video_views?: number;
}

export class FacebookApiService {
  private static readonly FACEBOOK_API_VERSION = 'v18.0';
  private static readonly FACEBOOK_GRAPH_URL = 'https://graph.facebook.com';

  /**
   * Get Facebook page access token
   */
  private static async getPageAccessToken(pageId: string): Promise<string> {
    try {
      const page = await FacebookService.getPage(pageId);
      return page.access_token;
    } catch (error) {
      console.error('Error getting page access token:', error);
      throw new Error('Failed to get page access token');
    }
  }

  /**
   * Make authenticated request to Facebook Graph API
   */
  private static async makeApiRequest(
    endpoint: string,
    accessToken: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    data?: any
  ): Promise<FacebookApiResponse> {
    try {
      const url = `${this.FACEBOOK_GRAPH_URL}/${this.FACEBOOK_API_VERSION}/${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'GET') {
        const params = new URLSearchParams({
          access_token: accessToken,
          ...data
        });
        const response = await fetch(`${url}?${params}`, options);
        const result = await response.json();
        
        if (!response.ok) {
          return {
            success: false,
            error: result.error?.message || 'Facebook API request failed',
            facebookError: result.error
          };
        }

        return {
          success: true,
          data: result
        };
      } else {
        const params = new URLSearchParams({
          access_token: accessToken,
          ...data
        });
        
        const response = await fetch(url, {
          ...options,
          body: params
        });
        const result = await response.json();
        
        if (!response.ok) {
          return {
            success: false,
            error: result.error?.message || 'Facebook API request failed',
            facebookError: result.error
          };
        }

        return {
          success: true,
          data: result
        };
      }
    } catch (error) {
      console.error('Error making Facebook API request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get Facebook page information
   */
  static async getPageInfo(pageId: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        pageId,
        accessToken,
        'GET',
        {
          fields: 'id,name,fan_count,category,picture'
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting page info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get page info'
      };
    }
  }

  /**
   * Create a Facebook post
   */
  static async createPost(pageId: string, postData: FacebookPostData): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/feed`,
        accessToken,
        'POST',
        postData
      );

      if (response.success) {
        // Update our database with the Facebook post ID
        await this.updatePostWithFacebookId(pageId, postData, response.data.id);
      }

      return response;
    } catch (error) {
      console.error('Error creating Facebook post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Facebook post'
      };
    }
  }

  /**
   * Update post in our database with Facebook post ID
   */
  private static async updatePostWithFacebookId(
    pageId: string,
    postData: FacebookPostData,
    facebookPostId: string
  ): Promise<void> {
    try {
      // Find the most recent post for this page with the same content
      const { data: posts } = await FacebookService.getPosts({
        pageId,
        limit: 1,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (posts && posts.length > 0) {
        const post = posts[0];
        if (post.content === postData.message) {
          await FacebookService.updatePage(post.id, {
            facebook_post_id: facebookPostId,
            status: 'published',
            published_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating post with Facebook ID:', error);
    }
  }

  /**
   * Get Facebook post insights
   */
  static async getPostInsights(pageId: string, postId: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${postId}/insights`,
        accessToken,
        'GET',
        {
          metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total,post_comments,post_shares,post_clicks'
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting post insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get post insights'
      };
    }
  }

  /**
   * Get Facebook page insights
   */
  static async getPageInsights(pageId: string, startDate?: string, endDate?: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];
      
      const response = await this.makeApiRequest(
        `${pageId}/insights`,
        accessToken,
        'GET',
        {
          metric: 'page_fans,page_impressions,page_engaged_users,page_post_engagements',
          since: start,
          until: end,
          period: 'day'
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting page insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get page insights'
      };
    }
  }

  /**
   * Delete a Facebook post
   */
  static async deletePost(pageId: string, facebookPostId: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        facebookPostId,
        accessToken,
        'DELETE'
      );

      return response;
    } catch (error) {
      console.error('Error deleting Facebook post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Facebook post'
      };
    }
  }

  /**
   * Upload photo to Facebook
   */
  static async uploadPhoto(pageId: string, photoUrl: string, caption?: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/photos`,
        accessToken,
        'POST',
        {
          url: photoUrl,
          caption: caption || '',
          published: 'true'
        }
      );

      return response;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload photo'
      };
    }
  }

  /**
   * Get Facebook page access token from user access token
   */
  static async getPageAccessTokenFromUser(userAccessToken: string, pageId: string): Promise<FacebookApiResponse> {
    try {
      const response = await this.makeApiRequest(
        'me/accounts',
        userAccessToken,
        'GET'
      );

      if (response.success && response.data.data) {
        const page = response.data.data.find((p: any) => p.id === pageId);
        if (page) {
          return {
            success: true,
            data: {
              access_token: page.access_token,
              page_id: page.id,
              page_name: page.name
            }
          };
        } else {
          return {
            success: false,
            error: 'Page not found in user accounts'
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Error getting page access token from user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get page access token'
      };
    }
  }

  /**
   * Validate Facebook access token
   */
  static async validateAccessToken(accessToken: string): Promise<FacebookApiResponse> {
    try {
      const response = await this.makeApiRequest(
        'me',
        accessToken,
        'GET',
        {
          fields: 'id,name'
        }
      );

      return response;
    } catch (error) {
      console.error('Error validating access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate access token'
      };
    }
  }

  /**
   * Get Facebook page posts
   */
  static async getPagePosts(pageId: string, limit: number = 25): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/posts`,
        accessToken,
        'GET',
        {
          fields: 'id,message,created_time,full_picture,permalink_url,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total,post_comments,post_shares)',
          limit: limit.toString()
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting page posts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get page posts'
      };
    }
  }

  /**
   * Schedule a Facebook post
   */
  static async schedulePost(pageId: string, postData: FacebookPostData, scheduledTime: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/feed`,
        accessToken,
        'POST',
        {
          ...postData,
          scheduled_publish_time: Math.floor(new Date(scheduledTime).getTime() / 1000),
          published: 'false'
        }
      );

      return response;
    } catch (error) {
      console.error('Error scheduling Facebook post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule Facebook post'
      };
    }
  }

  /**
   * Get Facebook page webhook subscriptions
   */
  static async getWebhookSubscriptions(pageId: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/subscribed_apps`,
        accessToken,
        'GET'
      );

      return response;
    } catch (error) {
      console.error('Error getting webhook subscriptions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook subscriptions'
      };
    }
  }

  /**
   * Subscribe to Facebook page webhooks
   */
  static async subscribeToWebhooks(pageId: string, webhookUrl: string, verifyToken: string): Promise<FacebookApiResponse> {
    try {
      const accessToken = await this.getPageAccessToken(pageId);
      
      const response = await this.makeApiRequest(
        `${pageId}/subscribed_apps`,
        accessToken,
        'POST',
        {
          subscribed_fields: 'feed,posts,comments,reactions'
        }
      );

      return response;
    } catch (error) {
      console.error('Error subscribing to webhooks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to webhooks'
      };
    }
  }
}

export default FacebookApiService;
