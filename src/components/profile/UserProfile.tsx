import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  CheckCircle,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TweetList from '../tweets/TweetList';

interface User {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  profile_picture: string;
  cover_photo: string;
  website: string;
  location: string;
  verified: boolean;
  follower_count: number;
  following_count: number;
  tweet_count: number;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserProfile(username!);
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!username || followLoading) return;
    
    setFollowLoading(true);
    try {
      const result = await apiService.followUser(username);
      setFollowing(result.following);
      
      // Update follower count
      if (user) {
        setUser({
          ...user,
          follower_count: result.following 
            ? user.follower_count + 1 
            : user.follower_count - 1
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 animate-pulse">
        <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
        <div className="p-4">
          <div className="h-24 w-24 bg-gray-300 dark:bg-gray-600 rounded-full -mt-12 mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          The user you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative">
        {user.cover_photo && (
          <img
            src={user.cover_photo}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex justify-between items-start mb-4">
          <img
            src={user.profile_picture || 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=96&h=96&fit=crop&crop=face'}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 -mt-12 bg-white dark:bg-gray-800 object-cover"
          />
          
          <div className="flex space-x-2 mt-4">
            {isOwnProfile ? (
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <Settings className="h-4 w-4 inline mr-2" />
                Edit profile
              </button>
            ) : (
              <>
                <button className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                    following
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                  }`}
                >
                  {followLoading ? 'Loading...' : following ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.display_name}
              </h1>
              {user.verified && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-gray-900 dark:text-white">{user.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
            {user.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center space-x-1">
                <LinkIcon className="h-4 w-4" />
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 dark:text-blue-400 hover:underline"
                >
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatJoinDate(user.created_at)}</span>
            </div>
          </div>

          <div className="flex space-x-6">
            <div className="flex space-x-1">
              <span className="font-bold text-gray-900 dark:text-white">
                {user.following_count.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Following</span>
            </div>
            <div className="flex space-x-1">
              <span className="font-bold text-gray-900 dark:text-white">
                {user.follower_count.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          <button className="flex-1 py-4 px-4 text-center border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">
            Tweets
          </button>
          <button className="flex-1 py-4 px-4 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Tweets & replies
          </button>
          <button className="flex-1 py-4 px-4 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Media
          </button>
          <button className="flex-1 py-4 px-4 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Likes
          </button>
        </nav>
      </div>

      {/* Tweets */}
      <TweetList username={username} />
    </div>
  );
};

export default UserProfile;