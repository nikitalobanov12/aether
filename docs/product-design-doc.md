# PRODUCT DESIGN DOCUMENT
## Task Planner App - Engineering Roadmap

**Version 1.0 | January 2026**  
**Status: Pre-Launch MVP Specification**

---

## TABLE OF CONTENTS
1. Product Overview
2. Core User Flows
3. MVP Feature Specifications (Launch)
4. Phase 2 Features (Post-Launch)
5. Technical Architecture
6. Data Models
7. Integration Requirements
8. UI/UX Specifications
9. Success Metrics

---

## 1. PRODUCT OVERVIEW

### Product Name
[To be determined - recommendations: "Flow," "North," "Trace," "Sync"]

### Vision Statement
"The first app that integrates calendar, tasks, and life goals into one unified system, with AI that helps you decide—not decides for you."

### Core Problem Solved
Users juggle multiple apps because no single tool:
- Syncs calendar + tasks bidirectionally without breaking
- Connects life goals → projects → daily tasks
- Shows what they actually accomplished
- Offers helpful AI without forced scheduling

### Target Users (MVP)
- **Primary**: Individual knowledge workers (25-40) exhausted with Motion/Todoist fragmentation
- **Secondary**: Freelancers, consultants, startup founders needing integrated daily + strategic planning
- **Psychographic**: Values control + clarity; skeptical of "AI magic" marketing

### Success Metrics (90 Days)
- 1,000+ active users
- 10-15% free → paid conversion
- <6% monthly churn
- 40% Day 30 retention
- NPS > 40

---

## 2. CORE USER FLOWS

### Flow 1: Daily Planning (Most Frequent)

```
User opens app (morning)
    ↓
"Today" view shows:
  - All tasks for today in order
  - Time blocks on left (calendar)
  - Unscheduled tasks on right
    ↓
User drags task → time block to schedule
    ↓
User can:
  - Check off completed task (removed from calendar)
  - Snooze task to tomorrow
  - Expand task to see subtasks
  - Add quick notes to task
    ↓
User sees "Next Up" task automatically highlighted
```

### Flow 2: Weekly Review (Weekly Ritual)

```
User opens "Week" view on Friday/Sunday
    ↓
View shows:
  - Completed tasks from week (grouped by project)
  - Time spent per project/category
  - Streaks for habits
  - Progress toward weekly goals
    ↓
User can:
  - See how daily tasks contributed to bigger goals
  - Review notes added to tasks
  - Export/share weekly summary
    ↓
Optional AI summary: "You accomplished X. Next week, focus on Y."
```

### Flow 3: Goal Setup (Monthly/Quarterly)

```
User creates new Goal (e.g., "Launch Side App")
    ↓
User creates Projects under goal (e.g., "Design," "Development," "Launch")
    ↓
User creates Tasks under projects (daily actionable items)
    ↓
System creates hierarchy view showing Goal → Project → Task
    ↓
User can:
  - See progress on Goal based on completed tasks
  - Prioritize projects
  - Reassign tasks between projects
    ↓
Daily view shows only today's tasks; Goal view shows where they fit
```

### Flow 4: Calendar Integration (Automatic)

```
User connects Google Calendar (OAuth)
    ↓
App syncs all calendar events + Google Tasks
    ↓
Daily view shows:
  - Calendar events + tasks in merged timeline
  - 30-min gaps highlighted for task scheduling
    ↓
User drags task → calendar slot to schedule
    ↓
Task syncs back to Google Tasks with due date
    ↓
When task checked off in app → removed from Google Tasks + calendar
    ↓
When task created in Google Tasks → appears in app immediately
```

### Flow 5: AI Assistance (Optional)

```
User creates complex task: "Plan vacation"
    ↓
System detects complex task; prompts:
  "Break this down? (AI can help)"
    ↓
If user accepts:
  AI suggests subtasks: "Book flights," "Reserve hotel," "Plan activities"
    ↓
User approves/modifies subtasks
    ↓
Each subtask appears as actionable task
```

