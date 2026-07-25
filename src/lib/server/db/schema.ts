import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Una subida = una foto original que el usuario cargó. Varias generaciones
// (distintos estilos, distintos intentos) pueden compartir la misma subida —
// así se agrupa la galería "por foto origen".
export const subidas = sqliteTable('subidas', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	archivo: text('archivo').notNull(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Subida = typeof subidas.$inferSelect;

export const generaciones = sqliteTable('generaciones', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	subidaId: integer('subida_id').references(() => subidas.id),
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
