import { TwitterApi } from 'twitter-api-v2';

// Twitter API configuration
export const TWITTER_CONFIG = {
  apiKey: process.env.TWITTER_API_KEY || 'your-twitter-api-key',
  apiSecret: process.env.TWITTER_API_SECRET || 'your-twitter-api-secret',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || 'your-access-token',
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || 'your-access-token-secret',
  bearerToken: process.env.TWITTER_BEARER_TOKEN || 'your-bearer-token',
  callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/twitter/callback'
};

// Create Twitter client for app-only authentication (for public data)
export const createAppOnlyTwitterClient = () => {
  return new TwitterApi(TWITTER_CONFIG.bearerToken);
};

// Create Twitter client with user tokens
export const createUserTwitterClient = (accessToken, accessTokenSecret) => {
  return new TwitterApi({
    appKey: TWITTER_CONFIG.apiKey,
    appSecret: TWITTER_CONFIG.apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });
};

// Create OAuth 1.0a client for authentication
export const createOAuthClient = () => {
  return new TwitterApi({
    appKey: TWITTER_CONFIG.apiKey,
    appSecret: TWITTER_CONFIG.apiSecret,
  });
};

export default TWITTER_CONFIG;