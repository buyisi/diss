const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'inventory.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // 初始化表结构
    initTables();
  }
});

// 初始化表结构
function initTables() {
  // 商品表
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      unit TEXT NOT NULL
    )
  `);

  // 库存表
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      production_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 入库记录
  db.run(`
    CREATE TABLE IF NOT EXISTS inbound (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      production_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // 出库记录
  db.run(`
    CREATE TABLE IF NOT EXISTS outbound (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  console.log('Database tables initialized.');
}

// 导出数据库连接
module.exports = db;