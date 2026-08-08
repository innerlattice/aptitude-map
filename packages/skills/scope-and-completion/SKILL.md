---
name: scope-and-completion
description: Bound work into a smallest coherent deliverable with explicit non-goals, budgets, change rules, stop conditions, verification, and handoff. Use when work may expand, drift, stall, or remain unfinished; not for deciding the architecture of an unframed system.
license: MIT
metadata:
  skillmeta.manifest: skill.json
---

# Scope and Completion

Keep work aligned with its intended outcome and make completion observable.

## Preserve these invariants

1. Define completion as evidence of an outcome, not effort expended.
2. Choose the smallest coherent deliverable that creates useful evidence or
   value; do not reduce scope until the result becomes meaningless.
3. Record non-goals and budgets before execution begins.
4. Treat scope changes as decisions with visible cost, not silent additions.
5. Preserve enough state that interrupted work can resume without reconstructing
   the project from memory.

## Procedure

1. **Create a work contract.** Use the seven fields in
   [work-contract.md](references/work-contract.md): outcome, evidence, scope,
   non-goals, budget, authority, and current state.
2. **Find the smallest coherent slice.** Remove optional audiences, variants,
   integrations, abstractions, migrations, and polish until another reduction
   would prevent the intended evidence or value.
3. **Identify uncertainty early.** Convert the largest uncertainty into a cheap
   test when possible. Do not implement around an assumption that can be tested
   more directly.
4. **Execute against the contract.** Keep one active slice unless parallel work
   is genuinely independent. Save a short resume packet after material state
   changes or before interruption.
5. **Control changes.** When new work appears, classify it as required for the
   outcome, defect correction, later improvement, or unrelated. State its cost
   and accept, defer, or reject it. Request approval when it changes the work
   contract.
6. **Stop deliberately.** Stop when the evidence passes, the budget is spent,
   the premise is disproved, or progress requires new authority or information.
   Verify the result and hand off remaining work explicitly.

## Completion report

Return:

- what outcome was achieved and the evidence;
- what changed from the original scope and why;
- checks that passed, failed, or could not run;
- deferred work and known limitations;
- the final state or a resume packet if the work is not complete.

## Avoid

- Expanding the work because an adjacent improvement is attractive.
- Confusing a long checklist with a coherent deliverable.
- Treating “good enough” as permission to ignore the stated evidence.
- Hiding uncertainty behind implementation effort.
- Declaring completion because time or context is running out.
- Leaving interrupted work without its current state, next action, and blockers.

## Validate

Before finishing, verify that the outcome, evidence, non-goals, budget, and
authority still agree; every accepted scope change is visible; and any
unfinished work has an explicit owner or resume state.
