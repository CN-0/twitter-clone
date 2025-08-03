import React, { useState, useEffect } from 'react';
import Tweet from './Tweet';
import { apiService } from '../../services/api';

interface TweetListProps {
  username?: string;
  refreshTrigger?: number;
}

const TweetList: React.FC<TweetListProps> = ({ username, refreshTrigger }) => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTweets = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const data = username 
        ? await apiService.getUserTweets(username, pageNum)
        : await apiService.getTimeline(pageNum);
      
      if (reset) {
        setTweets(data.tweets);
      } else {
        setTweets(prev => [...prev, ...data.tweets]);
      }
      
      setHasMore(data.tweets.length === 20);
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(1, true);
    setPage(1);
  }, [username, refreshTrigger]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTweets(nextPage, false);
  };

  const handleTweetUpdate = () => {
    fetchTweets(1, true);
    setPage(1);
  };

  if (loading && tweets.length === 0) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex space-x-3">
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {username ? 'No tweets yet' : 'Your timeline is empty'}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          {username ? 'This user hasn\'t posted any tweets yet.' : 'Follow some users to see their tweets here.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {tweets.map((tweet) => (
        <Tweet 
          key={tweet.id} 
          tweet={tweet} 
          onUpdate={handleTweetUpdate}
        />
      ))}
      
      {hasMore && (
        <div className="p-4 text-center border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more tweets'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TweetList;