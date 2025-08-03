const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(path.join(__dirname, 'twitter_clone.db'), (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeSchema()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  async initializeSchema() {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing schema:', err);
          reject(err);
        } else {
          console.log('Database schema initialized');
          this.createDefaultAdmin()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  async createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      // Create a default admin user for testing
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      const insertUser = `
        INSERT OR IGNORE INTO users (username, email, password_hash, display_name, verified)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(insertUser, ['admin', 'admin@twitter.com', hashedPassword, 'Admin User', true], function(err) {
        if (err) {
          console.error('Error creating admin user:', err);
          reject(err);
          return;
        }
        
        if (this.changes > 0) {
          // Insert into admin_users table
          const insertAdmin = `INSERT OR IGNORE INTO admin_users (user_id) VALUES (?)`;
          this.db.run(insertAdmin, [this.lastID], (err) => {
            if (err) {
              console.error('Error creating admin role:', err);
              reject(err);
            } else {
              console.log('Default admin user created');
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  getDb() {
    return this.db;
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;