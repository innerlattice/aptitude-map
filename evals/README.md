# Package evaluations

Evaluation cases live outside the packages so they test behavior without
becoming permanent instructions.

- Each skill has four execution cases and a selection set containing positive,
  negative, and ambiguous prompts.
- The operator has four cases covering intake, scope pressure, interrupted
  work, and unauthorized external action.
- `npm run test:packages` checks the case structure and package wiring.

The cases are ready for with-skill, no-skill, and independent-review runs. This
repository change performs structural and author sanity checks only; it does
not claim an empirical improvement until separate runners and a blind reviewer
have produced comparative evidence.
