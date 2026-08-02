# Planetary Hours Mobile App

## Android Production Release

Run release checks from the repository root:

```bash
npm run lint --workspace mobile
npm run typecheck --workspace mobile
npm test --workspace mobile
```

Run Expo health checks from `apps/mobile`:

```bash
npx expo-doctor
npx expo config --json
```

The production EAS profile builds a Google Play Android App Bundle:

```bash
cd apps/mobile
eas build --platform android --profile production
```

Before starting the build, verify the production public environment values:

```bash
npx expo config --json
```

Confirm the production profile supplies:

```text
EXPO_PUBLIC_API_BASE_URL=https://planetaryhours.in
EXPO_PUBLIC_ANDROID_UPDATE_MANIFEST_URL=https://planetaryhours.in/downloads/android-update.json
```

Verify Android signing credentials are remote-managed:

```bash
cd apps/mobile
eas credentials -p android
```

After the AAB is generated, verify before uploading to Google Play:

```text
Package ID: com.planetaryhours.app
Version name: 1.0.3
Version code: 6 or the auto-incremented EAS build value
Target SDK: meets current Google Play target API requirements
Permissions: foreground location only, ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION
```

Do not commit keystore files or production secrets.

## Expo Development

This is an Expo project using Expo Router.

Install dependencies:

```bash
npm install
```

Start the app from `apps/mobile`:

```bash
npx expo start
```

The app can be opened in an Android emulator, a development build, or Expo Go where supported.
