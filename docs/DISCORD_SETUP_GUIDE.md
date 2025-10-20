# 🚀 Discord Community Setup - Quick Start Guide

## ✅ What's Been Created

1. **Discord Setup Script** (`/scripts/discord-setup.ts`)
   - Automated creation of 20+ roles
   - 50+ channels organized in 10 categories
   - Voice channels
   - Proper permissions and restrictions

2. **Environment Configuration** (`env.example`)
   - Added Discord bot token variable
   - Added Discord guild ID variable

3. **NPM Script** (`package.json`)
   - `npm run discord:setup` command added

4. **Documentation** (`/scripts/README.md`)
   - Complete setup instructions
   - Post-setup configuration guide
   - Troubleshooting section

---

## 🎯 How to Run

### Step 1: Add Your Credentials to .env.local

Create or update `.env.local` in the root directory:

```bash
# Copy from env.example first if you don't have .env.local
cp env.example .env.local
```

Then add your Discord credentials at the bottom:

```env
DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_GUILD_ID="YOUR_SERVER_ID_HERE"
```

### Step 2: Run the Setup Script

```bash
npm run discord:setup
```

The script will:

- ✅ Create all roles with proper colors and permissions
- ✅ Create all categories
- ✅ Create all text channels with descriptions
- ✅ Create all voice channels
- ✅ Set up role-restricted channels
- ✅ Configure rate limits on support channels

**Expected Duration:** 2-3 minutes

---

## 📋 What You'll Get

### 20 Roles

- Staff roles (Founder, Admin, Moderator, Support)
- Community tiers (OG, Active, New Tripper)
- Traveler types (Solo, Couple, Family, Friends, Honeymoon)
- Experience levels (Explorer, Adventurer, Globetrotter, Legend)
- Regional roles (Americas, Europe, Asia-Pacific, Africa & ME)

### 10 Channel Categories

1. **WELCOME & INFO** - Server intro, rules, role assignment
2. **COMMUNITY** - General chat, introductions, memes
3. **TRAVEL TALK** - Planning, tips, budget/luxury travel
4. **BY REGION** - Regional travel discussions
5. **BY TRAVELER TYPE** - Role-restricted channels for each type
6. **SHARE YOUR JOURNEY** - Photos, bitácoras, videos, live updates
7. **GETRANDOMTRIP** - Product questions, feedback, support
8. **SUPPORT** - Help desk, bug reports, FAQ
9. **EVENTS & ACTIVITIES** - Events, deals, competitions
10. **VOICE CHANNELS** - 5 voice channels for different purposes

---

## 🔧 Post-Setup Tasks

After running the script, you'll need to:

### 1. Lock Read-Only Channels ⚠️

Go to these channels and disable "Send Messages" for @everyone:

- #welcome
- #announcements
- #rules
- #faq

### 2. Create Welcome Message 📝

Paste this in `#welcome`:

```
👋 Welcome to GetRandomTrip Community, @everyone!

We're excited to have you join our community of adventurous travelers!

🚀 **Get Started:**
1️⃣ Read the <#rules>
2️⃣ Grab your roles in <#get-your-role>
3️⃣ Introduce yourself in <#introductions>
4️⃣ Start exploring and chatting!

🎲 **Ready for your next random adventure?**
Visit: https://getrandomtrip.com

Happy travels! ✈️
```

### 3. Set Up Reaction Roles 🎭

Use **Carl-bot** in `#get-your-role`:

```
**Choose Your Traveler Type:**

🧳 - Solo Traveler
💑 - Couple Traveler
👨‍👩‍👧‍👦 - Family Traveler
👯 - Friends Traveler
🌙 - Honeymoon Traveler

**Choose Your Regions:**

🌎 - Americas
🌍 - Europe
🌏 - Asia-Pacific
🗺️ - Africa & Middle East
```

### 4. Install Bots 🤖

Recommended bots:

- **Carl-bot** - Reaction roles
- **MEE6** - Leveling & moderation
- **Dyno** - Auto-moderation
- **Ticket Tool** - Support tickets

### 5. Configure Server 🔧

- Set AFK channel to "🔇 AFK"
- Enable Community Features (for Welcome Screen)
- Set server icon (from `/public/assets/logos/`)
- Add server banner

---

## 📊 Channel Structure Overview

```
📁 WELCOME & INFO
  └─ #welcome (read-only)
  └─ #announcements (read-only)
  └─ #rules (read-only)
  └─ #get-your-role

📁 COMMUNITY
  └─ #general-chat
  └─ #introductions
  └─ #off-topic
  └─ #travel-memes

📁 TRAVEL TALK
  └─ #trip-planning
  └─ #destination-ideas
  └─ #travel-tips
  └─ #budget-travel
  └─ #luxury-escapes

📁 BY REGION
  └─ #americas
  └─ #europe
  └─ #asia-pacific
  └─ #africa-middle-east

📁 BY TRAVELER TYPE (Role-restricted)
  └─ #solo-travelers
  └─ #couples-travel
  └─ #family-adventures
  └─ #friends-trips
  └─ #honeymoon-magic

📁 SHARE YOUR JOURNEY
  └─ #trip-photos
  └─ #bitacoras
  └─ #travel-videos
  └─ #current-trips

📁 GETRANDOMTRIP
  └─ #how-it-works
  └─ #feature-requests
  └─ #feedback
  └─ #bookings-support
  └─ #mystery-reveals

📁 SUPPORT
  └─ #help-desk (10s slowmode)
  └─ #technical-issues (10s slowmode)
  └─ #faq (read-only)

📁 EVENTS & ACTIVITIES
  └─ #community-events
  └─ #travel-deals
  └─ #competitions

📁 VOICE CHANNELS
  └─ 🎙️ General Hangout
  └─ ✈️ Travel Planning
  └─ 🎮 Gaming Lounge
  └─ 🎵 Music & Chill
  └─ 🔇 AFK
```

---

## 🆘 Troubleshooting

**"Missing Permissions"**
→ Make sure bot has Administrator permission

**"Unknown Guild"**
→ Double-check your DISCORD_GUILD_ID

**"Invalid Token"**
→ Regenerate token in Developer Portal

**Rate Limited**
→ Wait 10-15 minutes and run again

---

## 🔒 Security Reminders

- ✅ `.env.local` is already in `.gitignore`
- ❌ Never commit Discord bot tokens
- ❌ Never share tokens publicly
- ⚠️ Regenerate immediately if exposed

---

## 📚 Additional Resources

- Full documentation: `/scripts/README.md`
- Discord Developer Portal: https://discord.com/developers/applications
- Discord.js Documentation: https://discord.js.org
- Carl-bot Setup: https://carl.gg

---

**Ready to build your community? Run `npm run discord:setup` now!** 🎉
