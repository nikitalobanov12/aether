# PRODUCT DESIGN DOCUMENT
## Task Planner App - Complete Engineering Specification

**Version 2.0 | January 2026 | Pre-Launch MVP**

---

## TABLE OF CONTENTS
1. Product Overview & Vision
2. MVP Feature Specifications (8 Features)
3. Technical Architecture
4. Database Schema
5. API Endpoints
6. UI/UX Specifications
7. Development Timeline
8. Success Metrics

---

## 1. PRODUCT OVERVIEW

### Product Vision
**"The first app that unifies calendar, tasks, and life goals—where AI helps you organize, never decides for you."**

### Core Problem
Users juggle multiple apps because no single tool:
- ✗ Syncs calendar + tasks bidirectionally without breaking
- ✗ Connects life goals → projects → daily tasks
- ✗ Shows what you accomplished (motivation gap)
- ✗ Offers helpful AI without forced scheduling

### Success Metrics (90 Days)
- 1,000+ active users
- 10-15% free → paid conversion
- <6% monthly churn
- NPS > 40

---

## 2. MVP FEATURES (8 Core Features - Launch Priority)

### Feature 1: Authentication
**Scope**: Email/password signup, simple onboarding, free tier auto-enabled

**User Flow**:
```
User signs up
  ↓
Email verification
  ↓
Onboarding: "What's your main goal for next week?"
  ↓
App opens to Today view
```

**Technical**:
- Firebase Auth or Auth0 (supports future OAuth)
- Simple user preferences table
- No SSO in MVP (add Phase 2)

---

### Feature 2: Goal → Project → Task Hierarchy

**User Experience**:
1. Create Goal (e.g., "Launch Side App")
2. Create Projects under Goal (e.g., "Design," "Dev," "Launch")
3. Create Tasks under Projects (daily actionable items)

**Hierarchy Rules**:
- Goals collapsed in sidebar by default
- Click Goal → expand to show Projects
- Click Project → show all tasks
- Today view shows tasks across all goals/projects

**Database Schema**:
```sql
goals (id, user_id, title, target_date, created_at, archived)
projects (id, goal_id, title, created_at, archived, display_order)
tasks (id, project_id, title, priority, due_date, completed_at, created_at)
```

---

### Feature 3: Daily Planner View (Primary Interface)

**Layout**:
```
LEFT (40%): Calendar                RIGHT (60%): Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7:00am  [ Event 1 ]                 🌟 NEXT UP: Write report
7:30am  [ ]                         ├─ Project: Q1 Planning
8:00am  [ ]                         └─ Due: Today 2pm
8:30am  [ Event 2 ]                 
9:00am  [ ]                         ─ Other tasks:
        ...                         ├─ Review metrics
        ...                         ├─ Schedule meeting
        ...                         └─ Update roadmap
```

**Interactions**:
- Drag task → time slot to schedule
- Check off task → grayed out + removed from calendar
- Click task → expand to see subtasks, notes, attachments

**Technical**:
- Load Google Calendar every 5 minutes
- Validate no double-booking
- Real-time updates with WebSocket

---

### Feature 4: "Next Up" Task Sequencing

**How It Works**:
- For each Project, ONE incomplete task is marked "Next Up"
- Auto-highlighted in today view
- When task completed, next in line appears
- **No AI, just list order**

**Technical**:
- Add `next_up_order` field to tasks
- Query: WHERE project_id = X AND completed_at IS NULL ORDER BY next_up_order LIMIT 1
- Update UI in real-time

---

### Feature 5: Google Calendar + Google Tasks Sync

**What It Does**:
```
User creates task in app
  ↓
Task appears in Google Tasks + Google Calendar event
  ↓
User completes task
  ↓
Task removed from both (bi-directional)
  ↓
User changes due date in Google Calendar
  ↓
App syncs change within 5 minutes
```

