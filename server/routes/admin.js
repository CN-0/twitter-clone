import express from 'express';
import TwitterScraperService from '../services/twitterScraper.js';

const createAdminRoutes = (db, authenticateAdmin) => {
  const router = express.Router();
  const database = db.getDb();
  const twitterScraper = new TwitterScraperService(db);

  // Check Twitter authentication status
  router.get('/twitter-status', authenticateAdmin, async (req, res) => {
    try {
      const tokens = await twitterScraper.getUserTwitterTokens(req.user.id);
      res.json({ 
        authenticated: !!tokens,
        username: tokens?.twitter_username || null
      });
    } catch (error) {
      console.error('Error checking Twitter status:', error);
      res.status(500).json({ error: 'Failed to check Twitter status' });
    }
  });

  // Get scraping targets
  router.get('/scraping-targets', authenticateAdmin, async (req, res) => {
    try {
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

      // Get target
      database.get(
        'SELECT * FROM scraping_targets WHERE id = ? AND is_active = TRUE',
        [id],
        async (err, target) => {
          if (err || !target) {
            return res.status(404).json({ error: 'Target not found or inactive' });
          }

          try {
            const result = await twitterScraper.scrapeTweetsFromUser(target.username, req.user.id);

            res.json({
              message: 'Scraping completed',
              tweetsAdded: result.scrapedCount,
              username: result.username
            });
          } catch (scrapeError) {
            console.error('Scraping error:', scrapeError);
            res.status(500).json({ error: scrapeError.message || 'Failed to scrape tweets' });
          }
        }
      );
    } catch (error) {
      console.error('Manual scrape error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Bulk scrape all active targets
  router.post('/scrape-all', authenticateAdmin, async (req, res) => {
    try {
      const results = await twitterScraper.scrapeAllActiveTargets(req.user.id);
      
      const summary = {
        totalTargets: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalTweetsScraped: results.reduce((sum, r) => sum + (r.scrapedCount || 0), 0),
        results
      };

      res.json({
        message: 'Bulk scraping completed',
        summary
      });
    } catch (error) {
      console.error('Bulk scrape error:', error);
      res.status(500).json({ error: 'Failed to perform bulk scraping' });
    }
  });

  // Get admin stats
  router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
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

  return router;
};

export default createAdminRoutes;