# Mobile QA Plan

## Test Environment Setup
**Devices:**
- iOS: iPhone 14 Pro (iOS 17+), iPhone SE (iOS 16+)
- Android: Pixel 7 (Android 13+), Samsung Galaxy A54 (Android 13+)
- Emulators: Xcode Simulator (iOS 17), Android Studio AVD (API 33)

**Build Configurations:**
- Staging: `EXPO_PUBLIC_APP_ENV=staging`, `EXPO_PUBLIC_API_BASE_URL=https://tribalmingle-staging.vercel.app/api`
- Production: `EXPO_PUBLIC_APP_ENV=production`, `EXPO_PUBLIC_API_BASE_URL=https://tribalmingle.vercel.app/api`

**Network Conditions:**
- High speed (Wi-Fi): 50+ Mbps
- 3G throttle: 1.5 Mbps, 400ms latency
- Offline: Airplane mode
- Captive portal: Public Wi-Fi with redirect

**Test Accounts:**
- staging-male@tribalmingle.com / TestPass123!
- staging-female@tribalmingle.com / TestPass123!
- premium-test@tribalmingle.com / TestPass123! (with active premium)

---

## Detailed Test Cases

### 1. Authentication Flow
**TC-AUTH-01: User Registration**
- Steps:
  1. Open app → tap "Sign up"
  2. Enter email, password, confirm password
  3. Accept terms, tap "Create account"
  4. Verify OTP screen appears
- Expected: User created, OTP sent, navigated to verification
- Status: [ ]

**TC-AUTH-02: Login with Valid Credentials**
- Steps:
  1. Open app → tap "Sign in"
  2. Enter valid email/password
  3. Tap "Sign in"
- Expected: Navigate to home/discover, token stored, profile loaded
- Status: [ ]

**TC-AUTH-03: Login with Invalid Credentials**
- Steps:
  1. Attempt login with wrong password
- Expected: Error toast "Invalid credentials", stay on login screen
- Status: [ ]

**TC-AUTH-04: Password Reset**
- Steps:
  1. Tap "Forgot password"
  2. Enter email, tap "Send reset link"
  3. Check email for reset link
  4. Enter new password
- Expected: Email sent, reset successful, can login with new password
- Status: [ ]

**TC-AUTH-05: Session Persistence**
- Steps:
  1. Login successfully
  2. Kill app, reopen
- Expected: User remains logged in, navigates to home
- Status: [ ]

**TC-AUTH-06: Logout**
- Steps:
  1. Navigate to Settings → Tap "Sign out"
- Expected: Token cleared, navigate to login screen
- Status: [ ]

---

### 2. Profile Setup (13 Steps)
**TC-PROF-01: Photo Upload**
- Steps:
  1. Start profile setup
  2. Tap "Add photo" → select from library
  3. Wait for upload progress
- Expected: Photo uploads, displays in grid, can continue
- Status: [ ]

**TC-PROF-02: Step Validation**
- Steps:
  1. Leave required field empty
  2. Tap "Continue"
- Expected: Error message displayed, cannot proceed
- Status: [ ]

**TC-PROF-03: Resume Mid-Setup**
- Steps:
  1. Complete steps 1-5
  2. Kill app, reopen
- Expected: Resume at step 6 with previous data intact
- Status: [ ]

**TC-PROF-04: Geolocation Capture**
- Steps:
  1. Reach location step
  2. Grant location permission
  3. Tap "Use current location"
- Expected: City/country auto-filled from GPS
- Status: [ ]

**TC-PROF-05: ID Verification Upload**
- Steps:
  1. Reach ID step
  2. Upload government ID photo
- Expected: Upload completes, verification pending status shown
- Status: [ ]

---

### 3. Discovery & Matching
**TC-DISC-01: Load Discovery Feed**
- Steps:
  1. Navigate to Discover tab
  2. Wait for profiles to load
