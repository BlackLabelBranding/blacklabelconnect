# App Store Release Readiness

Black Label Connect is a standalone iOS and Android product. Black Label Hub remains its administrative control plane, but mobile signing, builds, store records, privacy disclosures, support, and releases are owned by this project.

## Identity and ownership

- [x] Working product name: Black Label Connect
- [x] Home-screen name: Black Label
- [x] iOS bundle identifier: `com.blacklabelbranding.connect`
- [x] Android package: `com.blacklabelbranding.connect`
- [ ] Confirm the bundle identifier is available in the Black Label Apple Developer account
- [ ] Create the App Store Connect record under the correct legal entity
- [ ] Reserve the Android package in Google Play Console
- [ ] Configure the Expo project ID after the EAS project is created

## Required product behavior

- [ ] Sign in, recovery, sign out, and session revocation work against staging
- [ ] Account deletion can be initiated inside the app
- [ ] Support, privacy policy, and terms links are reachable without authentication
- [ ] Messaging includes report and block flows where user-generated content requires them
- [ ] Permission-denied and suspended-account states are understandable
- [ ] Notification deep links reopen only authorized records
- [ ] Offline drafts and failed sends have visible recovery states

## Privacy and permissions

- [ ] Publish the privacy policy and retention/deletion policy
- [ ] Complete the App Privacy questionnaire from actual collected data and SDK behavior
- [ ] Add usage descriptions only for permissions the shipped version requests
- [ ] Verify logs and notifications do not expose sensitive message content
- [ ] Confirm analytics, crash reporting, push, and attribution SDK disclosures

## Build and review

- [x] Development, internal preview, and production EAS profiles are separated
- [x] Production builds auto-increment store build numbers
- [ ] Add final app icon, adaptive icon, splash assets, and dark-mode variants
- [ ] Produce screenshots from real, seeded application states
- [ ] Prepare a least-privilege App Review account with stable sample data
- [ ] Write review notes explaining Hub-controlled roles, account switching, and restricted modules
- [ ] Validate on the supported iPhone and iPad matrix
- [ ] Complete TestFlight internal testing before external testing
- [ ] Confirm crash, notification, authentication, and deep-link telemetry before submission

## Release gate

Do not submit a build connected to production until the mobile bootstrap contract and every mobile-exposed data path have passed role-based allow and deny tests in staging. Store signing and release credentials must never be committed to this repository.
