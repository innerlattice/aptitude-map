# Aptitude Map

A local-first assessment app for maintaining a living capability ontology and
rating each capability by ability, energy, and importance.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The local D1 database persists under the ignored
`.wrangler/` directory. Use **Export JSON** in the app to download a portable,
schema-versioned snapshot.

## Rating scales

- Ability: `0` none through `5` distinctive; blank means untested.
- Energy: `-2` hate through `2` love; blank means untested.
- Importance: `0` irrelevant through `3` critical; blank means unset.

Native selects preserve browser keyboard behavior: Tab moves through Ability,
Energy, Importance, and Notes; typing a number selects the matching option.
Fields save when focus leaves them.

## Data model

- `profiles`: schema version and profile lifecycle.
- `question_sets`: editable ontology domains, each with a UUID.
- `questions`: editable capability records, each with a UUID and archive lifecycle.
- `responses`: one rating and note record per question.

The canonical schema is [db/schema.ts](db/schema.ts). Generated SQL migrations
live under `drizzle/`. Runtime initialization uses the matching idempotent SQL
in [db/schema-sql.ts](db/schema-sql.ts).

## Commands

- `npm run dev` — start the local app.
- `npm run db:generate` — generate a migration after schema changes.
- `npm test` — lint and build.
