# Media Storage & Uploads (Mobile App)

## Source of truth
All media for the mobile app is stored on the HostGator media server at **https://tm.d2d.ng**. Do **not** move media to AWS, S3, Cloudinary, or other providers without explicit approval.

## Upload flow (current)
1. **Mobile app** uploads to the backend endpoint: `POST /api/upload`.
2. The backend (see `tribalmingle/app/api/upload/route.ts`) forwards the file to HostGator using `uploadToHostGator`.
3. HostGator returns a URL under **https://tm.d2d.ng/media/**.
4. The app stores that URL in the user profile (`profilePhotos`, `profilePhoto`).

## Folder routing
The app sends a `folder` field to the API. The backend uses this to place the file on HostGator.

Recommended folder values:
- `profile`
- `selfie`
- `id-verification`
- `general`

## Required env vars (Expo)
These must be set for Expo builds so the app can resolve HostGator URLs consistently:
- `EXPO_PUBLIC_UPLOAD_BASE_URL=https://tm.d2d.ng`

We still keep:
- `EXPO_PUBLIC_API_BASE_URL` for core API calls.

## Backend-only secret
HostGator requires a server-side API key:
- `HOSTGATOR_API_KEY` (backend only; **never** ship this in the app)

## What NOT to change
- Do not switch to AWS/S3/Cloudinary without a formal migration plan.
- Do not upload directly to HostGator from the app (would expose `HOSTGATOR_API_KEY`).

## References
- Backend upload route: `tribalmingle/app/api/upload/route.ts`
- HostGator client: `tribalmingle/lib/vendors/hostgator-client.ts`
- Mobile upload helper: `tmapp/src/api/upload.ts`
