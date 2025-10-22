/**
 * Discord Work Channels Setup Script
 *
 * Creates internal team/work channels for GetRandomTrip staff.
 * These channels are private and only visible to specific roles.
 *
 * Prerequisites:
 * 1. Run the main discord-setup.ts first
 * 2. Bot must have Administrator permissions
 *
 * Usage:
 * npm run discord:setup-work
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

// Guild-specific channel types (excludes DM, GroupDM, etc.)
type GuildChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildCategory
  | ChannelType.GuildAnnouncement
  | ChannelType.GuildStageVoice
  | ChannelType.GuildForum
  | ChannelType.GuildMedia;

// Channel definitions for work channels
interface WorkChannelDefinition {
  name: string;
  type: GuildChannelType;
  category?: string;
  topic?: string;
  allowedRoles: string[]; // Role names that can access
  rateLimitPerUser?: number;
}

const workChannels: WorkChannelDefinition[] = [
  // INTERNAL TEAM Category
  {
    name: '🔒 INTERNAL TEAM',
    type: ChannelType.GuildCategory,
    allowedRoles: [],
  },
  {
    name: 'team-general',
    type: ChannelType.GuildText,
    category: '🔒 INTERNAL TEAM',
    topic: '💼 General team discussions and daily standups',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },
  {
    name: 'team-announcements',
    type: ChannelType.GuildText,
    category: '🔒 INTERNAL TEAM',
    topic: '📢 Internal company announcements and updates',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'team-meetings',
    type: ChannelType.GuildText,
    category: '🔒 INTERNAL TEAM',
    topic: '📅 Meeting notes, agendas, and schedules',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },
  {
    name: 'team-resources',
    type: ChannelType.GuildText,
    category: '🔒 INTERNAL TEAM',
    topic: '📚 Company docs, guidelines, passwords, and resources (use pins!)',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },

  // ENGINEERING Category
  { name: '⚙️ ENGINEERING', type: ChannelType.GuildCategory, allowedRoles: [] },
  {
    name: 'eng-general',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '💻 Engineering discussions and technical chat',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-backend',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '🔧 Backend development: API, database, server-side',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-frontend',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '🎨 Frontend development: React, Next.js, UI components',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-mobile',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '📱 Mobile app development: iOS, Android',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-devops',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '🚀 DevOps: deployment, CI/CD, infrastructure, monitoring',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-bugs',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '🐛 Bug tracking, fixes, and technical debt',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'eng-code-review',
    type: ChannelType.GuildText,
    category: '⚙️ ENGINEERING',
    topic: '👀 Code reviews, PR notifications, and technical feedback',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },

  // DESIGN Category
  { name: '🎨 DESIGN', type: ChannelType.GuildCategory, allowedRoles: [] },
  {
    name: 'design-general',
    type: ChannelType.GuildText,
    category: '🎨 DESIGN',
    topic: '🎨 Design discussions, inspiration, and feedback',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'design-ui-ux',
    type: ChannelType.GuildText,
    category: '🎨 DESIGN',
    topic: '🖥️ UI/UX design, wireframes, prototypes, user flows',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'design-branding',
    type: ChannelType.GuildText,
    category: '🎨 DESIGN',
    topic: '✨ Branding, logos, style guides, visual identity',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'design-marketing-assets',
    type: ChannelType.GuildText,
    category: '🎨 DESIGN',
    topic: '📸 Marketing materials, social media graphics, banners',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'design-feedback',
    type: ChannelType.GuildText,
    category: '🎨 DESIGN',
    topic: '💬 Design critiques and feedback sessions',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },

  // COMMERCIAL / BUSINESS Category
  {
    name: '💼 COMMERCIAL',
    type: ChannelType.GuildCategory,
    allowedRoles: [],
  },
  {
    name: 'commercial-general',
    type: ChannelType.GuildText,
    category: '💼 COMMERCIAL',
    topic: '💼 Business strategy, partnerships, revenue discussions',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'commercial-marketing',
    type: ChannelType.GuildText,
    category: '💼 COMMERCIAL',
    topic: '📣 Marketing campaigns, content strategy, growth initiatives',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'commercial-sales',
    type: ChannelType.GuildText,
    category: '💼 COMMERCIAL',
    topic: '💰 Sales discussions, partnerships, B2B opportunities',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'commercial-analytics',
    type: ChannelType.GuildText,
    category: '💼 COMMERCIAL',
    topic: '📊 Metrics, KPIs, analytics, data insights',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'commercial-partnerships',
    type: ChannelType.GuildText,
    category: '💼 COMMERCIAL',
    topic: '🤝 Partner discussions, vendor relationships, affiliates',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },

  // PRODUCT Category
  { name: '🚀 PRODUCT', type: ChannelType.GuildCategory, allowedRoles: [] },
  {
    name: 'product-general',
    type: ChannelType.GuildText,
    category: '🚀 PRODUCT',
    topic: '🎯 Product strategy, roadmap, and planning',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'product-roadmap',
    type: ChannelType.GuildText,
    category: '🚀 PRODUCT',
    topic: '🗺️ Feature roadmap, sprint planning, priorities',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'product-research',
    type: ChannelType.GuildText,
    category: '🚀 PRODUCT',
    topic: '🔍 User research, surveys, feedback analysis',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'product-launches',
    type: ChannelType.GuildText,
    category: '🚀 PRODUCT',
    topic: '🎉 Feature launches, release planning, go-to-market',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },

  // CUSTOMER SUCCESS Category
  {
    name: '🎫 CUSTOMER SUCCESS',
    type: ChannelType.GuildCategory,
    allowedRoles: [],
  },
  {
    name: 'cs-general',
    type: ChannelType.GuildText,
    category: '🎫 CUSTOMER SUCCESS',
    topic: '💬 Customer support discussions and coordination',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },
  {
    name: 'cs-tickets',
    type: ChannelType.GuildText,
    category: '🎫 CUSTOMER SUCCESS',
    topic: '🎫 Support ticket tracking and escalations',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
    rateLimitPerUser: 5,
  },
  {
    name: 'cs-feedback-review',
    type: ChannelType.GuildText,
    category: '🎫 CUSTOMER SUCCESS',
    topic: '📝 Review and discuss customer feedback from community',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },
  {
    name: 'cs-escalations',
    type: ChannelType.GuildText,
    category: '🎫 CUSTOMER SUCCESS',
    topic: '🚨 Urgent customer issues and escalations',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '💼 Support Team'],
  },

  // OPERATIONS Category
  { name: '⚡ OPERATIONS', type: ChannelType.GuildCategory, allowedRoles: [] },
  {
    name: 'ops-general',
    type: ChannelType.GuildText,
    category: '⚡ OPERATIONS',
    topic: '⚙️ Operations, processes, and daily ops',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'ops-incidents',
    type: ChannelType.GuildText,
    category: '⚡ OPERATIONS',
    topic: '🔥 System incidents, outages, and emergency response',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: 'ops-monitoring',
    type: ChannelType.GuildText,
    category: '⚡ OPERATIONS',
    topic: '📡 System monitoring, alerts, uptime notifications (bot)',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },

  // VOICE CHANNELS (Staff)
  {
    name: '🔒 STAFF VOICE',
    type: ChannelType.GuildCategory,
    allowedRoles: [],
  },
  {
    name: '📞 Team Meeting Room',
    type: ChannelType.GuildVoice,
    category: '🔒 STAFF VOICE',
    allowedRoles: ['👑 Founder', '🛡️ Admin', '🔧 Moderator', '💼 Support Team'],
  },
  {
    name: '💻 Engineering Sync',
    type: ChannelType.GuildVoice,
    category: '🔒 STAFF VOICE',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: '🎨 Design Review',
    type: ChannelType.GuildVoice,
    category: '🔒 STAFF VOICE',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
  {
    name: '🎯 Product Strategy',
    type: ChannelType.GuildVoice,
    category: '🔒 STAFF VOICE',
    allowedRoles: ['👑 Founder', '🛡️ Admin'],
  },
];

// Main setup function
async function setupWorkChannels() {
  console.log('🚀 Starting work channels setup...\n');

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

  // Get existing roles
  const roles = new Map<string, string>();
  guild.roles.cache.forEach((role) => {
    roles.set(role.name, role.id);
  });
  console.log(`📋 Found ${roles.size} existing roles\n`);

  // Create work channels
  console.log('📺 Creating work channels...');
  await createWorkChannels(guild, roles);
  console.log('✅ All work channels created\n');

  console.log('🎉 Work channels setup complete!');
  console.log('\n📝 Channels created:');
  console.log('- 🔒 Internal Team (staff-only)');
  console.log('- ⚙️ Engineering (dev team)');
  console.log('- 🎨 Design (design team)');
  console.log('- 💼 Commercial (business team)');
  console.log('- 🚀 Product (product team)');
  console.log('- 🎫 Customer Success (support team)');
  console.log('- ⚡ Operations (ops team)');
  console.log('- 🔒 Staff Voice (private voice channels)');

  // Logout
  client.destroy();
  process.exit(0);
}

// Create all work channels
async function createWorkChannels(guild: Guild, roles: Map<string, string>) {
  const categories = new Map<string, string>();

  for (const channelConfig of workChannels) {
    try {
      if (channelConfig.type === ChannelType.GuildCategory) {
        // Create category
        const category = await guild.channels.create({
          name: channelConfig.name,
          type: ChannelType.GuildCategory,
        });
        categories.set(channelConfig.name, category.id);

        // Lock category to @everyone
        await category.permissionOverwrites.create(guild.roles.everyone, {
          ViewChannel: false,
        });

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
          rateLimitPerUser: channelConfig.rateLimitPerUser || 0,
        });

        console.log(`  ✓ Created channel: ${channelConfig.name}`);

        // Set permissions for allowed roles
        // First, deny @everyone
        await channel.permissionOverwrites.create(guild.roles.everyone, {
          ViewChannel: false,
        });

        // Then, allow specific roles
        for (const roleName of channelConfig.allowedRoles) {
          const roleId = roles.get(roleName);
          if (roleId) {
            await channel.permissionOverwrites.create(roleId, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            });
          } else {
            console.warn(`  ⚠️  Role not found: ${roleName}`);
          }
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
setupWorkChannels().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
