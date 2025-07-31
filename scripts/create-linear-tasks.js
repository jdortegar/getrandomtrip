#!/usr/bin/env node

const { LinearClient } = require('@linear/sdk');
require('dotenv').config();

// Linear API configuration
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_KEY = process.env.LINEAR_TEAM_KEY || 'your-team-key';
const LINEAR_PROJECT_ID = process.env.LINEAR_PROJECT_ID;

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY not found in environment variables');
  console.log('Please add LINEAR_API_KEY to your .env file');
  process.exit(1);
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY });

// Task definitions based on MVP brief
const taskDefinitions = {
  epics: [
    {
      title: '🎨 UI/UX Design & Setup',
      description: 'Design system, wireframes, and initial project setup',
      priority: 1,
    },
    {
      title: '📋 Booking Flow Implementation',
      description:
        'Complete user booking journey from homepage to confirmation',
      priority: 2,
    },
    {
      title: '💳 Payment Integration',
      description: 'Stripe integration and payment processing',
      priority: 3,
    },
    {
      title: '🔧 Backend & API Development',
      description: 'Database setup, API endpoints, and business logic',
      priority: 4,
    },
    {
      title: '👨‍💼 Admin Panel',
      description: 'Admin dashboard for managing bookings and uploads',
      priority: 5,
    },
    {
      title: '📧 Email & Notifications',
      description: 'Email confirmations and notification system',
      priority: 6,
    },
    {
      title: '🧪 Testing & QA',
      description: 'Quality assurance and testing across all features',
      priority: 7,
    },
  ],
  stories: [
    // UI/UX Design Stories
    {
      title: 'Design System Setup',
      description:
        'Create consistent design tokens, color palette, and component library',
      epic: '🎨 UI/UX Design & Setup',
      priority: 1,
      estimate: 4,
    },
    {
      title: 'Homepage Design',
      description: 'Design landing page with CTA and hero section',
      epic: '🎨 UI/UX Design & Setup',
      priority: 2,
      estimate: 3,
    },
    {
      title: 'How It Works Page',
      description: 'Design 3-step explanation page',
      epic: '🎨 UI/UX Design & Setup',
      priority: 3,
      estimate: 2,
    },

    // Booking Flow Stories
    {
      title: 'Trip Details Form',
      description: 'Create form for departure airport, dates, and travelers',
      epic: '📋 Booking Flow Implementation',
      priority: 1,
      estimate: 6,
    },
    {
      title: 'City Exclusions Feature',
      description: 'Implement exclusion logic (1 free, additional cost extra)',
      epic: '📋 Booking Flow Implementation',
      priority: 2,
      estimate: 5,
    },
    {
      title: 'Add-ons Selection',
      description: 'Dynamic add-ons with pricing and quantity selection',
      epic: '📋 Booking Flow Implementation',
      priority: 3,
      estimate: 4,
    },
    {
      title: 'Booking Summary',
      description: 'Review page showing all selections and total price',
      epic: '📋 Booking Flow Implementation',
      priority: 4,
      estimate: 3,
    },
    {
      title: 'Confirmation Page',
      description: 'Success screen after booking completion',
      epic: '📋 Booking Flow Implementation',
      priority: 5,
      estimate: 2,
    },

    // Payment Integration Stories
    {
      title: 'Stripe Setup',
      description: 'Configure Stripe account and webhook endpoints',
      epic: '💳 Payment Integration',
      priority: 1,
      estimate: 3,
    },
    {
      title: 'Payment Form Integration',
      description: 'Integrate Stripe Elements for secure payment collection',
      epic: '💳 Payment Integration',
      priority: 2,
      estimate: 4,
    },
    {
      title: 'Payment Processing Logic',
      description: 'Handle payment success/failure and booking confirmation',
      epic: '💳 Payment Integration',
      priority: 3,
      estimate: 3,
    },

    // Backend Stories
    {
      title: 'Database Schema Design',
      description: 'Design Prisma schema for bookings, users, and add-ons',
      epic: '🔧 Backend & API Development',
      priority: 1,
      estimate: 4,
    },
    {
      title: 'Booking API Endpoints',
      description: 'Create REST API for booking creation and management',
      epic: '🔧 Backend & API Development',
      priority: 2,
      estimate: 6,
    },
    {
      title: 'Pricing Logic Implementation',
      description: 'Implement exclusion and add-on pricing calculations',
      epic: '🔧 Backend & API Development',
      priority: 3,
      estimate: 4,
    },
    {
      title: 'Data Validation',
      description: 'Add comprehensive validation for all booking data',
      epic: '🔧 Backend & API Development',
      priority: 4,
      estimate: 3,
    },

    // Admin Panel Stories
    {
      title: 'Admin Authentication',
      description: 'Secure login system for admin access',
      epic: '👨‍💼 Admin Panel',
      priority: 1,
      estimate: 4,
    },
    {
      title: 'Booking Management Dashboard',
      description: 'List view with filters and search functionality',
      epic: '👨‍💼 Admin Panel',
      priority: 2,
      estimate: 5,
    },
    {
      title: 'Booking Detail View',
      description:
        'Detailed view showing exclusions, add-ons, and customer info',
      epic: '👨‍💼 Admin Panel',
      priority: 3,
      estimate: 4,
    },
    {
      title: 'Document Upload System',
      description: 'Upload PDFs/links and attach to bookings',
      epic: '👨‍💼 Admin Panel',
      priority: 4,
      estimate: 3,
    },
    {
      title: 'CSV Export Feature',
      description: 'Export booking data as CSV for analysis',
      epic: '👨‍💼 Admin Panel',
      priority: 5,
      estimate: 2,
    },

    // Email Stories
    {
      title: 'Email Service Setup',
      description: 'Configure Resend or SendGrid for email delivery',
      epic: '📧 Email & Notifications',
      priority: 1,
      estimate: 2,
    },
    {
      title: 'Booking Confirmation Email',
      description: 'Design and implement booking confirmation email template',
      epic: '📧 Email & Notifications',
      priority: 2,
      estimate: 3,
    },
    {
      title: 'Admin Notification System',
      description: 'Notify admins of new bookings',
      epic: '📧 Email & Notifications',
      priority: 3,
      estimate: 2,
    },

    // Testing Stories
    {
      title: 'Unit Testing Setup',
      description: 'Set up testing framework and write unit tests',
      epic: '🧪 Testing & QA',
      priority: 1,
      estimate: 4,
    },
    {
      title: 'Integration Testing',
      description: 'Test complete booking flow and payment integration',
      epic: '🧪 Testing & QA',
      priority: 2,
      estimate: 5,
    },
    {
      title: 'User Acceptance Testing',
      description: 'End-to-end testing with real user scenarios',
      epic: '🧪 Testing & QA',
      priority: 3,
      estimate: 4,
    },
  ],
};

