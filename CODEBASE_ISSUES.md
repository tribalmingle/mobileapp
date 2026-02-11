# Codebase Issues Analysis

**Generated:** February 8, 2026  
**Total Errors:** 36 TypeScript errors across 12 files

---

## 1. Missing `global.css` File (Build-Breaking)

**File:** `metro.config.js` (Line 53)  
**Issue:** References `./global.css` but file doesn't exist.

**Fix:** Create `global.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 2. SVG Components Not Imported (12 errors)

### `app/(setup)/HeritageStep.tsx` (Lines 76-91)
- `Svg` not imported
- `Path` not imported

### `app/(setup)/LocationStep.tsx` (Lines 124-154)
- `Svg` not imported
- `Path` not imported

**Fix:** Add import at top of both files:
```typescript
import Svg, { Path } from 'react-native-svg';
```

---

## 3. Type Mismatches (7 errors)

### `app/(auth)/signup.tsx` (Line 151)
- **Issue:** Gender allows `""` but type requires `'male' | 'female' | 'non-binary'`
- **Fix:** Initialize gender state with valid default or make type allow empty string

### `app/(auth)/signup.tsx` (Line 408)
- **Issue:** Style array type incompatible with `ViewStyle`
- **Fix:** Use `StyleSheet.flatten()` or fix array composition

### `app/(tabs)/chat/[id].tsx` (Line 252)
- **Issue:** `targetUserId` used before declaration
- **Fix:** Move `useMemo` hook before its usage in dependency array

### `app/(tabs)/chat/[id].tsx` (Line 262)
- **Issue:** `replyTo` object missing `senderId` property
- **Fix:** Add `senderId` to the replyTo object

### `app/guaranteed-dating/index.tsx` (Line 190)
- **Issue:** `paidAmount` property doesn't exist in `GuaranteedDatingRequest` type
- **Fix:** Add `paidAmount` to the type definition or remove from object

---

## 4. Missing Props/Properties (6 errors)

### `app/(tabs)/chat.tsx` (Line 191)
- **Issue:** `toast` prop doesn't exist on `UniversalBackgroundProps`

### `app/(tabs)/chat/[id].tsx` (Line 522)
- **Issue:** Same `toast` prop issue

**Fix:** Add `toast` prop to `UniversalBackgroundProps` interface:
```typescript
toast?: { message: string; tone?: 'error' | 'info' | 'success' } | null;
```

### `app/profile/[id].tsx` (Lines 410, 413)
- **Issue:** `onAction` function is not defined
- **Fix:** Define `onAction` function or remove the calls

### `app/tips/index.tsx` (Lines 43, 93)
- **Issue:** `colors.text.muted` doesn't exist in theme

**Fix:** Add `muted` to theme in `src/theme/theme.ts`:
```typescript
text: {
  primary: '#F8F5FF',
  secondary: '#B8A9D4',
  tertiary: '#8B7355',
  muted: '#6B7280', // Add this
},
```

---

## 5. LinearGradient Colors Type (3 errors)

### Affected Files:
- `src/components/Button.tsx` (Line 52)
- `src/components/universal/UniversalBottomNav.tsx` (Line 76)
- `app/(tabs)/chat/[id].tsx` (Line 385)

**Issue:** `colors` prop must be tuple type `[ColorValue, ColorValue, ...ColorValue[]]`, not `string[]`

**Fix:** Cast colors with `as const` or use explicit tuple:
```typescript
colors={['#7C3AED', '#D4AF37'] as const}
// or
colors={gradients.hero.colors as readonly [string, string, ...string[]]}
```

---

## 6. Duplicate Object Keys (4 errors)

### `src/constants/locationData.ts`
- Line 169: `'Egypt'` appears twice
- Line 173: `'Ethiopia'` appears twice
- Line 176: `'Ghana'` appears twice
- Line 179: `'Kenya'` appears twice

**Fix:** Remove duplicate entries from the object

---

## 7. Jest Setup Types (6 errors - Test-only)

### `jest.setup.ts` (Lines 1, 6, 9, 10, 11, 19)
- `global` not recognized
- `jest` not recognized

**Fix:** Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

Or exclude jest.setup.ts from main compilation by adding to tsconfig:
```json
{
  "exclude": ["jest.setup.ts", "__tests__/**"]
}
```

---

## Priority Order for Fixes

1. **Critical (Build-breaking):**
   - Create `global.css`
   - Add SVG imports to HeritageStep.tsx and LocationStep.tsx

2. **High (Runtime errors):**
   - Fix `targetUserId` declaration order
   - Fix `onAction` undefined reference
   - Fix gender type mismatch

3. **Medium (Type safety):**
   - Add `toast` prop to UniversalBackgroundProps
   - Add `muted` to theme colors
   - Fix LinearGradient color types
   - Add `senderId` to replyTo

4. **Low (Code quality):**
   - Remove duplicate country keys
   - Fix Jest types (test-only)

---

## Quick Fix Commands

After fixing, verify with:
```bash
pnpm exec tsc --noEmit
```

Run the app:
```bash
npx expo start
```
