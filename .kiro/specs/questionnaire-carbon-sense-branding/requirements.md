# Requirements Document

## Introduction

Add a "CarbonSense" branding element to every question card in the questionnaire/intake flow. The branding element consists of the same logo mark (a small rounded square in the accent green color) and the "CarbonSense" wordmark text, arranged in a row — identical in appearance to the wordmark on the landing page. It should appear below the question text and above the answer input on each card.

## Glossary

- **QuestionCard**: The card component rendered in the intake flow (`src/components/intake/QuestionCard.tsx`) that displays a question and its answer input.
- **Header**: The sub-component within QuestionCard that renders the "Question N" step label and the question text.
- **BrandingElement**: The inline logo mark and "CarbonSense" wordmark row to be added to the QuestionCard.
- **LogoMark**: The 28×28 rounded square with `backgroundColor: Colors.accent` used as the visual icon on the landing page.
- **Wordmark**: The text "CarbonSense" styled with `Fonts.sansSemiBold`, `FontSizes.md`, `color: Colors.accent`, and `letterSpacing: 0.3`.
- **Colors**: The shared theme object at `src/theme/colors.ts`.
- **Fonts / FontSizes**: The shared typography objects at `src/theme/typography.ts`.

## Requirements

### Requirement 1: Display BrandingElement on Every QuestionCard

**User Story:** As a user going through the intake questionnaire, I want to see the CarbonSense brand on each question card, so that I have a consistent sense of the product identity throughout the flow.

#### Acceptance Criteria

1. THE QuestionCard SHALL render the BrandingElement on every question card in the intake flow.
2. WHEN the QuestionCard is displayed, THE BrandingElement SHALL appear below the question text and above the answer input area.
3. THE BrandingElement SHALL consist of the LogoMark and the Wordmark arranged in a horizontal row with `alignItems: 'center'` and a gap of 10.
4. THE LogoMark SHALL have width 28, height 28, borderRadius 8, and backgroundColor equal to `Colors.accent`.
5. THE Wordmark SHALL display the text "CarbonSense" with `fontFamily: Fonts.sansSemiBold`, `fontSize: FontSizes.md`, `color: Colors.accent`, and `letterSpacing: 0.3`.
6. THE BrandingElement SHALL be visually identical in style to the wordmark row on the landing page (`app/index.tsx`).

### Requirement 2: Consistent Placement Across All Question Types

**User Story:** As a user, I want the branding to appear consistently regardless of which question type is shown, so that the experience feels uniform.

#### Acceptance Criteria

1. WHEN the QuestionCard renders a question of type `options`, `stepper`, `percentage`, `weekly_km`, or `scale`, THE BrandingElement SHALL be visible below the question text on all of these types.
2. THE BrandingElement SHALL not alter the layout or spacing of the answer input area or the navigation buttons.
3. THE QuestionCard SHALL maintain its existing `gap: 28` between the Header section, the BrandingElement, the answer input, and the navigation area.

### Requirement 3: Reuse Shared Theme Tokens

**User Story:** As a developer, I want the branding element to use the existing theme tokens, so that any future theme changes propagate automatically.

#### Acceptance Criteria

1. THE BrandingElement SHALL source its color exclusively from `Colors.accent` and SHALL NOT use hardcoded color values.
2. THE BrandingElement SHALL source its typography from `Fonts.sansSemiBold` and `FontSizes.md` and SHALL NOT use hardcoded font or size values.
