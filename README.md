# Black Label Connect

The first runnable mobile shell for the unified Black Label app. It is intentionally isolated from the existing Hub frontend and uses a typed fixture matching the proposed `mobile_bootstrap()` version 1 contract.

This is a standalone App Store project. Black Label Hub supplies its administrative controls and authorization contract; it does not contain or ship the mobile application.

## Run

```bash
npm install
npm run web
```

Use `npm run ios` or `npm run android` when the matching simulator is available.

## Current slice

- Stable Home, Inbox, Calendar, Work, and More navigation
- Employee and contractor preview personas
- Server-controlled navigation derivation
- Representative operational data and interaction states
- Deny-by-default behavior when `mobile.access` is absent

Tap the initials in the header to switch between employee and contractor fixtures.

See `docs/app-store-release.md` for the release-readiness checklist and store boundary.

## Backend boundary

This scaffold does not connect to production data. Replace `src/fixtures/bootstrap.ts` with an authenticated adapter only after the Phase 0 `mobile_bootstrap()` contract and persona authorization tests pass in staging.
