const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Crée le dossier et le fichier si ils existent pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('[OK] Dossier data créé');
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]');
  console.log('[OK] users.json créé');
}

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('[ERR] Lecture users.json:', e.message);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (e) {
    console.error('[ERR] Ecriture users.json:', e.message);
    return false;
  }
}

// INSCRIPTION CLIENT
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  console.log('[REGISTER] Tentative:', email);
  
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email déjà utilisé' });
  }

  const hash = await bcrypt.hash(password, 10);
  users.push({ id: Date.now(), email, username, password: hash, role: 'client' });
  
  if (saveUsers(users)) {
    console.log('[REGISTER] OK:', email);
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erreur écriture fichier' });
  }
});

// CONNEXION CLIENT
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN] Tentative:', email);
  
  const users = readUsers();
  const user = users.find(u => u.email === email && u.role === 'client');
  
  if (!user) {
    console.log('[LOGIN] Email introuvable:', email);
    return res.status(401).json({ error: 'Invalid credential' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    console.log('[LOGIN] Mauvais mot de passe pour:', email);
    return res.status(401).json({ error: 'Invalid credential' });
  }

  console.log('[LOGIN] OK:', email);
  res.json({ success: true, user: { email: user.email, username: user.username } });
});

app.listen(3000, () => console.log('Serveur lancé sur http://localhost:3000'));
