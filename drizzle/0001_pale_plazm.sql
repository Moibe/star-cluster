CREATE TABLE `subidas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`archivo` text NOT NULL,
	`creado` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `generaciones` ADD `subida_id` integer REFERENCES subidas(id);