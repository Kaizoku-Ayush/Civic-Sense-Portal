const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/civic_sense_db'
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Read migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('❌ No migration files found!');
      return;
    }
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check which migrations have already run
    const { rows: executed } = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const executedFiles = executed.map(row => row.filename);
    
    // Run pending migrations
    for (const file of files) {
      if (executedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`📄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        
        console.log(`✅ Successfully executed ${file}\n`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to execute ${file}: ${err.message}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
    // Show database status
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Database tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Show departments count
    const { rows: depts } = await client.query('SELECT COUNT(*) FROM departments');
    console.log(`\n🏛️  Departments created: ${depts[0].count}`);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
