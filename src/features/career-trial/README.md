# Career Trial Module (Person 3 Handover)

This module is a standalone Computer Vision + 3D Career Trial feature for Ayna AI.

## Location

- `src/features/career-trial`

## Main Entry (UI)

- Import the feature UI:

```ts
import { CareerTrialEntry } from 'src/features/career-trial'
```

- Use it in your page/component:

```tsx
<CareerTrialEntry
  onScoreReady={(score) => {
    // score matches the project contract
    console.log(score)
  }}
/>
```

## Score Contract (for backend/store integration)

The module emits this shape:

```ts
type CareerTrialScore = {
  trialName: string
  accuracy: number
  stability: number
  reaction: number
  suggestedDirection: string
}
```

## Integration Adapter (Prompt 5.1)

For teammates who want pull-style access to the latest score without prop drilling:

```ts
import {
  getLatestCareerTrialScore,
  subscribeCareerTrialScore,
} from 'src/features/career-trial'
```

- `getLatestCareerTrialScore()` -> returns latest score or `null`
- `subscribeCareerTrialScore(listener)` -> subscribe to score updates, returns unsubscribe function

The module publishes the latest score internally when user clicks `Finish` in Result Island.

## Fallback Behavior (Prompt 6.1)

When camera is unavailable:

- shows **Simulation Paused**
- provides **Retry Camera** (re-initializes MediaPipe + webcam)
- provides **Skip to Quiz** (mock non-camera path for graceful degradation)

## Notes for Person 1 / Person 2

- All Person 3 logic is self-contained under this folder.
- Camera/MediaPipe + gesture + scoring + 3D simulation are integrated.
- Result Island includes:
  - overall score
  - breakdown (Accuracy, Speed, Stability)
  - finish action that emits final score contract
  - reset action for replay

