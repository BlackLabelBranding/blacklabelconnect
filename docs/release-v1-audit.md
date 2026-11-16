# Black Label Connect 1.0 — release audit (2026-11-16)

**Decision: NOT READY for App Store submission.** Apple organization enrollment is pending; the following gates are not verified. This document distinguishes observed code/configuration from untested runtime behavior.

## Verified in repository
- Expo 57 / React Native 0.86; EAS project ID configured.
- iOS bundle identifier `com.blacklabelbranding.connect`; EAS production profile auto-increments.
- Shared Supabase Auth; login, session persistence, sign-out, and My Black Label password-recovery link in `src/BootstrapGate.tsx`.
- Hub-managed application cards use `connect_my_apps` and employee calendar uses server RPC.
- Version 1.0.0 staged in this branch. **Do not tag or ship before release gates pass.**

## Blocking requirements (owners / acceptance)
| Priority | Gate | Acceptance evidence |
|---|---|---|
| P0 | Apple organization enrollment | Membership active; organization team, app ID, and App Store Connect record confirmed |
| P0 | Account deletion | In-app initiation of account deletion, clear process and retention terms, verified end-to-end; distinguish deletion from employee deactivation |
| P0 | Public legal/support links | Reachable from signed-out screen: privacy policy, support contact, terms, and deletion instructions; live HTTPS URLs verified |
| P0 | Messaging safety | Test report/block flows as applicable to user-generated content and moderation policy; no unauthorized cross-user messages |
| P0 | Backend authorization | Staging allow/deny tests for each role and each exposed RPC, including catalog, calendar scopes, time clock, messages, work and gigs |
| P0 | Build and signing | EAS iOS production build signed by Black Label Branding LLC; no secrets in repository; actual build uploaded to TestFlight |
| P0 | Real-device QA | iPhone sign-in/recovery/sign-out, permission denial, background/resume, push, deep links, offline/retry and app crash checks |
| P0 | App Review | Review account with seeded non-sensitive data; screenshots; app privacy disclosures; review notes |
| P1 | iPad | App currently declares `supportsTablet: true`; either verify iPad layout and screenshots or disable support before release |
| P1 | Branding | Confirm final app icon and splash appearance on installed build |
| P1 | Release automation | Run `npm run check`, Expo diagnostics, EAS build, and inspect build logs |

## Code findings
1. `src/BootstrapGate.tsx` signed-out screen currently offers only sign-in and password recovery; public privacy/support/deletion links are not implemented there.
2. `src/lib/supabase.ts` still sends client-info `blacklabel-connect@0.1.0` (should match release version).
3. `docs/app-store-release.md` lists account deletion, message reporting/blocking, security tests, and TestFlight as incomplete.
4. `app.json` enables iPad support; no device matrix results were provided.
5. `src/components/HomeLaunchpad.tsx` reads `time_punches` directly for clock status. Audit its RLS and ensure app-catalog denial does not expose restricted status.
6. No actual iOS build, signing result, TestFlight installation, or Apple review evidence was available during this repository audit.

## Release procedure
1. Resolve P0 blockers and attach test evidence to this PR or linked issues.
2. Run `npm ci && npm run check && npx expo-doctor` in CI or a trusted workstation; attach logs.
3. Configure EAS environment variables with **publishable** Supabase key, never service-role.
4. After organization enrollment, configure Apple signing and run `eas build --platform ios --profile production`.
5. Upload to TestFlight; run role-based employee QA; complete App Store Connect metadata and privacy answers.
6. Only then approve submission.

**No Apple build was triggered by this audit.**
