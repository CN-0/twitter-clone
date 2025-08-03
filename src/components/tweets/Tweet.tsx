import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  Bookmark,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../../services/api';

interface Tweet {
  id: number;
  content: string;
  image_url?: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  verified: boolean;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  retweet_username?: string;
  retweet_display_name?: string;
  original_content?: string;
  original_username?: string;
  original_display_name?: string;
  original_profile_picture?: string;
}

interface TweetProps {
  tweet: Tweet;
  onUpdate?: () => void;
}

const Tweet: React.FC<TweetProps> = ({ tweet, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(tweet.is_liked);
  const [isBookmarked, setIsBookmarked] = useState(tweet.is_bookmarked);
  const [likeCount, setLikeCount] = useState(tweet.like_count);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count);
  const [loading, setLoading] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await apiService.likeTweet(tweet.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetweet = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await apiService.retweetTweet(tweet.id);
      setRetweetCount(prev => prev + 1);
      onUpdate?.();
    } catch (error) {
      console.error('Error retweeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await apiService.bookmarkTweet(tweet.id);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRetweet = tweet.retweet_username && tweet.original_content;

  return (
    <article className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 cursor-pointer">
      {isRetweet && (
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
          <Repeat2 className="h-4 w-4 mr-2" />
          <span>{tweet.retweet_display_name} retweeted</span>
        </div>
      )}

      <div className="flex space-x-3">
        <img
          src={isRetweet && tweet.original_profile_picture ? 
            tweet.original_profile_picture : 
            (tweet.profile_picture || 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=40&h=40&fit=crop&crop=face')
          }
          alt="Profile"
          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">
              {isRetweet ? tweet.original_display_name : tweet.display_name}
            </h3>
            {tweet.verified && (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-gray-500 dark:text-gray-400 truncate">
              @{isRetweet ? tweet.original_username : tweet.username}
            </span>
            <span className="text-gray-500 dark:text-gray-400">·</span>
            <time className="text-gray-500 dark:text-gray-400 text-sm">
              {formatTimeAgo(tweet.created_at)}
            </time>
            <button className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {isRetweet ? tweet.original_content : tweet.content}
            </p>

            {tweet.image_url && (
              <div className="mt-3">
                <img
                  src={tweet.image_url}
                  alt="Tweet image"
                  className="rounded-2xl max-w-full h-auto border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 max-w-md">
            <button
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-200">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-sm">{tweet.reply_count}</span>
            </button>

            <button
              onClick={handleRetweet}
              disabled={loading}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200 group"
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors duration-200">
                <Repeat2 className="h-4 w-4" />
              </div>
              <span className="text-sm">{retweetCount}</span>
            </button>

            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-2 transition-colors duration-200 group ${
                isLiked 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              }`}
            >
              <div className={`p-2 rounded-full transition-colors duration-200 ${
                isLiked 
                  ? 'bg-red-50 dark:bg-red-900/20' 
                  : 'group-hover:bg-red-50 dark:group-hover:bg-red-900/20'
              }`}>
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                disabled={loading}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isBookmarked 
                    ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                <Share className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default Tweet;