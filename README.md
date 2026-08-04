# Aptitude Map

Aptitude Map is a living inventory of what you can do, what gives or drains
energy, and which outcomes matter enough to require action. It is designed for
personal reflection and for building a trustworthy human profile that can guide
learning, delegation, outsourcing, and eventually a personal digital twin.

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

Use **Export JSON** for a portable, schema-versioned backup. **Import JSON**
validates and atomically restores the profile, including stable UUIDs, ratings,
notes, ordering, and archive state.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Hosted identity headers are not present during
ordinary local development, so the app shows its sign-in screen. Local D1 data
is stored under the ignored `.wrangler/` directory.

## Architecture

- `app/` contains the Next-compatible UI and profile, import, and export routes.
- `lib/` owns the generic ontology, profile operations, and wire types.
- `db/` defines the canonical Drizzle schema and runtime bootstrap SQL.
- `drizzle/` contains versioned SQL migrations and migration metadata.
- `worker/` and `build/` adapt the app to a Cloudflare Worker deployment.
- `.openai/hosting.json` identifies the OpenAI Sites project and logical D1
  binding; it does not contain user records or credentials.

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

Deployments use OpenAI Sites with the project configuration already stored in
`.openai/hosting.json`. Run `npm test` before publishing. Schema changes must
include and verify their generated migration.
