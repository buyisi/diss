const express = require('express');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 首页
app.get('/', (req, res) => {
  res.render('index');
});

// 入库页面
app.get('/inbound', (req, res) => {
  res.render('inbound');
});

// 出库页面
app.get('/outbound', (req, res) => {
  res.render('outbound');
});

// 库存查询页面
app.get('/inventory', (req, res) => {
  const query = `
    SELECT p.id, p.barcode, p.name, p.type, p.unit, 
           i.batch_number, i.quantity, i.production_date, i.expiry_date
    FROM products p
    JOIN inventory i ON p.id = i.product_id
    WHERE i.quantity > 0
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching inventory');
    } else {
      res.render('inventory', { inventory: rows });
    }
  });
});

// 过期预警页面
app.get('/expiry', (req, res) => {
  const query = `
    SELECT p.id, p.barcode, p.name, p.type, p.unit, 
           i.batch_number, i.quantity, i.production_date, i.expiry_date
    FROM products p
    JOIN inventory i ON p.id = i.product_id
    WHERE i.quantity > 0 AND i.expiry_date < date('now', '+30 days')
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching expiry data');
    } else {
      res.render('expiry', { products: rows });
    }
  });
});

// 扫码查询商品
app.post('/api/scan', (req, res) => {
  const { barcode } = req.body;
  
  const query = 'SELECT * FROM products WHERE barcode = ?';
  db.get(query, [barcode], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    } else if (row) {
      res.json({ found: true, product: row });
    } else {
      res.json({ found: false, message: 'Product not found' });
    }
  });
});

// 入库处理
app.post('/api/inbound', (req, res) => {
  const { barcode, name, type, unit, batchNumber, quantity, productionDate, expiryDate } = req.body;
  
  // 先检查商品是否存在
  const checkQuery = 'SELECT * FROM products WHERE barcode = ?';
  db.get(checkQuery, [barcode], (err, product) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    let productId;
    if (product) {
      productId = product.id;
    } else {
      // 不存在则创建新商品
      const insertProductQuery = 'INSERT INTO products (barcode, name, type, unit) VALUES (?, ?, ?, ?)';
      db.run(insertProductQuery, [barcode, name, type, unit], function(err) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to create product' });
          return;
        }
        productId = this.lastID;
        processInbound();
      });
    }
    
    if (product) {
      processInbound();
    }
    
    function processInbound() {
      // 检查库存中是否已有该批次
      const checkInventoryQuery = 'SELECT * FROM inventory WHERE product_id = ? AND batch_number = ?';
      db.get(checkInventoryQuery, [productId, batchNumber], (err, inventory) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Database error' });
          return;
        }
        
        if (inventory) {
          // 更新现有库存
          const updateQuery = 'UPDATE inventory SET quantity = quantity + ? WHERE id = ?';
          db.run(updateQuery, [quantity, inventory.id], (err) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'Failed to update inventory' });
              return;
            }
            recordInbound();
          });
        } else {
          // 创建新库存记录
          const insertInventoryQuery = 'INSERT INTO inventory (product_id, batch_number, quantity, production_date, expiry_date) VALUES (?, ?, ?, ?, ?)';
          db.run(insertInventoryQuery, [productId, batchNumber, quantity, productionDate, expiryDate], (err) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'Failed to create inventory' });
              return;
            }
            recordInbound();
          });
        }
      });
    }
    
    function recordInbound() {
      // 记录入库
      const insertInboundQuery = 'INSERT INTO inbound (product_id, batch_number, quantity, production_date, expiry_date) VALUES (?, ?, ?, ?, ?)';
      db.run(insertInboundQuery, [productId, batchNumber, quantity, productionDate, expiryDate], (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to record inbound' });
          return;
        }
        res.json({ success: true, message: 'Inbound recorded successfully' });
      });
    }
  });
});

// 出库处理
app.post('/api/outbound', (req, res) => {
  const { barcode, batchNumber, quantity } = req.body;
  
  // 查找商品
  const findProductQuery = 'SELECT * FROM products WHERE barcode = ?';
  db.get(findProductQuery, [barcode], (err, product) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (!product) {
      res.json({ success: false, message: 'Product not found' });
      return;
    }
    
    // 检查库存
    const checkInventoryQuery = 'SELECT * FROM inventory WHERE product_id = ? AND batch_number = ? AND quantity >= ?';
    db.get(checkInventoryQuery, [product.id, batchNumber, quantity], (err, inventory) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      
      if (!inventory) {
        res.json({ success: false, message: 'Insufficient inventory' });
        return;
      }
      
      // 更新库存
      const updateQuery = 'UPDATE inventory SET quantity = quantity - ? WHERE id = ?';
      db.run(updateQuery, [quantity, inventory.id], (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to update inventory' });
          return;
        }
        
        // 记录出库
        const insertOutboundQuery = 'INSERT INTO outbound (product_id, batch_number, quantity) VALUES (?, ?, ?)';
        db.run(insertOutboundQuery, [product.id, batchNumber, quantity], (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to record outbound' });
            return;
          }
          res.json({ success: true, message: 'Outbound recorded successfully' });
        });
      });
    });
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  
  // 获取网络IP地址
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let networkIp = '192.168.10.13'; // 默认使用无线局域网IP
  
  // 优先使用无线局域网适配器的IP地址
  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal && name.includes('WLAN')) {
        networkIp = addr.address;
        break;
      }
    }
  }
  
  console.log(`Network access: http://${networkIp}:${PORT}`);
  console.log('请确保手机和电脑在同一网络下，使用上述网络地址访问');
  console.log('例如：在手机浏览器中输入 http://192.168.10.13:3000');
});