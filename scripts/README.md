# Linear Task Creation Script

This script automatically creates Linear tasks (epics and stories) for the Surprise Trip Booking App MVP based on the project brief.

## 📋 What it creates

### Epics (7 major phases)

1. **🎨 UI/UX Design & Setup** - Design system and initial setup
2. **📋 Booking Flow Implementation** - Complete user booking journey
3. **💳 Payment Integration** - Stripe integration
4. **🔧 Backend & API Development** - Database and API setup
5. **👨‍💼 Admin Panel** - Admin dashboard
6. **📧 Email & Notifications** - Email system
7. **🧪 Testing & QA** - Quality assurance

### Stories (25 detailed tasks)

Each epic contains multiple stories with:

- Detailed descriptions
- Priority levels
- Time estimates (in hours)
- Proper categorization

## 🚀 Setup Instructions

### 1. Get Linear API Key

1. Go to [Linear Settings](https://linear.app/settings/api)
2. Create a new API key
3. Copy the key

### 2. Find Your Team Key

1. Go to your Linear workspace
2. Look at the URL: `https://linear.app/your-workspace/team/TEAM-KEY`
3. Copy the `TEAM-KEY` part

### 3. Configure Environment

1. Copy `env.example` to `.env`
2. Fill in your Linear credentials:

```bash
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_KEY=your-team-key
LINEAR_PROJECT_ID=optional-project-id
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Script

```bash
node scripts/create-linear-tasks.js
```

## 📊 Task Breakdown

| Phase               | Stories | Est. Hours | Priority |
| ------------------- | ------- | ---------- | -------- |
| UI/UX Design        | 3       | 9          | High     |
| Booking Flow        | 5       | 20         | High     |
| Payment Integration | 3       | 10         | High     |
| Backend Development | 4       | 17         | High     |
| Admin Panel         | 5       | 18         | Medium   |
| Email System        | 3       | 7          | Medium   |
| Testing & QA        | 3       | 13         | Medium   |
| **Total**           | **26**  | **94**     | -        |

## 🔧 Customization

You can modify the `taskDefinitions` object in `create-linear-tasks.js` to:

- Add/remove tasks
- Change priorities
- Adjust time estimates
- Modify descriptions

## 🎯 Next Steps

After running the script:

1. Review created tasks in Linear
2. Assign team members
3. Set up sprints/cycles
4. Start with high-priority epics

## 📝 Notes

- The script creates epics first, then stories
- Stories are linked to their parent epics
- All tasks include proper descriptions and estimates
- Priority levels follow Linear's 1-4 scale (1 = highest)
