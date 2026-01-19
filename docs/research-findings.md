# Task Planner App: User Research Findings & Market Gaps
**Research Date: January 2026**

---

## PART 1: MAJOR PAIN POINTS BY APP

### Motion App - THE BIG COMPLAINTS

**Biggest Complaint: It's Too Complicated for What It Delivers**
- Users report **forcing AI scheduling when they'd rather plan manually** - "it takes longer to set up Motion's AI than to schedule my own day"
- Requires massive data input for each task; no shortcuts available
- **UI/UX is confusing**: Doesn't follow standard interaction patterns; users describe it as "clunky" with poor decision-making hierarchy
- **Poor Customer Service**: 3+ day wait times for support; limited helpful resources

**Specific Technical Failures**
- Snooze button doesn't work
- Recurring events won't edit all instances; must edit manually
- Tasks disappear/don't sync properly
- Phone notifications don't trigger even when enabled
- Auto-scheduling contradicts actual work availability
- Can't show work hours automatically (forces manual daily events)
- Due dates don't update in scheduler if changed after placing task
- AI never matches real work, even with parameters
- **"The AI never matched my real work"** is the core issue
- Aggressive charging: $370+ charges without proper onboarding
- Refund requests ignored; customer service refuses reactivation

**Verdict**: Motion promises AI magic but delivers complexity, bugs, and poor UX. Users feel scammed.

---

### Todoist - LOVED BUT MISSING KEY THINGS

**What Works Well**
- Clean, minimalist design ✓
- Fast task capture ✓
- Excellent free tier ✓
- Good template selection
- Karma system for gamification

**Critical Missing Features** (Multiple Users)
1. **No Task Dependencies** - can't set "Task B only shows after Task A is done"
2. **Calendar Sync is Broken** - tasks don't appear in calendar properly; can't control which tasks sync
   - Users report "duplicate tasks" when syncing with Google Calendar
   - Have to manually enable sync options on web app only
   - Recurring tasks filling up calendar needlessly
3. **Can't See Completed Tasks** - no easy way to review "what did I accomplish today/this week?"
   - Users want history/streak tracking but tasks disappear after completion
   - **Habit tracker loses past data** when streak fails instead of saving it
4. **Limited Organizational Depth** - missing:
   - Subtasks on creation (must add after)
   - Task dependencies
   - Visual progress bars for projects with subtasks
   - Ability to move tasks to subtasks in any view
5. **Video Attachments** - can't preview videos inline; must open browser
6. **Recurring Task Logic is Weird** - treats overdue recurring tasks oddly
7. **No Native Notes Feature** - comments only, no simple note-taking within app
8. **Limited Free Plan** - 5 projects max, manual backups only

**Verdict**: Excellent for simple task capture, but **fails at calendar integration and organizational depth**. Users want it to be the "one app" but it lacks structure for life/goal organization.

---

### Linear - NOT BUILT FOR PERSONAL USE

**The Problem**: Linear is optimized for software teams/issue tracking, not daily life planning

**Why People Try It**: Minimal design is beautiful

**Why They Leave to Todoist/Notion**
- No daily/personal task features
- Lacks recurring task automation
- No habit tracking
- No time-blocking view for personal scheduling
- **"Linear isn't specifically built for personal use"**
- Users resort to Notion or keep simpler tasks in Obsidian notes

**For Personal Use, Users Suggest**:
- Keep freelance work projects in Linear
- Use separate tool for habits/goals
- Use calendar for personal reminders
- Use Obsidian for general notes
- Don't try to force all of life into Linear

**Verdict**: Beautiful minimalism, but **fundamentally not designed for personal daily planning**. You can't retrofit a team tool for solo use.

---

### Sunsama - GOOD BUT EXPENSIVE FOR SOLO USE

**What Works Well**
- Beautiful, uncluttered design
- Weekly calendar view for planning
- Weekly review + reflection prompt
- Time tracking built-in

**Issues**
- **Too expensive for solo users** - $16-20/month is steep for individuals
- "Paying premium price for unreliable sync at higher tiers"
- Best for those already spending ~$30-40/month on productivity

