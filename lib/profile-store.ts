import { env } from "cloudflare:workers";
import { randomUUID } from "node:crypto";
import { schemaStatements } from "@/db/schema-sql";
import { seedQuestionSets } from "@/lib/seed";
import type {
  AptitudeProfile,
  Mutation,
  ProfileRecord,
  QuestionRecord,
  QuestionSetRecord,
  ResponseRecord,
} from "@/lib/types";

const DEFAULT_PROFILE_TITLE = "My aptitude map";
const CURRENT_SCHEMA_VERSION = 2;

const evtTitleReplacements = [
  ["Pioneer: discovering", "Explorer: discovering"],
  ["Pioneer: experimenting", "Explorer: experimenting"],
  ["Settler: selecting", "Villager: selecting"],
  ["Settler: productizing", "Villager: productizing"],
  ["Settler: transferring", "Villager: transferring"],
] as const;

function now() {
  return new Date().toISOString();
}

function requireNonEmpty(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must not be empty.`);
  }
  return value.trim();
}

function requireUuid(value: unknown, field: string) {
  const parsed = requireNonEmpty(value, field);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed)) {
    throw new Error(`${field} must be a UUID.`);
  }
  return parsed;
}

function requireOrderedIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("orderedIds must contain at least one UUID.");
  }
  const ids = value.map((id, index) => requireUuid(id, `orderedIds[${index}]`));
  if (new Set(ids).size !== ids.length) {
    throw new Error("orderedIds must not contain duplicates.");
  }
  return ids;
}

function requireRecord(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, field: string, limit: number) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  if (value.length > limit) throw new Error(`${field} exceeds the ${limit}-record limit.`);
  return value;
}

function requireInteger(value: unknown, field: string, minimum = 0) {
  if (!Number.isInteger(value) || Number(value) < minimum) {
    throw new Error(`${field} must be an integer of at least ${minimum}.`);
  }
  return Number(value);
}

function requireNullableString(value: unknown, field: string) {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string or null.`);
  return value;
}

function requireString(value: unknown, field: string, limit: number) {
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  if (value.length > limit) throw new Error(`${field} exceeds ${limit} characters.`);
  return value;
}

function requireUniqueIds(records: Array<{ id: string }>, field: string) {
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error(`${field} contains duplicate UUIDs.`);
  }
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function migrateDatabase() {
  const db = env.DB;
  const columns = await db
    .prepare("PRAGMA table_info(responses)")
    .all<{ name: string }>();
  const columnNames = new Set(columns.results.map((column) => column.name));

  if (columnNames.has("importance") && !columnNames.has("criticality")) {
    await db.prepare("ALTER TABLE responses RENAME COLUMN importance TO criticality").run();
  } else if (columnNames.has("importance") && columnNames.has("criticality")) {
    await db
      .prepare("UPDATE responses SET criticality = COALESCE(criticality, importance)")
      .run();
  }

  const timestamp = now();
  await db.batch([
    db
      .prepare(
        `UPDATE question_sets
         SET code = 'EVT', updated_at = ?
         WHERE code = 'WRD'
           AND title = 'Pioneer, Settler & Town Planner modes'
           AND NOT EXISTS (
             SELECT 1 FROM question_sets existing
             WHERE existing.profile_id = question_sets.profile_id
               AND existing.code = 'EVT'
           )`,
      )
      .bind(timestamp),
    db
      .prepare(
        `UPDATE question_sets
         SET title = 'Explorers, Villagers & Town Planners', updated_at = ?
         WHERE code = 'EVT'
           AND title = 'Pioneer, Settler & Town Planner modes'`,
      )
      .bind(timestamp),
  ]);

  const evtSetQuery = `SELECT id FROM question_sets
    WHERE code = 'EVT' AND title = 'Explorers, Villagers & Town Planners'`;
  const ontologyWrites = Array.from({ length: 9 }, (_, offset) => {
    const index = offset + 1;
    return (
      db
        .prepare(
          `UPDATE questions
           SET code = ?, updated_at = ?
           WHERE question_set_id IN (${evtSetQuery})
             AND code = ?
             AND NOT EXISTS (
               SELECT 1 FROM questions existing
               WHERE existing.question_set_id = questions.question_set_id
                 AND existing.code = ?
             )`,
        )
        .bind(`EVT-${index}`, timestamp, `WRD-${index}`, `EVT-${index}`)
    );
  });

  for (const [oldTitle, newTitle] of evtTitleReplacements) {
    ontologyWrites.push(
      db
        .prepare(
          `UPDATE questions
           SET title = ?, updated_at = ?
           WHERE question_set_id IN (${evtSetQuery}) AND title = ?`,
        )
        .bind(newTitle, timestamp, oldTitle),
    );
  }

  ontologyWrites.push(
    db
      .prepare(
        `UPDATE questions
         SET detail = REPLACE(detail, 'unfinished pioneer work', 'unfinished explorer work'),
             updated_at = ?
         WHERE question_set_id IN (${evtSetQuery})
           AND detail LIKE '%unfinished pioneer work%'`,
      )
      .bind(timestamp),
  );

  await db.batch(ontologyWrites);
  await db
    .prepare("UPDATE profiles SET schema_version = ? WHERE schema_version < ?")
    .bind(CURRENT_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION)
    .run();
}