---

## 3. MVP FEATURE SPECIFICATIONS (LAUNCH)

### Feature 1: Authentication & Account Management

**Specification**:
- Email/password signup (no OAuth in MVP, but architecture supports it)
- Simple onboarding: "What's your main goal for next week?"
- Email verification required
- Free tier automatically enabled

**Technical**:
- Use Firebase Auth or Auth0
- Store user preferences in simple document DB
- No SSO in MVP; add Google login in Phase 2

**UI/UX**:
- Single-screen signup (email + password + confirm password)
- 30-second welcome video explaining app
- 3-step guided tour on first login

---

### Feature 2: Goal → Project → Task Hierarchy

**Specification**:

#### Creating a Goal
- User clicks "+ Goal"
- Modal appears: [Goal Title] [Description] [Target Date]
- Goal is added to sidebar list

#### Creating a Project
- User clicks "+ Project" under Goal
- Modal appears: [Project Title] [Description] [Project Goal]
- Projects shown as collapsible sections under Goal

#### Creating a Task
- User clicks "+ Task" under Project
- Fields:
  - Task title (required)
  - Description (optional, max 500 chars)
  - Due date (optional, date picker)
  - Priority (optional: High/Medium/Low)
  - Subtasks (optional, can add multiple)
  - Notes (optional)
  - Time estimate (optional, in minutes)
- Task appears in project

#### Hierarchy Display Rules
- Goals collapsed by default in sidebar
- Click Goal → expand to show Projects
- Click Project → shows all tasks in that project
- Today view shows all tasks across all goals/projects ordered by due date
- Goal view shows hierarchical tree: Goal → Projects → Completed vs Remaining tasks

**Technical**:
- Store in relational structure:
  ```
  Goals (id, user_id, title, description, target_date, created_at)
  Projects (id, goal_id, title, description, order, created_at)
  Tasks (id, project_id, title, description, due_date, priority, completed_at, created_at)
  Subtasks (id, task_id, title, completed_at, created_at)
  ```
- Use soft deletes (archived flag) not hard deletes
- Support drag-to-reorder within projects

**UI/UX**:
- Sidebar shows collapsed Goals
- Main area shows expanded hierarchical view
- Breadcrumb: Goal → Project → Task
- Visual progress bars: "3 of 7 tasks completed"
- Color coding optional for Goals (users choose)

---

### Feature 3: Daily Planner View

**Specification**:

#### Layout
- Split-screen design:
  - **Left (40%)**: Calendar view of day
    - Hourly slots (7am - 10pm)
    - Existing calendar events shown
    - Highlight available time slots
  - **Right (60%)**: Tasks list for the day
    - "Next Up" task at top (highlighted, auto-selected from list order)
    - All remaining tasks below
    - Each task shows: Title, Project name, Due time (if scheduled), Priority badge

#### Interactions
- **Drag task → time slot**: Task gets scheduled; Google Calendar updates
- **Check off task**: Task marked complete; grayed out; removed from calendar
- **Unscheduled tasks**: Show in "No time assigned" section below calendar
- **Click task**: Expands to show details, subtasks, notes
- **"Next Up" highlight**: Only shows first incomplete task per project; changes as you complete tasks

#### Time Blocking
- Users can't create double-booked time slots
- "If you drag a task here, it will conflict with [Event Name]. Proceed?" warning
- Scheduled tasks show in calendar as colored blocks
- Unscheduled tasks show in gray below calendar
- Time estimate (if set) auto-calculates whether task fits in available time

**Technical**:
- Load user's Google Calendar in background every 5 minutes for real-time updates
- Store task-to-calendar-slot mapping in Tasks table (time_slot_start, time_slot_end)
- Validate no time conflicts before saving
- If Google Calendar event added manually, sync within 5 minutes

**UI/UX**:
- Clean, spacious design (Linear-inspired)
- Time slots show in 30-min or 1-hour increments (user preference)
- Current time highlighted with moving line
- Weekends show different background color (lighter)
- Simple "Mark Done" button (or checkbox) next to each task
- Keyboard shortcut: Number keys to complete top tasks (1 = first task, 2 = second task)

