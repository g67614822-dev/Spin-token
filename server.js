const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const files = {
  users: path.join(DATA_DIR, 'users.json'),
  prices: path.join(DATA_DIR, 'prices.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  settings: path.join(DATA_DIR, 'settings.json')
};

function readFile(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Init admin
if (!fs.existsSync(files.users)) {
  const adminPass = bcrypt.hashSync('admin123', 10);
  writeFile(files.users, [{ id: 1, email: 'admin@panel.com', password: adminPass, role: 'admin' }]);
}
if (!fs.existsSync(files.prices)) writeFile(files.prices, []);
if (!fs.existsSync(files.orders)) writeFile(files.orders, []);
if (!fs.existsSync(files.settings)) writeFile(files.settings, { operators: [] });

// Middleware auth
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
function adminOnly(req, res, next) {
  if (req.user.role!== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// Auth routes
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  const users = readFile(files.users);
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const user = { id: Date.now(), email, password: bcrypt.hashSync(password, 10), role: 'user' };
  users.push(user);
  writeFile(files.users, users);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readFile(files.users);
  const user = users.find(u => u.email === email);
  if (!user ||!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

// Public routes
app.get('/api/prices', (req, res) => res.json(readFile(files.prices)));
app.get('/api/settings', (req, res) => res.json(readFile(files.settings)));

// Order route
app.post('/api/order', auth, (req, res) => {
  const { uid, pseudo, packId, senderNumber, reference } = req.body;
  const orders = readFile(files.orders);
  const order = { id: Date.now(), userId: req.user.id, uid, pseudo, packId, senderNumber, reference, status: 'pending', date: new Date().toISOString() };
  orders.push(order);
  writeFile(files.orders, orders);
  res.json({ ok: true, order });
});
app.get('/api/myorders', auth, (req, res) => {
  const orders = readFile(files.orders).filter(o => o.userId === req.user.id);
  res.json(orders);
});

// Admin routes
app.get('/api/admin/orders', auth, adminOnly, (req, res) => res.json(readFile(files.orders)));
app.post('/api/admin/price', auth, adminOnly, (req, res) => {
  const prices = readFile(files.prices);
  const price = { id: Date.now(),...req.body };
  prices.push(price);
  writeFile(files.prices, prices);
  res.json(price);
});
app.put('/api/admin/price/:id', auth, adminOnly, (req, res) => {
  let prices = readFile(files.prices);
  prices = prices.map(p => p.id == req.params.id? {...p,...req.body } : p);
  writeFile(files.prices, prices);
  res.json({ ok: true });
});
app.post('/api/admin/operator', auth, adminOnly, (req, res) => {
  const settings = readFile(files.settings);
  settings.operators.push({ id: Date.now(),...req.body });
  writeFile(files.settings, settings);
  res.json({ ok: true });
});
app.put('/api/admin/order/:id', auth, adminOnly, (req, res) => {
  let orders = readFile(files.orders);
  orders = orders.map(o => o.id == req.params.id? {...o, status: req.body.status } : o);
  writeFile(files.orders, orders);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
