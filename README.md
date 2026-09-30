# Black Label Connect

The standalone Expo app for the unified Black Label mobile experience. It authenticates against Supabase and resolves the current user's workspace, persona, capabilities, navigation, and notification state through the versioned `mobile_bootstrap()` RPC.

This is a standalone App Store project. Black Label Hub supplies its administrative controls and authorization contract; it does not contain or ship the mobile application.

## Run

```bash
npm install
cp .env.example .env.local
npm run web
```

Use `npm run ios` or `npm run android` when the matching simulator is available.

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The publishable key is intended for client use; never place a service-role key in the mobile app.

## Current slice

- Stable Home, Inbox, Calendar, Work, and More navigation
- Supabase email/password session handling with persistent native storage
- Authenticated `mobile_bootstrap()` loading and contract validation
- Server-controlled persona resolution
- Server-controlled navigation derivation
- Representative operational data and interaction states
- Explicit loading, configuration, authentication, RPC error, and sign-out states

See `docs/app-store-release.md` for the release-readiness checklist and store boundary.

## Backend boundary

The app does not query Hub tables directly. Startup data is limited to the authenticated `mobile_bootstrap()` RPC, whose server-side authorization derives scope from `auth.uid()`.
