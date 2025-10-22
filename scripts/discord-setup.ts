/**
 * Discord Server Setup Script
 *
 * This script automates the creation of channels, roles, and permissions
 * for the GetRandomTrip Discord community.
 *
 * Prerequisites:
 * 1. Create a bot in Discord Developer Portal
 * 2. Copy bot token to .env.local as DISCORD_BOT_TOKEN
 * 3. Get your server ID and add to .env.local as DISCORD_GUILD_ID
 * 4. Invite bot to server with Administrator permissions
 *
 * Usage:
 * npm run discord:setup
 */

import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Guild,
  PermissionFlagsBits,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from .env.local or .env
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else {
  console.error('❌ No .env or .env.local file found');
  process.exit(1);
}

// Configuration
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
};

// Validate environment variables
function validateConfig() {
  if (!config.botToken) {
    console.error('❌ DISCORD_BOT_TOKEN is not set in .env or .env.local');
    process.exit(1);
  }
  if (!config.guildId) {
    console.error('❌ DISCORD_GUILD_ID is not set in .env or .env.local');
    process.exit(1);
  }
}

// Role definitions
interface RoleDefinition {
  name: string;
  color: number;
  hoist?: boolean;
  mentionable?: boolean;
  permissions?: bigint[];
}

const roles: RoleDefinition[] = [
  // Staff Roles
  {
    name: '👑 Founder',
    color: 0xe74c3c,
    hoist: true,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: '🛡️ Admin',
    color: 0xe67e22,
    hoist: true,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: '🔧 Moderator',
    color: 0x3498db,
    hoist: true,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManageChannels,
    ],
  },
  { name: '💼 Support Team', color: 0x2ecc71, hoist: true },

  // Community Roles
  { name: '⭐ OG Tripper', color: 0xf1c40f, hoist: false },
  { name: '🌟 Active Tripper', color: 0x9b59b6, hoist: false },
  { name: '🆕 New Tripper', color: 0x95a5a6, hoist: false },

  // Traveler Type Roles (Self-assignable)
  {
    name: '🧳 Solo Traveler',
    color: 0x1abc9c,
    hoist: false,
    mentionable: true,
  },
  {
    name: '💑 Couple Traveler',
    color: 0xe91e63,
    hoist: false,
    mentionable: true,
  },
  {
    name: '👨‍👩‍👧‍👦 Family Traveler',
    color: 0x00bcd4,
    hoist: false,
    mentionable: true,
  },
  {
    name: '👯 Friends Traveler',
    color: 0xff9800,
    hoist: false,
    mentionable: true,
  },
  {
    name: '🌙 Honeymoon Traveler',
    color: 0xff6b9d,
    hoist: false,
    mentionable: true,
  },

  // Experience Roles
  { name: '🥉 Explorer', color: 0xcd7f32, hoist: false },
  { name: '🥈 Adventurer', color: 0xc0c0c0, hoist: false },
  { name: '🥇 Globetrotter', color: 0xffd700, hoist: false },
  { name: '💎 Legend', color: 0xb9f2ff, hoist: false },

  // Regional Roles
  { name: '🌎 Americas', color: 0x546e7a, hoist: false, mentionable: true },
  { name: '🌍 Europe', color: 0x546e7a, hoist: false, mentionable: true },
  { name: '🌏 Asia-Pacific', color: 0x546e7a, hoist: false, mentionable: true },
  {
    name: '🌍 Africa & Middle East',
    color: 0x546e7a,
    hoist: false,
    mentionable: true,
  },
];

// Channel definitions
// Guild-specific channel types (excludes DM, GroupDM, etc.)
type GuildChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildCategory
  | ChannelType.GuildAnnouncement
  | ChannelType.GuildStageVoice
  | ChannelType.GuildForum
  | ChannelType.GuildMedia;

interface ChannelDefinition {
  name: string;
  type: GuildChannelType;
  category?: string;
  topic?: string;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  roleRestrictions?: string[];
}

