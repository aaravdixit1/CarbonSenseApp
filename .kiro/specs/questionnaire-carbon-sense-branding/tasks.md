# Implementation Plan: questionnaire-carbon-sense-branding

## Overview

Add a `Question.Branding` sub-component to `QuestionCard.tsx` that renders the CarbonSense logo mark and wordmark row, then insert it between `Question.Header` and `Question.Options` in the card render tree. The change is confined to a single file plus a new test file.

## Tasks

- [x] 1. Add `Question.Branding` sub-component and styles to `QuestionCard.tsx`
  - Define a stateless `Branding: FC` (no props) inside the Sub-components section of `QuestionCard.tsx`
  - It renders a `View` with `styles.brandingRow` containing a `View` with `styles.brandingLogoMark` and a `Text` with `styles.brandingWordmark` displaying "CarbonSense"
  - Add `Branding` to the `Question` namespace export alongside `Header`, `Options`, and `Nav`
  - Add style entries: `brandingRow` (`flexDirection: 'row'`, `alignItems: 'center'`, `gap: 10`), `brandingLogoMark` (`width: 28`, `height: 28`, `borderRadius: 8`, `backgroundColor: Colors.accent`), `brandingWordmark` (`fontFamily: Fonts.sansSemiBold`, `fontSize: FontSizes.md`, `color: Colors.accent`, `letterSpacing: 0.3`)
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2_

- [x] 2. Insert `<Question.Branding />` into the `QuestionCard` render tree
  - In the `QuestionCard` component's return JSX, add `<Question.Branding />` between `<Question.Header .../>` and `<Question.Options .../>`
  - Verify the existing `gap: 28` on the card `View` provides spacing automatically — no additional margin/padding needed
  - _Requirements: 1.2, 2.2, 2.3_

  - [ ]* 2.1 Write property test — Property 1: BrandingElement present on all question types
    - Create `__tests__/QuestionCard.branding.test.tsx`
    - Use `fc.constantFrom('options', 'stepper', 'percentage', 'weekly_km', 'scale')` to drive question type selection
    - For each sampled type, render the appropriate `QuestionCard` scenario and assert a `Text` node with content "CarbonSense" is present in the tree
    - Run with `{ numRuns: 100 }`
    - **Property 1: BrandingElement present on all question types**
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 2.2 Write property test — Property 2: BrandingElement appears between Header and Options
    - In the same test file, add a second `fc.assert` block
    - Use `fc.constantFrom(...ALL_QUESTION_KEYS)` to drive step key selection
    - Render `QuestionCard` for each sampled key, find child indices of Header, Branding, and Options nodes, and assert `headerIdx < brandingIdx < optionsIdx`
    - Run with `{ numRuns: 100 }`
    - **Property 2: BrandingElement appears between Header and Options**
    - **Validates: Requirements 1.2**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The entire change is confined to `src/components/intake/QuestionCard.tsx` and `__tests__/QuestionCard.branding.test.tsx`
- Property tests use `fast-check`; install with `npm install --save-dev fast-check` if not already present