---

### Feature 4: "Next Up" Task Sequencing

**Specification**:

#### What It Does
- For each Project, only ONE incomplete task is marked "Next Up" at any time
- When that task is completed, the next task in the project automatically becomes "Next Up"
- No manual task ordering needed; tasks flow automatically

#### How It Works
- Tasks are ordered by:
  1. User-set priority (High → Medium → Low)
  2. Due date (soonest first)
  3. Creation date (oldest first)
- User can manually reorder within a project (drag-to-reorder)
- Manual reorder overrides automatic ordering

#### Visual Indicator
- "Next Up" task has special background color (light blue/teal)
- Shows in Daily planner with emphasis
- Shows in Project view with emphasis
- Appears first in task lists

#### Mobile Behavior
- On mobile, "Next Up" task appears at top of screen
- Can swipe left to mark done
- Can swipe right to snooze

**Technical**:
- Add `next_up_order` column to Tasks table
- Implement sort algorithm:
  ```
  sort by (priority_weight, due_date, creation_date)
  where completed_at IS NULL
  ```
- When task marked complete, re-run sort to update next task
- Cache "next_up" task per project for performance

**UI/UX**:
- Clearly highlight "Next Up" task
- Show count: "1 of 5 tasks in this project"
- Subtle animation when "Next Up" task changes (celebrates completion)

---

### Feature 5: Calendar Integration (Google Calendar + Google Tasks)

**Specification**:

#### Sync Behavior
- **Direction**: Bi-directional (2-way sync)
- **Frequency**: Near real-time (check every 30 seconds for user actions; batch sync every 2 minutes)
- **Conflict Resolution**:
  - App update → syncs to Google within 10 seconds
  - Google Calendar update → syncs to app within 30 seconds
  - If both update simultaneously, app change takes precedence

#### What Syncs
- **FROM Google Calendar**:
  - All events (excluding "Busy" time blocks marked as "Busy")
  - Event title, time, duration
  - Only events on user's primary calendar
- **FROM Google Tasks**:
  - All tasks (all lists)
  - Task title, due date, completed status
  - Subtasks
- **TO Google Calendar**:
  - When task scheduled to time slot → creates calendar event titled "[Task] - [Project]"
  - Event is marked as "Busy" so doesn't conflict with other planning
  - Time estimate used as event duration
  - When task checked off → event marked "Tentative" then can be hidden
- **TO Google Tasks**:
  - When task created → syncs to "Tasks" list
  - When task completed → marked complete in Google Tasks
  - When task due date changed → updated in Google Tasks

#### Visual Indicators
- **Synced**: Checkmark icon next to task
- **Syncing**: Loading spinner (brief, < 2 seconds)
- **Error**: Red warning icon; can retry manually
- Color-coded tasks: "Calendar tasks" vs "App tasks" vs "Shared tasks" (if applicable)

#### Preventing Duplicates
- Track Google Calendar/Tasks IDs in database
- On import, check for existing IDs; don't create duplicates
- User can choose: "Show all Google Tasks in app" or "Only sync tasks created in app"

**Technical**:
```
Tables:
- SyncLog (id, user_id, sync_type, google_resource_id, app_resource_id, last_sync_time, status)

Sync Logic:
1. On login, pull all Google Calendar events + Google Tasks
2. For each Google item, check SyncLog for matching app_resource_id
3. If found, update app resource
4. If not found, create new app resource
5. Similarly, for app resources, push to Google
6. Store google_resource_ids in Tasks table for future matching
```

- Implement exponential backoff for failed syncs
- Queue sync requests if offline; execute when connection restored
- Log all sync operations for debugging

**UI/UX**:
- Show sync status in header: "Synced" or "Syncing..." or "Sync failed"
- Don't show technical details to users
- Transparent: When you create a task, show "Added to Google Tasks" confirmation
- Settings page shows: "Last synced 2 minutes ago"

