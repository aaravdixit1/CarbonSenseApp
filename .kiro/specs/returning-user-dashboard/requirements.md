# Requirements Document

## Introduction

The Returning User Dashboard is a home screen shown automatically to users who have already completed the carbon footprint questionnaire. Instead of seeing the onboarding/landing screen again, returning users land on a persistent "home base" that surfaces their footprint score, top recommended actions, and quick navigation to their full results or to retake the questionnaire. The goal is to support ongoing habit tracking rather than treating the experience as a one-time calculation.

## Glossary

- **Dashboard**: The returning-user home screen rendered at the app root when a completed session exists in storage.
- **Session**: A `StoredSession` object persisted via `AsyncStorage`, containing `session_id`, `habit_profile`, `footprint_result`, `actions`, and `created_at`.
- **FootprintScore**: The `total_tco2e` value from `footprint_result`, expressed in tonnes of CO₂ equivalent per year.
- **TopActions**: The subset of `actions` sorted by `rank` (ascending), representing the highest-impact habit changes.
- **Router**: The expo-router navigation controller used throughout the app.
- **Storage**: The `loadSession` / `clearSession` functions in `src/lib/storage.ts`.
- **LandingScreen**: The existing onboarding screen at `app/index.tsx`, shown only to first-time users.
- **ResultsScreen**: The existing detailed results screen at `app/results.tsx`.

---

## Requirements

### Requirement 1: Automatic Routing to Dashboard

**User Story:** As a returning user, I want the app to take me directly to my dashboard when I reopen it, so that I don't have to navigate past the onboarding screen every time.

#### Acceptance Criteria

1. WHEN the app root (`app/index.tsx`) mounts AND Storage returns a non-null Session, THE Router SHALL replace the current route with the Dashboard route without rendering the LandingScreen content.
2. WHEN the app root mounts AND Storage returns null, THE Router SHALL render the LandingScreen as normal.
3. WHILE Storage is being read on mount, THE LandingScreen SHALL display a neutral loading state rather than flashing its full onboarding content.
4. IF Storage throws an error during the session check, THEN THE Router SHALL fall back to rendering the LandingScreen.

---

### Requirement 2: Footprint Score Display

**User Story:** As a returning user, I want to see my carbon footprint score prominently on the dashboard, so that I have an immediate sense of where I stand.

#### Acceptance Criteria

1. THE Dashboard SHALL display the FootprintScore in tonnes CO₂e per year as the primary visual element.
2. THE Dashboard SHALL render the existing `FootprintMeter` component with the Session's `total_tco2e` value.
3. THE Dashboard SHALL display the date the Session was created, formatted as a human-readable string (e.g. "Calculated on Jan 5, 2025"), derived from `created_at`.
4. IF the Session's `total_tco2e` is 0 or negative, THEN THE Dashboard SHALL display a fallback message indicating the score is unavailable rather than rendering a misleading meter value.

---

### Requirement 3: Top Actions List

**User Story:** As a returning user, I want to see my top recommended habit changes on the dashboard, so that I have a quick reminder of what to focus on.

#### Acceptance Criteria

1. THE Dashboard SHALL display TopActions sorted by `rank` ascending, showing at most 3 actions.
2. THE Dashboard SHALL render each action using the existing `ActionCard` component.
3. WHEN the Session contains fewer than 3 actions, THE Dashboard SHALL display only the available actions without placeholder cards.
4. IF the Session contains no actions, THEN THE Dashboard SHALL display a message prompting the user to view their full results.

---

### Requirement 4: Navigation to Full Results

**User Story:** As a returning user, I want to navigate to my full results screen from the dashboard, so that I can review my category breakdown in detail.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a clearly labelled control that navigates to the ResultsScreen when activated.
2. WHEN the user activates the "View Full Results" control, THE Router SHALL push the `/results` route.
3. THE "View Full Results" control SHALL be accessible with an `accessibilityLabel` of "View full results" and `accessibilityRole` of "button".

---

### Requirement 5: Retake Questionnaire

**User Story:** As a returning user, I want to retake the questionnaire from the dashboard, so that I can update my footprint after my habits have changed.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a clearly labelled control that allows the user to retake the questionnaire.
2. WHEN the user activates the "Retake" control, THE Dashboard SHALL call `clearSession` from Storage before navigating.
3. WHEN `clearSession` completes, THE Router SHALL replace the current route with `/intake`.
4. IF `clearSession` throws an error, THEN THE Router SHALL still navigate to `/intake` so the user is not blocked.
5. THE "Retake" control SHALL be accessible with an `accessibilityLabel` of "Retake questionnaire" and `accessibilityRole` of "button".

---

### Requirement 6: Visual Design Consistency

**User Story:** As a returning user, I want the dashboard to feel like a natural part of the CarbonSense app, so that the experience is cohesive and trustworthy.

#### Acceptance Criteria

1. THE Dashboard SHALL use `Colors.background` (#F2EDE4) as the screen background color.
2. THE Dashboard SHALL use `Colors.card` (#FAF7F2) as the background color for content cards.
3. THE Dashboard SHALL use `Colors.accent` (#1E3D0F) for primary interactive controls and emphasis text.
4. THE Dashboard SHALL use `Fonts.displayRegular` (DM Serif Display) for the primary headline and `Fonts.sansRegular` / `Fonts.sansSemiBold` (DM Sans) for body and button text.
5. THE Dashboard SHALL display the CarbonSense wordmark (logo mark + app name) in the header, consistent with the LandingScreen treatment.
6. THE Dashboard SHALL apply safe-area insets to top and bottom padding using `useSafeAreaInsets`.

---

### Requirement 7: Dashboard Route Registration

**User Story:** As a developer, I want the dashboard to be a proper expo-router route, so that navigation is consistent with the rest of the app.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a default export in `app/dashboard.tsx`.
2. THE Router SHALL be able to navigate to the Dashboard via the `/dashboard` route.
3. THE Dashboard SHALL not be reachable from the LandingScreen directly; it is only reached via automatic redirect from the app root when a Session exists.
