/**
 * Discord Worker Roles Setup Script
 *
 * Creates department-specific roles for team members.
 * These roles give access to specific work channels.
 *
 * Prerequisites:
 * 1. Run discord-setup.ts first (creates base staff roles)
 * 2. Bot must have Manage Roles permission
 *
 * Usage:
 * npm run discord:setup-roles
 */

import { Client, GatewayIntentBits } from "discord.js";
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

// Configuration
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
};

// Validate environment variables
function validateConfig() {
  if (!config.botToken) {
    console.error("❌ DISCORD_BOT_TOKEN is not set");
    process.exit(1);
  }
  if (!config.guildId) {
    console.error("❌ DISCORD_GUILD_ID is not set");
    process.exit(1);
  }
}

// Worker role definitions
interface WorkerRoleDefinition {
  name: string;
  color: number;
  hoist: boolean;
  description: string;
  channels: string[]; // Which channels they should access
}

const workerRoles: WorkerRoleDefinition[] = [
  // Engineering Team
  {
    name: "💻 Engineer",
    color: 0x5865f2, // Blurple
    hoist: true,
    description: "Software Engineers, Developers",
    channels: ["Engineering", "Product"],
  },
  {
    name: "⚙️ Backend Engineer",
    color: 0x5865f2,
    hoist: false,
    description: "Backend/API Developers",
    channels: ["Engineering"],
  },
  {
    name: "🎨 Frontend Engineer",
    color: 0x5865f2,
    hoist: false,
    description: "Frontend/UI Developers",
    channels: ["Engineering", "Design"],
  },
  {
    name: "📱 Mobile Engineer",
    color: 0x5865f2,
    hoist: false,
    description: "iOS/Android Developers",
    channels: ["Engineering"],
  },
  {
    name: "🚀 DevOps Engineer",
    color: 0x5865f2,
    hoist: false,
    description: "DevOps/Infrastructure",
    channels: ["Engineering", "Operations"],
  },

  // Design Team
  {
    name: "🎨 Designer",
    color: 0xeb459e, // Pink
    hoist: true,
    description: "UI/UX Designers",
    channels: ["Design", "Product"],
  },
  {
    name: "🖥️ UI Designer",
    color: 0xeb459e,
    hoist: false,
    description: "User Interface Designers",
    channels: ["Design"],
  },
  {
    name: "✨ UX Designer",
    color: 0xeb459e,
    hoist: false,
    description: "User Experience Designers",
    channels: ["Design", "Product"],
  },
  {
    name: "🎬 Graphic Designer",
    color: 0xeb459e,
    hoist: false,
    description: "Graphics & Marketing Design",
    channels: ["Design", "Commercial"],
  },

  // Product Team
  {
    name: "🚀 Product Manager",
    color: 0xfee75c, // Yellow
    hoist: true,
    description: "Product Managers",
    channels: ["Product", "Engineering", "Design", "Commercial"],
  },
  {
    name: "📊 Product Analyst",
    color: 0xfee75c,
    hoist: false,
    description: "Product Analytics",
    channels: ["Product", "Commercial"],
  },

  // Commercial/Business Team
  {
    name: "💼 Business",
    color: 0x57f287, // Green
    hoist: true,
    description: "Business/Commercial Team",
    channels: ["Commercial", "Product"],
  },
  {
    name: "📣 Marketing",
    color: 0x57f287,
    hoist: false,
    description: "Marketing Team",
    channels: ["Commercial", "Design"],
  },
  {
    name: "💰 Sales",
    color: 0x57f287,
    hoist: false,
    description: "Sales Team",
    channels: ["Commercial"],
  },
  {
    name: "📈 Growth",
    color: 0x57f287,
    hoist: false,
    description: "Growth/Marketing",
    channels: ["Commercial", "Product"],
  },
  {
    name: "📝 Content Creator",
    color: 0x57f287,
    hoist: false,
    description: "Content Writers/Creators",
    channels: ["Commercial", "Design"],
  },

  // Operations Team
  {
    name: "⚡ Operations",
    color: 0xf23c50, // Red
    hoist: true,
    description: "Operations Team",
    channels: ["Operations", "Customer Success"],
  },
  {
    name: "📊 Data Analyst",
    color: 0xf23c50,
    hoist: false,
    description: "Data Analytics",
    channels: ["Operations", "Commercial", "Product"],
  },

  // Customer Success Team
  {
    name: "🎫 Customer Success",
    color: 0xeb459e,
    hoist: true,
    description: "Customer Success Team",
    channels: ["Customer Success"],
  },
  {
    name: "💬 Support Agent",
    color: 0xeb459e,
    hoist: false,
    description: "Customer Support",
    channels: ["Customer Success"],
  },
  {
    name: "📞 Account Manager",
    color: 0xeb459e,
    hoist: false,
    description: "Account Management",
    channels: ["Customer Success", "Commercial"],
  },

  // Other Roles
  {
    name: "📚 Intern",
    color: 0x95a5a6, // Gray
    hoist: false,
    description: "Interns/Trainees",
    channels: [],
  },
  {
    name: "🤝 Contractor",
    color: 0x95a5a6,
    hoist: false,
    description: "External Contractors",
    channels: [],
  },
];

