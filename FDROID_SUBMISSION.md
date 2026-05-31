# F-Droid Submission Guide for Shistu

I have prepared the necessary file structure for your F-Droid submission. 

## 1. Files Created
- `LICENSE`: MIT License (mandatory for F-Droid).
- `fastlane/metadata/android/en-US/`:
    - `title.txt`: The app name.
    - `short_description.txt`: Brief summary for the F-Droid list.
    - `full_description.txt`: Detailed features and privacy statement.

## 2. F-Droid Metadata (Recipe)
When you open a Merge Request on the [F-Droid Data repository](https://gitlab.com/fdroid/fdroiddata), you will need to add a file named `com.basecamplogic.shistu.yml` in the `metadata/` folder. 

**Recommended Content for `com.basecamplogic.shistu.yml`**:

```yaml
Categories:
  - Lifestyle
  - Health
License: MIT
AuthorName: Yogesh Sagar CB
SourceCode: https://github.com/YogeshSagarCB/Shistu
IssueTracker: https://github.com/YogeshSagarCB/Shistu/issues

AutoName: Shistu
Description: |-
    Shistu is a privacy-focused, local-first habit tracker designed for high performance and minimal friction.

    Key Features:
    * Local-First Architecture: Your data never leaves your device.
    * Native Android Widgets: Log your habits directly from your home screen.
    * AI Behavioral Intelligence: Get strategic insights based on behavioral science (Requires BYOK).
    * Deep Customization: Choose any emoji and color.
    * OLED Dark Mode: Optimized for battery and accessibility.

RepoType: git
Repo: https://github.com/YogeshSagarCB/Shistu

Builds:
  - versionName: 1.0.0
    versionCode: 1
    commit: e9fe44c  # Replace with your latest release commit hash
    subdir: android
    gradle:
      - yes
    prebuild:
      - cd .. && npm install && npx expo prebuild --platform android

AntiFeatures:
  NonFreeNet:
    en-US: This app uses Google Gemini AI for insights, which requires a connection to a non-free service. However, the core app functionality is fully operational offline without an API key.

AutoUpdateMode: Version
UpdateCheckMode: Tags
```

## 3. How to Submit
1.  **Tag a Release**: Push your changes and create a git tag (e.g., `v1.0.0`) on your GitHub repo.
2.  **GitLab Account**: Create an account on [GitLab.com](https://gitlab.com).
3.  **Fork fdroiddata**: Fork [fdroid/fdroiddata](https://gitlab.com/fdroid/fdroiddata).
4.  **Add Metadata**: Add the `.yml` file above to your fork.
5.  **Open Merge Request**: Submit the fork back to the main F-Droid repo.

The F-Droid team will then review your code, ensure no proprietary binaries are included, and start their build process.