- Expected: Paginated profiles display with photos, bio, compatibility
- Status: [ ]

**TC-DISC-02: Like Action**
- Steps:
  1. Tap heart icon on profile
- Expected: Profile removed from queue, next profile shown
- Status: [ ]

**TC-DISC-03: Pass Action**
- Steps:
  1. Tap X icon on profile
- Expected: Profile removed, next shown
- Status: [ ]

**TC-DISC-04: Super Like**
- Steps:
  1. Tap star icon (if available)
- Expected: Super like sent, confirmation shown
- Status: [ ]

**TC-DISC-05: Match Creation**
- Steps:
  1. Like user who already liked you
- Expected: Match modal appears, option to message
- Status: [ ]

**TC-DISC-06: Empty Feed**
- Steps:
  1. Exhaust all recommendations
- Expected: "No more profiles" message, refresh option
- Status: [ ]

---

### 4. Messaging
**TC-MSG-01: Send Text Message**
- Steps:
  1. Open matched user conversation
  2. Type message, tap send
- Expected: Message appears in thread, sent timestamp shown
- Status: [ ]

**TC-MSG-02: Receive Message (Polling)**
- Steps:
  1. Have another user send message
  2. Wait ~3-5s
- Expected: Message appears in thread, unread badge updates
- Status: [ ]

**TC-MSG-03: Unread Count**
- Steps:
  1. Receive messages from 2 users without opening
- Expected: Chat tab badge shows "2"
- Status: [ ]

**TC-MSG-04: Message Pagination**
- Steps:
  1. Open conversation with 50+ messages
  2. Scroll to top
- Expected: Older messages load automatically
- Status: [ ]

**TC-MSG-05: Block from Thread**
- Steps:
  1. Open conversation → menu → "Block user"
- Expected: User blocked, conversation locked, sessions invalidated
- Status: [ ]

---

### 5. Notifications & Push
**TC-NOTIF-01: Device Token Registration**
- Steps:
  1. Login successfully
  2. Check device token sent to `/notifications/device-token`
- Expected: Token registered on backend
- Status: [ ]

**TC-NOTIF-02: Receive Push (Background)**
- Steps:
  1. Close app to background
  2. Send test push notification
  3. Tap notification
- Expected: App opens to correct screen (chat/match/profile)
- Status: [ ]

**TC-NOTIF-03: Receive Push (Foreground)**
- Steps:
  1. App open and active
  2. Send test push
- Expected: In-app toast displayed, deep link works on tap
- Status: [ ]

**TC-NOTIF-04: Mark Notification Read**
- Steps:
  1. Navigate to Notifications → tap item
- Expected: Item marked read, unread badge decrements
- Status: [ ]

**TC-NOTIF-05: Mark All Read**
- Steps:
  1. Notifications list → tap "Mark all read"
- Expected: All items marked read, badge cleared
- Status: [ ]

---

### 6. Settings & Preferences
**TC-SET-01: Update Distance Filter**
- Steps:
  1. Settings → Change distance to 100km → save
  2. Restart app
- Expected: Distance persists at 100km
- Status: [ ]

**TC-SET-02: Update Age Range**
- Steps:
  1. Settings → Set min 25, max 35
- Expected: Discovery feed respects age filter
- Status: [ ]

**TC-SET-03: Toggle Push Notifications**
- Steps:
  1. Settings → Notifications → Toggle "Push notifications" off
- Expected: Preference synced to backend, push disabled
- Status: [ ]

**TC-SET-04: Pause Profile**
- Steps:
  1. Settings → Privacy → Toggle "Pause profile" on
- Expected: Profile hidden from discovery, badge shown on profile tab
- Status: [ ]

**TC-SET-05: Delete Account**
- Steps:
  1. Settings → "Delete account" → confirm
- Expected: Account scheduled for deletion, logged out
- Status: [ ]

---

