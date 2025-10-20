# 🎉 Complete Discord Setup Guide

Your all-in-one guide to set up the GetRandomTrip Discord server from scratch!

---

## 🚀 Quick Setup (3 Commands)

```bash
# 1. Create channels and roles (community)
npm run discord:setup

# 2. Create work channels (internal team)
npm run discord:setup-work

# 3. Post messages and configure (NEW!)
npm run discord:setup-messages
```

**Total time:** ~5-10 minutes

---

## 📋 Prerequisites

### 1. Get Discord Bot Credentials

**Create Bot:**
1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "GetRandomTrip Bot"
3. Go to "Bot" section → "Add Bot"
4. Copy the **Bot Token** (keep it secret!)

**Enable Intents:**
- ✅ PRESENCE INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT

**Invite Bot:**
1. Go to OAuth2 → URL Generator
2. Select: `bot` + `applications.commands`
3. Select permissions:
   - ✅ Administrator (easiest)
   - Or: Manage Roles, Manage Channels, Send Messages, Embed Links, Pin Messages
4. Copy URL and visit it → Select your server → Authorize

### 2. Get Server ID

1. Enable Developer Mode: Discord Settings → Advanced → Developer Mode ON
2. Right-click your server name → "Copy Server ID"

### 3. Configure Environment

Add to your `.env` file:

```env
# Discord Bot
DISCORD_BOT_TOKEN="MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GaBcDe..."
DISCORD_GUILD_ID="987654321098765432"

# Website URL (for welcome messages)
NEXT_PUBLIC_WEBSITE_URL="https://getrandomtrip.com"
# Or for local dev:
# NEXT_PUBLIC_WEBSITE_URL="http://localhost:3010"
```

---

## 🎯 Step-by-Step Setup

### Step 1: Create Community Channels & Roles

```bash
npm run discord:setup
```

**Creates:**
- ✅ 20 roles (staff, community, traveler types, experience levels)
- ✅ 50+ community channels in 10 categories
- ✅ Voice channels
- ✅ Permissions configured
- ✅ Role-restricted channels

**Time:** ~2-3 minutes

---

### Step 2: Create Work Channels (Optional)

```bash
npm run discord:setup-work
```

**Creates:**
- ✅ 40+ private staff channels
- ✅ 8 work categories (Engineering, Design, Commercial, etc.)
- ✅ Staff-only permissions
- ✅ Department voice channels

**Time:** ~2-3 minutes

---

### Step 3: Post Messages & Configure (NEW!)

```bash
npm run discord:setup-messages
```

