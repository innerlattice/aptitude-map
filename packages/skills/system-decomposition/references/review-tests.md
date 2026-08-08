# Decomposition review tests

Use these tests after proposing components and before committing to a design.

## 1. Orthogonality

Ask whether each component has a distinct primary responsibility. Take a
representative responsibility and identify its obvious home. If several
components can claim it equally, refine the boundary or name the shared concern
and its owner.

## 2. Coverage

Trace every required outcome, constraint, and failure mode through the
components. A decomposition has high coverage when nothing material disappears
between the original problem and the component map. Do not add components for
speculative possibilities unrelated to the current outcome.

## 3. Overlap

Look for repeated decisions, state, policies, or transformations. Duplication
may indicate an unclear boundary. A shared capability is acceptable when it has
one owner and a visible interface; implicit shared ownership is not.

## 4. Volatility

For each component, ask what would make it change. Separate responsibilities
when they change because of different users, laws, technologies, business
rules, scaling pressures, or release cadences. Keep tightly coupled changes
together when separation would create coordination without reducing risk.

## 5. Interface clarity

State what crosses each boundary: data, decisions, events, authority, or
physical material. Name the provider and consumer. A boundary is not useful if
its contract cannot be explained without exposing the component's internals.

## 6. Scale

Prefer three to seven top-level components. If there are more than twelve,
group them by a stable parent responsibility before continuing. If there are
only one or two, test whether distinct volatility or ownership has been hidden.

## Review format

For each proposed component, record:

1. Responsibility
2. Inputs and outputs
3. Dependencies
4. Reasons it changes
5. Owner or decision authority, when relevant

Then list missing coverage, remaining overlap, cycles, and uncertainties.
