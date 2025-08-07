import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Download, 
  Target,
  Plus,
  Play,
  Square,
  Trash2,
  Twitter,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ScrapingTarget {
  id: number;
  username: string;
  is_active: boolean;
  last_scraped_at: string | null;
  tweets_scraped: number;
  created_at: string;
}

interface AdminStats {
  userCount: number;
  tweetCount: number;
  scrapedTweetCount: number;
  activeTargetsCount: number;
}

interface TwitterStatus {
  authenticated: boolean;
  username: string | null;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [targets, setTargets] = useState<ScrapingTarget[]>([]);
  const [twitterStatus, setTwitterStatus] = useState<TwitterStatus | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    checkTwitterAuth();
  }, []);

  useEffect(() => {
    // Check for Twitter auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const twitterAuth = urlParams.get('twitter_auth');
    
    if (twitterAuth === 'success') {
      checkTwitterAuth();
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (twitterAuth === 'error') {
      console.error('Twitter authentication failed');
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, targetsData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getScrapingTargets()
      ]);
      
      setStats(statsData.stats);
      setTargets(targetsData.targets || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setStats(null);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const checkTwitterAuth = async () => {
    try {
      const status = await apiService.getTwitterStatus();
      setTwitterStatus(status);
    } catch (error) {
      console.error('Error checking Twitter status:', error);
      setTwitterStatus({ authenticated: false, username: null });
    }
  };

  const handleTwitterAuth = async () => {
    try {
      if (!user?.id) return;
      
      setActionLoading('twitter-auth');
      const authData = await apiService.getTwitterAuthUrl(user.id);
      
      // Open Twitter auth in a new window
      window.open(authData.authUrl, '_blank', 'width=600,height=600');
    } catch (error) {
      console.error('Error initiating Twitter auth:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const addTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      setActionLoading('add');
      await apiService.addScrapingTarget(newUsername);
      setNewUsername('');
      fetchData();
    } catch (error) {
      console.error('Error adding target:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTarget = async (id: number) => {
    try {
      setActionLoading(`toggle-${id}`);
      await apiService.toggleScrapingTarget(id);
      fetchData();
    } catch (error) {
      console.error('Error toggling target:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const manualScrape = async (id: number) => {
    if (!twitterStatus?.authenticated) {
      alert('Please authenticate with Twitter first to enable scraping.');
      return;
    }

    try {
      setActionLoading(`scrape-${id}`);
      await apiService.manualScrape(id);
      fetchData();
    } catch (error) {
      console.error('Error scraping:', error);
      alert(`Scraping failed: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const bulkScrape = async () => {
    if (!twitterStatus?.authenticated) {
      alert('Please authenticate with Twitter first to enable scraping.');
      return;
    }

    try {
      setActionLoading('bulk-scrape');
      const result = await apiService.bulkScrapeTargets();
      
      alert(`Bulk scraping completed!\nTargets: ${result.summary.totalTargets}\nSuccessful: ${result.summary.successful}\nTotal tweets scraped: ${result.summary.totalTweetsScraped}`);
      
      fetchData();
    } catch (error) {
      console.error('Error bulk scraping:', error);
      alert(`Bulk scraping failed: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage tweet scraping and monitor platform statistics
        </p>
      </div>

      {/* Twitter Authentication Status */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Twitter className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Twitter API Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {twitterStatus?.authenticated 
                  ? `Connected as @${twitterStatus.username}` 
                  : 'Connect your Twitter account to enable tweet scraping'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {twitterStatus?.authenticated ? (
              <div className="flex items-center space-x-2">
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                  Connected
                </span>
                <button
                  onClick={bulkScrape}
                  disabled={actionLoading === 'bulk-scrape'}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{actionLoading === 'bulk-scrape' ? 'Scraping...' : 'Scrape All'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleTwitterAuth}
                disabled={actionLoading === 'twitter-auth'}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{actionLoading === 'twitter-auth' ? 'Connecting...' : 'Connect Twitter'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.userCount.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.tweetCount.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Tweets</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.scrapedTweetCount.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Scraped Tweets</p>
              </div>
              <Download className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeTargetsCount.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Active Targets</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Scraping Targets Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Scraping Targets
          </h2>
          
          {/* Add New Target */}
          <form onSubmit={addTarget} className="flex space-x-3">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter Twitter username (without @)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={actionLoading === 'add'}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{actionLoading === 'add' ? 'Adding...' : 'Add Target'}</span>
            </button>
          </form>
        </div>

        {/* Targets List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tweets Scraped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Scraped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {targets.map((target) => (
                <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 mr-1">@</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {target.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      target.is_active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    }`}>
                      {target.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {target.tweets_scraped.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {target.last_scraped_at 
                      ? new Date(target.last_scraped_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleTarget(target.id)}
                        disabled={actionLoading === `toggle-${target.id}`}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          target.is_active
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                        }`}
                      >
                        {target.is_active ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => manualScrape(target.id)}
                        disabled={!target.is_active || !twitterStatus?.authenticated || actionLoading === `scrape-${target.id}`}
                        className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors duration-200"
                        title={!twitterStatus?.authenticated ? 'Twitter authentication required' : 'Scrape tweets'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {targets.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No scraping targets configured
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Add Twitter usernames above to start scraping their tweets
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
          Tweet Scraping Guide
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li>• First, authenticate with Twitter using the "Connect Twitter" button above</li>
          <li>• Add Twitter usernames (without @) to start monitoring their public tweets</li>
          <li>• Use the toggle button to activate/deactivate scraping for specific users</li>
          <li>• Click the download button to manually trigger scraping for active targets</li>
          <li>• Use "Scrape All" to scrape tweets from all active targets at once</li>
          <li>• Scraped tweets are automatically integrated into the platform timeline</li>
          <li>• Monitor the statistics above to track scraping performance</li>
        </ul>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This system uses the Twitter API v2 for scraping. Make sure you have proper API credentials configured and comply with Twitter's rate limits and terms of service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;