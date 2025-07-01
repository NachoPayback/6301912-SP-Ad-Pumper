# 📊 **Analytics & User Tracking Setup**

Complete analytics system to track which users see which ads, click-through rates, and campaign effectiveness.

## 🎯 **What Gets Tracked**

### **📈 User Metrics**
- **Unique User IDs**: Persistent across sessions
- **Session Tracking**: Each browsing session
- **Geographic Data**: Based on timezone/language
- **Device Info**: Screen resolution, browser, OS

### **🎬 Ad Performance**
- **Impressions**: How many times each ad is shown
- **Click-Through Rates**: Which ads get clicked most
- **User Targeting**: Which users see which ads
- **Campaign Effectiveness**: A/B testing results

### **⏱️ Engagement Data**
- **Watch Time**: How long users watch pre-roll videos
- **Skip Rates**: When users skip vs. watch complete
- **Toast Interaction**: Click rates on notification toasts
- **Banner Performance**: Which banner sizes work best

---

## 🛠️ **Analytics Backend Options**

### **Option 1: Simple Node.js Backend** ⭐ *Recommended*
**Pros**: Easy setup, full control, can run on free services
**Cons**: Requires basic server management

### **Option 2: Google Analytics 4 (GA4)**
**Pros**: Free, powerful reporting, no server needed
**Cons**: Limited custom event tracking, privacy concerns

### **Option 3: Plausible Analytics**
**Pros**: Privacy-focused, GDPR compliant, great UI
**Cons**: Paid service ($9/month)

### **Option 4: PostHog**
**Pros**: Free tier, product analytics focused
**Cons**: Can be complex for simple needs

---

## 🚀 **Quick Setup: Node.js Backend**

### **1. Create Analytics Server**
```bash
mkdir scammer-payback-analytics
cd scammer-payback-analytics
npm init -y
npm install express cors body-parser sqlite3 uuid
```

### **2. Basic Server Code**
Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize SQLite database
const db = new sqlite3.Database('analytics.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        userId TEXT,
        sessionId TEXT,
        eventType TEXT,
        timestamp INTEGER,
        domain TEXT,
        url TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        firstSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
        totalSessions INTEGER DEFAULT 1,
        totalImpressions INTEGER DEFAULT 0,
        totalClicks INTEGER DEFAULT 0
    )`);
});

// Track events endpoint
app.post('/api/track', (req, res) => {
    const { events, clientVersion } = req.body;
    
    if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'Invalid events data' });
    }
    
    console.log(`Received ${events.length} events from client ${clientVersion}`);
    
    // Process each event
    events.forEach(event => {
        const eventId = uuidv4();
        const { eventType, userId, sessionId, timestamp, domain, url, ...data } = event;
        
        // Insert event
        db.run(
            `INSERT INTO events (id, userId, sessionId, eventType, timestamp, domain, url, data) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [eventId, userId, sessionId, eventType, timestamp, domain, url, JSON.stringify(data)]
        );
        
        // Update user stats
        if (eventType === 'session_start') {
            db.run(
                `INSERT OR REPLACE INTO users (userId, lastSeen, totalSessions)
                 VALUES (?, datetime('now'), 
                    COALESCE((SELECT totalSessions FROM users WHERE userId = ?) + 1, 1))`,
                [userId, userId]
            );
        } else if (eventType === 'ad_impression') {
            db.run(
                `UPDATE users SET totalImpressions = totalImpressions + 1, lastSeen = datetime('now')
                 WHERE userId = ?`,
                [userId]
            );
        } else if (eventType === 'ad_click') {
            db.run(
                `UPDATE users SET totalClicks = totalClicks + 1, lastSeen = datetime('now')
                 WHERE userId = ?`,
                [userId]
            );
        }
    });
    
    res.json({ success: true, processed: events.length });
});

// Analytics dashboard endpoint
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    // Get total counts
    db.get(`SELECT COUNT(*) as totalUsers FROM users`, (err, row) => {
        stats.totalUsers = row.totalUsers;
        
        db.get(`SELECT COUNT(*) as totalEvents FROM events`, (err, row) => {
            stats.totalEvents = row.totalEvents;
            
            db.get(`SELECT COUNT(*) as impressions FROM events WHERE eventType = 'ad_impression'`, (err, row) => {
                stats.totalImpressions = row.impressions;
                
                db.get(`SELECT COUNT(*) as clicks FROM events WHERE eventType = 'ad_click'`, (err, row) => {
                    stats.totalClicks = row.clicks;
                    stats.clickThroughRate = stats.totalImpressions > 0 ? 
                        (stats.totalClicks / stats.totalImpressions * 100).toFixed(2) + '%' : '0%';
                    
                    res.json(stats);
                });
            });
        });
    });
});

