# PRD: Aether Landing Page Design

**Visual Identity:** "Engineered Minimalism."

**Competitor Contrast:**
- **Vs. Sunsama:** Less "soft/pastel/zen," more "structured/clean/pro."
- **Vs. Morgen:** Less "tech-heavy/dashboard," more "focused/sequenced."

## 1. Design Language

### Color Palette (Dark Mode First)

Aether is a tool for deep work. The landing page should reflect the app's dark mode default to reduce eye strain and signal "developer-grade" quality.

- **Background:** Deep Obsidian (#0B0C10) - Not pure black, richer.
- **Surface:** Charcoal (#1F2833) - For cards and feature blocks.
- **Primary Accent:** Electric Teal (#32B8C6) - Used sparingly for buttons and key active states. High contrast against the dark background.
- **Secondary Accent:** Muted Purple (#6C5CE7) - Used for the "Goals" hierarchy visualization (subtle).
- **Text:** White (#FFFFFF) for headings, Light Grey (#C5C6C7) for body.

### Typography

- **Headings:** Geist, Inter, or SF Pro Display. Tight tracking (letter-spacing), bold weights. Needs to feel precise.
- **Body:** Inter or Roboto. High legibility.

### UI Elements

- **Borders:** Thin, subtle 1px borders with low opacity (rgba(255,255,255, 0.1)) on cards.
- **Glassmorphism:** Slight blur behind sticky headers, but don't overdo it. Keep it performance-focused.
- **Corners:** Slightly rounded (8px or 12px), not fully pill-shaped. We want to look structured, not "bubbly."

## 2. Section Layouts & Visuals

### Hero Section (The "Control Center" Shot)

- **Layout:** Center aligned text. Large product visual underneath.
- **The Visual:** A high-fidelity screenshot of the Aether "Today" view.
- **Crucial Animation:** An animated cursor drags a task from the "Task List" onto the "Calendar" timeline. As it drops, the calendar block snaps into place, and the Google Calendar icon briefly pulses to signify sync.
- **Why:** Show, don't just tell, the bi-directional sync immediately.

### The "Frankenstein" Problem (The Visual Metaphor)

- **Layout:** Three columns merging into one.
- **Visual:**
  - Left side: Faded, grayed-out logos of Todoist, Notion, and Google Calendar. They look disconnected and chaotic.
  - Right side: The Aether Logo glowing in Teal.
  - Action: Lines flow from the three chaotic apps into the single Aether interface.

### Feature Deep Dives (Zig-Zag Layout)

**Block 1: Hierarchy (Right Text, Left Image)**
- **Visual:** A "cutaway" view of the Sidebar.
- **Action:** Show a Goal ("Launch MVP") expanding into Projects ("Design", "Backend") expanding into Tasks. Connect lines visually to show the relationship.

**Block 2: The Sync (Left Text, Right Image)**
- **Visual:** A split screen. Phone Mockup (Google Calendar App) vs. Desktop Monitor (Aether).
- **Action:** A task is checked off on the Desktop. Instantly, the event vanishes from the Phone screen.
- **Caption:** "Updates in < 200ms."

**Block 3: Weekly Review (Right Text, Left Image)**
- **Visual:** A "Data Card." Dark background, bright teal bars showing "14 Tasks Completed."
- **Vibe:** Look like a fitness tracker summary. Make productivity look like a high score.

### Pricing Section (The "No-Brainer" Card)

- **Layout:** Three cards, but the Aether card is scaled up 110% and glows.
- **Competitor Cards (Sunsama/Morgen):** Grayed out, lower opacity. Price is crossed out or highlighted in red to show expense.
- **Aether Card:** Vibrant border. Big "$8" typography. The button says "Start Free Trial" but includes "No Credit Card" text below.

## 3. Interactive Moments

- **The "Sync" Toggle:** Somewhere on the page, have a small toggle switch the user can click. When clicked, it switches the view from "List Mode" to "Calendar Mode" instantly.
- **Hover States:** When hovering over the Comparison Table, the Aether column should light up, while competitors fade slightly.

## 4. Mobile Responsiveness

- **Hero:** Stack the text above the image. Ensure the "Drag and Drop" animation is replaced by a static, high-contrast image of the mobile view on phones.
- **Navigation:** Hamburger menu. The "Get Started" button must remain sticky at the bottom of the viewport on scroll.