**Technical Requirements**:
- OAuth for Google Calendar + Tasks APIs
- Background sync job every 5 minutes
- Conflict resolution: last-write-wins
- De-duplication logic (crucial)
- Sync log table to track state

**Database Schema**:
```sql
calendar_integrations (user_id, provider, access_token, refresh_token, expires_at)
sync_log (user_id, sync_type, app_resource_id, google_resource_id, status, error_message)
tasks (... google_calendar_event_id, google_tasks_id ...)
```

---

### Feature 6: Completed Task History

**What Users See**:
- Weekly view showing all completed tasks
- Grouped by project/goal
- Time spent per task (if tracked)
- Motivational summary: "You completed 14 tasks this week"

**Database Schema**:
```sql
completed_tasks (id, task_id, user_id, completed_at, time_spent_minutes, notes)
```

**Technical**:
- When user checks off task, log to completed_tasks
- Weekly view queries: completed_at BETWEEN start_week AND end_week

---

### Feature 7: Minimal, Linear-Inspired Design

**Design Principles**:
- White space > clutter
- Dark text on light background (or light mode + dark mode toggle)
- Monochromatic + single teal accent
- Sidebar navigation
- Card-based task display

**Key Colors**:
- Background: #F5F7FA (light) or #0B0C10 (dark)
- Text: #111827 (light) or #F9FAFB (dark)
- Accent: #32B8C6 (teal)
- Success: #10B981 (green)

---

### Feature 8: Affordable Pricing

**Pricing Structure**:
- **Free**: 50 tasks, 2 goals, basic sync
- **Pro**: $8/month or $80/year (20% discount)
- **Features in Pro**: Unlimited tasks, unlimited goals, all features

**Billing**:
- Stripe for payments
- Email receipts
- Cancel anytime

---

## 3. TECHNICAL ARCHITECTURE

### Tech Stack (Recommended)

**Frontend**:
- React + TypeScript
- TailwindCSS
- Zustand (state management)
- React Big Calendar (calendar component)
- Vercel (deployment)

**Backend**:
- Node.js + Express (or Python FastAPI)
- PostgreSQL (relational data)
- Redis (sync queue)
- Heroku or AWS ECS (deployment)

**Third-Party**:
- Firebase Auth or Auth0
- Google Calendar API v3
- Google Tasks API
- Stripe (payments)
- SendGrid (email)

### Data Flow
```
User Action (Frontend)
  ↓
API Request
  ↓
Backend Validation
  ↓
Database Update
  ↓
Background Job: Sync to Google (async)
  ↓
WebSocket: Notify Frontend
  ↓
Frontend UI Update
```

---

## 4. DATABASE SCHEMA (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  display_order INTEGER,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  display_order INTEGER,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(10), -- HIGH, MEDIUM, LOW
  due_date DATE,
  due_time TIME,
  time_estimate_minutes INTEGER,
  next_up_order INTEGER,
  display_order INTEGER,
  completed_at TIMESTAMP,
  
  -- Calendar sync
  google_calendar_event_id VARCHAR(255),
  google_tasks_id VARCHAR(255),
  time_slot_start TIMESTAMP,
  time_slot_end TIMESTAMP,
  
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subtasks
CREATE TABLE subtasks (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id),
  title VARCHAR(500) NOT NULL,
  completed_at TIMESTAMP,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completed Tasks (History)
CREATE TABLE completed_tasks (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id),
  user_id UUID NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  time_spent_minutes INTEGER,
  notes TEXT
);

-- Calendar Integrations
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(50), -- 'google'
  access_token VARCHAR(2000),
  refresh_token VARCHAR(2000),
  token_expires_at TIMESTAMP,
  calendar_id VARCHAR(255),
  connected_at TIMESTAMP DEFAULT NOW()
);

-- Sync Log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  sync_type VARCHAR(50), -- 'calendar', 'tasks'
  app_resource_id UUID,
  google_resource_id VARCHAR(255),
  status VARCHAR(20), -- 'pending', 'syncing', 'synced', 'failed'
  error_message TEXT,
  last_sync_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Billing
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(20), -- 'free', 'pro'
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20), -- 'active', 'canceled', 'past_due'
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## 5. API ENDPOINTS (Core)

