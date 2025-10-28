CREATE TABLE `academic_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email_cronograma` timestamp,
	`email_reforco` timestamp,
	`ciencia_unidade` timestamp,
	`lista_softwares` timestamp,
	`criacao` timestamp,
	`teste_deploy` timestamp,
	`homologacao` timestamp,
	`aprovacao` timestamp,
	`implantacao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academic_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`changes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laboratories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predio` varchar(10) NOT NULL,
	`bloco` varchar(10),
	`sala` varchar(50) NOT NULL,
	`estacao` varchar(100),
	`nome_contato` varchar(255),
	`email_contato` varchar(320),
	`ramal_contato` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laboratories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laboratory_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`laboratory_id` int NOT NULL,
	`monitor_shutdown_minutes` int,
	`profile_cleanup_days` int,
	`hide_last_user` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laboratory_features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `software_installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`laboratory_id` int NOT NULL,
	`software_name` varchar(255) NOT NULL,
	`version` varchar(100),
	`license` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `software_installations_id` PRIMARY KEY(`id`)
);