**Does:**
- ✅ Posts welcome message in #welcome (with embed)
- ✅ Posts rules in #rules (with embed)
- ✅ Posts role selection guide in #get-your-role
- ✅ Posts intro template in #introductions
- ✅ Posts FAQ in #faq
- ✅ Posts welcome announcement in #announcements
- ✅ Pins important messages
- ✅ Sets read-only channels (#welcome, #announcements, #rules, #faq)
- ✅ Adds reaction emojis to role messages

**Time:** ~1 minute

---

## ✅ What You Get

### 📊 Complete Server Structure

```
GetRandomTrip Discord
│
├── 🏠 WELCOME & INFO (4 channels)
│   ├── #welcome ⭐ Auto-posted welcome message
│   ├── #announcements ⭐ Auto-posted announcement
│   ├── #rules ⭐ Auto-posted rules
│   └── #get-your-role ⭐ Auto-posted role guide
│
├── 💬 COMMUNITY (4 channels)
│   ├── #general-chat
│   ├── #introductions ⭐ Auto-posted template
│   ├── #off-topic
│   └── #travel-memes
│
├── ✈️ TRAVEL TALK (5 channels)
├── 🌍 BY REGION (4 channels)
├── 👥 BY TRAVELER TYPE (5 role-restricted channels)
├── 📸 SHARE YOUR JOURNEY (4 channels)
├── 🎫 GETRANDOMTRIP (5 channels)
├── 🆘 SUPPORT (3 channels)
│   └── #faq ⭐ Auto-posted FAQ
├── 🎉 EVENTS & ACTIVITIES (3 channels)
├── 🎵 VOICE CHANNELS (5 channels)
│
└── 🔒 INTERNAL WORK CHANNELS (40+ channels)
    ├── 🔒 Internal Team
    ├── ⚙️ Engineering
    ├── 🎨 Design
    ├── 💼 Commercial
    ├── 🚀 Product
    ├── 🎫 Customer Success
    ├── ⚡ Operations
    └── 🔒 Staff Voice
```

---

## 🎨 What the Messages Look Like

### #welcome
Beautiful embed with:
- Welcome message
- 4-step getting started guide
- Links to key channels
- Website link
- Support info

### #rules
Professional embed with:
- 8 clear community rules
- Emoji icons for each rule
- Consequences explanation
- Contact info for issues

### #get-your-role
Two colorful embeds:
1. Traveler types (Solo, Couple, Family, Friends, Honeymoon)
2. Regions (Americas, Europe, Asia-Pacific, Africa & ME)
- Includes reaction emojis
- Ready for Carl-bot setup

### #introductions
Template embed with:
- Questions to answer
- Friendly tone
- Encourages engagement

### #faq
Comprehensive FAQ with:
- About GetRandomTrip
- How it works
- Pricing info
- Cancellation policies
- Support contact

---

## 🔧 Post-Setup Tasks

### 1. Set Up Carl-bot Reaction Roles (5 mins)

**Install Carl-bot:**
1. Visit https://carl.gg
2. Click "Invite" → Select your server
3. Authorize

**Configure Reaction Roles:**
```
1. Go to #get-your-role
2. Use Carl-bot dashboard or commands:
   /reactionrole create

3. For each role, link emoji to role:
   🧳 → @🧳 Solo Traveler
   💑 → @💑 Couple Traveler
   👨‍👩‍👧‍👦 → @👨‍👩‍👧‍👦 Family Traveler
   👯 → @👯 Friends Traveler
   🌙 → @🌙 Honeymoon Traveler
   🌎 → @🌎 Americas
   🌍 → @🌍 Europe
   🌏 → @🌏 Asia-Pacific
   🗺️ → @🌍 Africa & Middle East
```

### 2. Assign Staff Roles (2 mins)

**Assign roles to your team:**
1. Right-click member → Roles
2. Assign appropriate role:
   - 👑 Founder (you)
   - 🛡️ Admin (leadership)
   - 🔧 Moderator (community managers)
   - 💼 Support Team (support staff)

### 3. Optional: Install More Bots

**MEE6** (Leveling & Welcome):
- Visit: https://mee6.xyz
- Enable: Welcome messages, Leveling, Moderation

**Dyno** (Auto-moderation):
- Visit: https://dyno.gg
- Enable: Auto-moderation, Auto-role, Logging

**Ticket Tool** (Support):
- Visit: https://tickettool.xyz
- Set up in #help-desk and #bookings-support

### 4. Configure Server Settings (5 mins)

**Community Features:**
1. Server Settings → Enable Community
2. Set up Welcome Screen:
   - Add #welcome, #rules, #get-your-role
3. Set default channels

**AFK Channel:**
1. Server Settings → Overview
2. AFK Channel → Select "🔇 AFK"
3. AFK Timeout → 5 minutes

**Verification Level:**
1. Server Settings → Safety Setup
2. Verification Level → Medium (recommended)
3. Enable "Require 2FA for moderator actions"

**Discovery (if eligible):**
1. Server Settings → Discovery
2. Fill out application
3. Add tags and description

---

## 📱 Invite Your Community

### Generate Invite Link

**For Public:**
```
1. Click server name → Invite People
2. Set: Expire After → Never
3. Set: Max Uses → Unlimited
4. Copy link
```

**For Custom URL (requires Community):**
```
Server Settings → Vanity URL
Create: discord.gg/getrandomtrip
```

### Where to Share

- 📧 Email newsletter
- 🌐 Website footer
- 📱 Social media profiles
- 📝 Blog posts
- ✈️ Booking confirmation emails
- 📱 App notifications

---

## 🎯 Success Checklist

After setup, verify:

```bash
✅ All channels created
✅ All roles created
✅ Welcome message posted and pinned
✅ Rules posted and pinned
✅ Role selection guide posted
✅ Intro template posted and pinned
✅ FAQ posted and pinned
✅ Read-only channels configured
✅ Carl-bot reaction roles working
✅ Staff roles assigned
✅ Team can see work channels
✅ Community members can't see work channels
✅ Bot permissions correct
✅ Server icon uploaded
✅ Server description set
✅ Invite link created
```

---

## 🔄 Order of Operations

**Recommended sequence:**

```bash
# Day 1: Setup
1. Get bot credentials ✓
2. Run: npm run discord:setup ✓
3. Run: npm run discord:setup-work ✓
4. Run: npm run discord:setup-messages ✓

# Day 1-2: Configure
5. Install Carl-bot ✓
6. Set up reaction roles ✓
7. Assign staff roles ✓
8. Install other bots (MEE6, Dyno) ✓
9. Test everything ✓

# Day 2-3: Customize
10. Customize messages if needed ✓
11. Add server icon/banner ✓
12. Configure verification ✓
13. Set up bot integrations (GitHub, etc.) ✓

# Day 3+: Launch
14. Soft launch to team ✓
15. Gather feedback ✓
16. Public launch ✓
17. Start engaging! ✓
```

---

## 🛠️ Troubleshooting

### "Bot can't post messages"

**Solution:**
- Check bot has "Send Messages" permission
- Verify bot is in the server
- Check channel permissions override

### "Can't pin messages"

**Solution:**
- Grant bot "Pin Messages" permission
- Check channel-specific permissions

### "Read-only not working"

**Solution:**
- Bot needs "Manage Channels" permission
- Verify @everyone role permissions

### "Reaction roles not working"

**Solution:**
- Carl-bot must be properly configured
- Use Carl-bot dashboard: https://carl.gg
- Emojis must match exactly

### "Work channels visible to everyone"

**Solution:**
- Run discord:setup first (creates roles)
- Then run discord:setup-work
- Verify staff have correct roles

### "Script fails halfway"

**Solution:**
- Discord rate limits: Wait 10 minutes
- Run script again (won't duplicate)
- Check bot token is valid

---

## 📚 Documentation Reference

- **`/DISCORD_SETUP_GUIDE.md`** - General setup instructions
- **`/DISCORD_CHANNEL_GUIDE.md`** - How to use each channel
- **`/DISCORD_WORK_CHANNELS.md`** - Internal work channels guide
- **`/DISCORD_COMPLETE_SETUP.md`** - This file (complete guide)
- **`/scripts/README.md`** - Technical documentation

---

## 🎨 Customization

### Change Welcome Message

Edit `scripts/discord-setup-messages.ts`:
```typescript
.setDescription('Your custom message here')
```

Then re-run:
```bash
npm run discord:setup-messages
```

### Add More Channels

Edit `scripts/discord-setup.ts` or `scripts/discord-setup-work-channels.ts`

Add to `channels` array:
```typescript
{
  name: 'your-channel',
  type: ChannelType.GuildText,
  category: 'CATEGORY NAME',
  topic: 'Channel description'
}
```

### Change Colors

Edit embed colors in `discord-setup-messages.ts`:
```typescript
.setColor(0x3498db) // Blue
.setColor(0xe74c3c) // Red
.setColor(0x2ecc71) // Green
```

---

## 💡 Pro Tips

### Engagement

- Post daily in #general-chat
- Welcome every new member
- Run weekly events
- Feature member content
- Respond to every question

### Moderation

- Set up auto-mod (Dyno/MEE6)
- Clear rules enforcement
- Warn before banning
- Document violations
- Stay consistent

### Growth

- Share invite everywhere
- Run Discord-exclusive contests
- Offer Discord perks
- Create valuable content
- Build community, not just audience

### Analytics

- Track metrics (Statbot)
- Monitor engagement
- A/B test content
- Survey members
- Iterate based on feedback

---

## 🎁 Bonus Features

### Future Enhancements

Consider adding:
- **Discord Store** - Sell trips directly
- **Events** - Schedule community events
- **Stage Channels** - Host Q&As
- **Threads** - Organized discussions
- **Forum Channels** - Q&A format
- **Server Subscriptions** - Premium perks

### Integrations

Hook up:
- GitHub → #eng-code-review
- Stripe → Revenue notifications
- Google Analytics → Daily stats
- Mailchimp → Campaign updates
- Zapier → Automate workflows
- Webhooks → Custom integrations

---

## 🆘 Need Help?

**Discord:**
- Official Discord API: https://discord.gg/discord-api
- Discord.js: https://discord.gg/djs

**Resources:**
- Discord Developer Docs: https://discord.com/developers/docs
- Discord.js Guide: https://discordjs.guide
- Carl-bot Docs: https://docs.carl.gg

**Our Team:**
- Check work channels for internal support
- Tag @Admin for urgent issues

---

## 🎉 You're All Set!

Your Discord server is now:
- ✅ Fully configured
- ✅ Professionally organized
- ✅ Ready for community
- ✅ Set up for team collaboration
- ✅ Automated where possible

**Now go build an amazing community!** 🚀

---

**Quick Commands Reference:**

```bash
# Initial setup
npm run discord:setup              # Create community channels
npm run discord:setup-work         # Create work channels
npm run discord:setup-messages     # Post messages & configure

# Re-run anytime to update
```

**Last updated:** January 2025  
**Version:** 1.0.0

