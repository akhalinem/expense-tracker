CREATE TABLE `transaction_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`typeId` integer NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`categoryId` integer,
	FOREIGN KEY (`typeId`) REFERENCES `transaction_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