---

### Feature 6: Completed Task History & Streak Tracking

**Specification**:

#### What Gets Tracked
- Every task marked "Complete" is logged with timestamp
- Completed subtasks also logged
- Time spent on task (if user manually logged time)
- Project associated with task

#### History Views

**Daily History**:
- "Today" view shows at bottom: "3 tasks completed today"
- User can click to see which ones
- Shows motivational message: "Great progress! Keep it up!"

**Weekly Review**:
- Dedicated "Week" view accessible from main nav
- Shows:
  - Calendar of week with completion dots
  - List of all completed tasks by day
  - Completed tasks grouped by project
  - Count: "12 of 18 tasks completed this week"
  - Time breakdown: "3 hours on Project A, 2 hours on Project B"
  - Habit streaks: "Exercise: 4 days in a row"

**Monthly View**:
- "Insights" page (later, Phase 2)
- Shows heatmap of completion (GitHub-style)
- Monthly summary with trends

#### Habit Streaks
- User can optionally tag tasks as "Habit" (e.g., "Exercise," "Writing")
- Streaks tracked continuously
- **Even if streak breaks, history is preserved** (unlike Todoist)
- User can see: "Exercise: 4-day streak (broken on Thursday, resumed Friday)"
- No data loss when streak breaks

**Technical**:
```
Tables:
- CompletedTasks (id, task_id, completed_at, time_spent_minutes, notes)
- HabitStreaks (id, user_id, habit_name, current_streak_days, best_streak_days, last_completed_date, broken_date)
```

- Use date grouping to show historical data
- Preserve habit history even when streak resets

**UI/UX**:
- Week view is visually appealing (motivational)
- Color progression for completed tasks (light → dark as time passes)
- Show "Week" and "Month" tabs for time switching
- Add confetti animation when user completes all tasks in a day (optional, can disable)

---

### Feature 7: Google Tasks & Calendar Sync (Advanced)

**Specification**: Already covered in Feature 5 (Calendar Integration)

---

### Feature 8: Minimal, Linear-Inspired Design

**Specification**:

#### Design Philosophy
- Maximum signal, minimum noise
- Every UI element serves a purpose
- No decorative elements
- Whitespace is intentional

