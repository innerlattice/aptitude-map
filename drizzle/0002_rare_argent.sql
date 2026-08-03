ALTER TABLE `profiles` ADD `owner_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_owner_id` ON `profiles` (`owner_id`);