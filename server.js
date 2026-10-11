const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'database.json');

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      config: {
        appName: "Innocent Extreme VPN",
        whatsappNumber: "+923702534697",
        telegramHandle: "@ayazbagrani",
        telegramChannel: "https://t.me/ayazbagrani"
      },
      networks: [
        {
          id: "jazz",
          name: "Jazz PK",
          badgeColor: "#FFB800",
          tweaks: [
            {
              id: "jazz_yt",
              title: "Jazz (YouTube)",
              serverIp: "104.18.22.45",
              port: 443,
              sni: "m.youtube.com"
            },
            {
              id: "jazz_tamasha",
              title: "Jazz Tamasha Bug (Zero MB)",
              serverIp: "104.18.23.10",
              port: 443,
              sni: "tamashaweb.com"
            }
          ]
        },
        {
          id: "ufone",
          name: "Ufone PK",
          badgeColor: "#FF6F00",
          tweaks: [
            {
              id: "ufone_social",
              title: "Ufone Social VIP (FB/WA Host)",
              serverIp: "172.67.180.12",
              port: 443,
              sni: "m.facebook.com"
            }
          ]
        },
        {
          id: "zong",
          name: "Zong 4G",
          badgeColor: "#00E676",
          tweaks: [
            {
              id: "zong_tiktok",
              title: "Zong TikTok Package Bug",
              serverIp: "104.17.65.1",
              port: 443,
              sni: "api.tiktokv.com"
            }
          ]
        },
        {
          id: "telenor",
          name: "Telenor PK",
          badgeColor: "#00A3E0",
          tweaks: [
            {
              id: "telenor_free",
              title: "Telenor Unlimited Free Host",
              serverIp: "104.21.40.90",
              port: 80,
              sni: "apps.telenor.com.pk"
            }
          ]
        }
      ],
      users: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 1. Android App: Contacts Config Fetch
app.get('/api/config', (req, res) => {
  const db = getDB();
  res.json({ success: true, data: db.config });
});

// 2. Android App: Networks & Tweaks Fetch
app.get('/api/networks', (req, res) => {
  const db = getDB();
  res.json({ success: true, networks: db.networks });
});

// 3. Admin Panel: Update Contacts
app.post('/api/admin/config', (req, res) => {
  const { whatsappNumber, telegramHandle, telegramChannel } = req.body;
  const db = getDB();

  if (whatsappNumber) db.config.whatsappNumber = whatsappNumber;
  if (telegramHandle) db.config.telegramHandle = telegramHandle;
  if (telegramChannel) db.config.telegramChannel = telegramChannel;

  saveDB(db);
  res.json({ success: true, message: "Settings updated successfully!", config: db.config });
});

// 4. Admin Panel: Create User (Paid / Trial / Free)
app.post('/api/admin/create-user', (req, res) => {
  const { name, accountType, quotaGB, durationHours } = req.body;
  const db = getDB();

  const code = accountType === 'TRIAL'
    ? 'TRIAL-' + Math.floor(100000 + Math.random() * 900000)
    : 'VIP-' + Math.floor(100000 + Math.random() * 900000);

  const newUser = {
    id: Date.now().toString(),
    name: name || "User",
    code: code,
    accountType: accountType || 'TRIAL',
    totalGB: parseFloat(quotaGB) || 2.0,
    usedGB: 0.0,
    expiresAt: new Date(Date.now() + (parseInt(durationHours) || 24) * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE'
  };

  db.users.push(newUser);
  saveDB(db);
  res.json({ success: true, user: newUser });
});

// 5. Admin Panel: Fetch All Users
app.get('/api/admin/users', (req, res) => {
  const db = getDB();
  res.json({ success: true, users: db.users });
});

// 6. Android App: Verify Code & Fetch Live GB Usage
app.post('/api/user/verify-code', (req, res) => {
  const { code } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.code === code);

  if (!user) {
    return res.status(404).json({ success: false, message: "Invalid Trial / VIP Code!" });
  }

  const isExpired = new Date() > new Date(user.expiresAt);
  if (isExpired || user.usedGB >= user.totalGB) {
    user.status = 'EXPIRED';
    saveDB(db);
    return res.status(403).json({ success: false, message: "Code Expired!" });
  }

  const remainingGB = Math.max(0, user.totalGB - user.usedGB).toFixed(3);

  res.json({
    success: true,
    data: {
      name: user.name,
      code: user.code,
      accountType: user.accountType,
      totalGB: user.totalGB,
      usedGB: user.usedGB.toFixed(3),
      remainingGB: remainingGB,
      expiresAt: user.expiresAt,
      status: user.status
    }
  });
});

app.listen(PORT, () => {
  console.log(`Innocent Extreme VPN backend running on http://localhost:${PORT}`);
});
