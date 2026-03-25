# Qbits String Sizing Calculator

**Server-side calculation engine + lightweight frontend**
All logic and data stays on your server. Frontend is display-only.

---

## Architecture

```
Browser (public)              AWS Server (private)
─────────────────             ──────────────────────
public/index.html   ──POST──►  server.js
  - UI only                      ├── api/engine.js  ← ALL LOGIC HERE
  - No data                      └── api/data.js    ← ALL DATA HERE
  - No logic
  - Calls /api/*              Returns JSON results only
```

**What the browser sees:** Dropdown labels, calculated results, ratings.
**What the browser NEVER sees:** Inverter specs, panel data, rating thresholds, MPPT algorithm.

---

## Files

```
qbits-calc/
├── server.js           ← Express server (entry point)
├── package.json        ← Dependencies
├── api/
│   ├── data.js         ← Inverter & panel database (PRIVATE)
│   └── engine.js       ← Calculation engine (PRIVATE)
└── public/
    └── index.html      ← Frontend (PUBLIC, display only)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/options` | Panel & inverter dropdown lists (labels only, no specs) |
| POST | `/api/calculate` | Main calculation — returns everything |
| POST | `/api/voltage-bar` | Voltage bar data for custom panel count |
| GET | `/api/health` | Health check |

### POST /api/calculate
```json
{
  "panelWp": 610,
  "inverterId": "QB-17KTLC",
  "totalPanels": 47,
  "tMin": -5,
  "tMax": 50
}
```

### POST /api/voltage-bar
```json
{
  "panelWp": 610,
  "inverterId": "QB-17KTLC",
  "panelsPerString": 15,
  "tMin": -5,
  "tMax": 50
}
```

---

## Deployment on AWS

### 1. Upload to server
```bash
scp -r qbits-calc/ ubuntu@your-server-ip:/home/ubuntu/
```

### 2. Install dependencies
```bash
cd /home/ubuntu/qbits-calc
npm install
```

### 3. Test locally
```bash
node server.js
# ⚡ Server: http://localhost:3000
```

### 4. Run with PM2 (production)
```bash
# Install PM2 if not already
npm install -g pm2

# Start
pm2 start server.js --name qbits-calc

# Auto-restart on reboot
pm2 save
pm2 startup
```

### 5. Nginx reverse proxy (for tools.qbitsenergy.com)
Add to your Nginx config:

```nginx
server {
    listen 80;
    server_name tools.qbitsenergy.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then:
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# SSL with Certbot
sudo certbot --nginx -d tools.qbitsenergy.com
```

### 6. DNS
Add an A record in your domain DNS:
```
tools.qbitsenergy.com  →  A  →  your-aws-elastic-ip
```

---

## Adding New Inverters

Edit `api/data.js` → add to the INVERTERS array:
```javascript
{
  id: "QB-50KTLC",
  model: "QB-50KTLC",
  series: "TLC",
  phase: "3-Ph",
  mpptCount: 2,
  maxDcV: 1100,
  mpptMin: 200,
  mpptMax: 1000,
  maxDcI: [30, 30],
  stringsPerMppt: [3, 3],
  ratedPower: 50000,
  maxOutputPower: 55000,
  maxOutputCurrent: 80,
  gridV: 400,
  recV: 650,
}
```

Then restart:
```bash
pm2 restart qbits-calc
```

---

## Adding New Panels

Edit `api/data.js` → add to the PANELS array:
```javascript
{ wp: 650, vmp: 43.20, imp: 15.10, voc: 51.50, isc: 16.10 },
```

---

## Environment

- **Node.js:** 18+ recommended
- **Port:** Default 3000 (change in server.js or set PORT env var)
- **CORS:** Configured for qbitsenergy.com — update in server.js if needed

---

© Qbits Energy — A Heaven Green Energy Limited Brand
