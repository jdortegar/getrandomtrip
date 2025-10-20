/**
 * Discord Messages Setup Script
 *
 * Automatically posts welcome messages, rules, templates, and pins them.
 * Also sets read-only permissions on announcement channels.
 *
 * Prerequisites:
 * 1. Run discord-setup.ts first
 * 2. Bot must have these permissions:
 *    - Send Messages
 *    - Embed Links
 *    - Pin Messages
 *    - Manage Channels (for read-only)
 *
 * Usage:
 * npm run discord:setup-messages
 */

import {
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
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
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://getrandomtrip.com',
};

// Validate environment variables
function validateConfig() {
  if (!config.botToken) {
    console.error('❌ DISCORD_BOT_TOKEN is not set');
    process.exit(1);
  }
  if (!config.guildId) {
    console.error('❌ DISCORD_GUILD_ID is not set');
    process.exit(1);
  }
}

// Main setup function
async function setupMessages() {
  console.log('🚀 Starting messages setup...\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  console.log('🔑 Logging in...');
  await client.login(config.botToken);
  console.log('✅ Bot logged in successfully!\n');

  const guild = await client.guilds.fetch(config.guildId!);
  console.log(`📍 Found server: ${guild.name}\n`);

  // Fetch all channels
  const channels = await guild.channels.fetch();

  // Post and configure messages
  console.log('📝 Posting messages...\n');

  await postWelcomeMessage(channels, guild);
  await postRulesMessage(channels, guild);
  await postGetYourRoleMessage(channels, guild);
  await postIntroductionsTemplate(channels, guild);
  await postFAQMessage(channels, guild);
  await postAnnouncementExample(channels, guild);

  console.log('\n🎉 Messages setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up Carl-bot for reaction roles in #get-your-role');
  console.log('2. Customize messages as needed');
  console.log('3. Test channel permissions');
  console.log('4. Invite your community!');

  client.destroy();
  process.exit(0);
}

// Post welcome message
async function postWelcomeMessage(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'welcome' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #welcome channel not found');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('👋 Welcome to GetRandomTrip Community!')
    .setDescription(
      `We're excited to have you join our community of adventurous travelers!`
    )
    .addFields(
      {
        name: '🚀 Get Started',
        value:
          '1️⃣ Read the <#rules>\n2️⃣ Grab your roles in <#get-your-role>\n3️⃣ Introduce yourself in <#introductions>\n4️⃣ Start exploring and chatting!',
      },
      {
        name: '🎲 Ready for your next random adventure?',
        value: `Visit: ${config.websiteUrl}`,
      },
      {
        name: '💬 Need Help?',
        value:
          'Check <#help-desk> or ask our <@&Support Team> for assistance.',
      }
    )
    .setFooter({ text: 'Happy travels! ✈️' })
    .setTimestamp();

  try {
    const message = await channel.send({ embeds: [embed] });
    await message.pin();

    // Make channel read-only
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false,
    });

    console.log('  ✅ Posted and pinned welcome message in #welcome');
    console.log('  🔒 Set #welcome to read-only');
  } catch (error) {
    console.error('  ❌ Failed to post welcome message:', error);
  }
}

