CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `question_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_question_sets_profile_code` ON `question_sets` (`profile_id`,`code`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`question_set_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`question_set_id`) REFERENCES `question_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_questions_set_code` ON `questions` (`question_set_id`,`code`);--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`ability` integer,
	`energy` integer,
	`importance` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "responses_ability_range" CHECK("responses"."ability" is null or ("responses"."ability" >= 0 and "responses"."ability" <= 5)),
	CONSTRAINT "responses_energy_range" CHECK("responses"."energy" is null or ("responses"."energy" >= -2 and "responses"."energy" <= 2)),
	CONSTRAINT "responses_importance_range" CHECK("responses"."importance" is null or ("responses"."importance" >= 0 and "responses"."importance" <= 3))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_responses_question_id` ON `responses` (`question_id`);