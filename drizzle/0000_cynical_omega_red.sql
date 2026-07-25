CREATE TABLE `generaciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`juego` text NOT NULL,
	`estilo` text NOT NULL,
	`parametros` text DEFAULT '{}' NOT NULL,
	`archivo_original` text NOT NULL,
	`archivo_cuadrado` text NOT NULL,
	`creado` integer NOT NULL
);