#### Color Palette
- Primary: Monochromatic (blacks, grays, whites)
- Accent: Teal (#32B8C6 or similar)
- Status colors:
  - Green: Completed
  - Blue: In progress
  - Gray: Not started
  - Orange: Overdue

#### Typography
- Sans-serif (SF Pro, Inter, or system font)
- Font sizes: 12px (small), 14px (body), 16px (headers), 18px (large headers), 20px (page title)
- Font weight: 400 (regular), 500 (medium), 600 (semibold)

#### Layout
- 12-column grid
- 16px padding/margins
- Consistent spacing (multiples of 8px)
- Maximum content width: 1200px

#### Components
- Buttons: Minimal, no shadows
- Cards: Light border, no shadow
- Inputs: Border only, no background color
- Lists: Subtle divider lines
- Modals: Overlay with blur, centered content

**UI/UX**:
- Navigation: Vertical sidebar on desktop, hamburger on mobile
- Responsive: Works on 320px (mobile) to 4K (desktop)
- Dark mode: Support dark mode with high contrast option
- Accessibility: WCAG AA compliant (4.5:1 contrast ratio minimum)

---

## 4. PHASE 2 FEATURES (POST-LAUNCH)

### Feature 9: AI Subtask Suggestions

**Specification**:
- When user creates a task with certain keywords ("Plan," "Organize," "Prepare," "Build," etc.), show:
  - "AI can help break this down. Suggest subtasks?"
  - Opt-in modal (user can decline)
- AI suggests 3-5 logical subtasks
- User approves, modifies, or rejects each subtask
- Approved subtasks added to task

**Example**:
- User creates: "Plan vacation"
- AI suggests: "Research destinations," "Book flights," "Reserve hotel," "Plan activities," "Arrange transportation"
- User approves all or selects specific ones

**Technical**:
- Use OpenAI API (GPT-3.5) for task breakdown
- Prompt: "Break down this task into actionable subtasks: [task title]"
- Cache results to save API calls
- Only show if task title length > 20 characters

---

### Feature 10: Natural Language Parsing

**Specification**:
- User can input: "Tomorrow 2pm: Meeting with Sarah" 
- Parser extracts: Task title ("Meeting with Sarah"), due date (tomorrow), due time (2pm)
- Task auto-created with correct date/time

**Technical**:
- Use chrono-node or similar NLP library
- Parse common patterns: "Tomorrow 2pm," "Next Friday," "In 3 days," "Dec 15"
- If ambiguous, ask user to confirm: "Did you mean tomorrow or next week?"

---

### Feature 11: Optional Daily AI Briefing

**Specification**:
- User opts into daily email/notification: "Your day"
- Morning (user-specified time), app sends:
  - "Good morning! Here's your day:"
  - List of today's tasks in priority order
  - Highlighted "Next Up" task
  - Progress toward weekly goals
  - Optional AI insight: "Based on your habits, consider tackling [high-effort task] first"
- User can customize frequency (daily, 3x/week, weekly)

**Technical**:
- Use email service (SendGrid, Mailgun)
- Generate daily at user's timezone
- Track open rates and clicks

---

### Feature 12: Advanced Filtering & Views

**Specification**:
- Filter by: Project, Priority, Due date, Status, Goals
- Saved views: "My overdue tasks," "This week," "High priority," "With subtasks"
- Custom filters: "Show all High priority tasks due this week"

---

## 5. TECHNICAL ARCHITECTURE

### Technology Stack (Recommended)

**Frontend**:
- React.js (or Vue/Svelte if preference)
- TailwindCSS or custom CSS with design system
- TypeScript
- State management: Zustand or Jotai (lightweight)
- HTTP client: Axios or Fetch API
- Calendar rendering: React Big Calendar or custom component

**Backend**:
- Node.js + Express (or Python Django/FastAPI)
- PostgreSQL (relational data; needed for task hierarchy)
- Redis (for caching, sync queue)
- Google Calendar API v3 + Google Tasks API

**Infrastructure**:
- Vercel (frontend) or AWS Amplify
- Heroku (backend) or AWS ECS
- PostgreSQL on Render or AWS RDS
- Docker for containerization

**Third-party Integrations**:
- Firebase Auth (or Auth0) for authentication
- SendGrid for email
- Sentry for error tracking
- Stripe for payments

---

### Data Flow

```
User Action (Frontend)
    ↓
API Request (REST or GraphQL)
    ↓
Backend Validation + Business Logic
    ↓
Database Update + Google Sync Queue
    ↓
Background Job: Sync to Google Calendar/Tasks (async)
    ↓
WebSocket: Notify Frontend of Completion
    ↓
Frontend UI Update (optimistic + real)
```

---

### Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  timezone VARCHAR(50),
  preferences JSONB
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  display_order INTEGER
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  display_order INTEGER
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
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  
  -- Calendar sync fields
  google_calendar_event_id VARCHAR(255),
  google_tasks_id VARCHAR(255),
  time_slot_start TIMESTAMP,
  time_slot_end TIMESTAMP,
  
  -- Ordering
  next_up_order INTEGER,
  display_order INTEGER
);

-- Subtasks
CREATE TABLE subtasks (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id),
  title VARCHAR(500) NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  display_order INTEGER
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

