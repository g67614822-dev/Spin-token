import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

// Crée data.json si il existe pas
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ spins: [], users: {} }));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// API
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
  db.users[uid] = (db.users[uid] || 0) + Number(amount);
  writeDB(db);
  res.json({ ok: true });
});

// Sert le frontend pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
