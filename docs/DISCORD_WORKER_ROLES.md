# 👥 Discord Worker Roles Guide

Complete guide for department-specific roles and permissions.

---

## 🚀 Quick Setup

```bash
# 1. Create worker roles (run once)
npm run discord:setup-roles

# 2. Update work channel permissions (run after creating roles)
npm run discord:update-work-permissions
```

---

## 📋 Available Worker Roles

### 💻 **Engineering Team** (Blue - #5865F2)

| Role                 | Description                | Access                             |
| -------------------- | -------------------------- | ---------------------------------- |
| **💻 Engineer**      | General software engineers | All engineering channels + Product |
| ⚙️ Backend Engineer  | Backend/API developers     | Backend, DevOps channels           |
| 🎨 Frontend Engineer | Frontend/UI developers     | Frontend channels + Design         |
| 📱 Mobile Engineer   | iOS/Android developers     | Mobile channels                    |
| 🚀 DevOps Engineer   | DevOps/Infrastructure      | DevOps, Operations channels        |

---

### 🎨 **Design Team** (Pink - #EB459E)

| Role                | Description                 | Access                        |
| ------------------- | --------------------------- | ----------------------------- |
| **🎨 Designer**     | General UI/UX designers     | All design channels + Product |
| 🖥️ UI Designer      | User interface designers    | Design channels               |
| ✨ UX Designer      | User experience designers   | Design + Product research     |
| 🎬 Graphic Designer | Graphics & marketing design | Design + Commercial           |

---

### 🚀 **Product Team** (Yellow - #FEE75C)

| Role                   | Description       | Access                                   |
| ---------------------- | ----------------- | ---------------------------------------- |
| **🚀 Product Manager** | Product managers  | Product, Engineering, Design, Commercial |
| 📊 Product Analyst     | Product analytics | Product + Commercial analytics           |

---

### 💼 **Commercial/Business Team** (Green - #57F287)

| Role               | Description              | Access                            |
| ------------------ | ------------------------ | --------------------------------- |
| **💼 Business**    | General business team    | All commercial channels + Product |
| 📣 Marketing       | Marketing team           | Commercial + Design               |
| 💰 Sales           | Sales team               | Commercial + Sales channels       |
| 📈 Growth          | Growth/Marketing         | Commercial + Product              |
| 📝 Content Creator | Content writers/creators | Commercial + Design               |

---

### ⚡ **Operations Team** (Red - #F23C50)

| Role              | Description     | Access                          |
| ----------------- | --------------- | ------------------------------- |
| **⚡ Operations** | Operations team | Operations + Customer Success   |
| 📊 Data Analyst   | Data analytics  | Operations, Commercial, Product |

---

### 🎫 **Customer Success Team** (Pink - #EB459E)

| Role                    | Description           | Access          |
| ----------------------- | --------------------- | --------------- |
| **🎫 Customer Success** | Customer success team | All CS channels |
| 💬 Support Agent        | Customer support      | CS channels     |
| 📞 Account Manager      | Account management    | CS + Commercial |

---

### 🔧 **Other Roles** (Gray - #95A5A6)

| Role          | Description          | Access             |
| ------------- | -------------------- | ------------------ |
| 📚 Intern     | Interns/Trainees     | Internal Team only |
| 🤝 Contractor | External contractors | Internal Team only |

---

## 🎯 Role Hierarchy

### Staff Roles (Already Exist)

```
👑 Founder (Red) - Full access
🛡️ Admin (Orange) - Almost full access
🔧 Moderator (Blue) - Community + CS + Internal
💼 Support Team (Green) - CS + Internal
```

### Worker Roles (New!)

```
Department Leads:
├── 💻 Engineer (visible in sidebar)
├── 🎨 Designer (visible in sidebar)
├── 🚀 Product Manager (visible in sidebar)
├── 💼 Business (visible in sidebar)
├── ⚡ Operations (visible in sidebar)
└── 🎫 Customer Success (visible in sidebar)

Specialists (not visible in sidebar):
├── ⚙️ Backend Engineer
├── 🎨 Frontend Engineer
├── 📱 Mobile Engineer
├── 🚀 DevOps Engineer
├── 🖥️ UI Designer
├── ✨ UX Designer
├── 🎬 Graphic Designer
├── 📊 Product Analyst
├── 📣 Marketing
├── 💰 Sales
├── 📈 Growth
├── 📝 Content Creator
├── 📊 Data Analyst
├── 💬 Support Agent
├── 📞 Account Manager
├── 📚 Intern
└── 🤝 Contractor
```

---

## 📊 Channel Access Matrix

### Engineering Channels