-- Sync Log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  sync_type VARCHAR(50), -- 'calendar', 'tasks'
  google_resource_id VARCHAR(255),
  app_resource_id VARCHAR(255),
  last_sync_time TIMESTAMP,
  status VARCHAR(20), -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calendar Integrations
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(50), -- 'google', 'outlook'
  access_token VARCHAR(1000),
  refresh_token VARCHAR(1000),
  token_expires_at TIMESTAMP,
  calendar_id VARCHAR(255),
  connected_at TIMESTAMP DEFAULT NOW()
);
```

---

### API Endpoints (Core)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

GET    /goals
POST   /goals
PUT    /goals/:id
DELETE /goals/:id

GET    /projects?goal_id=:id
POST   /projects
PUT    /projects/:id
DELETE /projects/:id

GET    /tasks?project_id=:id&date=:date
POST   /tasks
PUT    /tasks/:id
PATCH  /tasks/:id/complete
DELETE /tasks/:id
POST   /tasks/:id/subtasks

GET    /calendar/events?date_start=:date&date_end=:date
GET    /calendar/sync-status

POST   /integrations/google-calendar/connect
POST   /integrations/google-calendar/disconnect
POST   /sync/trigger

GET    /completed-tasks?week=:date
GET    /history/weekly?date=:date
GET    /insights?period=month
```

---

## 6. DATA MODELS (Application Logic)

### Task Lifecycle

```
CREATED → IN_PROGRESS → COMPLETED → ARCHIVED
           (optional)
```

- Created: Task added to system
- In Progress: User started task (optional status)
- Completed: User marked task done; logged in CompletedTasks table
- Archived: User hides task (soft delete)

### Sync States

```
PENDING_SYNC → SYNCING → SYNCED → CONFLICT → FAILED
```

- Pending: Change made locally; not yet synced
- Syncing: Background job running
- Synced: Successfully synced to Google
- Conflict: User made change while sync in progress; resolved by last-write-wins
- Failed: Sync failed; user notified; can retry

---

## 7. INTEGRATION REQUIREMENTS

### Google Calendar API
- **Scope**: calendar, tasks
- **Read permissions**: 
  - calendar.readonly for events
  - tasks for Google Tasks
- **Write permissions**: 
  - calendar for creating/updating events
  - tasks for creating/updating tasks
- **Rate limits**: 
  - 1 million requests/day (plenty for MVP)
  - Implement exponential backoff for rate limit errors

### Google Tasks API
- **Scope**: tasks
- **Functionality needed**:
  - List tasks
  - Create tasks
  - Update tasks
  - Complete tasks
  - Create/update subtasks

### Error Handling
- If Google API returns 401: Prompt user to re-authenticate
- If Google API returns 403: Show error "Missing permissions"
- If Google API times out: Queue request for retry; notify user sync is pending
- If sync fails 3x: Alert user; suggest checking their account

---

## 8. UI/UX SPECIFICATIONS

### Layout (Desktop)

```
┌─────────────────────────────────────────┐
│ Logo    Nav    Search    User Menu       │ <- Header (60px)
├────────┬──────────────────────────────────┤
│ Sidebar│                                  │
│        │ Main Content Area               │
│ Goals  │                                  │
│ Projs  │ (Daily/Week/Project/Goals view) │
│ ....   │                                  │
│        │                                  │
└────────┴──────────────────────────────────┘
```

- Sidebar width: 250px (collapsible)
- Main area: Responsive
- Header fixed at top

### Sidebar
- **Top section**: User name/avatar + Settings icon
- **Middle section**: Goals list (collapsible)
  - Click goal → expand to show projects
  - Visual indicator: "3 of 7 tasks done" under each project
- **Bottom section**: "Today," "This Week," "All Tasks," "+ New Goal"

### Daily View (Primary Interface)

**Left Column (Calendar)**:
- Title: "Today" or selected date
- Time slots: 7am to 10pm, 30-min increments
- Existing calendar events shown
- Available time highlighted
- User drags tasks here

**Right Column (Tasks)**:
- "Next Up" task highlighted at top
- All remaining tasks below
- Each task shows:
  - Checkbox (on left)
  - Task title (bold)
  - Project name (smaller, dimmed)
  - Due time (if scheduled)
  - Priority badge (if high priority)
- Check box = mark complete
- Click task = expand details

### Components

