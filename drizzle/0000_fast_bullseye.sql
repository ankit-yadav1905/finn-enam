CREATE TABLE `document_pages` (
	`document_id` text NOT NULL,
	`page` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`document_id`, `page`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`kind` text NOT NULL,
	`published_at` text,
	`sha256` text,
	`ingested_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`published_at` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`url` text NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_cache` (
	`ticker` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` text NOT NULL
);
