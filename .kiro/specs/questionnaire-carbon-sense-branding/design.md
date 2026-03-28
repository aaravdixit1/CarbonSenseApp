# Design Document

## Feature: questionnaire-carbon-sense-branding

## Overview

Add a `BrandingElement` sub-component to `QuestionCard` that renders the CarbonSense logo mark and wordmark in a horizontal row, identical to the wordmark row already present on the landing page (`app/index.tsx`). The element is inserted between the `Header` (question text) and the `Options` (answer input) sections inside the existing `gap: 28` card layout, so no spacing changes are required.

The change is intentionally minimal: one new sub-component, a handful of new style entries, and a single line added to the `QuestionCard` render tree.

---

## Architecture

The feature touches a single file: `src/components/intake/QuestionCard.tsx`.

```
QuestionCard (View, gap: 28)
  ├── Question.Header        ← existing
  ├── Question.Branding      ← NEW sub-component
  ├── Question.Options       ← existing
  └── Question.Nav           ← existing
```

No new files, no new dependencies, no changes to routing or state.

---

## Components and Interfaces

### `Question.Branding` (new sub-component)

A stateless functional component with no props. It renders the logo mark `View` and the "CarbonSense" `Text` in a row, using the same style values as `wordmarkRow` / `logoMark` / `appName` in `app/index.tsx`.

```tsx
const Branding: FC = () => (
  <View style={styles.brandingRow}>
    <View style={styles.brandingLogoMark} />
    <Text style={styles.brandingWordmark}>CarbonSense</Text>
  </View>
);
```

Exported as `Question.Branding` alongside the existing `Question.Header`, `Question.Options`, and `Question.Nav` namespace members.

### `QuestionCard` render update

```tsx
<View style={styles.card}>
  <Question.Header stepNumber={currentStep + 1} question={config.question} />
  <Question.Branding />                          {/* ← inserted here */}
  <Question.Options ... />
  <Question.Nav ... />
</View>
```

---

## Data Models

No new data models. The component is purely presentational and reads only from the shared theme tokens.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: BrandingElement present on all question types

*For any* question type (`options`, `stepper`, `percentage`, `weekly_km`, `scale`), when the `QuestionCard` is rendered for that question type, the rendered tree SHALL contain a `BrandingElement` (a `View` with `brandingRow` style containing a logo mark `View` and a `Text` node with the content "CarbonSense").

**Validates: Requirements 1.1, 2.1**

### Property 2: BrandingElement appears between Header and Options

*For any* rendered `QuestionCard`, the `BrandingElement` node SHALL appear after the `Header` node and before the `Options` node in the component tree's child order.

**Validates: Requirements 1.2**

---

## Error Handling

The `Branding` sub-component has no props and no conditional logic, so there are no error paths. It cannot fail to render. Theme token imports (`Colors`, `Fonts`, `FontSizes`) are compile-time constants; a missing import would be caught at build time.

---

## Testing Strategy

### Dual approach

Both unit/example tests and property-based tests are used. They are complementary: example tests pin specific style values; property tests verify universal presence and ordering across all question types.

### Unit / example tests

Focus on:
- The `BrandingElement` renders with the correct style values (logo mark dimensions, colors, typography).
- The card's `gap: 28` is preserved after the change.
- The answer input area and nav buttons are unaffected.

These are concrete assertions on a single rendered snapshot and do not require randomization.

### Property-based tests

Library: **fast-check** (already compatible with the Jest setup in this project via `npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**.

**Property 1 test** — BrandingElement present on all question types

```
// Feature: questionnaire-carbon-sense-branding, Property 1: BrandingElement present on all question types
fc.assert(
  fc.property(
    fc.constantFrom('options', 'stepper', 'percentage', 'weekly_km', 'scale'),
    (questionType) => {
      // render a QuestionCard configured for questionType
      // assert the rendered tree contains a Text node with "CarbonSense"
    }
  ),
  { numRuns: 100 }
);
```

**Property 2 test** — BrandingElement ordering

```
// Feature: questionnaire-carbon-sense-branding, Property 2: BrandingElement appears between Header and Options
fc.assert(
  fc.property(
    fc.constantFrom(...ALL_QUESTION_KEYS),
    (stepKey) => {
      // render QuestionCard for stepKey
      // find indices of Header, Branding, Options in children
      // assert headerIdx < brandingIdx < optionsIdx
    }
  ),
  { numRuns: 100 }
);
```

### Test file location

`__tests__/QuestionCard.branding.test.tsx`
