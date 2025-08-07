import { createUserTwitterClient, createAppOnlyTwitterClient } from '../config/twitter.js';

class TwitterScraperService {
  constructor(db) {
    this.db = db;
    this.database = db.getDb();
  }

  // Get stored Twitter tokens for a user
  async getUserTwitterTokens(userId) {
    return new Promise((resolve, reject) => {
      this.database.get(
        'SELECT * FROM twitter_tokens WHERE user_id = ?',
        [userId],
        (err, tokens) => {
          if (err) reject(err);
          else resolve(tokens);
        }
      );
    });
  }

  // Store Twitter tokens for a user
  async storeUserTwitterTokens(userId, accessToken, accessTokenSecret, twitterUserId, twitterUsername) {
    return new Promise((resolve, reject) => {
      this.database.run(
        `INSERT OR REPLACE INTO twitter_tokens 
         (user_id, access_token, access_token_secret, twitter_user_id, twitter_username, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, accessToken, accessTokenSecret, twitterUserId, twitterUsername],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Scrape tweets from a specific user
  async scrapeTweetsFromUser(targetUsername, adminUserId) {
    try {
      // Get admin's Twitter tokens
      const tokens = await this.getUserTwitterTokens(adminUserId);
      
      if (!tokens) {
        throw new Error('No Twitter tokens found. Please authenticate with Twitter first.');
      }

      // Create Twitter client with user tokens
      const twitterClient = createUserTwitterClient(tokens.access_token, tokens.access_token_secret);

      // Get target user info
      const targetUser = await twitterClient.v2.userByUsername(targetUsername);
      
      if (!targetUser.data) {
        throw new Error(`User @${targetUsername} not found on Twitter`);
      }

      // Get the last scraped tweet ID for this target
      const lastTweetId = await this.getLastScrapedTweetId(targetUsername);

      // Fetch tweets from the user's timeline
      const tweetsResponse = await twitterClient.v2.userTimeline(targetUser.data.id, {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics', 'text', 'attachments'],
        'media.fields': ['url', 'preview_image_url'],
        expansions: ['attachments.media_keys'],
        since_id: lastTweetId || undefined
      });

      const tweets = tweetsResponse.data?.data || [];
      const mediaMap = new Map();

      // Create media map for attachments
      if (tweetsResponse.includes?.media) {
        tweetsResponse.includes.media.forEach(media => {
          mediaMap.set(media.media_key, media);
        });
      }

      let scrapedCount = 0;
      let latestTweetId = lastTweetId;

      // Store scraped tweets in database
      for (const tweet of tweets) {
        try {
          // Get media URL if available
          let imageUrl = '';
          if (tweet.attachments?.media_keys) {
            const mediaKey = tweet.attachments.media_keys[0];
            const media = mediaMap.get(mediaKey);
            if (media && (media.type === 'photo' || media.preview_image_url)) {
              imageUrl = media.url || media.preview_image_url || '';
            }
          }

          // Insert tweet into database
          await this.storeTweet({
            content: tweet.text,
            imageUrl,
            isScraped: true,
            scrapedFrom: targetUsername,
            originalTweetId: tweet.id,
            createdAt: tweet.created_at,
            likeCount: tweet.public_metrics?.like_count || 0,
            retweetCount: tweet.public_metrics?.retweet_count || 0,
            replyCount: tweet.public_metrics?.reply_count || 0
          });

          scrapedCount++;
          latestTweetId = tweet.id;
        } catch (tweetError) {
          console.error(`Error storing tweet ${tweet.id}:`, tweetError);
        }
      }

      // Update scraping target with latest info
      await this.updateScrapingTarget(targetUsername, scrapedCount, latestTweetId);

      return {
        success: true,
        scrapedCount,
        totalTweets: tweets.length,
        username: targetUsername
      };

    } catch (error) {
      console.error('Twitter scraping error:', error);
      throw error;
    }
  }

  // Store a scraped tweet in the database
  async storeTweet(tweetData) {
    return new Promise((resolve, reject) => {
      this.database.run(
        `INSERT INTO tweets 
         (user_id, content, image_url, is_scraped, scraped_from, like_count, retweet_count, reply_count, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, // System user ID for scraped tweets
          tweetData.content,
          tweetData.imageUrl,
          tweetData.isScraped,
          tweetData.scrapedFrom,
          tweetData.likeCount,
          tweetData.retweetCount,
          tweetData.replyCount,
          tweetData.createdAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Get the last scraped tweet ID for a target
  async getLastScrapedTweetId(username) {
    return new Promise((resolve, reject) => {
      this.database.get(
        'SELECT last_tweet_id FROM scraping_targets WHERE username = ?',
        [username],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.last_tweet_id || null);
        }
      );
    });
  }

  // Update scraping target statistics
  async updateScrapingTarget(username, newTweetsCount, latestTweetId) {
    return new Promise((resolve, reject) => {
      this.database.run(
        `UPDATE scraping_targets 
         SET last_scraped_at = CURRENT_TIMESTAMP, 
             tweets_scraped = tweets_scraped + ?, 
             last_tweet_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE username = ?`,
        [newTweetsCount, latestTweetId, username],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Scrape tweets for all active targets
  async scrapeAllActiveTargets(adminUserId) {
    return new Promise((resolve, reject) => {
      this.database.all(
        'SELECT * FROM scraping_targets WHERE is_active = TRUE',
        [],
        async (err, targets) => {
          if (err) {
            reject(err);
            return;
          }

          const results = [];
          
          for (const target of targets) {
            try {
              const result = await this.scrapeTweetsFromUser(target.username, adminUserId);
              results.push(result);
            } catch (error) {
              results.push({
                success: false,
                username: target.username,
                error: error.message
              });
            }
          }

          resolve(results);
        }
      );
    });
  }
}

export default TwitterScraperService;