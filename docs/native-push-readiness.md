# Native notification build readiness

Connect's employee-only notification registration is implemented, but push delivery is **not live**.

## Configure Expo

1. In the Expo account that owns Black Label Connect, create or link the EAS project using `eas init` (or verify the existing project). Use the UUID from Expo project settings.
2. Set `EXPO_PUBLIC_EAS_PROJECT_ID` to that UUID in the appropriate EAS environment and local development environment. It is a public project identifier, not a secret.
3. Verify that `expo.extra.eas.projectId` resolves to the same UUID in the native build configuration. Do not commit an invented UUID.
4. Configure Apple APNs credentials and Android Firebase Cloud Messaging credentials through Expo/EAS. Keep credentials and service-role keys out of the repository.
5. Run `npm install`, `npx expo install --check`, `npm run typecheck`, and `npx expo config --type public`.
6. Build a development client with `eas build --profile development --platform ios` and separately `--platform android`. Test on physical devices with an active employee login.
7. In Employee announcements, tap **Enable notifications on this device**. Confirm that the `connect_register_push_device` RPC creates the expected enabled registration for that employee.
8. Only after verifying a real device and provider configuration, authorize a controlled employee-only push test and separately deploy/configure the worker. The worker is not deployed, scheduled, or enabled by these instructions.

## Current limitations

- The staged push worker currently chooses one registered device per employee, not every device.
- Expo push ticket acceptance does not prove device delivery; receipt handling is still needed.
- Queue retries can duplicate notifications after an ambiguous timeout.
- Web desktop foreground alerts are separate from native background push.
- Customer notifications belong to My Black Label, not Connect.
- SMS delivery remains disabled.
