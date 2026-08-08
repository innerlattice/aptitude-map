# Aptitude Map

Aptitude Map is an open-source living inventory of what you can do, what gives
or drains energy, and which outcomes matter enough to require action. It is
designed for personal reflection and for building a trustworthy human profile
that can guide learning, delegation, outsourcing, and eventually a personal
digital twin.

Use the hosted app at [aptitude-map.exobyt.chatgpt.site](https://aptitude-map.exobyt.chatgpt.site).
The site is public; each person's saved map is private to their ChatGPT sign-in.

## What you record

Each capability belongs to an editable ontology and has a stable UUID. You can
change the ontology without losing the identity of existing questions or
responses. Every capability can be assessed on three independent dimensions:

- **Ability (A):** `0` none to `5` distinctive; blank means untested.
- **Energy (E):** `-2` hate to `2` love; blank means untested.
- **Criticality (C):** how important it is that the outcome exists in your life
  or work over the next 12–24 months, regardless of who performs it. `0` is
  irrelevant, `1` useful, `2` material, and `3` mission-critical.

Notes capture evidence, context, preferences, and learning edges. Native form
controls preserve browser affordances: Tab moves through fields, number keys
select ratings, and a field saves when focus leaves it.

## Privacy and ownership

The hosted app uses a stable, site-specific ChatGPT user ID. Profile reads,
writes, ontology edits, imports, and exports are scoped to that ID on the
server. A new user receives an independent copy of the starter ontology.

Personal profiles are data, not source code. This repository contains the app,
the generic starter ontology, the schema, and migrations. It intentionally
excludes local D1 state, exported profiles, backups, secrets, and runtime output
through [`.gitignore`](.gitignore). Keep exported JSON out of source control;
it may contain your complete ratings and notes.

Each independently deployed copy receives its own Sites project, database, and
site-specific user identities. Cloning this repository does not copy the hosted
profiles from this example deployment.

Use **Export JSON** for a portable, schema-versioned backup. **Import JSON**
validates and atomically restores the profile, including stable UUIDs, ratings,
notes, ordering, and archive state.

## Freeze a private baseline

After completing a map, freeze the export before deriving learning or
delegation decisions from it:

```bash
npm run profile:freeze -- \
  --input private/aptitude-map-YYYY-MM-DD.json \
  --output-dir private/profile/v1
```

The command validates that every capability has complete A/E/C ratings, copies
the source without changing it, records a SHA-256 checksum, and creates an
initial routing overlay. It never overwrites an existing baseline directory.
The four routes are deliberately distinct: own and distill, learn enough to
govern, delegate or automate, and avoid or defer.

Everything under `private/` remains gitignored. The reusable schemas live in
[`schemas/`](schemas/); they contain no personal profile data.

When one broad capability contains parts that need different routes, record an
ID-checked facet review and apply it without editing repeated JSON by hand:

```bash
npm run profile:review-routing -- \
  --routing private/profile/v1/routing.json \
  --overrides private/profile/v1/routing-overrides.json
```

The review command matches both UUID and capability code, removes stale facet
reviews, creates a timestamped backup, and atomically replaces the derived
routing file. Use facets only when their work would genuinely be routed to
different owners.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Hosted identity headers are not present during
ordinary local development, so the app shows its sign-in screen. Local D1 data
is stored under the ignored `.wrangler/` directory.

## Deploy your own

OpenAI Sites is currently the supported deployment target. Every clone should
create its own Sites project; never reuse somebody else's project ID.

1. Clone this repository and run `npm ci`.
2. Copy `.openai/hosting.example.json` to `.openai/hosting.json`.
3. Open the project in the ChatGPT desktop app and ask:

   > Deploy this project as a new OpenAI Site. Create a new Sites project and
   > D1 database rather than linking an existing project. Keep it private until
   > I approve broader access.

4. Review the build and database migration, then approve the deployment and
   desired audience.

Sites adds the new project's ID to the local `.openai/hosting.json`. That file
is gitignored because it belongs to one deployment, not to the reusable source.
The committed `.openai/hosting.example.json` contains only the portable D1 and
R2 binding declarations.

Sites saves a version before deploying it. You can ask ChatGPT to save without
deploying when you want a reviewable candidate, or deploy an approved version
to its production URL. See the [OpenAI Sites documentation](https://learn.chatgpt.com/docs/sites#understand-projects-versions-and-deployments).

## Architecture

- `app/` contains the Next-compatible UI and profile, import, and export routes.
- `lib/` owns the generic ontology, profile operations, and wire types.
- `db/` defines the canonical Drizzle schema and runtime bootstrap SQL.
- `drizzle/` contains versioned SQL migrations and migration metadata.
- `worker/` and `build/` adapt the app to a Cloudflare Worker deployment.
- `schemas/` defines portable contracts for frozen baselines, routing overlays,
  and evidence claims.
- `packages/` contains universal SkillMeta skills and a harness-independent
  operator agent package; it contains no personal profile data.
- `scripts/` and `tests/` implement and verify the private baseline workflow
  and portable package checks.
- `evals/` contains realistic behavior and selection cases outside the packages.
- `.openai/hosting.example.json` declares portable storage binding names.
- The ignored `.openai/hosting.json` links one local clone to its Sites project.

The persistent model has four concepts:

- `profiles` — owner identity, schema version, and profile lifecycle.
- `question_sets` — editable ontology domains with stable UUIDs.
- `questions` — editable capability records with stable UUIDs and archive state.
- `responses` — one set of ratings and notes per capability.

The canonical schema is [`db/schema.ts`](db/schema.ts). Keep
[`db/schema-sql.ts`](db/schema-sql.ts) synchronized with generated migrations
when the data model changes.

## Development

```bash
npm test             # lint and production build
npm run db:generate  # generate a migration after a schema change
```

Deployments use OpenAI Sites. Run `npm test` before publishing. Schema changes
must include and verify their generated migration.

## License

[MIT](LICENSE)