// Post rules message
async function postRulesMessage(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'rules' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #rules channel not found');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('📜 Community Rules & Guidelines')
    .setDescription('Please read and follow these rules to keep our community awesome!')
    .addFields(
      {
        name: '1. 🤝 Be Respectful and Kind',
        value:
          'Treat everyone with respect. No harassment, hate speech, or bullying.',
      },
      {
        name: '2. 🚫 No Spam or Self-Promotion',
        value:
          'No advertising, referral links, or excessive self-promotion without permission.',
      },
      {
        name: '3. 💬 Use Appropriate Channels',
        value:
          'Keep discussions in the right channels. Read channel descriptions!',
      },
      {
        name: '4. 🔞 Keep Content Family-Friendly',
        value: 'No NSFW content, explicit language, or inappropriate material.',
      },
      {
        name: '5. 🌍 English/Spanish Primary Languages',
        value: 'Main languages are English and Spanish for better communication.',
      },
      {
        name: '6. 📸 Protect Privacy',
        value:
          "Don't share personal information (yours or others). Stay safe online!",
      },
      {
        name: '7. ⚖️ Follow Discord Terms of Service',
        value: 'All Discord ToS and Community Guidelines apply here.',
      },
      {
        name: '8. 🆘 Report Issues',
        value:
          'See rule violations? Contact <@&Moderator> or <@&Support Team>.',
      }
    )
    .setFooter({
      text: 'Violations may result in warnings, timeouts, or bans. Thanks for understanding!',
    });

  try {
    const message = await channel.send({ embeds: [embed] });
    await message.pin();

    // Make channel read-only
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false,
    });

    console.log('  ✅ Posted and pinned rules in #rules');
    console.log('  🔒 Set #rules to read-only');
  } catch (error) {
    console.error('  ❌ Failed to post rules:', error);
  }
}

// Post get-your-role message
async function postGetYourRoleMessage(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'get-your-role' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #get-your-role channel not found');
    return;
  }

  const embed1 = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🎭 Choose Your Traveler Type')
    .setDescription(
      'React with emojis below to get your role and access exclusive channels!\n\n' +
        '**Note:** You need to set up Carl-bot reaction roles for this to work.'
    )
    .addFields(
      { name: '🧳 Solo Traveler', value: 'For solo adventurers', inline: true },
      {
        name: '💑 Couple Traveler',
        value: 'For romantic getaways',
        inline: true,
      },
      {
        name: '👨‍👩‍👧‍👦 Family Traveler',
        value: 'For family adventures',
        inline: true,
      },
      {
        name: '👯 Friends Traveler',
        value: 'For group trips',
        inline: true,
      },
      {
        name: '🌙 Honeymoon Traveler',
        value: 'For honeymooners',
        inline: true,
      }
    );

  const embed2 = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('🌍 Choose Your Regions')
    .setDescription('Select regions you\'re interested in or have traveled to!')
    .addFields(
      { name: '🌎 Americas', value: 'North, Central & South America', inline: true },
      { name: '🌍 Europe', value: 'European destinations', inline: true },
      { name: '🌏 Asia-Pacific', value: 'Asia & Oceania', inline: true },
      {
        name: '🗺️ Africa & Middle East',
        value: 'Africa & Middle East',
        inline: true,
      }
    )
    .setFooter({
      text: 'Setup: Use Carl-bot to configure reaction roles for these emojis',
    });

  try {
    const msg1 = await channel.send({ embeds: [embed1] });
    const msg2 = await channel.send({ embeds: [embed2] });

    // Add reactions as examples (Carl-bot will need to be configured)
    await msg1.react('🧳');
    await msg1.react('💑');
    await msg1.react('👨‍👩‍👧‍👦');
    await msg1.react('👯');
    await msg1.react('🌙');

    await msg2.react('🌎');
    await msg2.react('🌍');
    await msg2.react('🌏');
    await msg2.react('🗺️');

    await msg1.pin();

    console.log('  ✅ Posted role selection messages in #get-your-role');
    console.log('  ℹ️  Configure Carl-bot for reaction roles next!');
  } catch (error) {
    console.error('  ❌ Failed to post role selection:', error);
  }
}

// Post introductions template
async function postIntroductionsTemplate(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'introductions' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #introductions channel not found');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle('👋 Introduce Yourself!')
    .setDescription('Welcome! We\'d love to get to know you better.')
    .addFields(
      { name: '✈️ Where are you from?', value: 'City, Country' },
      {
        name: '🌍 Favorite place you\'ve visited?',
        value: 'Tell us about your best trip!',
      },
      {
        name: '🎒 What\'s your travel style?',
        value: 'Solo, couple, family, or with friends?',
      },
      {
        name: '🎲 What brought you to GetRandomTrip?',
        value: 'How did you find us?',
      },
      {
        name: '💭 Fun fact about you?',
        value: '(Optional) Share something interesting!',
      }
    )
    .setFooter({ text: 'Can\'t wait to hear your stories!' });

  try {
    const message = await channel.send({ embeds: [embed] });
    await message.pin();
    console.log('  ✅ Posted and pinned introduction template in #introductions');
  } catch (error) {
    console.error('  ❌ Failed to post introductions template:', error);
  }
}

