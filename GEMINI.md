# Shistu Project Documentation

## Architecture & Conventions
- **App Name/Branding**: Defined in `app.json`. Use `expo-constants` to reference the app name throughout the application.
- **Data Persistence**: SQLite (local-first).
- **Styling**: Vanilla CSS, OLED Dark Mode.
- **Privacy**: Local-first with optional BYOK (Bring Your Own Key) for Gemini.

## App Metadata & Re-branding
To update the app name, bundle identifier, or package name:

1.  **Update `app.json`**:
    - `name`: Human-readable name (e.g., "Shistu").
    - `slug`: Expo URL slug.
    - `ios.bundleIdentifier`: Unique iOS identifier (e.g., `com.basecamplogic.shistu`).
    - `android.package`: Unique Android package name (e.g., `com.basecamplogic.shistu`).

2.  **Synchronize Native Directories**:
    Because this project has pre-generated `ios/` and `android/` folders, changes to `app.json` will not automatically propagate. You must run:
    ```bash
    npx expo prebuild --clean
    ```
    *Warning: This will overwrite customizations made directly within the `ios/` or `android/` directories. Only use this if you have not manually modified the native code extensively or if you are comfortable re-applying those changes.*

3.  **JavaScript Constants**:
    If you have used the app name in your UI code, ensure it is accessed via `expo-constants` rather than a hardcoded string:
    ```typescript
    import Constants from 'expo-constants';
    const APP_NAME = Constants.expoConfig?.name ?? 'Shistu';
    ```
