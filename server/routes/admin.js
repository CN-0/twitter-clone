const express = require('express');
const axios = require('axios');
const Database = require('../database/init');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Get scraping targets
router.get('/scraping-targets', authenticateAdmin, async (req, res) => {
  try {
    const db = new Database();
    await db.connect();
    const database = db.getDb();

    database.all(
      'SELECT * FROM scraping_targets ORDER BY created_at DESC',
      [],
      (err, targets) => {
        if (err) {
          console.error('Error fetching scraping targets:', err);
          return res.status(500).json({ error: 'Failed to fetch targets' });
        }

        res.json({ targets });
      }
    );
  } catch (error) {
    console.error('Get scraping targets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add scraping target
router.post('/scraping-targets', authenticateAdmin, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = new Database();
    await db.connect();
    const database = db.getDb();

    database.run(
      'INSERT INTO scraping_targets (username) VALUES (?)',
      [username],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Username already added' });
          }
          return res.status(500).json({ error: 'Failed to add target' });
        }

        res.status(201).json({
          message: 'Scraping target added successfully',
          target: {
            id: this.lastID,
            username,
            isActive: true
          }
        });
      }
    );
  } catch (error) {
    console.error('Add scraping target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle scraping target status
router.put('/scraping-targets/:id/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const db = new Database();
    await db.connect();
    const database = db.getDb();

    database.run(
      'UPDATE scraping_targets SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update target' });
        }

        res.json({ message: 'Target status updated' });
      }
    );
  } catch (error) {
    console.error('Toggle target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual scrape trigger
router.post('/scrape/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const db = new Database();
    await db.connect();
    const database = db.getDb();

    // Get target
    database.get(
      'SELECT * FROM scraping_targets WHERE id = ? AND is_active = TRUE',
      [id],
      async (err, target) => {
        if (err || !target) {
          return res.status(404).json({ error: 'Target not found or inactive' });
        }

        try {
          const scrapedTweets = await scrapeTweetsFromUser(target.username);
          
          // Store scraped tweets
          let tweetsAdded = 0;
          for (const tweet of scrapedTweets) {
            database.run(
              `INSERT INTO tweets (user_id, content, is_scraped, scraped_from, created_at) 
               VALUES (?, ?, ?, ?, ?)`,
              [1, tweet.content, true, target.username, tweet.createdAt],
              function(err) {
                if (!err) {
                  tweetsAdded++;
                }
              }
            );
          }

          // Update scraping target
          database.run(
            'UPDATE scraping_targets SET last_scraped_at = CURRENT_TIMESTAMP, tweets_scraped = tweets_scraped + ? WHERE id = ?',
            [tweetsAdded, id]
          );

          res.json({
            message: 'Scraping completed',
            tweetsAdded,
            username: target.username
          });
        } catch (scrapeError) {
          console.error('Scraping error:', scrapeError);
          res.status(500).json({ error: 'Failed to scrape tweets' });
        }
      }
    );
  } catch (error) {
    console.error('Manual scrape error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock scraping function (replace with actual implementation)
async function scrapeTweetsFromUser(username) {
  // This is a mock implementation
  // In a real application, you would implement actual scraping logic
  // Note: Be careful with rate limits and Twitter's Terms of Service
  
  const mockTweets = [
    {
      content: `Sample tweet from @${username} - This is a mock scraped tweet for demonstration purposes.`,
      createdAt: new Date().toISOString()
    },
    {
      content: `Another sample tweet from @${username} with some interesting content about technology.`,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      content: `Mock tweet #3 from @${username} showing the scraping functionality in action.`,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockTweets;
}

// Get admin stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = new Database();
    await db.connect();
    const database = db.getDb();

    const stats = {};

    // Get user count
    database.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to get stats' });
      }
      stats.userCount = result.count;

      // Get tweet count
      database.get('SELECT COUNT(*) as count FROM tweets', [], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to get stats' });
        }
        stats.tweetCount = result.count;

        // Get scraped tweet count
        database.get('SELECT COUNT(*) as count FROM tweets WHERE is_scraped = TRUE', [], (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to get stats' });
          }
          stats.scrapedTweetCount = result.count;

          // Get active targets count
          database.get('SELECT COUNT(*) as count FROM scraping_targets WHERE is_active = TRUE', [], (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to get stats' });
            }
            stats.activeTargetsCount = result.count;

            res.json({ stats });
          });
        });
      });
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;