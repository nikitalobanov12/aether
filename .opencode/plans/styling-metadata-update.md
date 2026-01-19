# Plan: Update Styling, Favicon, and Metadata

## Overview

Update the Dayflow app with proper branding based on the product docs.

## Tasks

### 1. Update Metadata in `src/app/layout.tsx`

Replace the current metadata export with:

```typescript
export const metadata: Metadata = {
  title: {
    default: "Dayflow - Organize Your Goals. Execute Your Day.",
    template: "%s | Dayflow",
  },
  description:
    "The task planner that syncs calendar, tasks, and life goals in one unified system. AI that helps—not decides for you.",
  keywords: [
    "task planner",
    "goal tracker",
    "calendar sync",
    "productivity",
    "time blocking",
    "daily planner",
  ],
  authors: [{ name: "Dayflow" }],
  creator: "Dayflow",
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Dayflow",
    title: "Dayflow - Organize Your Goals. Execute Your Day.",
    description:
      "The task planner that syncs calendar, tasks, and life goals in one unified system. AI that helps—not decides for you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dayflow - Organize Your Goals. Execute Your Day.",
    description:
      "The task planner that syncs calendar, tasks, and life goals in one unified system.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};
```

### 2. Create Favicon SVG at `public/icon.svg`

A simple "D" logomark with teal accent:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#32B8C6"/>
  <path d="M9 8h6c4.418 0 8 3.582 8 8s-3.582 8-8 8H9V8zm3.5 3.5v9h2.5c2.485 0 4.5-2.015 4.5-4.5s-2.015-4.5-4.5-4.5h-2.5z" fill="white"/>
</svg>
```

### 3. Create Apple Touch Icon at `public/apple-touch-icon.png`

Generate a 180x180 PNG version of the icon (teal background with white "D").

### 4. Create Web Manifest at `public/manifest.json`

```json
{
  "name": "Dayflow",
  "short_name": "Dayflow",
  "description": "The task planner that syncs calendar, tasks, and life goals in one unified system.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#32B8C6",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

### 5. Update Color Scheme in `src/styles/globals.css`

Update the `:root` and `.dark` sections to use teal as the primary accent color.

**Light mode changes:**

```css
--primary: oklch(0.65 0.15 195); /* Teal #32B8C6 */
--primary-foreground: oklch(1 0 0); /* White */
--ring: oklch(0.65 0.15 195);
```

**Dark mode changes:**

```css
--primary: oklch(0.7 0.15 195); /* Lighter teal for dark mode */
--primary-foreground: oklch(0.145 0 0); /* Dark text */
--ring: oklch(0.7 0.15 195);
--sidebar-primary: oklch(0.7 0.15 195);
```

### 6. Create `docs/backlog.md`

```markdown
# Backlog

A simple list of tasks and features to track.

---

## In Progress

- [ ] ...

---

## Todo

- [ ] ...

---

## Done

- [x] Initial project setup
- [x] Database schema design
- [x] Authentication with Better Auth
```

## Files to Create/Modify

| File                          | Action           |
| ----------------------------- | ---------------- |
| `src/app/layout.tsx`          | Edit metadata    |
| `public/icon.svg`             | Create           |
| `public/apple-touch-icon.png` | Create (180x180) |
| `public/manifest.json`        | Create           |
| `src/styles/globals.css`      | Edit colors      |
| `docs/backlog.md`             | Create           |

## Brand Colors Reference

| Color          | Hex     | OKLCH                | Usage                           |
| -------------- | ------- | -------------------- | ------------------------------- |
| Teal (Primary) | #32B8C6 | oklch(0.65 0.15 195) | Primary accent, buttons, links  |
| White          | #FFFFFF | oklch(1 0 0)         | Backgrounds, primary foreground |
| Dark           | #1a1a1a | oklch(0.145 0 0)     | Text, dark mode background      |
