export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT,
    schema_version INTEGER NOT NULL DEFAULT 2,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS question_sets (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_question_sets_profile_code
    ON question_sets(profile_id, code)`,
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY NOT NULL,
    question_set_id TEXT NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_set_code
    ON questions(question_set_id, code)`,
  `CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY NOT NULL,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    ability INTEGER CHECK (ability IS NULL OR (ability >= 0 AND ability <= 5)),
    energy INTEGER CHECK (energy IS NULL OR (energy >= -2 AND energy <= 2)),
    criticality INTEGER CHECK (criticality IS NULL OR (criticality >= 0 AND criticality <= 3)),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_question_id
    ON responses(question_id)`,
] as const;
