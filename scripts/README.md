# Discord Server Setup Script

Automated script to create a complete Discord community for GetRandomTrip.

## 🚀 Quick Start

### 1. Prerequisites

Before running the script, you need:

1. **Discord Bot Token**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create "New Application"
   - Go to "Bot" section → "Add Bot"
   - Copy the bot token

2. **Discord Server ID (Guild ID)**
   - Enable Developer Mode in Discord:
     - Settings → Advanced → Enable "Developer Mode"
   - Right-click your server name → "Copy Server ID"

3. **Invite Bot to Your Server**
   - In Developer Portal → OAuth2 → URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Administrator` (for easy setup)
   - Copy the generated URL and visit it in browser
   - Select your server and authorize

### 2. Configure Environment

Add these variables to your `.env.local` file:

```env
DISCORD_BOT_TOKEN="your-bot-token-here"
DISCORD_GUILD_ID="your-server-id-here"
```

### 3. Run the Setup Script

```bash
npm run discord:setup
```

## 📋 What Gets Created

### Roles (20)

**Staff Roles:**

- 👑 Founder (Admin)
- 🛡️ Admin
- 🔧 Moderator
- 💼 Support Team

**Community Roles:**

- ⭐ OG Tripper
- 🌟 Active Tripper
- 🆕 New Tripper

**Traveler Type Roles (Self-assignable):**

- 🧳 Solo Traveler
- 💑 Couple Traveler
- 👨‍👩‍👧‍👦 Family Traveler
- 👯 Friends Traveler
- 🌙 Honeymoon Traveler

**Experience Roles:**

- 🥉 Explorer (1+ trip)
- 🥈 Adventurer (5+ trips)
- 🥇 Globetrotter (10+ trips)
- 💎 Legend (25+ trips)

**Regional Roles:**

- 🌎 Americas
- 🌍 Europe
- 🌏 Asia-Pacific
- 🌍 Africa & Middle East

### Categories & Channels (50+)

1. **WELCOME & INFO**
   - #welcome
   - #announcements
   - #rules
   - #get-your-role

2. **COMMUNITY**
   - #general-chat
   - #introductions
   - #off-topic
   - #travel-memes

3. **TRAVEL TALK**
   - #trip-planning
   - #destination-ideas
   - #travel-tips
   - #budget-travel
   - #luxury-escapes

4. **BY REGION**
   - #americas
   - #europe
   - #asia-pacific
   - #africa-middle-east

5. **BY TRAVELER TYPE** (Role-restricted)
   - #solo-travelers
   - #couples-travel
   - #family-adventures
   - #friends-trips
   - #honeymoon-magic

6. **SHARE YOUR JOURNEY**
   - #trip-photos
   - #bitacoras
   - #travel-videos
   - #current-trips

7. **GETRANDOMTRIP**
   - #how-it-works
   - #feature-requests
   - #feedback
   - #bookings-support
   - #mystery-reveals

8. **SUPPORT**
   - #help-desk
   - #technical-issues
   - #faq

9. **EVENTS & ACTIVITIES**
   - #community-events
   - #travel-deals
   - #competitions

10. **VOICE CHANNELS**
    - 🎙️ General Hangout
    - ✈️ Travel Planning
    - 🎮 Gaming Lounge
    - 🎵 Music & Chill
    - 🔇 AFK

## ⚙️ Post-Setup Configuration

After the script runs, you'll need to manually:

### 1. Set Read-Only Channels

Lock these channels to read-only:

- #welcome
- #announcements
- #rules
- #faq

**How:** Channel Settings → Permissions → @everyone → Disable "Send Messages"

### 2. Create Welcome Message

In `#welcome`, create a pinned message:

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

### 3. Set Up Reaction Roles

In `#get-your-role`, use a bot like Carl-bot to set up reaction roles:

**Traveler Types:**

- 🧳 → Solo Traveler
- 💑 → Couple Traveler
- 👨‍👩‍👧‍👦 → Family Traveler
- 👯 → Friends Traveler
- 🌙 → Honeymoon Traveler

**Regions:**

- 🌎 → Americas
- 🌍 → Europe (x2 for both Europe and Africa/ME)
- 🌏 → Asia-Pacific

### 4. Install Recommended Bots

- **MEE6** - Leveling, auto-moderation, welcome messages
- **Carl-bot** - Reaction roles, custom commands
- **Dyno** - Advanced moderation
- **Ticket Tool** - Support ticket system
- **Statbot** - Server analytics

### 5. Set AFk Channel

Server Settings → Overview → AFK Channel → Select "🔇 AFK"

### 6. Configure Community Features

Server Settings → Enable Community → Follow prompts

This enables:

- Welcome Screen
- Server Insights
- Announcement Channels
- Discovery (if eligible)

## 🔧 Troubleshooting

### "Missing Permissions" Error

**Solution:** Make sure your bot has `Administrator` permission.

### "Unknown Guild" Error

**Solution:**

1. Double-check your `DISCORD_GUILD_ID`
2. Make sure the bot is invited to the correct server

### Rate Limit Errors

**Solution:** The script includes delays, but if you hit rate limits:

1. Wait 10-15 minutes
2. Run the script again (it will skip existing channels/roles)

### Token Invalid Error

**Solution:**

1. Regenerate your bot token in Developer Portal
2. Update `.env.local` with new token

## 📝 Notes

- The script takes approximately 2-3 minutes to complete
- All channels include descriptions/topics
- Role-restricted channels are automatically configured
- Voice channels are created in their own category
- Colors are assigned to roles for visual organization

## 🆘 Need Help?

If you encounter issues:

1. Check the console output for specific errors
2. Verify all environment variables are set correctly
3. Ensure bot has proper permissions
4. Check Discord API status: https://discordstatus.com

## 🔒 Security

- Never commit `.env.local` to version control
- Never share your bot token publicly
- Regenerate token immediately if exposed
- Use environment-specific tokens for production

---

**Happy Community Building!** 🎉
