# Mobile QA Plan

## Smoke Test Matrix
- Platforms: iOS (latest, previous), Android (Pixel-like, Samsung midrange), emulators + 1 physical each.
- Build types: Staging vs Production; Release (no dev menu), Debug (for logs).
- Network: Good Wi‑Fi, 3G/Edge, offline/airplane, captive portal check.
- Localization/timezone sanity: GMT, WAT, PST; 12/24h.

## Core Flows
- Auth: signup, login, logout, reset password, session restore.
- Profile setup: advance through all steps, media upload, validation errors, resume from mid-step.
- Discovery/likes/matches: fetch feed, like/pass/superlike, empty state, match creation, open chat.
- Messaging: send/receive text, media placeholder, unread badge, typing/receipts (if enabled), pagination.
- Notifications: register device token, receive push foreground/background, deep link to chat/match/profile, mark read/all.
- Premium/boosts: view plans, activate boost, spotlight bid, entitlement gating (when enabled).
- Concierge/guaranteed dating: submit request, view status, refund/feedback (when enabled).
- Community/events/tips: list, join/RSVP, view tips.
- Referrals: view code/status/history, share/invite.
- Safety: report/block, ensure blocked cannot message; settings toggles and pause profile.
- Settings: distance/age/tribes filters persist, notifications/email toggles persist.

## Regression Checklist
- Navigation: tab switch, back behavior, deep links from push.
- State: app kill/relauch preserves auth and settings; offline queue gracefully fails.
- Forms: inputs validated, keyboard behaviors correct (return/dismiss, scroll into view).
- Accessibility: tappable targets, contrast, labels on interactive elements where applicable.
- Performance: cold start under 3s on midrange; chat scroll smooth; lists virtualized.
- Crash/Errors: handled toasts/modals; no unhandled promise rejections.

## Instrumentation & Logging
- Analytics: app_start, screen views, login/signup/logout events logged (plumb real provider later).
- Errors: captured via captureError helper; console review for warnings.

## Release Readiness
- Versioning set in app.json/app.config; build numbers incremented.
- EAS build artifacts for iOS/Android produced from main branch.
- Store assets: icons/splash, screenshots, privacy URLs, data safety/ATT, contact info.
- Rollback: previous stable build available; feature flags for risky areas.

## Test Data & Accounts
- Staging accounts for male/female flows; test payment tokens; referral codes; push test payloads.

## Sign-off
- QA owner reviews this matrix; record pass/fail per item; file defects with reproduction steps and logs.
