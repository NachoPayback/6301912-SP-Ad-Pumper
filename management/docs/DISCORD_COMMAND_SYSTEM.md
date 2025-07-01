# Discord Command System

## 🎯 Overview

The Discord integration has been **completely redesigned** to eliminate spam and provide **on-demand control**:

**OLD SYSTEM (Spammy):** Every user action automatically sent to Discord
**NEW SYSTEM (Smart):** Discord is your **command & control center**

## 🚀 How It Works

### Architecture
- **Supabase Database:** Stores all user data, analytics, and ad interactions
- **Discord Controller:** Checks for commands and responds with data on-demand
- **No More Spam:** Discord only gets what you request

### Command Flow
1. You update a command file (GitHub Gist, file, or API endpoint)
2. Extension checks for new commands every 30 seconds
3. Commands are executed and results sent to Discord
4. Clean, organized responses instead of constant spam

## 📋 Available Commands

### `test_connection`
Tests if the command system is working
```json
{
  "action": "test_connection",
  "params": {}
}
```

### `get_analytics_summary`
Get comprehensive analytics for a time period
```json
{
  "action": "get_analytics_summary",
  "params": {
    "timeframe": "24h"  // Options: "24h", "7d"
  }
}
```

### `get_user_stats`
Get detailed stats for a specific user
```json
{
  "action": "get_user_stats",
  "params": {
    "userId": "user_12345_abc"
  }
}
```

### `update_user_settings`
Remotely change a user's ad settings
```json
{
  "action": "update_user_settings",
  "params": {
    "userId": "user_12345_abc",
    "settings": {
      "slot_mode": "aggressive",      // light, normal, aggressive, stealth, custom
      "banners_per_page": 5,
      "toasts_per_session": 3,
      "preroll_enabled": true
    }
  }
}
```

### `get_active_users`
Get list of users active in the last 24 hours
```json
{
  "action": "get_active_users",
  "params": {}
}
```

### `emergency_disable`
Immediately disable the extension for all users
```json
{
  "action": "emergency_disable",
  "params": {}
}
```

## 🔧 Setup Instructions

### Step 1: Create Command Endpoint
You can use any of these methods to host your commands:

**Option A: GitHub Gist**
1. Create a new GitHub Gist
2. Name it `discord-commands.json`
3. Add your commands in the format shown below

**Option B: GitHub Repository File**
1. Add `discord-commands.json` to your config repository
2. Use the raw URL as the command endpoint

**Option C: Simple API Endpoint**
Host a simple API that returns command JSON

### Step 2: Command File Format
```json
{
  "timestamp": 1704067200000,  // Unix timestamp - increment to trigger new commands
  "commands": [
    {
      "action": "get_analytics_summary",
      "params": { "timeframe": "24h" }
    }
  ]
}
```

### Step 3: Update Command URL
Currently set to: `https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/discord-commands.json`

## 💡 Usage Examples

### Get Daily Analytics Report
1. Update your command file:
```json
{
  "timestamp": 1704067200001,
  "commands": [
    { "action": "get_analytics_summary", "params": { "timeframe": "24h" } }
  ]
}
```
2. Wait up to 30 seconds
3. Receive formatted analytics in Discord

### Check Specific User
1. Get user ID from analytics
2. Update command file:
```json
{
  "timestamp": 1704067200002,
  "commands": [
    { "action": "get_user_stats", "params": { "userId": "user_12345_abc" } }
  ]
}
```

### Remotely Control User Settings
1. Update command file:
```json
{
  "timestamp": 1704067200003,
  "commands": [
    {
      "action": "update_user_settings",
      "params": {
        "userId": "user_12345_abc",
        "settings": {
          "slot_mode": "light",
          "banners_per_page": 1,
          "toasts_per_session": 0
        }
      }
    }
  ]
}
```

## 🛡️ Security Features

- **No Automatic Spam:** Only requested data is sent
- **Command-Based:** You control what and when data is sent
- **Timestamp Protection:** Commands only execute if timestamp is newer
- **Error Handling:** Failed commands report errors to Discord
- **Emergency Disable:** Instant kill switch for all users

## 📊 Response Format

All Discord responses use clean, formatted embeds with:
- **Color coding:** Green (success), Red (error), Blue (info)
- **Structured fields:** Easy to read data organization
- **Timestamps:** When the data was collected
- **Context:** Domain, user info, etc.

## 🔄 Automatic Features

The extension **ONLY** sends these to Discord automatically:
- **Critical Errors:** System failures, security alerts
- **Status Updates:** Extension online/offline notifications
- **Emergency Events:** Only truly urgent issues

**Everything else is on-demand only!**

## 🎯 Benefits

✅ **No Discord Spam** - Clean, organized communications
✅ **On-Demand Data** - Get exactly what you need, when you need it
✅ **Remote Control** - Change user settings from Discord
✅ **Real-Time Analytics** - Instant access to Supabase data
✅ **Emergency Controls** - Instant disable capabilities
✅ **Structured Responses** - Professional formatted outputs

This system gives you **complete control** over your Discord channel while maintaining full access to all your analytics data! 