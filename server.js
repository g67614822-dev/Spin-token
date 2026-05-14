const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const PAYMENTS_FILE = path.join(__dirname, 'payments.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialisation des fichiers JSON si inexistants
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, '[]');
}

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify({
    ff: { title: "Free Fire", sections: [] },
    pubg: { title: "PUBG", sections: [] },
    mlbb: { title: "Mobile Legends", sections: [] },
    bs: { title: "Blood Strike", sections: [] }
  }, null, 2));
}

if (!fs.existsSync(PAYMENTS_FILE)) {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify([
    {
      name: "mvola",
      nameDisplay: "MVOLA",
      number: "0346615939",
      img: "https://i.supaimg.com/41a936fe-94cb-4a81-b51b-50ed3ddf5cf6/6d8efa53-9a5a-4228-8eb7-68e7e9c591b9.jpg",
      ussd: "*111*1*2*0346615939*montant*2*0%23#"
    },
    {
      name: "airtel",
      nameDisplay: "AIRTEL",
      number: "0337294466",
      img: "https://i.supaimg.com/41a936fe-94cb-4a81-b51b-50ed3ddf5cf6/49912d1d-00aa-497c-8a19-d35ff276299b.jpg",
      ussd: "*436*2*1*0337294466%23"
    }
  ], null, 2));
}

// ================= ORDERS API =================
app.post('/api/order', (req, res) => {
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString('fr-MG'),
   ...req.body
  };
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  orders.unshift(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  res.json({ success: true, order });
});

app.get('/api/orders', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  res.json(orders);
});

// ================= PRODUCTS API =================
app.get('/api/products', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(PRODUCTS_FILE)));
});

app.post('/api/products', (req, res) => {
  const { game, section, q, p, img } = req.body;
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));

  let sec = products[game].sections.find(s => s.name === section);
  if (!sec) {
    sec = { name: section, items: [] };
    products[game].sections.push(sec);
  }
  sec.items.push({ q, p, img });

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true });
});

app.post('/api/products/delete', (req, res) => {
  const { game, section, index } = req.body;
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  const s = products[game].sections.find(s => s.name === section);
  if (s) s.items.splice(index, 1);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true });
});

// ================= PAYMENTS API =================
app.get('/api/payments', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(PAYMENTS_FILE)));
});

app.post('/api/payments', (req, res) => {
  const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE));
  payments.push(req.body);
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
  res.json({ success: true });
});

app.post('/api/payments/delete', (req, res) => {
  const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE));
  payments.splice(req.body.index, 1);
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
  res.json({ success: true });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
