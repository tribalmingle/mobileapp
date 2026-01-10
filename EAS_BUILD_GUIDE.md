# EAS Build & Deployment Guide

## Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure project: `eas build:configure` (already done - eas.json exists)

## Environment Setup

### Development Build (Local Testing)
```bash
# Create development build for iOS simulator
eas build --profile development --platform ios

# Create development build for Android emulator  
eas build --profile development --platform android
```

### Staging Build (Internal Testing)
```bash
# iOS staging build
eas build --profile staging --platform ios

# Android staging build
eas build --profile staging --platform android

# Build both platforms
eas build --profile staging --platform all
```

### Production Build (Store Release)
```bash
# iOS production build
eas build --profile production --platform ios

# Android production build  
eas build --profile production --platform android

# Build both platforms
eas build --profile production --platform all
```

## Store Credentials Setup

### iOS (App Store Connect)
1. Create App Store Connect API Key:
   - Go to https://appstoreconnect.apple.com/access/api
   - Create new key with "Admin" or "App Manager" role
   - Download .p8 file

2. Configure in eas.json (already done):
   ```json
   "appleId": "your-apple-id@example.com",
   "ascAppId": "1234567890",
   "appleTeamId": "YOUR_TEAM_ID"
   ```

3. Or use interactive setup:
   ```bash
   eas credentials
   ```

### Android (Google Play Console)
1. Create service account:
   - Go to https://play.google.com/console
   - Setup → API access → Create service account
   - Grant "Release Manager" permissions
   - Download JSON key

2. Save as `google-play-service-account.json` in project root (add to .gitignore)

3. Already configured in eas.json:
   ```json
   "serviceAccountKeyPath": "./google-play-service-account.json"
   ```

## Submission to Stores

### iOS Submission
```bash
# Submit latest production build to App Store
eas submit --platform ios --latest

# Or specify build ID
eas submit --platform ios --id <build-id>
```

### Android Submission
```bash
# Submit to Google Play (internal track by default)
eas submit --platform android --latest

# Submit to specific track
eas submit --platform android --latest --track production
```

Available Android tracks:
- `internal` - Internal testing (default)
- `alpha` - Closed alpha testing
- `beta` - Open beta testing  
- `production` - Public release

## Build Status & Management

### Check build status
```bash
# View all builds
eas build:list

# View builds for specific project
eas build:list --platform ios
eas build:list --platform android

# View build details
eas build:view <build-id>
```

### Download build artifacts
```bash
# Download build
eas build:download <build-id>

# Download latest
eas build:download --platform ios --latest
```

## App Store Assets Checklist

### iOS App Store
- [ ] App icon: 1024x1024 PNG (no alpha, no rounded corners)
- [ ] Screenshots:
  - iPhone 6.7" (2796x1290) - required
  - iPhone 6.5" (2778x1284) - required
  - iPad Pro 12.9" (2048x2732) - optional
- [ ] App preview video (optional): 15-30s
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] App Store description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Age rating via questionnaire
- [ ] Export compliance declaration

### Google Play Store
- [ ] High-res icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 PNG
- [ ] Screenshots:
  - Phone: 320-3840px (min 2, max 8)
  - 7" tablet: 1024-3840px (min 1, max 8)
  - 10" tablet: 1024-3840px (min 1, max 8)
- [ ] Promo video URL (YouTube, optional)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Privacy policy URL
- [ ] Content rating via questionnaire
- [ ] Target audience & content
- [ ] Data safety section

## Environment Variables for Production

Update `.env` or configure in EAS Secrets:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://tribalmingle.vercel.app/api
EXPO_PUBLIC_APP_ENV=production

# Analytics (when ready)
EXPO_PUBLIC_ANALYTICS_PROVIDER=segment
EXPO_PUBLIC_SEGMENT_WRITE_KEY=your_segment_key

# Or use EAS Secrets
eas secret:create --name SEGMENT_WRITE_KEY --value your_key --scope project
```

## Rollback Strategy

### If production build has critical bug:
1. Stop store rollout immediately (both stores support staged rollouts)
2. Revert to previous build:
   ```bash
   # iOS: Submit previous stable build
   eas submit --platform ios --id <previous-build-id>
   
   # Android: Rollback in Play Console or submit previous build
   eas submit --platform android --id <previous-build-id> --track production
   ```
3. Fix bug, test in staging, create new production build

### Staged Rollout Best Practices
- iOS: Use "Phased Release" (automatic 7-day rollout)
- Android: Start at 1% → 5% → 10% → 50% → 100% over 1 week
- Monitor crash reports and user feedback at each stage

## Version Management

### Before each build:
1. Update `version` in app.json: `"1.2.3"` (semantic versioning)
2. Increment `buildNumber` (iOS) and `versionCode` (Android)
3. Update CHANGELOG.md with release notes

### Build number conventions:
- Development: Use any number for testing
- Staging: Increment by 1 for each internal build
- Production: Increment by 1, never reuse

## Troubleshooting

### Build fails with credentials error
```bash
# Clear and reconfigure credentials
eas credentials --clear-credentials
eas credentials
```

### Build succeeds but app crashes on launch
1. Check build logs: `eas build:view <build-id>`
2. Ensure environment variables are set correctly
3. Test with staging build first before production

### Submission rejected
1. Review rejection reason in App Store Connect / Play Console
2. Common issues:
   - Missing privacy policy
   - Incomplete content ratings
   - Data safety information incomplete
   - Missing required screenshots
3. Fix issues, no need to rebuild (unless code changes needed)
4. Resubmit same build after fixes

## Quick Reference Commands

```bash
# Build staging for testing
eas build --profile staging --platform all

# Build production for release
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

## Next Steps
1. Complete iOS/Android developer account setup
2. Configure store credentials using instructions above
3. Create staging builds for internal testing
4. Run QA matrix from QA_PLAN.md
5. Create production builds
6. Prepare store assets
7. Submit for review