| Channel          | Engineer | Backend | Frontend | Mobile | DevOps | PM  |
| ---------------- | -------- | ------- | -------- | ------ | ------ | --- |
| #eng-general     | ✅       | ✅      | ✅       | ✅     | ✅     | ✅  |
| #eng-backend     | ✅       | ✅      | ❌       | ❌     | ✅     | ❌  |
| #eng-frontend    | ✅       | ❌      | ✅       | ❌     | ❌     | ❌  |
| #eng-mobile      | ✅       | ❌      | ❌       | ✅     | ❌     | ❌  |
| #eng-devops      | ✅       | ❌      | ❌       | ❌     | ✅     | ❌  |
| #eng-bugs        | ✅       | ✅      | ✅       | ✅     | ✅     | ❌  |
| #eng-code-review | ✅       | ✅      | ✅       | ✅     | ❌     | ❌  |

### Design Channels

| Channel                  | Designer | UI  | UX  | Graphic | Frontend | PM  |
| ------------------------ | -------- | --- | --- | ------- | -------- | --- |
| #design-general          | ✅       | ✅  | ✅  | ✅      | ✅       | ✅  |
| #design-ui-ux            | ✅       | ✅  | ✅  | ❌      | ❌       | ❌  |
| #design-branding         | ✅       | ❌  | ❌  | ✅      | ❌       | ❌  |
| #design-marketing-assets | ✅       | ❌  | ❌  | ✅      | ❌       | ❌  |
| #design-feedback         | ✅       | ✅  | ✅  | ✅      | ❌       | ✅  |

### Product Channels

| Channel           | PM  | Analyst | Engineer | Designer |
| ----------------- | --- | ------- | -------- | -------- |
| #product-general  | ✅  | ✅      | ✅       | ✅       |
| #product-roadmap  | ✅  | ❌      | ✅       | ✅       |
| #product-research | ✅  | ✅      | ❌       | ❌       |
| #product-launches | ✅  | ❌      | ✅       | ✅       |

### Commercial Channels

| Channel                  | Business | Marketing | Sales | Growth |
| ------------------------ | -------- | --------- | ----- | ------ |
| #commercial-general      | ✅       | ✅        | ✅    | ✅     |
| #commercial-marketing    | ✅       | ✅        | ❌    | ✅     |
| #commercial-sales        | ✅       | ❌        | ✅    | ❌     |
| #commercial-analytics    | ✅       | ❌        | ❌    | ✅     |
| #commercial-partnerships | ✅       | ❌        | ✅    | ❌     |

---

## 🔧 How to Use

### 1. Create Worker Roles

```bash
npm run discord:setup-roles
```

**What it does:**

- Creates 23 department-specific roles
- Sets colors and visibility
- Configures mentionability

**Time:** ~1-2 minutes

---

### 2. Assign Roles to Team Members

**Method 1: Right-click (easiest)**

1. Right-click team member
2. Click "Roles"
3. Check appropriate role(s)

**Method 2: Server Settings**

1. Server Settings → Members
2. Find member
3. Click "+" next to their name
4. Select role(s)

**Example Assignments:**

```
John (Backend Dev):
- 🛡️ Admin
- 💻 Engineer
- ⚙️ Backend Engineer

Maria (UI Designer):
- 🔧 Moderator
- 🎨 Designer
- 🖥️ UI Designer

Carlos (Product Manager):
- 🛡️ Admin
- 🚀 Product Manager

Ana (Marketing):
- 💼 Business
- 📣 Marketing
```

---

### 3. Update Channel Permissions

```bash
npm run discord:update-work-permissions
```

**What it does:**

- Grants worker roles access to their channels
- Updates all work channel permissions
- Maintains existing staff role access

**Time:** ~30 seconds

---

## 💡 Best Practices

### Role Assignment Strategy

**Generalist Roles (visible in sidebar):**

- Give these to everyone in that department
- Examples: Engineer, Designer, Business

**Specialist Roles (hidden from sidebar):**

- Give these for specific expertise
- Examples: Backend Engineer, UI Designer

**Multiple Roles:**

- ✅ Someone can have multiple roles
- ✅ Example: Engineer + Frontend Engineer
- ✅ Example: Designer + UX Designer

**Cross-Functional:**

- Product Managers → Product + access to Eng/Design
- Frontend Engineers → Engineer + limited Design access
- Growth → Business + Product access

---

### Common Team Structures

**Small Startup (5-10 people):**

```
CEO: 👑 Founder
CTO: 🛡️ Admin + 💻 Engineer
Designer: 🎨 Designer
Marketer: 📣 Marketing
Support: 💼 Support Team + 💬 Support Agent
```

**Growing Team (10-30 people):**

```
Leadership: 👑 Founder + 🛡️ Admin
Engineers: 💻 Engineer + specialty (Backend/Frontend/Mobile)
Designers: 🎨 Designer + specialty (UI/UX/Graphic)
Product: 🚀 Product Manager
Marketing: 💼 Business + 📣 Marketing
Sales: 💼 Business + 💰 Sales
Support: 🎫 Customer Success + 💬 Support Agent
```

