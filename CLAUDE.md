# SpotIt

React Native + Expo SDK 54 room scanner & item inventory app.

## Architecture
- Two-stage detection: YOLO on-device (native) / ONNX in-browser (web) → Gemini cloud enrichment
- Database: WatermelonDB 0.28 with LokiJSAdapter (web/dev), SQLite planned for native
- State: Zustand for UI state, WatermelonDB observables for data
- Navigation: React Navigation 7 (bottom tabs + stack navigators)

## Key Patterns
- Platform-specific files: `.web.ts` suffix for web implementations
- Database models use WatermelonDB decorators (experimentalDecorators in tsconfig)
- `headerBackTitle: ''` not `headerBackTitleVisible` for React Nav 7
- Entry point: index.ts → App.tsx → src/root/App.tsx → RootNavigator

## Environment Variables
- `EXPO_PUBLIC_GEMINI_API_KEY` — Gemini API key for item enrichment (in .env, gitignored)

## Commands
- `npx expo start --web` — Run web version
- `npx expo run:ios` — Build and run on iOS
- `npx expo run:android` — Build and run on Android
- `npm test` — Run tests

## Code Style
- TypeScript strict mode
- English for code, variables, comments
- No default exports for components (except screens)