```
AUTH
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

GOALS
GET    /goals
POST   /goals
PUT    /goals/:id
DELETE /goals/:id

PROJECTS
GET    /projects?goal_id=:id
POST   /projects
PUT    /projects/:id
DELETE /projects/:id

TASKS
GET    /tasks?project_id=:id&date=:date
POST   /tasks
PUT    /tasks/:id
PATCH  /tasks/:id/complete
DELETE /tasks/:id

SUBTASKS
POST   /tasks/:id/subtasks
PATCH  /subtasks/:id/complete
DELETE /subtasks/:id

CALENDAR
GET    /calendar/events?date_start=:date&date_end=:date
GET    /calendar/today
POST   /integrations/google/connect
POST   /integrations/google/disconnect

HISTORY
GET    /completed-tasks?week=:date
GET    /weekly-summary?date=:date

SYNC
POST   /sync/trigger
GET    /sync/status
```

---

## 6. UI/UX SPECIFICATIONS

### Layout (Desktop)
```
┌──────────────────────────────────────┐
│ Logo  Nav  Search  User Menu         │ (Header, 60px)
├─────┬────────────────────────────────┤
│ Sidebar  │  Main Content Area        │
│ 250px    │  Responsive               │
│          │                            │
│  Goals   │  Today View / Week / Goals│
│  Projects│                            │
│  ...     │                            │
│          │                            │
└─────┴────────────────────────────────┘
```

### Sidebar
- User name + settings icon (top)
- Goals list (collapsible, shows project count + progress)
- Navigation: Today, Week, Goals, Settings (bottom)

### Today View
- **Left**: Calendar (7am-10pm, 30-min slots)
- **Right**: Tasks list with "Next Up" highlighted
- Drag-and-drop task to calendar slot
- Check-off interface (snappy)

---

## 7. DEVELOPMENT TIMELINE (15 Weeks)

### Weeks 1-3: Foundation
- [ ] Project setup (React + Node)
- [ ] Firebase Auth
- [ ] Database schema + migration
- [ ] Basic navigation

### Weeks 4-6: Core Features
- [ ] Goal/Project/Task CRUD
- [ ] Hierarchy display + sorting
- [ ] Daily planner view (basic)

### Weeks 7-9: Calendar Integration
- [ ] Google Calendar API integration
- [ ] Bi-directional sync (crucial)
- [ ] Drag-to-schedule tasks
- [ ] De-duplication logic

### Weeks 10-12: Polish & Testing
- [ ] Weekly review view
- [ ] Completed task history
- [ ] Error handling + sync recovery
- [ ] Performance optimization
- [ ] Extensive calendar sync testing

### Weeks 13-15: Launch Prep
- [ ] Pricing + Stripe integration
- [ ] Landing page
- [ ] Email onboarding
- [ ] Beta user testing
- [ ] Bug fixes + final polish

---

## 8. SUCCESS METRICS

### 90-Day Goals
- 1,000+ active users
- 10-15% free → paid conversion
- <6% monthly churn
- NPS > 40

### 6-Month Goals
- 10,000+ active users
- $5,000-10,000 MRR
- 40%+ Day 30 retention
- 50+ user testimonials

### Tracking
- Daily active users (DAU)
- Weekly active users (WAU)
- Free to paid conversion rate
- Monthly churn rate
- NPS (Net Promoter Score)
- Feature usage heatmap

---

## CRITICAL SUCCESS FACTORS

1. **Calendar sync must not break** (your #1 differentiator)
2. **Weekly review must be motivational** (engagement driver)
3. **Design must be simple** (user retention)
4. **Pricing at $8/mo** (competitive advantage)
5. **No AI auto-scheduling** (builds trust)

---

**You're building the first cohesive system for goal-aligned daily planning. Go build it.**