**Scaled Team (30+ people):**

```
C-Level: 👑 Founder
Directors: 🛡️ Admin + Department role
Managers: 🛡️ Admin + Department role
ICs: Department role + Specialty role
Interns: 📚 Intern
Contractors: 🤝 Contractor
```

---

## 🎨 Role Colors & Organization

### Visual Hierarchy

Roles appear in this order (top to bottom):

1. **Red** - Founder/Admin
2. **Blue** - Engineers
3. **Yellow** - Product
4. **Pink** - Designers
5. **Green** - Business/Commercial
6. **Red** - Operations
7. **Pink** - Customer Success
8. **Gray** - Other roles

### Hoist Settings

**Hoisted (visible in sidebar):**

- 💻 Engineer
- 🎨 Designer
- 🚀 Product Manager
- 💼 Business
- ⚡ Operations
- 🎫 Customer Success

**Not Hoisted (cleaner sidebar):**

- All specialty roles
- Interns
- Contractors

---

## 🔄 Updating Permissions

### When to Re-run Permission Update

Run `npm run discord:update-work-permissions` when:

- ✅ Added new worker roles
- ✅ Created new work channels
- ✅ Changed team structure
- ✅ Need to fix access issues

### What It Doesn't Change

- ❌ Staff roles (Founder, Admin, etc.)
- ❌ Community channels
- ❌ Existing manual permissions
- ❌ Role hierarchy

---

## 🆘 Troubleshooting

### "Worker can't see their channels"

**Solution:**

1. Verify they have the role assigned
2. Run: `npm run discord:update-work-permissions`
3. Check channel-specific overrides

### "Too many roles in sidebar"

**Solution:**

- Only hoist department lead roles
- Keep specialty roles un-hoisted
- Edit in script and re-run

### "Need different permissions"

**Solution:**

- Edit `channelPermissions` in `discord-update-work-permissions.ts`
- Re-run the update script
- Or manually adjust in Discord

### "Want to add custom role"

**Solution:**

1. Add to `workerRoles` in `discord-setup-worker-roles.ts`
2. Run: `npm run discord:setup-roles`
3. Add to `channelPermissions` in update script
4. Run: `npm run discord:update-work-permissions`

---

## 🎯 Example Scenarios

### Scenario 1: Hiring New Backend Developer

```bash
# Already have roles set up, just assign:
1. Right-click new member
2. Assign: 💻 Engineer
3. Assign: ⚙️ Backend Engineer
4. They now see: Engineering channels + Product
```

### Scenario 2: Adding Design Intern

```bash
# Create and assign:
1. Assign: 📚 Intern
2. Assign: 🎨 Designer (if they should see design channels)
3. They see: Internal Team + Design channels
```

### Scenario 3: Promoting to Team Lead

```bash
# Give additional permissions:
1. Keep existing role (e.g., 💻 Engineer)
2. Add: 🛡️ Admin
3. Now they can: Moderate + Access all channels
```

### Scenario 4: Contractor for Frontend Work

```bash
# Temporary access:
1. Assign: 🤝 Contractor
2. Assign: 🎨 Frontend Engineer
3. Limited access, can see Frontend channels
4. Remove roles when contract ends
```

---

## 📋 Quick Command Reference

```bash
# Initial setup (run once)
npm run discord:setup              # Create base channels/roles
npm run discord:setup-work         # Create work channels
npm run discord:setup-messages     # Post messages

# Worker roles (run once)
npm run discord:setup-roles        # Create worker roles

# Update permissions (run after assigning roles)
npm run discord:update-work-permissions

# Re-run anytime to update
```

---

## ✅ Complete Setup Checklist

```bash
Day 1: Initial Setup
✅ npm run discord:setup
✅ npm run discord:setup-work
✅ npm run discord:setup-messages
✅ npm run discord:setup-roles

Day 1-2: Configuration
✅ Assign worker roles to team members
✅ npm run discord:update-work-permissions
✅ Test channel access
✅ Adjust as needed

Ongoing:
✅ Assign roles to new hires
✅ Re-run permission update if needed
✅ Review access quarterly
```

---

## 🎉 Summary

### What You Now Have

- ✅ 23 department-specific worker roles
- ✅ Color-coded role hierarchy
- ✅ Automatic channel permissions
- ✅ Flexible role assignments
- ✅ Scalable team structure

### What's Automated

- ✅ Role creation
- ✅ Permission updates
- ✅ Channel access control
- ✅ Visual organization

### What You Control

- ✅ Who gets what role
- ✅ Multiple roles per person
- ✅ Custom role creation
- ✅ Permission adjustments

---

**Ready to organize your team? Run the setup now!** 🚀

```bash
npm run discord:setup-roles
```

Then assign roles and update permissions:

```bash
npm run discord:update-work-permissions
```