**Task Card** (expandable):
```
☐ Task Title                    [⋮ menu]
  Project Name → Sub-project
  Subtask 1 ☐
  Subtask 2 ☐
  Notes: [Show notes...]
  Time: 45 min
  Due: Tomorrow at 2pm
  [Edit] [Delete]
```

**Goal/Project Hierarchy**:
```
▼ Goal: Launch Product
  ▶ Project: Design (3/5 done)
  ▶ Project: Development (2/7 done)
  ▼ Project: Launch (1/2 done)
    ☐ Task 1
    ☐ Task 2
```

**Week View**:
```
┌─ Week of Jan 20-26 ─────────────────────┐
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun      │
│  ●    ●    ●    ○    ●    ○    ●      │ (● = day completed tasks)
│                                        │
│ Completed Tasks:                       │
│ • Task A (Project X)                   │
│ • Task B (Project Y)                   │
│ • Task C (Project X)                   │
│ ... 12 more                            │
│                                        │
│ Progress:                              │
│ • Project X: 7/10 (70%)               │
│ • Project Y: 5/8 (62%)                │
│                                        │
│ Habits:                                │
│ • Exercise: 4-day streak              │
│ • Writing: 2-day streak               │
└────────────────────────────────────────┘
```

---

### Responsive Design

**Mobile (< 768px)**:
- Single column layout
- Sidebar: Hamburger menu
- Daily view: Tasks above, time slots accessible via scroll
- Week view: Vertical scrolling

**Tablet (768px - 1024px)**:
- Two-column layout
- Sidebar: Collapsed by default
- Daily view: Left side for calendar, right for tasks

**Desktop (> 1024px)**:
- Full layout (see above)

---

## 9. SUCCESS METRICS

### User Acquisition
- Signups per day
- Organic traffic (SEO, referral)
- PH ranking at launch

### Engagement
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average session duration
- Features used (% of users using each feature)

### Retention
- Day 1, Day 7, Day 30 retention
- Monthly churn rate (target: < 6%)
- NPS score (target: > 40)

### Conversion
- Free → paid conversion rate (target: 10-15%)
- MRR (target: $2,000+ by month 3)
- ARPPU (average revenue per paying user)

### Product Health
- Sync success rate (target: > 99.5%)
- App performance (load time < 2s)
- Error rate (target: < 0.1%)

### Feature Adoption
- % users who set up Google Calendar sync
- % users who create at least one goal
- % users who complete a weekly review
- % users who use AI features (when available)

---

## DEVELOPMENT TIMELINE

**Week 1-2**: Setup + Auth + Basic UI
**Week 3-4**: Goal/Project/Task CRUD
**Week 5-6**: Daily Planner View + Drag-to-Schedule
**Week 7-8**: Google Calendar Integration (sync)
**Week 9-10**: Google Tasks Sync + Calendar Events
**Week 11-12**: Task Completion + History + Weekly Review
**Week 13-14**: Testing + Bug Fixes + UI Polish
**Week 15**: Launch (Product Hunt, etc.)

---

## LAUNCH CHECKLIST

- [ ] All MVP features complete
- [ ] Database backed up
- [ ] Security audit (OWASP top 10)
- [ ] Performance optimization (load < 2s)
- [ ] Mobile testing (iOS + Android + responsive)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit (WCAG AA)
- [ ] Beta test with 50 users (2-week period)
- [ ] User documentation + help center
- [ ] Customer support email set up
- [ ] Monitoring/logging set up (Sentry, etc.)
- [ ] Analytics configured (Mixpanel, Amplitude)
- [ ] Landing page live + SEO optimized
- [ ] Email sequences ready
- [ ] Product Hunt launch prep
- [ ] Social media assets ready

---

## POST-LAUNCH PRIORITIES

1. **Monitor for bugs** (daily)
2. **Track key metrics** (hourly dashboard)
3. **Respond to user feedback** (same day)
4. **Fix critical bugs** (within 24 hours)
5. **Iterate on onboarding** (based on drop-off data)
6. **Add Phase 2 features** (based on user requests + research)