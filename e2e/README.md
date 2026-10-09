# E2E tests (Maestro)

- One flow per user story: `maestro/us-<NN>-<slug>.yaml`, where `NN` is the story id in `docs/prd.md`.
- Select elements by `id` (React Native `testID`), never by visible copy, so copy changes do not break flows.
- Flows run against builds with fake services (`EXPO_PUBLIC_USE_FAKES=1`), so results are deterministic.
- `appId` must match `ios.bundleIdentifier` / `android.package` in `apps/mobile/app.json`.

Run locally (requires [Maestro](https://maestro.dev) and a booted simulator/emulator with the app installed):

```bash
maestro test e2e/maestro
```

Open item for pipeline setup (step 2): flows currently assume a build with the JS bundle embedded.
Running them against a cached dev client also needs a deep link to the Metro server before `launchApp`.
