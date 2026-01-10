# Recreate TM App – Phase Plan

## Phase 1 (start now)
1) Scaffold tmapp workspace: base folder, package.json, Expo/Router boilerplate.
2) Create shared tokens: theme.ts and constants.ts mirroring current design tokens.
3) Build routing skeleton: app/_layout.tsx plus group folders (auth, setup, tabs) with placeholder screens.
4) Wire entry point: app/index.tsx using existing splash logic.
5) Verify path casing (all lowercase) and import paths for new skeleton.

## Phase 2
1) Migrate shared UI primitives: UniversalBackground, UniversalHeader, UniversalBottomNav, GoldButton, PurpleCard, Button, CustomInput, GradientBackground, GlassCard.
2) Re-point assets references to tmapp/assets; copy assets folder.
3) Align theme usage (colors/spacing/typography/borderRadius/shadows) and fix any missing tokens.
4) Validate components on both platforms (Android/iOS tweaks for spacing, logo/button areas).
5) Add any required utility/constants modules referenced by shared components.

## Phase 3
1) Rebuild auth screens (welcome, splash/index, signup, login, password/OTP flows) with lowercase routes.
2) Ensure Platform.OS === 'android' spacing tweaks for logoContainer/buttonContainer/pagination.
3) Rewire navigation to lowercase paths (/signup, /login, /otp-verification, etc.).
4) Hook auth API calls (register/login) and SecureStore token handling.
5) Smoke-test routing: welcome → signup → login → password reset → success screens.

## Phase 4
1) Recreate 13-step profile setup into app/(setup)/step1.tsx … step13.tsx mirroring existing steps.
2) Port setup state management and API calls (updateProfile, SecureStore token reads).
3) Carry over step components (photo upload, location, heritage, bio, looking for, verification, etc.).
4) Ensure layout parity (gradients/patterns, spacing, headers) and Android-safe padding.
5) Validate completion flow transitions back to main tabs.

## Phase 5
1) Rebuild main tab stack in app/(tabs)/ (home, discover, matches, chat, profile) with universal header/background/nav.
2) Wire bottom nav routes to new paths and ensure active-state highlighting.
3) Migrate any tab-specific modals/promos/filters and data hooks.
4) Confirm deep-links/initial routes function after migration.
5) Final QA: run lint/tsc, check sitemap for missing exports, and ensure assets load.