const channels: ChannelDefinition[] = [
  // WELCOME & INFO Category
  { name: 'WELCOME & INFO', type: ChannelType.GuildCategory },
  {
    name: 'welcome',
    type: ChannelType.GuildText,
    category: 'WELCOME & INFO',
    topic:
      '👋 Welcome to GetRandomTrip! Start here for server rules and how to get started.',
  },
  {
    name: 'announcements',
    type: ChannelType.GuildText,
    category: 'WELCOME & INFO',
    topic:
      '📢 Official updates, new features, and important news from GetRandomTrip.',
  },
  {
    name: 'rules',
    type: ChannelType.GuildText,
    category: 'WELCOME & INFO',
    topic:
      '📜 Community guidelines and code of conduct. Please read before participating!',
  },
  {
    name: 'get-your-role',
    type: ChannelType.GuildText,
    category: 'WELCOME & INFO',
    topic: '🎭 React to messages to get your traveler type roles!',
  },

  // COMMUNITY Category
  { name: 'COMMUNITY', type: ChannelType.GuildCategory },
  {
    name: 'general-chat',
    type: ChannelType.GuildText,
    category: 'COMMUNITY',
    topic: '💬 General discussions about travel, life, and anything random!',
  },
  {
    name: 'introductions',
    type: ChannelType.GuildText,
    category: 'COMMUNITY',
    topic:
      "👋 Introduce yourself! Where are you from? What's your travel style?",
  },
  {
    name: 'off-topic',
    type: ChannelType.GuildText,
    category: 'COMMUNITY',
    topic: '🎲 Non-travel related conversations and random fun!',
  },
  {
    name: 'travel-memes',
    type: ChannelType.GuildText,
    category: 'COMMUNITY',
    topic: '😂 Share your best travel memes and funny moments!',
  },

  // TRAVEL TALK Category
  { name: 'TRAVEL TALK', type: ChannelType.GuildCategory },
  {
    name: 'trip-planning',
    type: ChannelType.GuildText,
    category: 'TRAVEL TALK',
    topic: '🗺️ Planning your next adventure? Get advice and share tips!',
  },
  {
    name: 'destination-ideas',
    type: ChannelType.GuildText,
    category: 'TRAVEL TALK',
    topic: '🌍 Discover and share amazing destinations around the world.',
  },
  {
    name: 'travel-tips',
    type: ChannelType.GuildText,
    category: 'TRAVEL TALK',
    topic:
      '💡 Share your best travel hacks, packing tips, and money-saving strategies.',
  },
  {
    name: 'budget-travel',
    type: ChannelType.GuildText,
    category: 'TRAVEL TALK',
    topic: '💰 Tips for traveling on a budget and getting the most value.',
  },
  {
    name: 'luxury-escapes',
    type: ChannelType.GuildText,
    category: 'TRAVEL TALK',
    topic: '✨ Premium travel experiences and luxury recommendations.',
  },

  // BY REGION Category
  { name: 'BY REGION', type: ChannelType.GuildCategory },
  {
    name: 'americas',
    type: ChannelType.GuildText,
    category: 'BY REGION',
    topic: '🌎 Travel discussions for North, Central, and South America.',
  },
  {
    name: 'europe',
    type: ChannelType.GuildText,
    category: 'BY REGION',
    topic: '🌍 Share your European adventures and get recommendations.',
  },
  {
    name: 'asia-pacific',
    type: ChannelType.GuildText,
    category: 'BY REGION',
    topic: '🌏 Explore Asia and Oceania - from Tokyo to Sydney!',
  },
  {
    name: 'africa-middle-east',
    type: ChannelType.GuildText,
    category: 'BY REGION',
    topic: '🌍 Discover Africa and the Middle East adventures.',
  },

  // BY TRAVELER TYPE Category
  { name: 'BY TRAVELER TYPE', type: ChannelType.GuildCategory },
  {
    name: 'solo-travelers',
    type: ChannelType.GuildText,
    category: 'BY TRAVELER TYPE',
    topic: '🧳 Connect with other solo adventurers!',
    roleRestrictions: ['🧳 Solo Traveler'],
  },
  {
    name: 'couples-travel',
    type: ChannelType.GuildText,
    category: 'BY TRAVELER TYPE',
    topic: '💑 Romantic getaways and couple travel tips.',
    roleRestrictions: ['💑 Couple Traveler'],
  },
  {
    name: 'family-adventures',
    type: ChannelType.GuildText,
    category: 'BY TRAVELER TYPE',
    topic: '👨‍👩‍👧‍👦 Family-friendly destinations and kid travel tips.',
    roleRestrictions: ['👨‍👩‍👧‍👦 Family Traveler'],
  },
  {
    name: 'friends-trips',
    type: ChannelType.GuildText,
    category: 'BY TRAVELER TYPE',
    topic: '👯 Group travel planning and friend adventures.',
    roleRestrictions: ['👯 Friends Traveler'],
  },
  {
    name: 'honeymoon-magic',
    type: ChannelType.GuildText,
    category: 'BY TRAVELER TYPE',
    topic: '🌙 Romantic honeymoon destinations and planning.',
    roleRestrictions: ['🌙 Honeymoon Traveler'],
  },

  // SHARE YOUR JOURNEY Category
  { name: 'SHARE YOUR JOURNEY', type: ChannelType.GuildCategory },
  {
    name: 'trip-photos',
    type: ChannelType.GuildText,
    category: 'SHARE YOUR JOURNEY',
    topic: '📸 Share your amazing travel photos and memories!',
  },
  {
    name: 'bitacoras',
    type: ChannelType.GuildText,
    category: 'SHARE YOUR JOURNEY',
    topic:
      '📔 Share detailed travel logs and experiences (inspired by our Bitácoras feature).',
  },
  {
    name: 'travel-videos',
    type: ChannelType.GuildText,
    category: 'SHARE YOUR JOURNEY',
    topic: '🎥 Share your travel videos and vlogs!',
  },
  {
    name: 'current-trips',
    type: ChannelType.GuildText,
    category: 'SHARE YOUR JOURNEY',
    topic: '🔴 Live updates from travelers currently on trips!',
  },

  // GETRANDOMTRIP Category
  { name: 'GETRANDOMTRIP', type: ChannelType.GuildCategory },
  {
    name: 'how-it-works',
    type: ChannelType.GuildText,
    category: 'GETRANDOMTRIP',
    topic: '❓ Questions about how GetRandomTrip works.',
  },
  {
    name: 'feature-requests',
    type: ChannelType.GuildText,
    category: 'GETRANDOMTRIP',
    topic: '💡 Suggest new features and improvements for GetRandomTrip.',
  },
  {
    name: 'feedback',
    type: ChannelType.GuildText,
    category: 'GETRANDOMTRIP',
    topic: '💬 Share your GetRandomTrip experience and feedback.',
  },
  {
    name: 'bookings-support',
    type: ChannelType.GuildText,
    category: 'GETRANDOMTRIP',
    topic: '🎫 Get help with your bookings and reservations.',
  },
  {
    name: 'mystery-reveals',
    type: ChannelType.GuildText,
    category: 'GETRANDOMTRIP',
    topic: '🎁 Share your excitement when you reveal your mystery destination!',
  },

  // SUPPORT Category
  { name: 'SUPPORT', type: ChannelType.GuildCategory },
  {
    name: 'help-desk',
    type: ChannelType.GuildText,
    category: 'SUPPORT',
    topic: "🆘 General support and questions - we're here to help!",
    rateLimitPerUser: 10,
  },
  {
    name: 'technical-issues',
    type: ChannelType.GuildText,
    category: 'SUPPORT',
    topic: '🐛 Report bugs or technical problems here.',
    rateLimitPerUser: 10,
  },
  {
    name: 'faq',
    type: ChannelType.GuildText,
    category: 'SUPPORT',
    topic: '📚 Frequently asked questions and answers.',
  },

  // EVENTS & ACTIVITIES Category
  { name: 'EVENTS & ACTIVITIES', type: ChannelType.GuildCategory },
  {
    name: 'community-events',
    type: ChannelType.GuildText,
    category: 'EVENTS & ACTIVITIES',
    topic: '🎉 Virtual meetups, travel challenges, and community events.',
  },
  {
    name: 'travel-deals',
    type: ChannelType.GuildText,
    category: 'EVENTS & ACTIVITIES',
    topic: '💸 Share amazing flight deals, hotel discounts, and travel offers!',
  },
  {
    name: 'competitions',
    type: ChannelType.GuildText,
    category: 'EVENTS & ACTIVITIES',
    topic: '🏆 Win trips, discounts, and prizes through our competitions!',
  },

  // Voice Channels
  { name: 'VOICE CHANNELS', type: ChannelType.GuildCategory },
  {
    name: '🎙️ General Hangout',
    type: ChannelType.GuildVoice,
    category: 'VOICE CHANNELS',
  },
  {
    name: '✈️ Travel Planning',
    type: ChannelType.GuildVoice,
    category: 'VOICE CHANNELS',
  },
  {
    name: '🎮 Gaming Lounge',
    type: ChannelType.GuildVoice,
    category: 'VOICE CHANNELS',
  },
  {
    name: '🎵 Music & Chill',
    type: ChannelType.GuildVoice,
    category: 'VOICE CHANNELS',
  },
  { name: '🔇 AFK', type: ChannelType.GuildVoice, category: 'VOICE CHANNELS' },
];

