const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          const newHeaders = {
            ...this.getAuthHeaders(),
            ...options.headers
          };
          return fetch(url, {
            ...options,
            headers: newHeaders
          });
        } else {
          // Redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Tweet methods
  async getTimeline(page = 1, limit = 20) {
    const response = await this.request(`/tweets/timeline?page=${page}&limit=${limit}`);
    return response.json();
  }

  async createTweet(content: string, imageUrl?: string, replyToId?: number, quoteTweetId?: number) {
    const response = await this.request('/tweets', {
      method: 'POST',
      body: JSON.stringify({ content, imageUrl, replyToId, quoteTweetId })
    });
    return response.json();
  }

  async likeTweet(tweetId: number) {
    const response = await this.request(`/tweets/${tweetId}/like`, {
      method: 'POST'
    });
    return response.json();
  }

  async retweetTweet(tweetId: number) {
    const response = await this.request(`/tweets/${tweetId}/retweet`, {
      method: 'POST'
    });
    return response.json();
  }

  async bookmarkTweet(tweetId: number) {
    const response = await this.request(`/tweets/${tweetId}/bookmark`, {
      method: 'POST'
    });
    return response.json();
  }

  async getUserTweets(username: string, page = 1, limit = 20) {
    const response = await this.request(`/tweets/user/${username}?page=${page}&limit=${limit}`);
    return response.json();
  }

  // User methods
  async getUserProfile(username: string) {
    const response = await this.request(`/users/${username}`);
    return response.json();
  }

  async followUser(username: string) {
    const response = await this.request(`/users/${username}/follow`, {
      method: 'POST'
    });
    return response.json();
  }

  async updateProfile(profileData: any) {
    const response = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.json();
  }

  async searchUsers(query: string, limit = 10) {
    const response = await this.request(`/users/search/${encodeURIComponent(query)}?limit=${limit}`);
    return response.json();
  }

  // Admin methods
  async getScrapingTargets() {
    const response = await this.request('/admin/scraping-targets');
    return response.json();
  }

  async addScrapingTarget(username: string) {
    const response = await this.request('/admin/scraping-targets', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    return response.json();
  }

  async toggleScrapingTarget(id: number) {
    const response = await this.request(`/admin/scraping-targets/${id}/toggle`, {
      method: 'PUT'
    });
    return response.json();
  }

  async manualScrape(id: number) {
    const response = await this.request(`/admin/scrape/${id}`, {
      method: 'POST'
    });
    return response.json();
  }

  async getAdminStats() {
    const response = await this.request('/admin/stats');
    return response.json();
  }

  // Twitter authentication methods
  async getTwitterAuthUrl(userId: number) {
    const response = await this.request(`/auth/twitter?userId=${userId}`);
    return response.json();
  }

  async getTwitterStatus() {
    const response = await this.request('/admin/twitter-status');
    return response.json();
  }

  async bulkScrapeTargets() {
    const response = await this.request('/admin/scrape-all', {
      method: 'POST'
    });
    return response.json();
  }
}

export const apiService = new ApiService();