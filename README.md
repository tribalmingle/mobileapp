# FocusFlow - ADHD Productivity App

A calm, offline-first productivity app designed for entrepreneurs and business people living with ADHD. Built with React Native / Expo.

## Features

### Core Screens (5-Tab Navigation)

1. **Home** - Today's Focus card showing one task at a time, quick actions, daily progress stats
2. **Projects** - Create and manage projects, break them into small actionable tasks
3. **Focus** - Distraction-free Pomodoro timer with animated progress circle
4. **Schedule** - Time blocking with daily view, drag-and-drop task scheduling
5. **Progress** - Weekly charts, streak tracking, all-time stats, daily reflections

### Key Functionality

- **Offline-First**: All data stored locally using Zustand + AsyncStorage
- **Free/Premium Tiers**:
  - Free: 1 project, 5 tasks per project, 3 focus sessions/day
  - Premium: Unlimited everything, cloud backup, advanced features
- **Dark/Light Theme**: Calm, low-stimulation design with teal accents
- **Haptic Feedback**: Subtle feedback on interactions

## Tech Stack

- Expo SDK 53 / React Native 0.76.7
- Zustand for state management (persisted with AsyncStorage)
- NativeWind (Tailwind CSS) for styling
- react-native-reanimated for animations
- lucide-react-native for icons
- expo-haptics for feedback

## Design System

**Color Palette (Dark Mode - Default)**
- Background: `#1a1a1f` (dark charcoal)
- Card: `#252529` (mist gray)
- Primary: `#5b9a8b` (desaturated teal)
- Text: `#e8e8e8`
- Text Muted: `#6b6b70`

**Light Mode**
- Background: `#f8f8fa`
- Card: `#ffffff`
- Same teal accents

## File Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── settings.tsx         # Settings modal
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigation
│       ├── index.tsx        # Home screen
│       ├── projects.tsx     # Projects screen
│       ├── focus.tsx        # Focus timer screen
│       ├── schedule.tsx     # Schedule/time blocking
│       └── progress.tsx     # Progress/stats screen
├── components/              # Reusable UI components
└── lib/
    ├── state/
    │   └── app-store.ts     # Zustand store (offline data)
    └── cn.ts                # className utility
```

## Data Model

All productivity data is stored locally on device:
- Projects (id, title, color, isActive)
- Tasks (id, projectId, title, completed, priority)
- Focus Sessions (id, taskId, startTime, duration, completed)
- Time Blocks (id, title, startTime, endTime, type)
- Daily Progress (date, tasksCompleted, focusMinutes)

## Philosophy

- **One task at a time**: Reduce cognitive load
- **Progress over perfection**: Celebrate small wins
- **Calm UX**: Low-stimulation, no overwhelming lists
- **Privacy-first**: Data stays on your device
