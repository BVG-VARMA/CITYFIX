import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure persistent data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cityfix.db');
const sqlDb = new sqlite3.Database(dbPath);

// Enable WAL mode for high performance concurrency
sqlDb.run('PRAGMA journal_mode = WAL;');
sqlDb.run('PRAGMA foreign_keys = ON;');

// Helper promise wrappers
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqlDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize Schema
export async function initDatabase() {
  console.log(`🗄️ Initializing Persistent SQLite Database at: ${dbPath}`);

  // 1. Departments Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      head TEXT NOT NULL,
      contact TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      avg_resolution_hours INTEGER NOT NULL DEFAULT 24
    )
  `);

  // 2. Users Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen',
      ward TEXT DEFAULT 'General Ward',
      avatar TEXT,
      reports_count INTEGER DEFAULT 0,
      upvotes_given INTEGER DEFAULT 0,
      karma INTEGER DEFAULT 50,
      badge TEXT DEFAULT 'Civic Member',
      department_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // 3. Issues Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      category_label TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      photo_url TEXT,
      resolved_photo_url TEXT,
      reporter_id TEXT,
      reporter_name TEXT,
      reporter_phone TEXT,
      reporter_ward TEXT,
      reporter_avatar TEXT,
      department_id TEXT,
      department_name TEXT,
      assigned_to TEXT DEFAULT 'Unassigned',
      upvotes INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 4. Timeline Events Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      time TEXT NOT NULL,
      time_formatted TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      actor TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
    )
  `);

  // 5. Upvotes Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS upvotes (
      issue_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (issue_id, user_id),
      FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
    )
  `);

  // 6. Notifications Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      issue_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // 7. Citizen Feedback Table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS citizen_feedback (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      user_avatar TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      tags_json TEXT,
      satisfaction TEXT DEFAULT 'satisfied',
      created_at TEXT NOT NULL,
      FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
    )
  `);

  // Seed default municipal departments if table is empty
  const deptCountRow = await getOne(`SELECT COUNT(*) as count FROM departments`);
  if (!deptCountRow || deptCountRow.count === 0) {
    const defaultDepts = [
      {
        id: 'roads',
        name: 'Roads & Infrastructure',
        code: 'ROADS',
        icon: 'Hammer',
        color: '#f59e0b',
        head: 'Eng. Marcus Vance',
        contact: 'roads-dispatch@cityfix.gov',
        categories: ['pothole', 'sidewalk', 'road_damage'],
        avgResolutionHours: 28
      },
      {
        id: 'sanitation',
        name: 'Sanitation & Waste Management',
        code: 'SANITATION',
        icon: 'Trash2',
        color: '#10b981',
        head: 'Elena Rostova',
        contact: 'sanitation-ops@cityfix.gov',
        categories: ['garbage', 'dumping', 'debris'],
        avgResolutionHours: 14
      },
      {
        id: 'water',
        name: 'Water Works & Sewerage',
        code: 'WATER',
        icon: 'Droplets',
        color: '#06b6d4',
        head: 'Dr. Arthur Sterling',
        contact: 'water-urgent@cityfix.gov',
        categories: ['water_leak', 'drain_clog', 'sewer'],
        avgResolutionHours: 19
      },
      {
        id: 'electricity',
        name: 'Electricity & Street Lighting',
        code: 'ELECTRICITY',
        icon: 'Zap',
        color: '#eab308',
        head: 'Ravi Kumar',
        contact: 'lighting-grid@cityfix.gov',
        categories: ['streetlight', 'power_line', 'traffic_light'],
        avgResolutionHours: 18
      },
      {
        id: 'traffic',
        name: 'Traffic & Urban Transit',
        code: 'TRAFFIC',
        icon: 'Car',
        color: '#ec4899',
        head: 'Chief Olivia Martinez',
        contact: 'traffic-safety@cityfix.gov',
        categories: ['traffic_hazard', 'sign_damaged', 'obstruction'],
        avgResolutionHours: 22
      },
      {
        id: 'parks',
        name: 'Parks & Public Amenities',
        code: 'PARKS',
        icon: 'Trees',
        color: '#84cc16',
        head: 'Lucas Vance',
        contact: 'parks-dept@cityfix.gov',
        categories: ['tree_fallen', 'bench_broken', 'vandalism'],
        avgResolutionHours: 36
      }
    ];

    for (const d of defaultDepts) {
      await runQuery(
        `INSERT INTO departments (id, name, code, icon, color, head, contact, categories_json, avg_resolution_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.name, d.code, d.icon, d.color, d.head, d.contact, JSON.stringify(d.categories), d.avgResolutionHours]
      );
    }
    console.log('✅ Seeded 6 Municipal Departments');
  }

  // Seed default admin accounts if empty
  const userCountRow = await getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
  if (!userCountRow || userCountRow.count === 0) {
    const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
    
    // Municipal Commissioner
    await runQuery(
      `INSERT INTO users (id, name, phone, email, password, role, ward, avatar, karma, badge, department_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr_admin_1',
        'Municipal Commissioner',
        '9876543200',
        'admin@cityfix.org',
        hashedAdminPassword,
        'admin',
        'Central Municipal HQ',
        'https://ui-avatars.com/api/?name=Municipal+Commissioner&background=0284c7&color=ffffff&bold=true',
        1000,
        'Municipal Lead Dispatcher',
        'roads',
        new Date().toISOString()
      ]
    );

    // Zonal Field Supervisor
    await runQuery(
      `INSERT INTO users (id, name, phone, email, password, role, ward, avatar, karma, badge, department_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr_admin_2',
        'Zonal Field Supervisor',
        '9876543201',
        'david.admin@cityfix.org',
        hashedAdminPassword,
        'admin',
        'Zone 4 Field Ops',
        'https://ui-avatars.com/api/?name=Zonal+Supervisor&background=059669&color=ffffff&bold=true',
        800,
        'Zone 4 Field Ops',
        'sanitation',
        new Date().toISOString()
      ]
    );
    console.log('✅ Seeded Municipal Admin accounts (admin@cityfix.org / 9876543200 : admin123)');
  } else {
    // Migration: Update existing records that still have the old placeholder names or unsplash photos
    await runQuery(`
      UPDATE users 
      SET name = 'Municipal Commissioner', 
          avatar = 'https://ui-avatars.com/api/?name=Municipal+Commissioner&background=0284c7&color=ffffff&bold=true'
      WHERE id = 'usr_admin_1' AND (name = 'Director Sarah Chen' OR avatar LIKE '%unsplash%')
    `);
    await runQuery(`
      UPDATE users 
      SET name = 'Zonal Field Supervisor', 
          avatar = 'https://ui-avatars.com/api/?name=Zonal+Supervisor&background=059669&color=ffffff&bold=true'
      WHERE id = 'usr_admin_2' AND (name = 'Field Officer David Kim' OR avatar LIKE '%unsplash%')
    `);
  }

  console.log('🚀 Database initialization complete and ready.');
}

export default sqlDb;