// Main setup function
async function setupDiscordServer() {
  console.log('🚀 Starting Discord server setup...\n');

  // Create client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
  });

  // Login
  console.log('🔑 Logging in...');
  await client.login(config.botToken);
  console.log('✅ Bot logged in successfully!\n');

  // Get guild
  const guild = await client.guilds.fetch(config.guildId!);
  console.log(`📍 Found server: ${guild.name}\n`);

  // Create roles
  console.log('👥 Creating roles...');
  const createdRoles = await createRoles(guild);
  console.log(`✅ Created ${createdRoles.size} roles\n`);

  // Create channels
  console.log('📺 Creating channels...');
  await createChannels(guild, createdRoles);
  console.log('✅ All channels created\n');

  console.log('🎉 Discord server setup complete!');
  console.log('\n📝 Next steps:');
  console.log(
    '1. Set permissions for #welcome, #announcements, #rules (read-only)',
  );
  console.log('2. Create welcome message in #welcome');
  console.log('3. Add reaction roles in #get-your-role');
  console.log('4. Pin important messages');
  console.log('5. Configure moderation bots (MEE6, Carl-bot, etc.)');

  // Logout
  client.destroy();
  process.exit(0);
}

// Create all roles
async function createRoles(guild: Guild) {
  const createdRoles = new Map<string, string>();

  for (const roleConfig of roles) {
    try {
      const role = await guild.roles.create({
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist || false,
        mentionable: roleConfig.mentionable || false,
        permissions: roleConfig.permissions || [],
      });
      createdRoles.set(roleConfig.name, role.id);
      console.log(`  ✓ Created role: ${roleConfig.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create role ${roleConfig.name}:`, error);
    }
  }

  return createdRoles;
}

