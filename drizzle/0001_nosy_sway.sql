PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`ability` integer,
	`energy` integer,
	`criticality` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "responses_ability_range" CHECK("ability" is null or ("ability" >= 0 and "ability" <= 5)),
	CONSTRAINT "responses_energy_range" CHECK("energy" is null or ("energy" >= -2 and "energy" <= 2)),
	CONSTRAINT "responses_criticality_range" CHECK("criticality" is null or ("criticality" >= 0 and "criticality" <= 3))
);
--> statement-breakpoint
INSERT INTO `__new_responses`("id", "question_id", "ability", "energy", "criticality", "note", "created_at", "updated_at") SELECT "id", "question_id", "ability", "energy", "importance", "note", "created_at", "updated_at" FROM `responses`;--> statement-breakpoint
DROP TABLE `responses`;--> statement-breakpoint
ALTER TABLE `__new_responses` RENAME TO `responses`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_responses_question_id` ON `responses` (`question_id`);--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`schema_version` integer DEFAULT 2 NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("id", "schema_version", "title", "created_at", "updated_at") SELECT "id", "schema_version", "title", "created_at", "updated_at" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
UPDATE `profiles` SET `schema_version` = 2 WHERE `schema_version` < 2;--> statement-breakpoint
UPDATE `question_sets`
SET `code` = 'EVT', `updated_at` = CURRENT_TIMESTAMP
WHERE `code` = 'WRD'
  AND `title` = 'Pioneer, Settler & Town Planner modes'
  AND NOT EXISTS (
    SELECT 1 FROM `question_sets` AS `existing`
    WHERE `existing`.`profile_id` = `question_sets`.`profile_id`
      AND `existing`.`code` = 'EVT'
  );--> statement-breakpoint
UPDATE `question_sets`
SET `title` = 'Explorers, Villagers & Town Planners', `updated_at` = CURRENT_TIMESTAMP
WHERE `code` = 'EVT' AND `title` = 'Pioneer, Settler & Town Planner modes';--> statement-breakpoint
UPDATE `questions`
SET `code` = REPLACE(`code`, 'WRD-', 'EVT-'), `updated_at` = CURRENT_TIMESTAMP
WHERE `question_set_id` IN (
    SELECT `id` FROM `question_sets`
    WHERE `code` = 'EVT' AND `title` = 'Explorers, Villagers & Town Planners'
  )
  AND `code` GLOB 'WRD-[1-9]';--> statement-breakpoint
UPDATE `questions` SET `title` = 'Explorer: discovering', `updated_at` = CURRENT_TIMESTAMP
WHERE `title` = 'Pioneer: discovering' AND `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT');--> statement-breakpoint
UPDATE `questions` SET `title` = 'Explorer: experimenting', `updated_at` = CURRENT_TIMESTAMP
WHERE `title` = 'Pioneer: experimenting' AND `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT');--> statement-breakpoint
UPDATE `questions` SET `title` = 'Villager: selecting', `updated_at` = CURRENT_TIMESTAMP
WHERE `title` = 'Settler: selecting' AND `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT');--> statement-breakpoint
UPDATE `questions` SET `title` = 'Villager: productizing', `updated_at` = CURRENT_TIMESTAMP
WHERE `title` = 'Settler: productizing' AND `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT');--> statement-breakpoint
UPDATE `questions` SET `title` = 'Villager: transferring', `updated_at` = CURRENT_TIMESTAMP
WHERE `title` = 'Settler: transferring' AND `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT');--> statement-breakpoint
UPDATE `questions`
SET `detail` = REPLACE(`detail`, 'unfinished pioneer work', 'unfinished explorer work'),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `question_set_id` IN (SELECT `id` FROM `question_sets` WHERE `code` = 'EVT')
  AND `detail` LIKE '%unfinished pioneer work%';--> statement-breakpoint
PRAGMA foreign_keys=ON;
