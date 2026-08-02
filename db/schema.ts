import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  schemaVersion: integer("schema_version").notNull().default(1),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const questionSets = sqliteTable(
  "question_sets",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull(),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_question_sets_profile_code").on(
      table.profileId,
      table.code,
    ),
  ],
);

export const questions = sqliteTable(
  "questions",
  {
    id: text("id").primaryKey(),
    questionSetId: text("question_set_id")
      .notNull()
      .references(() => questionSets.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    position: integer("position").notNull(),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_questions_set_code").on(table.questionSetId, table.code),
  ],
);

export const responses = sqliteTable(
  "responses",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    ability: integer("ability"),
    energy: integer("energy"),
    importance: integer("importance"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_responses_question_id").on(table.questionId),
    check(
      "responses_ability_range",
      sql`${table.ability} is null or (${table.ability} >= 0 and ${table.ability} <= 5)`,
    ),
    check(
      "responses_energy_range",
      sql`${table.energy} is null or (${table.energy} >= -2 and ${table.energy} <= 2)`,
    ),
    check(
      "responses_importance_range",
      sql`${table.importance} is null or (${table.importance} >= 0 and ${table.importance} <= 3)`,
    ),
  ],
);