---

### Morgen - EXPENSIVE + SYNC ISSUES

**Issues**
- **$15-30/month** - more expensive than competitors for what it offers
- **Unreliable sync** - core feature is broken
- Treated as "expensive for what it does"
- Reddit thread titled "Why the f is morgen calendar so expensive?"

---

## PART 2: WHAT PEOPLE ACTUALLY WANT

### The #1 Missing Feature Across All Apps
**"Show me only the NEXT task, in order, automatically"**

Users want:
- One task per project visible at a time
- Next task only shows when previous is done
- Simple order-based dependencies (not complex 11-click setup)
- Automatic task sequencing without AI fuss

**This is the sweet spot between Todoist (no sequencing) and Motion (overly complex AI)**

---

### Calendar Integration (Non-Negotiable)

Users want:
- **Tasks AND calendar events in ONE view**
- Two-way sync: complete task in planner → disappears from calendar
- Prevent recurring tasks from cluttering calendar
- **See scheduled time blocks AND tasks in daily view**
- Smart integration, not just overlay

**Current State**: Todoist's sync is broken; Motion has sync but hidden behind complexity; others don't try.

---

### Goal/Project Hierarchy (Missing from Todoist)

Users want:
- **Goals → Projects → Tasks hierarchy** (Todoist lacks this)
- Ability to organize life goals separately from daily tasks
- See how daily tasks ladder up to bigger goals
- Visual progress tracking for project completion

**Gap**: Todoist is flat (just tasks); Linear has projects but for teams only; Personal apps (Notion) are too flexible.

---

### Weekly/Monthly Reviews & Reflection

**Biggest missing feature across all apps**

Users want:
- Easy way to see what you accomplished this week
- Weekly summaries without complex setup
- Time spent per task/category
- Month-over-month habit tracking
- Analytics on productivity patterns

**Current**: Apps let you *do* tasks but not *review* them easily. Users juggle 2-3 apps to get overview

---

### Natural Language Processing (NLP) for Task Input

Users explicitly want:
- "Tomorrow 2pm: meeting with Sarah" → auto-parses to calendar slot + task
- "Buy milk, eggs, bread" → auto-creates shopping list subtasks
- Not all apps have this; TickTick does it well

---

### Time-Boxing (Tasks in Calendar Slots)

**Major Missing Feature**:
- **Create tasks, then drag them into time blocks on calendar**
- See hourly schedule with tasks embedded
- If you don't finish, reschedule easily to next slot
- **"I can't find any app that does this yet"**

Apps like Sunsama offer this, but not many others.

---

### Habit Tracking

Users want:
- Simple habit tracking integrated with tasks
- Streak history (not lost when streak breaks)
- Daily/weekly goals with progress
- **Tiimo and TickTick do this well**

Todoist's habit tracker loses data when streak fails — users hate this.

---

### AI Organization (BUT NOT Scheduling)

**Key Insight**: Users want AI to *organize*, NOT to *decide for them*

What they want:
- ✓ AI breaks down complex tasks into subtasks
- ✓ AI suggests subtasks (optional, user approves)
- ✓ AI prioritizes based on deadlines + importance
- ✓ Natural language parsing for task input
- ✓ AI daily briefing: "Here's your ideal plan for today"
- ✗ NOT auto-scheduling (Motion tried this, failed)
- ✗ NOT forcing you to work on something AI thinks is important

**Quote**: *"It's not about replacing your decision-making, but augmenting it"*

---

### What People DON'T Want in AI

- **Auto-scheduling that ignores reality** - Motion's fatal flaw
- **Forcing you to input 10 data points** to create a simple task
- **AI making irreversible decisions** about your schedule
- **Complexity masquerading as "smart"** 
- **Feature bloat** justified by "AI can do it"

---

## PART 3: FEATURE COMPARISON - WHAT'S ACTUALLY MISSING