// Post FAQ message
async function postFAQMessage(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'faq' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #faq channel not found');
    return;
  }

  const embed1 = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('📚 Frequently Asked Questions')
    .setDescription('**About GetRandomTrip**');

  const embed2 = new EmbedBuilder()
    .setColor(0x3498db)
    .addFields(
      {
        name: '❓ What is GetRandomTrip?',
        value:
          'GetRandomTrip is a mystery travel booking platform. Choose your preferences, and we reveal a surprise destination!',
      },
      {
        name: '🎲 How does it work?',
        value:
          '1. Set your travel preferences (dates, budget, interests)\n2. Book your mystery trip\n3. Reveal your destination before you travel\n4. Enjoy your adventure!',
      },
      {
        name: '💰 How much does it cost?',
        value:
          'Trip prices vary based on your preferences, dates, and destination. Visit our website for current pricing.',
      },
      {
        name: '🗓️ When do I find out my destination?',
        value:
          'You can reveal your destination after booking, typically a few weeks before departure.',
      }
    );

  const embed3 = new EmbedBuilder()
    .setColor(0x3498db)
    .addFields(
      {
        name: '✈️ What\'s included?',
        value:
          'Typically includes: flights, accommodation, and basic trip planning. Check your specific package details.',
      },
      {
        name: '❌ Can I cancel or change my booking?',
        value:
          'Cancellation policies vary. Check your booking terms or contact support in <#bookings-support>.',
      },
      {
        name: '🆘 How do I get help?',
        value:
          'For support:\n• Discord: <#help-desk> or <#bookings-support>\n• Website: Contact form\n• Email: support@getrandomtrip.com',
      },
      {
        name: '🌍 Where do you fly to?',
        value:
          'We offer destinations worldwide! Popular regions include Europe, Asia, Americas, and more.',
      }
    )
    .setFooter({
      text: 'More questions? Ask in #help-desk or visit our website!',
    });

  try {
    const msg1 = await channel.send({ embeds: [embed1, embed2, embed3] });
    await msg1.pin();

    // Make channel read-only
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false,
    });

    console.log('  ✅ Posted and pinned FAQ in #faq');
    console.log('  🔒 Set #faq to read-only');
  } catch (error) {
    console.error('  ❌ Failed to post FAQ:', error);
  }
}

// Post announcement example
async function postAnnouncementExample(channels: any, guild: any) {
  const channel = channels.find(
    (c: any) => c.name === 'announcements' && c.type === ChannelType.GuildText
  ) as TextChannel;

  if (!channel) {
    console.log('  ⚠️  #announcements channel not found');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('🎉 Welcome to GetRandomTrip Discord!')
    .setDescription(
      'We\'re excited to launch our official Discord community!\n\n' +
        'This is where you\'ll find:\n' +
        '• 🌍 Travel inspiration and tips\n' +
        '• 👥 Connect with fellow travelers\n' +
        '• 🎁 Exclusive deals and contests\n' +
        '• 💬 Direct support from our team\n\n' +
        'Make sure to grab your roles in <#get-your-role> and introduce yourself in <#introductions>!'
    )
    .setImage('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800')
    .setFooter({ text: 'Stay tuned for more updates!' })
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });

    // Make channel read-only
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false,
    });

    console.log('  ✅ Posted welcome announcement in #announcements');
    console.log('  🔒 Set #announcements to read-only');
  } catch (error) {
    console.error('  ❌ Failed to post announcement:', error);
  }
}

// Run setup
validateConfig();
setupMessages().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

