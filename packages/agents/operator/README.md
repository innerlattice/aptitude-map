# Operator package

The operator is a portable agent role for coordinating bounded work. It keeps
state, controls scope changes, invokes two ordinary Agent Skills, and defaults
to advice and preparation rather than autonomous action.

## Install in any harness

1. Load `AGENT.md` as the persistent instruction layer for one agent.
2. Make the skill directories declared in `agent.json` discoverable. If the
   harness has no skill-selection mechanism, load a skill only when its
   description matches the current work.
3. Map the four adapter capabilities in `agent.json` to the harness: instruction
   loading, atomic state storage, skill invocation, and approval requests.
4. Persist each active work item according to `work-state.schema.json`.
5. Keep the default authority advisory until a human or external policy grants
   a narrower action scope.

The package intentionally contains no tool names, model assumptions, personal
profile, or harness configuration. A harness-specific adapter may translate
the four capabilities, but it must not change the core authority rules.

## What this version does not do

- It does not decide the principal's goals or values.
- It does not grant permission to act as another person.
- It does not provide scheduling, messaging, payments, or project-management
  integrations.
- It does not run several work items concurrently by default.

Those behaviors require explicit policy and adapters outside the universal
package.