async function createEpics() {
  console.log('🏗️  Creating epics...');

  for (const epic of taskDefinitions.epics) {
    try {
      const createdEpic = await linear.issueCreate({
        teamId: LINEAR_TEAM_KEY,
        title: epic.title,
        description: epic.description,
        priority: epic.priority,
        issueType: 'Epic',
      });

      console.log(`✅ Created epic: ${epic.title}`);
      epic.id = createdEpic.issue.id;
    } catch (error) {
      console.error(`❌ Failed to create epic "${epic.title}":`, error.message);
    }
  }
}

async function createStories() {
  console.log('📝 Creating stories...');

  for (const story of taskDefinitions.stories) {
    try {
      const epic = taskDefinitions.epics.find((e) => e.title === story.epic);

      const createdStory = await linear.issueCreate({
        teamId: LINEAR_TEAM_KEY,
        title: story.title,
        description: story.description,
        priority: story.priority,
        estimate: story.estimate,
        issueType: 'Story',
        parentId: epic?.id,
      });

      console.log(`✅ Created story: ${story.title}`);
    } catch (error) {
      console.error(
        `❌ Failed to create story "${story.title}":`,
        error.message
      );
    }
  }
}

async function main() {
  console.log('🚀 Starting Linear task creation...');
  console.log(`📋 Team: ${LINEAR_TEAM_KEY}`);
  console.log(`📁 Project: ${LINEAR_PROJECT_ID || 'Default'}`);
  console.log('');

  try {
    // Verify Linear connection
    const viewer = await linear.viewer;
    console.log(`👤 Connected as: ${viewer.name}`);
    console.log('');

    // Create epics first
    await createEpics();
    console.log('');

    // Then create stories
    await createStories();
    console.log('');

    console.log('🎉 Task creation completed!');
    console.log(
      `📊 Created ${taskDefinitions.epics.length} epics and ${taskDefinitions.stories.length} stories`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createEpics, createStories, taskDefinitions };