// Main setup function
async function setupWorkerRoles() {
  console.log("🚀 Starting worker roles setup...\n");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  console.log("🔑 Logging in...");
  await client.login(config.botToken);
  console.log("✅ Bot logged in successfully!\n");

  const guild = await client.guilds.fetch(config.guildId!);
  console.log(`📍 Found server: ${guild.name}\n`);

  // Create worker roles
  console.log("👥 Creating worker roles...\n");
  let createdCount = 0;
  let skippedCount = 0;

  for (const roleConfig of workerRoles) {
    try {
      // Check if role already exists
      const existingRole = guild.roles.cache.find(
        (r) => r.name === roleConfig.name,
      );

      if (existingRole) {
        console.log(`  ⏭️  Role already exists: ${roleConfig.name}`);
        skippedCount++;
        continue;
      }

      // Create role
      await guild.roles.create({
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        mentionable: true,
        reason: "Worker role setup",
      });

      console.log(`  ✅ Created role: ${roleConfig.name}`);
      console.log(`     → ${roleConfig.description}`);
      console.log(
        `     → Access: ${roleConfig.channels.join(", ") || "Internal Team only"}`,
      );
      createdCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`  ❌ Failed to create role ${roleConfig.name}:`, error);
    }
  }

  console.log(`\n✅ Worker roles setup complete!`);
  console.log(`   Created: ${createdCount} roles`);
  console.log(`   Skipped: ${skippedCount} roles (already exist)`);

  console.log("\n📋 Available Worker Roles:\n");
  console.log("**Engineering:**");
  console.log("  • 💻 Engineer (general)");
  console.log("  • ⚙️ Backend Engineer");
  console.log("  • 🎨 Frontend Engineer");
  console.log("  • 📱 Mobile Engineer");
  console.log("  • 🚀 DevOps Engineer");

  console.log("\n**Design:**");
  console.log("  • 🎨 Designer (general)");
  console.log("  • 🖥️ UI Designer");
  console.log("  • ✨ UX Designer");
  console.log("  • 🎬 Graphic Designer");

  console.log("\n**Product:**");
  console.log("  • 🚀 Product Manager");
  console.log("  • 📊 Product Analyst");

  console.log("\n**Commercial/Business:**");
  console.log("  • 💼 Business (general)");
  console.log("  • 📣 Marketing");
  console.log("  • 💰 Sales");
  console.log("  • 📈 Growth");
  console.log("  • 📝 Content Creator");

  console.log("\n**Operations:**");
  console.log("  • ⚡ Operations");
  console.log("  • 📊 Data Analyst");

  console.log("\n**Customer Success:**");
  console.log("  • 🎫 Customer Success");
  console.log("  • 💬 Support Agent");
  console.log("  • 📞 Account Manager");

  console.log("\n**Other:**");
  console.log("  • 📚 Intern");
  console.log("  • 🤝 Contractor");

  console.log("\n📝 Next Steps:");
  console.log("1. Assign roles to team members (Right-click → Roles)");
  console.log("2. Run: npm run discord:update-work-permissions");
  console.log(
    "3. This will grant new roles access to their department channels",
  );

  client.destroy();
  process.exit(0);
}

// Run setup
validateConfig();
setupWorkerRoles().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