| Feature | Todoist | Motion | Linear | Sunsama | Your Opportunity |
|---------|---------|--------|--------|---------|-----------------|
| **Calendar Integration** | Broken ✗ | Works but cluttered | N/A | Good ✓ | **Build it right** |
| **Task Sequencing (Next Action)** | No ✗ | AI confuses it | N/A | Partial | **Simple order-based** |
| **Goal→Project→Task Hierarchy** | Flat ✗ | N/A | Teams only | N/A | **Add this** |
| **Completed Task History** | No ✗ | N/A | N/A | Yes ✓ | **Show what you did** |
| **Time-Boxing (Drag to calendar)** | No ✗ | Yes (complex) | N/A | Yes ✓ | **Make it simple** |
| **NLP Task Input** | No ✗ | Basic | N/A | Basic | **Implement well** |
| **Habit Tracking** | Poor ✗ | No ✗ | No ✗ | Yes ✓ | **Include it** |
| **Weekly Review** | No ✗ | No ✗ | No ✗ | Yes ✓ | **Make it easy** |
| **AI Subtask Suggestions** | No ✗ | Yes (forced) | N/A | No ✗ | **Optional AI help** |
| **Simplicity** | Good ✓ | Bad ✗ | Good ✓ | Good ✓ | **Keep it simple** |
| **Price** | Free-$5 | $19-29 | $8-15 | $16-20 | **$8-12** |

---

## PART 4: THE WINNING FORMULA (What You Should Build)

### Core Must-Haves (Launch MVP)

1. **Clean Calendar + Task Integration**
   - See tasks + calendar events together in daily/weekly view
   - Bi-directional sync with Google Calendar
   - Drag task → time block to schedule it
   - Complete task → disappears from calendar ✓

2. **Simple Task Sequencing**
   - Show "Next Up" task per project automatically
   - Next task appears when previous done
   - Simple: based on list order, not complex dependencies
   - **Key: NO AI forcing; YOU decide the order**

3. **Goal → Project → Task Hierarchy**
   - Create life goals (e.g., "Get healthier," "Ship side project")
   - Break into projects
   - Break into daily tasks
   - See how daily work ladders up

4. **Daily Planner View**
   - Tomorrow's tasks clearly listed
   - Time-blocked view of day
   - Check-off interface that's fast
   - Minimal, Linear-inspired design

5. **Google Tasks + Calendar Sync**
   - Bi-directional sync (key requirement from your spec)
   - Don't break it (Todoist's fatal flaw)
   - Tested before launch

### Phase 2 Features (After MVP traction)

6. **Weekly Review Section**
   - See completed tasks from week
   - View time spent per category
   - Reflection prompts (like Sunsama)
   - Motivational streak tracking

7. **AI Organization (Not Scheduling)**
   - Suggest subtasks when you add a complex task
   - Parse natural language: "Tomorrow 2pm: call with Jane" → auto-slots
   - Suggest priority based on due date + importance (optional)
   - Daily briefing: "Here's your optimized plan"
   - **Never auto-schedule without asking**

8. **Habit Tracking**
   - Daily/weekly goals
   - Streak history (saved, even if streak breaks)
   - Linked to tasks (e.g., "Exercise" habit shows relevant tasks)

---

## SUMMARY FOR YOUR ROADMAP

**MVP (Month 1-2)**
- [ ] Calendar + task integration (2-way sync, Google Calendar)
- [ ] Simple task sequencing (Next Up per project)
- [ ] Goal → Project → Task hierarchy
- [ ] Daily planner view with time blocks
- [ ] Google Tasks sync
- [ ] Linear-inspired minimalist design

**Phase 2 (Month 3-4)**
- [ ] Weekly review with completed task history
- [ ] Optional AI subtask suggestions
- [ ] Natural language parsing
- [ ] Habit tracking

**Phase 3 (Month 5+)**
- [ ] Monthly analytics dashboard
- [ ] Advanced filters and views
- [ ] Team sharing (light)
- [ ] Mobile app optimization

---

**Key Takeaway**: 
You're not building Motion. You're not building a better Todoist. **You're building the first app that makes calendar + tasks + goals feel like one integrated system, with AI that helps without taking over.**

The market is *screaming* for this. It doesn't exist yet.