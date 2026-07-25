import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const generaciones = sqliteTable('generaciones', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	juego: text('juego').notNull(),
	estilo: text('estilo').notNull(),
	parametros: text('parametros').notNull().default('{}'),
	archivoOriginal: text('archivo_original').notNull(),
	archivoCuadrado: text('archivo_cuadrado').notNull(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Generacion = typeof generaciones.$inferSelect;