// Create all channels
async function createChannels(guild: Guild, roles: Map<string, string>) {
  const categories = new Map<string, string>();

  for (const channelConfig of channels) {
    try {
      if (channelConfig.type === ChannelType.GuildCategory) {
        // Create category
        const category = await guild.channels.create({
          name: channelConfig.name,
          type: ChannelType.GuildCategory,
        });
        categories.set(channelConfig.name, category.id);
        console.log(`  ✓ Created category: ${channelConfig.name}`);
      } else {
        // Create channel under category
        const parentId = channelConfig.category
          ? categories.get(channelConfig.category)
          : undefined;

        const channel = await guild.channels.create({
          name: channelConfig.name,
          type: channelConfig.type,
          parent: parentId,
          topic: channelConfig.topic || undefined,
          nsfw: channelConfig.nsfw || false,
          rateLimitPerUser: channelConfig.rateLimitPerUser || 0,
        });

        console.log(`  ✓ Created channel: ${channelConfig.name}`);

        // Apply role restrictions if specified
        if (
          channelConfig.roleRestrictions &&
          channelConfig.roleRestrictions.length > 0
        ) {
          for (const roleName of channelConfig.roleRestrictions) {
            const roleId = roles.get(roleName);
            if (roleId) {
              await channel.permissionOverwrites.create(roleId, {
                ViewChannel: true,
              });
            }
          }
          // Deny @everyone from viewing
          await channel.permissionOverwrites.create(guild.roles.everyone, {
            ViewChannel: false,
          });
        }
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `  ✗ Failed to create channel ${channelConfig.name}:`,
        error,
      );
    }
  }
}

// Run setup
validateConfig();
setupDiscordServer().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
