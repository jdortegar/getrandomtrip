/**
 * Discord Work Channel Permissions Update Script
 *
 * Updates work channel permissions to include new worker roles.
 * Run this after creating worker roles to grant them access.
 *
 * Usage:
 * npm run discord:update-work-permissions
 */

import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { existsSync } from "fs";

// Load environment variables
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else if (existsSync(".env")) {
  dotenv.config({ path: ".env" });
} else {
  console.error("❌ No .env or .env.local file found");
  process.exit(1);
}

const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
};

function validateConfig() {
  if (!config.botToken || !config.guildId) {
    console.error("❌ Discord credentials not set");
    process.exit(1);
  }
}

// Channel permissions mapping
const channelPermissions: Record<string, string[]> = {
  // Engineering channels
  "eng-general": [
    "💻 Engineer",
    "⚙️ Backend Engineer",
    "🎨 Frontend Engineer",
    "📱 Mobile Engineer",
    "🚀 DevOps Engineer",
    "🚀 Product Manager",
  ],
  "eng-backend": ["💻 Engineer", "⚙️ Backend Engineer", "🚀 DevOps Engineer"],
  "eng-frontend": ["💻 Engineer", "🎨 Frontend Engineer"],
  "eng-mobile": ["💻 Engineer", "📱 Mobile Engineer"],
  "eng-devops": ["💻 Engineer", "🚀 DevOps Engineer"],
  "eng-bugs": [
    "💻 Engineer",
    "⚙️ Backend Engineer",
    "🎨 Frontend Engineer",
    "📱 Mobile Engineer",
    "🚀 DevOps Engineer",
  ],
  "eng-code-review": [
    "💻 Engineer",
    "⚙️ Backend Engineer",
    "🎨 Frontend Engineer",
    "📱 Mobile Engineer",
  ],

  // Design channels
  "design-general": [
    "🎨 Designer",
    "🖥️ UI Designer",
    "✨ UX Designer",
    "🎬 Graphic Designer",
    "🎨 Frontend Engineer",
    "🚀 Product Manager",
  ],
  "design-ui-ux": ["🎨 Designer", "🖥️ UI Designer", "✨ UX Designer"],
  "design-branding": ["🎨 Designer", "🎬 Graphic Designer"],
  "design-marketing-assets": [
    "🎨 Designer",
    "🎬 Graphic Designer",
    "📣 Marketing",
  ],
  "design-feedback": [
    "🎨 Designer",
    "🖥️ UI Designer",
    "✨ UX Designer",
    "🎬 Graphic Designer",
    "🚀 Product Manager",
  ],

  // Commercial channels
  "commercial-general": [
    "💼 Business",
    "📣 Marketing",
    "💰 Sales",
    "📈 Growth",
    "🚀 Product Manager",
  ],
  "commercial-marketing": [
    "💼 Business",
    "📣 Marketing",
    "📈 Growth",
    "📝 Content Creator",
  ],
  "commercial-sales": ["💼 Business", "💰 Sales", "📞 Account Manager"],
  "commercial-analytics": [
    "💼 Business",
    "📊 Product Analyst",
    "📊 Data Analyst",
    "📈 Growth",
  ],
  "commercial-partnerships": ["💼 Business", "💰 Sales"],

  // Product channels
  "product-general": [
    "🚀 Product Manager",
    "📊 Product Analyst",
    "💻 Engineer",
    "🎨 Designer",
  ],
  "product-roadmap": [
    "🚀 Product Manager",
    "💻 Engineer",
    "🎨 Designer",
    "💼 Business",
  ],
  "product-research": [
    "🚀 Product Manager",
    "📊 Product Analyst",
    "✨ UX Designer",
  ],
  "product-launches": [
    "🚀 Product Manager",
    "📣 Marketing",
    "💻 Engineer",
    "🎨 Designer",
  ],

  // Customer Success channels
  "cs-general": [
    "🎫 Customer Success",
    "💬 Support Agent",
    "📞 Account Manager",
  ],
  "cs-tickets": ["🎫 Customer Success", "💬 Support Agent"],
  "cs-feedback-review": [
    "🎫 Customer Success",
    "💬 Support Agent",
    "🚀 Product Manager",
  ],
  "cs-escalations": ["🎫 Customer Success", "📞 Account Manager"],

  // Operations channels
  "ops-general": ["⚡ Operations", "📊 Data Analyst", "🚀 DevOps Engineer"],
  "ops-incidents": ["⚡ Operations", "🚀 DevOps Engineer", "💻 Engineer"],
  "ops-monitoring": ["⚡ Operations", "🚀 DevOps Engineer"],

  // Voice channels
  "Engineering Sync": [
    "💻 Engineer",
    "⚙️ Backend Engineer",
    "🎨 Frontend Engineer",
    "📱 Mobile Engineer",
    "🚀 DevOps Engineer",
  ],
  "Design Review": [
    "🎨 Designer",
    "🖥️ UI Designer",
    "✨ UX Designer",
    "🎬 Graphic Designer",
  ],
  "Product Strategy": ["🚀 Product Manager", "📊 Product Analyst"],
};

async function updatePermissions() {
  console.log("🚀 Updating work channel permissions...\n");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  console.log("🔑 Logging in...");
  await client.login(config.botToken);
  console.log("✅ Bot logged in successfully!\n");

  const guild = await client.guilds.fetch(config.guildId!);
  console.log(`📍 Found server: ${guild.name}\n`);

  // Fetch all channels and roles
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  console.log("🔧 Updating permissions...\n");

  let updatedCount = 0;

  for (const [channelName, roleNames] of Object.entries(channelPermissions)) {
    try {
      // Find channel (normalize name)
      const channel = channels.find((c) => {
        const cleanName = c?.name.replace(/[^\w-]/g, "").toLowerCase();
        const searchName = channelName.replace(/[^\w-]/g, "").toLowerCase();
        return cleanName === searchName;
      });

      if (!channel) {
        console.log(`  ⚠️  Channel not found: ${channelName}`);
        continue;
      }

      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildVoice
      ) {
        continue;
      }

      // Grant access to each role
      for (const roleName of roleNames) {
        const role = roles.find((r) => r.name === roleName);

        if (!role) {
          continue; // Role doesn't exist yet
        }

        // Check if already has permission
        const existing = channel.permissionOverwrites.cache.get(role.id);
        if (existing?.allow.has("ViewChannel")) {
          continue; // Already has access
        }

        // Grant permission
        await channel.permissionOverwrites.create(role.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        console.log(`  ✅ Granted ${roleName} access to #${channel.name}`);
        updatedCount++;
      }

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  ❌ Failed to update ${channelName}:`, error);
    }
  }

  console.log(`\n✅ Permissions updated!`);
  console.log(`   Updated: ${updatedCount} permissions`);

  console.log("\n📋 Role Access Summary:\n");
  console.log("💻 Engineer → All engineering channels + product");
  console.log("🎨 Designer → All design channels + product");
  console.log("🚀 Product Manager → Product, engineering, design, commercial");
  console.log("💼 Business → All commercial channels");
  console.log("📣 Marketing → Commercial + design channels");
  console.log("🎫 Customer Success → All CS channels");
  console.log("⚡ Operations → Operations + devops channels");

  console.log(
    "\n✨ All set! Team members with worker roles can now access their channels.",
  );

  client.destroy();
  process.exit(0);
}

validateConfig();
updatePermissions().catch((error) => {
  console.error("❌ Update failed:", error);
  process.exit(1);
});