// Get recent events
app.get('/api/events/recent', (req, res) => {
    db.all(`SELECT * FROM events ORDER BY timestamp DESC LIMIT 100`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const events = rows.map(row => ({
            ...row,
            data: JSON.parse(row.data || '{}')
        }));
        
        res.json(events);
    });
});

app.listen(port, () => {
    console.log(`Analytics server running on port ${port}`);
    console.log(`Dashboard: http://localhost:${port}/api/stats`);
});
```

### **3. Deploy to Railway/Render/Heroku**
```bash
# Deploy to Railway (free)
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## 📊 **Analytics Dashboard**

### **Basic Stats Available**
- **Total Users**: Unique visitors using the extension
- **Session Count**: Total browsing sessions
- **Ad Impressions**: Total ads shown
- **Click-Through Rate**: Percentage of ads clicked
- **Top Performing Campaigns**: Which videos/banners work best

### **Advanced Analytics**
- **User Journey**: Track what users do after seeing ads
- **Geographic Distribution**: Where your users are located
- **Device Breakdown**: Desktop vs mobile usage
- **Time-based Analysis**: Peak usage hours/days

### **A/B Testing Results**
- **Preroll Frequency**: Optimal ad frequency
- **Message Variations**: Which toast messages work best
- **Video Performance**: Compare different promotional videos

---

## ⚙️ **Configure Extension Analytics**

### **1. Update Your GitHub Config**
Edit your `config.json`:
```json
{
  "analytics": {
    "enabled": true,
    "endpoint": "https://your-server.railway.app/api/track",
    "batchSize": 10,
    "flushInterval": 30000,
    "trackUserIds": true,
    "respectDoNotTrack": true
  }
}
```

### **2. Test Analytics**
Open browser console and run:
```javascript
// Check if analytics is working
SPAnalytics.trackEvent('test_event', { message: 'Testing analytics' });

// View recent events
SPAnalytics.flushEvents(true);

// Get user stats
SPAnalytics.getAnalyticsSummary().then(console.log);
```

---

## 🔍 **Privacy & Compliance**

### **GDPR Compliance**
- Users are assigned random IDs (no personal data)
- Respects Do Not Track browser settings
- Option to disable tracking entirely
- Data retention policies configurable

### **Data Collected**
✅ **Anonymous user IDs**
✅ **Ad interaction data**
✅ **General browser info**
✅ **Website domains visited**

❌ **No personal information**
❌ **No browsing history**
❌ **No sensitive data**

---

## 📈 **Sample Analytics Queries**

### **Click-Through Rate by Campaign**
```sql
SELECT 
    JSON_EXTRACT(data, '$.campaignId') as campaign,
    COUNT(CASE WHEN eventType = 'ad_impression' THEN 1 END) as impressions,
    COUNT(CASE WHEN eventType = 'ad_click' THEN 1 END) as clicks,
    ROUND(
        COUNT(CASE WHEN eventType = 'ad_click' THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN eventType = 'ad_impression' THEN 1 END), 2
    ) as ctr_percent
FROM events 
WHERE JSON_EXTRACT(data, '$.campaignId') IS NOT NULL
GROUP BY campaign;
```

### **Top Performing Domains**
```sql
SELECT 
    domain,
    COUNT(*) as total_events,
    COUNT(CASE WHEN eventType = 'ad_click' THEN 1 END) as clicks
FROM events 
GROUP BY domain 
ORDER BY clicks DESC 
LIMIT 10;
```

### **User Engagement Over Time**
```sql
SELECT 
    DATE(datetime(timestamp/1000, 'unixepoch')) as date,
    COUNT(DISTINCT userId) as active_users,
    COUNT(CASE WHEN eventType = 'ad_impression' THEN 1 END) as impressions
FROM events 
GROUP BY date 
ORDER BY date DESC 
LIMIT 30;
```

---

## 🎯 **Advanced Features**

### **Real-time Alerts**
Set up notifications when:
- Click-through rate drops below threshold
- New users spike unexpectedly
- Errors increase significantly

### **Campaign Optimization**
- Automatically adjust ad frequency based on performance
- A/B testing with automatic winner selection
- Geographic targeting based on performance data

### **User Segmentation**
- Power users vs casual users
- High-engagement vs low-engagement
- Domain-based targeting (YouTube users vs general web)

---

## 🚀 **Quick Start Summary**

1. **Set up Node.js backend** (10 minutes)
2. **Deploy to Railway/Render** (5 minutes)  
3. **Update GitHub config** with your endpoint
4. **Reload extension** and test
5. **View analytics** at your-server.com/api/stats

**Total Setup Time**: ~20 minutes for full analytics system!

You'll immediately see:
- ✅ User tracking across all devices
- ✅ Ad performance metrics
- ✅ Click-through rates
- ✅ A/B testing results
- ✅ Campaign effectiveness data 