### 7. Safety & Trust
**TC-SAF-01: Report User**
- Steps:
  1. View profile → Report → Select reason → submit
- Expected: Report sent, confirmation shown
- Status: [ ]

**TC-SAF-02: Block User**
- Steps:
  1. Profile → Block user → confirm
- Expected: User blocked, sessions invalidated, removed from matches
- Status: [ ]

**TC-SAF-03: View Blocked List**
- Steps:
  1. Safety → View blocked users
- Expected: List displays all blocked users with unblock option
- Status: [ ]

**TC-SAF-04: Unblock User**
- Steps:
  1. Blocked list → Unblock user → confirm
- Expected: User unblocked, can appear in discovery again
- Status: [ ]

---

### 8. Premium & Payments (When Enabled)
**TC-PREM-01: View Premium Plans**
- Steps:
  1. Premium tab → View plans
- Expected: Plans displayed with pricing, features
- Status: [ ]

**TC-PREM-02: Purchase with Stripe**
- Steps:
  1. Select plan → Enter test card → confirm
- Expected: Payment succeeds, entitlements applied
- Status: [ ]

**TC-PREM-03: Activate Boost**
- Steps:
  1. Premium → Boosts → Activate
- Expected: Boost active for 60 min, profile visibility increased
- Status: [ ]

---

### 9. Analytics & Observability
**TC-OBS-01: Track App Start**
- Steps:
  1. Kill app → reopen
  2. Check analytics console/backend
- Expected: `app_start` event logged with timestamp
- Status: [ ]

**TC-OBS-02: Track Screen Views**
- Steps:
  1. Navigate: Discover → Matches → Chat
  2. Check analytics
- Expected: `screen_view` events for each screen
- Status: [ ]

**TC-OBS-03: Error Capture**
- Steps:
  1. Trigger API failure (e.g., invalid endpoint)
  2. Check error logs
- Expected: Error captured with user context, stack trace
- Status: [ ]

---

## Regression Checklist
- [ ] Navigation: Tab switching works, back button behavior correct
- [ ] Deep links: Push notifications route to correct screens
- [ ] State persistence: Auth token and settings survive app restart
- [ ] Offline mode: Graceful failures with user-friendly errors
- [ ] Form validation: All required fields enforced
- [ ] Keyboard behavior: Dismiss on scroll, return key submits
- [ ] Accessibility: Tappable areas ≥44pt, text contrast WCAG AA
- [ ] Performance: Cold start <3s, list scroll 60fps, no memory leaks
- [ ] Crash handling: No unhandled promise rejections, errors toasted

---

## Device-Specific Tests
**iOS-Specific:**
- [ ] Face ID/Touch ID for login (if implemented)
- [ ] Apple Pay integration (if enabled)
- [ ] ATT (App Tracking Transparency) prompt shown
- [ ] Share sheet integration for referrals

**Android-Specific:**
- [ ] Google Pay integration (if enabled)
- [ ] Back button: navigates correctly, double-tap exits
- [ ] Permission prompts: camera, location, notifications
- [ ] Battery optimization: app not killed in background

---

## Network Condition Tests
- [ ] High speed: All features work smoothly
- [ ] 3G throttle: Graceful loading states, no crashes
- [ ] Offline: Appropriate error messages, cached data shown
- [ ] Reconnect: Queued actions sync when online

---

## Release Readiness
- [ ] Version number updated in app.json
- [ ] Build number incremented
- [ ] EAS production builds created (iOS + Android)
- [ ] Store assets prepared: icon 1024x1024, splash screens, screenshots
- [ ] Privacy policy URL live and accessible
- [ ] Data safety questionnaire completed
- [ ] Support email/contact configured
- [ ] Rollback plan: Previous build available in store

---

## Sign-Off
**QA Owner:** _______________  
**Date:** _______________  
**Pass Rate:** _____ / _____ tests  
**Critical Bugs:** _____  
**Release Approved:** [ ] Yes [ ] No