export async function ensureDatabase() {
  const db = env.DB;
  if (!db) {
    throw new Error("The local database binding is unavailable.");
  }

  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  await db.prepare("PRAGMA foreign_keys = ON").run();
  await migrateDatabase();

  const existing = await db
    .prepare("SELECT id FROM profiles ORDER BY created_at LIMIT 1")
    .first<{ id: string }>();

  if (existing) return existing.id;

  const profileId = randomUUID();
  const timestamp = now();
  const writes = [
    db
      .prepare(
        `INSERT INTO profiles (id, schema_version, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        profileId,
        CURRENT_SCHEMA_VERSION,
        DEFAULT_PROFILE_TITLE,
        timestamp,
        timestamp,
      ),
  ];

  seedQuestionSets.forEach((set, setIndex) => {
    const questionSetId = randomUUID();
    writes.push(
      db
        .prepare(
          `INSERT INTO question_sets
            (id, profile_id, code, title, description, position, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          questionSetId,
          profileId,
          set.code,
          set.title,
          set.description,
          setIndex,
          timestamp,
          timestamp,
        ),
    );

    set.questions.forEach((question, questionIndex) => {
      const questionId = randomUUID();
      writes.push(
        db
          .prepare(
            `INSERT INTO questions
              (id, question_set_id, code, title, detail, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            questionId,
            questionSetId,
            `${set.code}-${questionIndex + 1}`,
            question.title,
            question.detail,
            questionIndex,
            timestamp,
            timestamp,
          ),
      );
      writes.push(
        db
          .prepare(
            `INSERT INTO responses
              (id, question_id, ability, energy, criticality, note, created_at, updated_at)
             VALUES (?, ?, NULL, NULL, NULL, '', ?, ?)`,
          )
          .bind(randomUUID(), questionId, timestamp, timestamp),
      );
    });
  });

  await db.batch(writes);
  await db.prepare("PRAGMA optimize").run();
  return profileId;
}

function mapProfile(row: Record<string, unknown>): ProfileRecord {
  return {
    id: String(row.id),
    schemaVersion: Number(row.schema_version),
    title: String(row.title),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapQuestionSet(row: Record<string, unknown>): QuestionSetRecord {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    code: String(row.code),
    title: String(row.title),
    description: String(row.description),
    position: Number(row.position),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapQuestion(row: Record<string, unknown>): QuestionRecord {
  return {
    id: String(row.id),
    questionSetId: String(row.question_set_id),
    code: String(row.code),
    title: String(row.title),
    detail: String(row.detail),
    position: Number(row.position),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function nullableNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function mapResponse(row: Record<string, unknown>): ResponseRecord {
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    ability: nullableNumber(row.ability),
    energy: nullableNumber(row.energy),
    criticality: nullableNumber(row.criticality),
    note: String(row.note ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function loadProfile(): Promise<AptitudeProfile> {
  const profileId = await ensureDatabase();
  const db = env.DB;

  const [profileRow, setRows, questionRows, responseRows] = await Promise.all([
    db
      .prepare("SELECT * FROM profiles WHERE id = ?")
      .bind(profileId)
      .first<Record<string, unknown>>(),
    db
      .prepare(
        "SELECT * FROM question_sets WHERE profile_id = ? ORDER BY position, created_at",
      )
      .bind(profileId)
      .all<Record<string, unknown>>(),
    db
      .prepare(
        `SELECT q.* FROM questions q
         JOIN question_sets s ON s.id = q.question_set_id
         WHERE s.profile_id = ?
         ORDER BY s.position, q.position, q.created_at`,
      )
      .bind(profileId)
      .all<Record<string, unknown>>(),
    db
      .prepare(
        `SELECT r.* FROM responses r
         JOIN questions q ON q.id = r.question_id
         JOIN question_sets s ON s.id = q.question_set_id
         WHERE s.profile_id = ?
         ORDER BY s.position, q.position`,
      )
      .bind(profileId)
      .all<Record<string, unknown>>(),
  ]);

  if (!profileRow) throw new Error("The aptitude profile could not be loaded.");

  return {
    schemaVersion: 2,
    profile: mapProfile(profileRow),
    questionSets: setRows.results.map(mapQuestionSet),
    questions: questionRows.results.map(mapQuestion),
    responses: responseRows.results.map(mapResponse),
  };
}

function validateImportedProfile(value: unknown): AptitudeProfile {
  const root = requireRecord(value, "profile export");
  if (root.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Only schema version ${CURRENT_SCHEMA_VERSION} exports can be imported.`);
  }

  const profileInput = requireRecord(root.profile, "profile");
  const profile: ProfileRecord = {
    id: requireUuid(profileInput.id, "profile.id"),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title: requireNonEmpty(profileInput.title, "profile.title").slice(0, 160),
    createdAt: requireString(profileInput.createdAt, "profile.createdAt", 80),
    updatedAt: requireString(profileInput.updatedAt, "profile.updatedAt", 80),
  };

  const questionSets = requireArray(root.questionSets, "questionSets", 100).map(
    (value, index): QuestionSetRecord => {
      const record = requireRecord(value, `questionSets[${index}]`);
      return {
        id: requireUuid(record.id, `questionSets[${index}].id`),
        profileId: requireUuid(record.profileId, `questionSets[${index}].profileId`),
        code: requireNonEmpty(record.code, `questionSets[${index}].code`).slice(0, 120),
        title: requireNonEmpty(record.title, `questionSets[${index}].title`).slice(0, 120),
        description: requireString(
          record.description,
          `questionSets[${index}].description`,
          2000,
        ),
        position: requireInteger(record.position, `questionSets[${index}].position`),
        archivedAt: requireNullableString(
          record.archivedAt,
          `questionSets[${index}].archivedAt`,
        ),
        createdAt: requireString(record.createdAt, `questionSets[${index}].createdAt`, 80),
        updatedAt: requireString(record.updatedAt, `questionSets[${index}].updatedAt`, 80),
      };
    },
  );

  const questions = requireArray(root.questions, "questions", 2000).map(
    (value, index): QuestionRecord => {
      const record = requireRecord(value, `questions[${index}]`);
      return {
        id: requireUuid(record.id, `questions[${index}].id`),
        questionSetId: requireUuid(
          record.questionSetId,
          `questions[${index}].questionSetId`,
        ),
        code: requireNonEmpty(record.code, `questions[${index}].code`).slice(0, 160),
        title: requireNonEmpty(record.title, `questions[${index}].title`).slice(0, 160),
        detail: requireString(record.detail, `questions[${index}].detail`, 6000),
        position: requireInteger(record.position, `questions[${index}].position`),
        archivedAt: requireNullableString(
          record.archivedAt,
          `questions[${index}].archivedAt`,
        ),
        createdAt: requireString(record.createdAt, `questions[${index}].createdAt`, 80),
        updatedAt: requireString(record.updatedAt, `questions[${index}].updatedAt`, 80),
      };
    },
  );

  const responses = requireArray(root.responses, "responses", 2000).map(
    (value, index): ResponseRecord => {
      const record = requireRecord(value, `responses[${index}]`);
      return {
        id: requireUuid(record.id, `responses[${index}].id`),
        questionId: requireUuid(record.questionId, `responses[${index}].questionId`),
        ability: validateRating("ability", record.ability),
        energy: validateRating("energy", record.energy),
        criticality: validateRating("criticality", record.criticality),
        note: requireString(record.note, `responses[${index}].note`, 12000),
        createdAt: requireString(record.createdAt, `responses[${index}].createdAt`, 80),
        updatedAt: requireString(record.updatedAt, `responses[${index}].updatedAt`, 80),
      };
    },
  );

  requireUniqueIds(questionSets, "questionSets");
  requireUniqueIds(questions, "questions");
  requireUniqueIds(responses, "responses");

  if (questionSets.some((record) => record.profileId !== profile.id)) {
    throw new Error("Every question set must belong to the imported profile UUID.");
  }
  const questionSetIds = new Set(questionSets.map((record) => record.id));
  if (questions.some((record) => !questionSetIds.has(record.questionSetId))) {
    throw new Error("Every question must refer to an imported question-set UUID.");
  }
  const questionIds = new Set(questions.map((record) => record.id));
  if (responses.some((record) => !questionIds.has(record.questionId))) {
    throw new Error("Every response must refer to an imported question UUID.");
  }
  if (new Set(responses.map((record) => record.questionId)).size !== responses.length) {
    throw new Error("The import contains more than one response for a question.");
  }
  if (responses.length !== questions.length) {
    throw new Error("Every imported question must have exactly one response.");
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile,
    questionSets,
    questions,
    responses,
  };
}

export async function importProfile(value: unknown): Promise<AptitudeProfile> {
  const imported = validateImportedProfile(value);
  await ensureDatabase();
  const db = env.DB;
  const writes = [
    db.prepare("DELETE FROM profiles"),
    db
      .prepare(
        `INSERT INTO profiles (id, schema_version, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        imported.profile.id,
        CURRENT_SCHEMA_VERSION,
        imported.profile.title,
        imported.profile.createdAt,
        imported.profile.updatedAt,
      ),
  ];

  for (const group of chunks(imported.questionSets, 10)) {
    const placeholders = group.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    writes.push(
      db
        .prepare(
          `INSERT INTO question_sets
            (id, profile_id, code, title, description, position, archived_at, created_at, updated_at)
           VALUES ${placeholders}`,
        )
        .bind(
          ...group.flatMap((record) => [
            record.id,
            record.profileId,
            record.code,
            record.title,
            record.description,
            record.position,
            record.archivedAt,
            record.createdAt,
            record.updatedAt,
          ]),
        ),
    );
  }

  for (const group of chunks(imported.questions, 10)) {
    const placeholders = group.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    writes.push(
      db
        .prepare(
          `INSERT INTO questions
            (id, question_set_id, code, title, detail, position, archived_at, created_at, updated_at)
           VALUES ${placeholders}`,
        )
        .bind(
          ...group.flatMap((record) => [
            record.id,
            record.questionSetId,
            record.code,
            record.title,
            record.detail,
            record.position,
            record.archivedAt,
            record.createdAt,
            record.updatedAt,
          ]),
        ),
    );
  }

  for (const group of chunks(imported.responses, 12)) {
    const placeholders = group.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    writes.push(
      db
        .prepare(
          `INSERT INTO responses
            (id, question_id, ability, energy, criticality, note, created_at, updated_at)
           VALUES ${placeholders}`,
        )
        .bind(
          ...group.flatMap((record) => [
            record.id,
            record.questionId,
            record.ability,
            record.energy,
            record.criticality,
            record.note,
            record.createdAt,
            record.updatedAt,
          ]),
        ),
    );
  }

  await db.batch(writes);
  await db.prepare("PRAGMA optimize").run();
  return loadProfile();
}

function validateRating(field: string, value: unknown) {
  if (value === null) return null;
  if (!Number.isInteger(value)) throw new Error(`${field} must be an integer or null.`);
  const ranges: Record<string, [number, number]> = {
    ability: [0, 5],
    energy: [-2, 2],
    criticality: [0, 3],
  };
  const [min, max] = ranges[field];
  if (Number(value) < min || Number(value) > max) {
    throw new Error(`${field} must be between ${min} and ${max}.`);
  }
  return Number(value);
}

async function touchProfile(profileId: string, timestamp: string) {
  await env.DB
    .prepare("UPDATE profiles SET updated_at = ? WHERE id = ?")
    .bind(timestamp, profileId)
    .run();
}

export async function applyMutation(input: Mutation): Promise<AptitudeProfile> {
  const profileId = await ensureDatabase();
  const db = env.DB;
  const timestamp = now();

  switch (input.type) {
    case "updateResponse": {
      const id = requireUuid(input.responseId, "responseId");
      if (!["ability", "energy", "criticality", "note"].includes(input.field)) {
        throw new Error("Unknown response field.");
      }
      const value =
        input.field === "note"
          ? String(input.value ?? "").slice(0, 12000)
          : validateRating(input.field, input.value);
      const column = input.field;
      await db
        .prepare(`UPDATE responses SET ${column} = ?, updated_at = ? WHERE id = ?`)
        .bind(value, timestamp, id)
        .run();
      break;
    }

    case "updateQuestionSet": {
      const id = requireUuid(input.questionSetId, "questionSetId");
      const fieldMap = {
        code: "code",
        title: "title",
        description: "description",
      } as const;
      const column = fieldMap[input.field];
      if (!column) throw new Error("Unknown question-set field.");
      const value =
        input.field === "description"
          ? String(input.value ?? "").trim().slice(0, 2000)
          : requireNonEmpty(input.value, input.field).slice(0, 120);
      await db
        .prepare(`UPDATE question_sets SET ${column} = ?, updated_at = ? WHERE id = ?`)
        .bind(value, timestamp, id)
        .run();
      break;
    }

    case "updateQuestion": {
      const id = requireUuid(input.questionId, "questionId");
      const fieldMap = { code: "code", title: "title", detail: "detail" } as const;
      const column = fieldMap[input.field];
      if (!column) throw new Error("Unknown question field.");
      const value =
        input.field === "detail"
          ? String(input.value ?? "").trim().slice(0, 6000)
          : requireNonEmpty(input.value, input.field).slice(0, 160);
      await db
        .prepare(`UPDATE questions SET ${column} = ?, updated_at = ? WHERE id = ?`)
        .bind(value, timestamp, id)
        .run();
      break;
    }

    case "addQuestionSet": {
      const row = await db
        .prepare(
          "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM question_sets WHERE profile_id = ?",
        )
        .bind(profileId)
        .first<{ next_position: number }>();
      const position = Number(row?.next_position ?? 0);
      await db
        .prepare(
          `INSERT INTO question_sets
            (id, profile_id, code, title, description, position, created_at, updated_at)
           VALUES (?, ?, ?, 'New question set', '', ?, ?, ?)`,
        )
        .bind(randomUUID(), profileId, `SET-${position + 1}`, position, timestamp, timestamp)
        .run();
      break;
    }

    case "addQuestion": {
      const questionSetId = requireUuid(input.questionSetId, "questionSetId");
      const row = await db
        .prepare(
          "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM questions WHERE question_set_id = ?",
        )
        .bind(questionSetId)
        .first<{ next_position: number }>();
      const position = Number(row?.next_position ?? 0);
      const questionId = randomUUID();
      await db.batch([
        db
          .prepare(
            `INSERT INTO questions
              (id, question_set_id, code, title, detail, position, created_at, updated_at)
             VALUES (?, ?, ?, 'New capability', '', ?, ?, ?)`,
          )
          .bind(
            questionId,
            questionSetId,
            `ITEM-${position + 1}`,
            position,
            timestamp,
            timestamp,
          ),
        db
          .prepare(
            `INSERT INTO responses
              (id, question_id, ability, energy, criticality, note, created_at, updated_at)
             VALUES (?, ?, NULL, NULL, NULL, '', ?, ?)`,
          )
          .bind(randomUUID(), questionId, timestamp, timestamp),
      ]);
      break;
    }

    case "setQuestionSetArchived": {
      const id = requireUuid(input.questionSetId, "questionSetId");
      await db
        .prepare("UPDATE question_sets SET archived_at = ?, updated_at = ? WHERE id = ?")
        .bind(input.archived ? timestamp : null, timestamp, id)
        .run();
      break;
    }

    case "setQuestionArchived": {
      const id = requireUuid(input.questionId, "questionId");
      await db
        .prepare("UPDATE questions SET archived_at = ?, updated_at = ? WHERE id = ?")
        .bind(input.archived ? timestamp : null, timestamp, id)
        .run();
      break;
    }

    case "reorderQuestionSets": {
      const ids = requireOrderedIds(input.orderedIds);
      await db.batch(
        ids.map((id, position) =>
          db
            .prepare("UPDATE question_sets SET position = ?, updated_at = ? WHERE id = ?")
            .bind(position, timestamp, id),
        ),
      );
      break;
    }

    case "reorderQuestions": {
      const questionSetId = requireUuid(input.questionSetId, "questionSetId");
      const ids = requireOrderedIds(input.orderedIds);
      await db.batch(
        ids.map((id, position) =>
          db
            .prepare(
              "UPDATE questions SET position = ?, updated_at = ? WHERE id = ? AND question_set_id = ?",
            )
            .bind(position, timestamp, id, questionSetId),
        ),
      );
      break;
    }

    default:
      throw new Error("Unknown mutation type.");
  }

  await touchProfile(profileId, timestamp);
  return loadProfile();
}
