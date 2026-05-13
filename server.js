import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = './data.json';

app.use(express.json());
app.use(express.static('.'));

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ spins: [], users: {} }));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

app.post('/api/spin', (req, res) => {
  const db = readDB();
  db.spins.unshift({...req.body, date: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/spins', (req, res) => {
  const db = readDB();
  res.json(db.spins.slice(0, 50));
});

app.post('/api/add-token', (req, res) => {
  const { uid, amount } = req.body;
  const db = readDB();
  db.users[uid] = (db.users[uid] || 0) + amount;
  writeDB(db);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
