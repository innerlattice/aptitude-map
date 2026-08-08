---
name: system-decomposition
description: Decompose complex goals, systems, or changes into stable, high-coverage, low-overlap components. Use when boundaries, dependencies, or changing parts are unclear; not for merely listing tasks in an already bounded change.
license: MIT
metadata:
  skillmeta.manifest: skill.json
---

# System Decomposition

Turn a complex subject into a small set of components that can be understood,
owned, changed, and tested independently.

## Preserve these invariants

1. Anchor the decomposition in the required outcome, not the current
   implementation or organization chart.
2. Keep components at one useful level of abstraction.
3. Give each responsibility one primary home and make shared concerns explicit.
4. Separate parts that change for different reasons, at different rates, or
   under different constraints.
5. Expose dependencies and interfaces without recursively decomposing
   everything.

## Procedure

1. **State the outcome.** Record the user-visible or system-visible result,
   constraints, non-goals, known risks, and unresolved uncertainty.
2. **Trace the necessary flow.** Follow information, value, decisions, or state
   from input to outcome. Use the flow to find responsibilities rather than
   inventing categories from familiar technology layers.
3. **Propose three to seven components.** Use more only when the subject truly
   requires it, and never exceed twelve without first grouping related parts.
   Name components with established domain language.
4. **Test the boundaries.** Check orthogonality, coverage, overlap, volatility,
   and interface clarity using [review-tests.md](references/review-tests.md).
5. **Map dependencies.** For every dependency, state what crosses the boundary
   and which component owns the contract. Mark cycles and shared mutable state.
6. **Choose the next useful depth.** Decompose only the components that block a
   decision, hide material risk, or contain responsibilities needing different
   owners. Stop when further detail does not change action.

## Output

Return:

- the outcome and important constraints;
- three to seven named components with one-sentence responsibilities;
- interfaces and material dependencies;
- volatility or ownership boundaries that drove the structure;
- unresolved questions and the next component, if any, requiring deeper work.

Explain the result in plain language. If two plausible decompositions remain,
show the trade-off instead of presenting arbitrary certainty.

## Avoid

- Mixing outcomes, processes, technologies, teams, and data stores as peers.
- Creating a catch-all component such as “miscellaneous,” “platform,” or
  “management” without a precise responsibility.
- Treating shared concerns as duplicated ownership.
- Splitting by implementation detail before the outcome is understood.
- Continuing decomposition because more detail is possible rather than useful.

## Validate

Before finishing, verify that every required outcome maps to at least one
component, every responsibility has one primary owner, overlaps are explicit,
and components that change independently are not accidentally fused.
